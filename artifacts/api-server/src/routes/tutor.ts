import { Router, type IRouter } from "express";
import { eq, isNull } from "drizzle-orm";
import { db, lecturesTable } from "@workspace/db";
import { AskTutorBody, AskTutorResponse } from "@workspace/api-zod";
import { chatText, chatJson, FAST_MODEL } from "../lib/ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const STARTER_SYSTEM =
  'You are a sharp college critical-thinking tutor who asks the questions that actually deepen understanding. Reply as strict JSON of the form {"questions": string[]} with NO other keys.';

function starterPrompt(title: string, body: string): string {
  // Cap body length sent to the model — the opening sections carry the core
  // concepts and a shorter prompt generates noticeably faster.
  const trimmed = body.length > 4000 ? body.slice(0, 4000) : body;
  return `From the lecture below, generate 6 substantial starter questions a motivated student would want answered to truly master this material — not surface-level recall. Spread them across the reading's major ideas, and make them probe understanding: ask for the WHY behind a rule, the difference between two concepts that are easy to confuse, how to APPLY an idea to a concrete new example, a common trap or misconception, and an edge case or counterexample. Each question is one natural sentence in the student's voice, under ~22 words, specific to THIS lecture's content (reference its actual concepts, not generic phrasing).\n\nLECTURE TITLE: ${title}\n\nLECTURE BODY:\n"""\n${trimmed}\n"""`;
}

async function generateStarterQuestions(
  title: string,
  body: string,
): Promise<string[]> {
  const out = await chatJson<{ questions: string[] }>(
    STARTER_SYSTEM,
    starterPrompt(title, body),
    FAST_MODEL,
  );
  return Array.isArray(out?.questions)
    ? out.questions
        .filter((q) => typeof q === "string" && q.trim().length > 0)
        .slice(0, 8)
    : [];
}

router.get("/tutor/suggestions/:lectureId", async (req, res): Promise<void> => {
  const lectureId = Number(req.params.lectureId);
  if (!Number.isFinite(lectureId)) {
    res.status(400).json({ error: "invalid lectureId" });
    return;
  }
  const [lecture] = await db
    .select()
    .from(lecturesTable)
    .where(eq(lecturesTable.id, lectureId));
  if (!lecture) {
    res.status(404).json({ error: "lecture not found" });
    return;
  }

  // Serve cached questions instantly — no model call on the hot path.
  if (lecture.starterQuestions && lecture.starterQuestions.length > 0) {
    res.json({ questions: lecture.starterQuestions });
    return;
  }

  try {
    const questions = await generateStarterQuestions(
      lecture.title,
      lecture.body,
    );
    if (questions.length > 0) {
      await db
        .update(lecturesTable)
        .set({ starterQuestions: questions })
        .where(eq(lecturesTable.id, lectureId));
    }
    res.json({ questions });
  } catch {
    res.json({ questions: [] });
  }
});

// Pre-generate and cache starter questions for every lecture that lacks them.
// Runs in the background on boot so the very first view of any lecture is
// already instant — critical for live demos.
export async function warmStarterQuestions(): Promise<void> {
  let lectures: { id: number; title: string; body: string }[];
  try {
    lectures = await db
      .select({
        id: lecturesTable.id,
        title: lecturesTable.title,
        body: lecturesTable.body,
      })
      .from(lecturesTable)
      .where(isNull(lecturesTable.starterQuestions));
  } catch (err) {
    logger.error({ err }, "warmStarterQuestions: query failed");
    return;
  }

  if (lectures.length === 0) return;
  logger.info(
    { count: lectures.length },
    "warmStarterQuestions: generating starter questions",
  );

  for (const lecture of lectures) {
    try {
      const questions = await generateStarterQuestions(
        lecture.title,
        lecture.body,
      );
      if (questions.length > 0) {
        await db
          .update(lecturesTable)
          .set({ starterQuestions: questions })
          .where(eq(lecturesTable.id, lecture.id));
      }
    } catch (err) {
      logger.warn(
        { err, lectureId: lecture.id },
        "warmStarterQuestions: failed for lecture",
      );
    }
  }
  logger.info("warmStarterQuestions: done");
}

router.post("/tutor/ask", async (req, res): Promise<void> => {
  const parsed = AskTutorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { message, selectedLectureText } = parsed.data;

  const sys =
    "You are an encouraging college critical-thinking tutor. Explain step by step, use concrete examples, and name the relevant concepts (premises, conclusions, fallacies, biases) where helpful. Keep replies short (3-6 sentences) unless the student asks for more detail. Never just give the answer — guide them.";
  const user = selectedLectureText
    ? `Context from the lecture the student is reading:\n"""\n${selectedLectureText}\n"""\n\nStudent question: ${message}`
    : message;

  let text = "";
  try {
    text = await chatText(sys, user);
  } catch {
    text =
      "I'm having trouble reaching the tutor service right now. Try again in a moment, and consider re-reading the relevant section of the lecture.";
  }
  res.json(AskTutorResponse.parse({ text, audioUrl: null }));
});

export default router;
