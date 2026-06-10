import { Router, type IRouter } from "express";
import { eq, isNull } from "drizzle-orm";
import { db, lecturesTable } from "@workspace/db";
import { AskTutorBody, AskTutorResponse } from "@workspace/api-zod";
import { chatText, chatJson, TEXT_MODEL } from "../lib/ai";
import { logger } from "../lib/logger";
import { logEvent } from "../lib/events";
import {
  APPLIED_RULES,
  violatesStandard,
  hasConcreteExample,
  isCleanText,
} from "../lib/questions";

const router: IRouter = Router();

const STARTER_SYSTEM =
  'You are a sharp college critical-thinking tutor who writes applied practice questions phrased in the student\'s own voice. You NEVER ask students to recite, define, or explain concepts in the abstract — every question hands them a concrete situation and asks them to APPLY a principle to it. PREFER business and entrepreneurship situations (pricing, customers, ads, hiring, fundraising, product decisions), though everyday situations are fine too; never invent fake statistics, named companies, or real-sounding events. Reply as strict JSON of the form {"questions": string[]} with NO other keys.';

function starterPrompt(title: string, body: string): string {
  // Cap body length sent to the model — the opening sections carry the core
  // concepts and a shorter prompt generates noticeably faster. The lecture is
  // used ONLY to know which concepts to test; its examples must never be reused.
  const trimmed = body.length > 4000 ? body.slice(0, 4000) : body;
  return `Write 10 practice questions that test whether a student can USE the concepts named in the source below. Phrase each as one or two natural sentences in the student's own voice (~15–35 words), and wrap the concrete situation in DOUBLE QUOTES so it is unmistakable. Favor business and entrepreneurship scenarios — a founder, a small shop, an ad campaign, a pricing or hiring call — where they fit naturally, with everyday situations as fine alternatives.

${APPLIED_RULES}

The source material below tells you ONLY which concepts are in play — do NOT reuse its examples and do NOT reference it. The student should never need it in front of them.

CONCEPT AREA: ${title}\n\nSOURCE (concepts only):\n"""\n${trimmed}\n"""`;
}

async function generateStarterQuestions(
  title: string,
  body: string,
): Promise<string[]> {
  const out = await chatJson<{ questions: string[] }>(
    STARTER_SYSTEM,
    starterPrompt(title, body),
    TEXT_MODEL,
  );
  // Reject definitional / text-referencing questions outright — they are never
  // restored by the fallback below, no matter how few survive.
  const allowed = (Array.isArray(out?.questions) ? out.questions : []).filter(
    (q) =>
      typeof q === "string" &&
      q.trim().length > 0 &&
      isCleanText(q) &&
      !violatesStandard(q),
  );
  const applied = allowed.filter(hasConcreteExample);
  const chosen =
    applied.length >= 4
      ? applied
      : [...applied, ...allowed.filter((q) => !hasConcreteExample(q))];
  return [...new Set(chosen)].slice(0, 6);
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
  await logEvent({ kind: "tutor", detail: { action: "ask" } });
  res.json(AskTutorResponse.parse({ text, audioUrl: null }));
});

export default router;
