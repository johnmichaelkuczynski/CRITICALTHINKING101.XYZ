import { Router, type IRouter } from "express";
import { eq, isNull } from "drizzle-orm";
import { db, lecturesTable } from "@workspace/db";
import { AskTutorBody, AskTutorResponse } from "@workspace/api-zod";
import { chatText, chatJson, TEXT_MODEL } from "../lib/ai";
import { logger } from "../lib/logger";
import { logEvent } from "../lib/events";

const router: IRouter = Router();

const STARTER_SYSTEM =
  'You are a sharp college critical-thinking tutor who writes applied practice questions. You NEVER ask students to recite, define, or explain concepts in the abstract — every question forces them to APPLY a concept to a specific concrete case. Reply as strict JSON of the form {"questions": string[]} with NO other keys.';

function starterPrompt(title: string, body: string): string {
  // Cap body length sent to the model — the opening sections carry the core
  // concepts and a shorter prompt generates noticeably faster.
  const trimmed = body.length > 4000 ? body.slice(0, 4000) : body;
  return `Using the concepts taught in the lecture below, write 6 APPLIED practice questions. The point is to test whether the student can USE the ideas, never whether they memorized the textbook.

ABSOLUTE RULES — every question MUST follow all of these:
1. Each question contains its own SPECIFIC, CONCRETE example invented by you — a real sentence, a short passage, a mini-scenario, a claim, an argument, or a brief exchange between people. The example must be written out IN the question so the student can answer it without re-reading the lecture.
2. The task is always to APPLY a concept to that example: classify it, diagnose what's wrong with it, reconstruct it, decide whether it qualifies, identify the fallacy/bias/premise/conclusion at work, fix it, or judge it.
3. Use fresh, vivid, real-world examples (campus life, news, ads, arguments between friends, social media, science claims, politics) — NOT the same examples used in the lecture.

STRICTLY FORBIDDEN — never produce a question that:
- asks "what is X", "define X", "explain X", "why is X", "what is the difference between X and Y", "how do you distinguish X from Y", or "what are the cues/steps for X" in the abstract.
- can be answered by reciting or paraphrasing a definition or rule from the lecture.
- references "the lecture", "the text", "the reading", or "the lecture's test/rule" — the student should not need the lecture in front of them.
- is vague or open-ended ("how do I get better at...", "what should I keep in mind...").

FORMAT — every question MUST embed its concrete example inside DOUBLE QUOTES ("like this") so the situation is unmistakable. Generate 8 questions. Each is one or two natural sentences in the student's own voice, ~15–35 words.

Good: My roommate says "You can't trust Dr. Lee's diet study — she's overweight herself." Which fallacy is that, and why does it fail?
Good: A flyer claims "Four out of five dentists recommend Brite gum." What's missing before I should believe that supports the conclusion that Brite is best?
Bad: "What is the ad hominem fallacy and why is it a problem?"
Bad: "How can I reliably tell a stated premise apart from rhetorical noise?"

LECTURE TITLE: ${title}\n\nLECTURE CONTENT (for the concepts only — do NOT reuse its examples):\n"""\n${trimmed}\n"""`;
}

// An applied question presents a concrete example. We enforce that the model
// wrapped that example in quotes, which lets us discard any abstract
// definition/recall questions that slip through.
function isApplied(q: string): boolean {
  if (/["“”]/.test(q)) return true; // a double-quoted example
  if (/['‘][^'’]{15,}['’]/.test(q)) return true; // a long single-quoted span
  return false;
}

// Guard against occasional model glitches that splice in non-Latin scripts
// (Cyrillic, Arabic, Devanagari, CJK, Hangul) mid-sentence.
function isCleanText(q: string): boolean {
  return !/[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u3000-\u9FFF\uAC00-\uD7AF]/.test(
    q,
  );
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
  const all = Array.isArray(out?.questions)
    ? out.questions.filter(
        (q) => typeof q === "string" && q.trim().length > 0 && isCleanText(q),
      )
    : [];
  const applied = all.filter(isApplied);
  // Prefer applied questions; only fall back to the rest if too few survive,
  // so the section is never empty.
  const chosen = applied.length >= 4 ? applied : [...applied, ...all];
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
