import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, diagnosticSessionsTable } from "@workspace/db";
import type { DiagnosticQuestion } from "@workspace/db";
import {
  GetAssessmentsOverviewResponse,
  StartAssessmentBody,
  StartAssessmentResponse,
  SubmitAssessmentBody,
  SubmitAssessmentResponse,
  GetAssessmentSessionParams,
  GetAssessmentSessionResponse,
} from "@workspace/api-zod";
import {
  GRADED_SLOTS,
  SLOT_META,
  isValidSlot,
  isGradedSlot,
  slotLabel,
  generateDiagnostic,
  scoreSkills,
  generateFeedback,
  DIAGNOSTIC_TOTAL,
} from "../lib/diagnostics";
import { logEvent } from "../lib/events";

const router: IRouter = Router();

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

// Public (no correct answers) view of a session's questions.
function publicQuestions(questions: DiagnosticQuestion[]) {
  return questions.map((q, i) => ({
    id: i,
    skill: q.skill,
    prompt: q.prompt,
    options: q.options,
  }));
}

// ---------- Overview: status of the 5 graded slots + 20% component + self history ----------
router.get("/assessments/overview", async (_req, res): Promise<void> => {
  const all = await db
    .select()
    .from(diagnosticSessionsTable)
    .orderBy(desc(diagnosticSessionsTable.startedAt));

  const slots = GRADED_SLOTS.map((slot) => {
    const meta = SLOT_META[slot]!;
    const sessions = all.filter((s) => s.slot === slot);
    const submitted = sessions.find((s) => s.status === "submitted");
    const inProgress = sessions.find((s) => s.status === "in_progress");
    // Graded slots are re-takeable, so a slot can have BOTH a completed attempt
    // and an active retake at the same time. Surface the active retake in `status`
    // (so the UI offers Resume) while still exposing the latest submitted result
    // via the score fields and `sessionId` (so "View results" keeps working).
    // Grade credit is computed from submitted-session existence below, independent
    // of `status`, so starting a retake never drops points already earned.
    const status = inProgress ? "in_progress" : submitted ? "submitted" : "not_started";
    return {
      slot,
      label: meta.label,
      description: meta.description,
      graded: true,
      status: status as "not_started" | "in_progress" | "submitted",
      sessionId: submitted?.id ?? inProgress?.id ?? null,
      scorePercent: submitted?.scorePercent ?? null,
      passed: submitted?.passed ?? null,
      submittedAt: submitted?.submittedAt ?? null,
    };
  });

  const gradedTaken = GRADED_SLOTS.filter((slot) =>
    all.some((s) => s.slot === slot && s.status === "submitted"),
  ).length;
  const gradedTotal = GRADED_SLOTS.length;
  const gradedComponent = Number(((gradedTaken / gradedTotal) * 100).toFixed(1));

  const selfHistory = all
    .filter((s) => s.slot === "self" && s.status === "submitted" && s.submittedAt)
    .slice(0, 10)
    .map((s) => ({
      sessionId: s.id,
      scorePercent: s.scorePercent ?? 0,
      submittedAt: s.submittedAt!,
    }));

  res.json(
    GetAssessmentsOverviewResponse.parse({
      slots,
      gradedTaken,
      gradedTotal,
      gradedComponent,
      weightPercent: 20,
      selfHistory,
    }),
  );
});

// ---------- Start (or resume) an assessment; generate fresh unique questions ----------
router.post("/assessments/start", async (req, res): Promise<void> => {
  const parsed = StartAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid body" });
    return;
  }
  const { slot } = parsed.data;
  if (!isValidSlot(slot)) {
    res.status(400).json({ error: "unknown slot" });
    return;
  }
  const graded = isGradedSlot(slot);

  // Graded slots are re-takeable as often as the student wants. We don't block a
  // retake after a prior submission; we only resume an existing in-progress
  // session so a half-finished attempt isn't orphaned. Each fresh start below
  // creates a brand-new session with newly generated, unique questions.
  if (graded) {
    const existing = await db
      .select()
      .from(diagnosticSessionsTable)
      .where(eq(diagnosticSessionsTable.slot, slot))
      .orderBy(desc(diagnosticSessionsTable.startedAt));
    const inProgress = existing.find((s) => s.status === "in_progress");
    if (inProgress) {
      res.json(
        StartAssessmentResponse.parse({
          id: inProgress.id,
          slot,
          label: slotLabel(slot),
          graded,
          status: "in_progress",
          total: inProgress.questions.length,
          questions: publicQuestions(inProgress.questions),
        }),
      );
      return;
    }
  }

  // Collect prior stems across ALL administrations so each instance is unique.
  const prior = await db
    .select({ questions: diagnosticSessionsTable.questions })
    .from(diagnosticSessionsTable);
  const priorStems = prior.flatMap((p) => (p.questions ?? []).map((q) => q.prompt));

  const questions = await generateDiagnostic(priorStems);

  const [session] = await db
    .insert(diagnosticSessionsTable)
    .values({ slot, status: "in_progress", questions })
    .returning();
  if (!session) {
    res.status(500).json({ error: "failed to create assessment" });
    return;
  }

  await logEvent({
    kind: "diagnostic",
    detail: { action: "start", slot, graded, total: questions.length },
  });

  res.json(
    StartAssessmentResponse.parse({
      id: session.id,
      slot,
      label: slotLabel(slot),
      graded,
      status: "in_progress",
      total: questions.length,
      questions: publicQuestions(questions),
    }),
  );
});

// ---------- Submit: score objectively, record pass/fail, write feedback ----------
router.post("/assessments/submit", async (req, res): Promise<void> => {
  const parsed = SubmitAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid body" });
    return;
  }
  const { sessionId, answers: rawAnswers } = parsed.data;

  const [session] = await db
    .select()
    .from(diagnosticSessionsTable)
    .where(eq(diagnosticSessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "assessment not found" });
    return;
  }
  if (session.status === "submitted") {
    res.status(409).json({ error: "assessment already submitted" });
    return;
  }

  // Graded slots are re-takeable: multiple submitted rows per slot are allowed.
  // The atomic in_progress→submitted claim below still prevents a single session
  // from being submitted twice, and the grade math dedupes graded slots by a Set,
  // so extra submissions never inflate the 20% diagnostic component.

  const questions = session.questions;
  // Build a dense answer array indexed by question position; -1 = skipped.
  const answers: number[] = questions.map(() => -1);
  for (const a of rawAnswers) {
    if (a.questionId >= 0 && a.questionId < answers.length) {
      answers[a.questionId] = a.choice;
    }
  }

  const { scorePercent, breakdown } = scoreSkills(questions, answers);
  const graded = isGradedSlot(session.slot);
  const feedback = await generateFeedback(session.slot, scorePercent, breakdown);
  // Pass/fail: completing a graded diagnostic = pass. Self-assessment is ungraded.
  const passed = graded ? true : null;
  const submittedAt = new Date();

  // Atomically claim the session: only transition a row that is still
  // in_progress. This makes the write state-safe against (a) a course reset that
  // deletes the row mid-attempt and (b) a concurrent second submit on the same
  // session — both leave `updated` empty instead of returning a phantom 200.
  const updated = await db
    .update(diagnosticSessionsTable)
    .set({
      status: "submitted",
      answers,
      scorePercent,
      skillBreakdown: breakdown,
      feedback,
      passed,
      submittedAt,
    })
    .where(
      and(
        eq(diagnosticSessionsTable.id, sessionId),
        eq(diagnosticSessionsTable.status, "in_progress"),
      ),
    )
    .returning({ id: diagnosticSessionsTable.id });

  if (updated.length === 0) {
    // Re-read to report the accurate reason: the row is gone (reset mid-attempt)
    // vs. it was already submitted by a racing request.
    const [current] = await db
      .select({ status: diagnosticSessionsTable.status })
      .from(diagnosticSessionsTable)
      .where(eq(diagnosticSessionsTable.id, sessionId));
    if (!current) {
      res.status(404).json({ error: "assessment not found" });
      return;
    }
    res.status(409).json({ error: "assessment already submitted" });
    return;
  }

  await logEvent({
    kind: "diagnostic",
    correct: null,
    score: scorePercent,
    detail: { action: "submit", slot: session.slot, graded, passed, scorePercent },
  });

  res.json(
    SubmitAssessmentResponse.parse({
      sessionId: session.id,
      slot: session.slot,
      label: slotLabel(session.slot),
      graded,
      scorePercent,
      passed,
      skillBreakdown: breakdown,
      feedback,
      questions: questions.map((q, i) => ({
        id: i,
        skill: q.skill,
        prompt: q.prompt,
        options: q.options,
        choice: answers[i] ?? -1,
        correctIndex: q.correctIndex,
        correct: (answers[i] ?? -1) === q.correctIndex,
        explanation: q.explanation,
      })),
      submittedAt,
    }),
  );
});

// ---------- Fetch a session — questions if in progress, full result if submitted ----------
router.get("/assessments/sessions/:sessionId", async (req, res): Promise<void> => {
  const params = GetAssessmentSessionParams.safeParse({
    sessionId: parseIdParam(req.params.sessionId),
  });
  if (!params.success) {
    res.status(400).json({ error: "invalid session id" });
    return;
  }
  const [session] = await db
    .select()
    .from(diagnosticSessionsTable)
    .where(eq(diagnosticSessionsTable.id, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "assessment not found" });
    return;
  }
  const graded = isGradedSlot(session.slot);

  if (session.status === "submitted") {
    const answers = session.answers ?? session.questions.map(() => -1);
    res.json(
      GetAssessmentSessionResponse.parse({
        status: "submitted",
        session: null,
        result: {
          sessionId: session.id,
          slot: session.slot,
          label: slotLabel(session.slot),
          graded,
          scorePercent: session.scorePercent ?? 0,
          passed: session.passed ?? null,
          skillBreakdown: session.skillBreakdown ?? [],
          feedback: session.feedback ?? "",
          questions: session.questions.map((q, i) => ({
            id: i,
            skill: q.skill,
            prompt: q.prompt,
            options: q.options,
            choice: answers[i] ?? -1,
            correctIndex: q.correctIndex,
            correct: (answers[i] ?? -1) === q.correctIndex,
            explanation: q.explanation,
          })),
          submittedAt: session.submittedAt ?? null,
        },
      }),
    );
    return;
  }

  res.json(
    GetAssessmentSessionResponse.parse({
      status: "in_progress",
      session: {
        id: session.id,
        slot: session.slot,
        label: slotLabel(session.slot),
        graded,
        status: "in_progress",
        total: session.questions.length,
        questions: publicQuestions(session.questions),
      },
      result: null,
    }),
  );
});

export default router;
