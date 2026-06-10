import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  assignmentsTable,
  problemsTable,
  topicsTable,
  practiceExamSessionsTable,
  practiceExamProblemsTable,
  practiceExamAnswersTable,
  feedbackMessagesTable,
} from "@workspace/db";
import {
  CreatePracticeExamResponse,
  GetPracticeExamResponse,
  SubmitPracticeExamBody,
  SubmitPracticeExamResponse,
  GetFeedbackMessagesResponse,
  AskFeedbackBody,
  AskFeedbackResponse,
} from "@workspace/api-zod";
import { chatJson, chatText } from "../lib/ai";
import { gradeAnswer } from "../lib/grading";
import { logEvent } from "../lib/events";
import { topicMastery, buildFocusPointers, type FocusPointer } from "../lib/profile";
import { APPLIED_RULES, violatesStandard, answerIsBareLabel } from "../lib/questions";

const router: IRouter = Router();

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

function baseDifficultyFor(kind: string): number {
  switch (kind) {
    case "final":
      return 3.7;
    case "midterm":
      return 3.4;
    case "test":
      return 3.0;
    default:
      return 2.5;
  }
}

type Blueprint = { topicId: number; topicTitle: string };

// ---------- Create a fresh practice exam mirroring a graded assignment ----------
router.post("/assignments/:assignmentId/practice", async (req, res): Promise<void> => {
  const assignmentId = parseIdParam(req.params.assignmentId);
  if (!Number.isFinite(assignmentId)) {
    res.status(400).json({ error: "invalid assignment id" });
    return;
  }
  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, assignmentId));
  if (!assignment) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }

  const blueprintRows = await db
    .select({
      topicId: problemsTable.topicId,
      topicTitle: topicsTable.title,
    })
    .from(problemsTable)
    .leftJoin(topicsTable, eq(problemsTable.topicId, topicsTable.id))
    .where(eq(problemsTable.assignmentId, assignmentId))
    .orderBy(asc(problemsTable.position));
  if (blueprintRows.length === 0) {
    res.status(400).json({ error: "assignment has no problems to mirror" });
    return;
  }
  const blueprint: Blueprint[] = blueprintRows.map((r) => ({
    topicId: r.topicId,
    topicTitle: r.topicTitle ?? "Critical thinking",
  }));

  const base = baseDifficultyFor(assignment.kind);

  // Generate all fresh problems in one shot for speed; fall back per-slot.
  let generated: Array<{ prompt: string; correctAnswer: string; explanation: string }> = [];
  try {
    const out = await chatJson<{
      problems: Array<{ prompt: string; correctAnswer: string; explanation: string }>;
    }>(
      "You are a college critical-thinking exam author. Generate a set of BRAND-NEW practice problems that mirror an assignment blueprint. " +
        "You are given an ordered list of topics; produce exactly one fresh problem per slot, in the same order, on that slot's topic. " +
        "Each problem's `prompt` presents a concrete situation and asks the student to apply the concept to it; the answer is SHORT (a word, short phrase, or letter choice) — never multi-paragraph. " +
        APPLIED_RULES +
        '\n\nRespond as strict JSON: {"problems": [{"prompt": string, "correctAnswer": string, "explanation": string}]} with exactly the same number of items as slots, in order.',
      JSON.stringify({
        assignmentKind: assignment.kind,
        difficulty: `${base.toFixed(1)}/5`,
        slots: blueprint.map((b, i) => ({ slot: i + 1, topic: b.topicTitle })),
      }),
    );
    generated = Array.isArray(out?.problems) ? out.problems : [];
  } catch {
    generated = [];
  }

  const [session] = await db
    .insert(practiceExamSessionsTable)
    .values({ assignmentId, status: "in_progress" })
    .returning();
  if (!session) {
    res.status(500).json({ error: "failed to create practice exam" });
    return;
  }

  const problemValues = blueprint.map((b, i) => {
    const g = generated[i];
    const jitter = (Math.random() - 0.5) * 0.4;
    const difficulty = Math.max(1, Math.min(5, base + jitter));
    if (
      g &&
      g.prompt &&
      g.correctAnswer &&
      !violatesStandard(g.prompt) &&
      !answerIsBareLabel(g.correctAnswer)
    ) {
      return {
        sessionId: session.id,
        topicId: b.topicId,
        position: i + 1,
        prompt: g.prompt,
        correctAnswer: g.correctAnswer,
        explanation: g.explanation || `The expected answer is ${g.correctAnswer}.`,
        difficulty,
      };
    }
    return {
      sessionId: session.id,
      topicId: b.topicId,
      position: i + 1,
      prompt: `Practice (${b.topicTitle}): Someone argues, "Everyone I asked agreed with me, so my conclusion must be correct." Why doesn't the fact that many people agree actually show the conclusion is true?`,
      correctAnswer:
        "Lots of people can be wrong about the same thing — agreement isn't evidence. What makes a conclusion true is good reasons and evidence, not how many people hold it.",
      explanation:
        "Agreement by many people is not evidence that a claim is true; popularity and truth are independent.",
      difficulty,
    };
  });

  const storedProblems = await db
    .insert(practiceExamProblemsTable)
    .values(problemValues)
    .returning();
  storedProblems.sort((a, b) => a.position - b.position);

  await logEvent({
    kind: "practice_exam",
    assignmentId,
    weekNumber: assignment.weekNumber,
    detail: { action: "create", problemCount: storedProblems.length, kind: assignment.kind },
  });

  res.json(
    CreatePracticeExamResponse.parse({
      id: session.id,
      assignmentId,
      assignmentTitle: assignment.title,
      kind: assignment.kind as "homework" | "test" | "midterm" | "final",
      weekNumber: assignment.weekNumber,
      status: "in_progress",
      createdAt: session.createdAt.toISOString(),
      problems: storedProblems.map((p) => ({
        id: p.id,
        position: p.position,
        prompt: p.prompt,
        topicId: p.topicId,
        topicTitle: blueprint.find((b) => b.topicId === p.topicId)?.topicTitle ?? null,
        difficulty: p.difficulty,
      })),
    }),
  );
});

// ---------- Read a practice exam session ----------
router.get("/practice-exams/:sessionId", async (req, res): Promise<void> => {
  const sessionId = parseIdParam(req.params.sessionId);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid session id" });
    return;
  }
  const [session] = await db
    .select()
    .from(practiceExamSessionsTable)
    .where(eq(practiceExamSessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "practice exam not found" });
    return;
  }
  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, session.assignmentId));
  const problems = await db
    .select({
      id: practiceExamProblemsTable.id,
      position: practiceExamProblemsTable.position,
      prompt: practiceExamProblemsTable.prompt,
      topicId: practiceExamProblemsTable.topicId,
      topicTitle: topicsTable.title,
      difficulty: practiceExamProblemsTable.difficulty,
    })
    .from(practiceExamProblemsTable)
    .leftJoin(topicsTable, eq(practiceExamProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceExamProblemsTable.sessionId, sessionId))
    .orderBy(asc(practiceExamProblemsTable.position));

  res.json(
    GetPracticeExamResponse.parse({
      id: session.id,
      assignmentId: session.assignmentId,
      assignmentTitle: assignment?.title ?? "Practice exam",
      kind: (assignment?.kind ?? "homework") as "homework" | "test" | "midterm" | "final",
      weekNumber: assignment?.weekNumber ?? 0,
      status: session.status as "in_progress" | "submitted",
      createdAt: session.createdAt.toISOString(),
      problems: problems.map((p) => ({
        id: p.id,
        position: p.position,
        prompt: p.prompt,
        topicId: p.topicId,
        topicTitle: p.topicTitle ?? null,
        difficulty: p.difficulty,
      })),
    }),
  );
});

// ---------- Submit a practice exam: grade + heavy feedback + focus pointers ----------
router.post("/practice-exams/:sessionId/submit", async (req, res): Promise<void> => {
  res.setTimeout(5 * 60 * 1000);
  const sessionId = parseIdParam(req.params.sessionId);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid session id" });
    return;
  }
  const parsed = SubmitPracticeExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db
    .select()
    .from(practiceExamSessionsTable)
    .where(eq(practiceExamSessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "practice exam not found" });
    return;
  }

  // Idempotent: a session can only be graded once. Re-submitting returns the
  // stored result instead of re-grading (which would duplicate answers + events).
  if (session.status === "submitted") {
    const stored = await db
      .select({
        problemId: practiceExamAnswersTable.problemId,
        answer: practiceExamAnswersTable.answer,
        correct: practiceExamAnswersTable.correct,
        feedback: practiceExamAnswersTable.feedback,
        prompt: practiceExamProblemsTable.prompt,
        correctAnswer: practiceExamProblemsTable.correctAnswer,
        explanation: practiceExamProblemsTable.explanation,
        topicTitle: topicsTable.title,
      })
      .from(practiceExamAnswersTable)
      .leftJoin(
        practiceExamProblemsTable,
        eq(practiceExamAnswersTable.problemId, practiceExamProblemsTable.id),
      )
      .leftJoin(topicsTable, eq(practiceExamProblemsTable.topicId, topicsTable.id))
      .where(eq(practiceExamAnswersTable.sessionId, sessionId))
      .orderBy(asc(practiceExamProblemsTable.position));
    const perProblem = stored.map((s) => ({
      problemId: s.problemId,
      prompt: s.prompt ?? "",
      topicTitle: s.topicTitle ?? null,
      userAnswer: s.answer,
      correctAnswer: s.correctAnswer ?? "",
      correct: s.correct ?? false,
      feedback: s.feedback ?? "",
      explanation: s.explanation ?? "",
    }));
    const storedScore = perProblem.filter((p) => p.correct).length;
    res.json(
      SubmitPracticeExamResponse.parse({
        sessionId,
        score: storedScore,
        total: perProblem.length,
        percent: session.scorePercent ?? 0,
        perProblem,
        overallFeedback: session.overallFeedback ?? "",
        focusPointers: (session.focusPointers as FocusPointer[] | null) ?? [],
        encouragement: session.encouragement ?? "",
      }),
    );
    return;
  }

  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, session.assignmentId));

  const problems = await db
    .select()
    .from(practiceExamProblemsTable)
    .where(eq(practiceExamProblemsTable.sessionId, sessionId))
    .orderBy(asc(practiceExamProblemsTable.position));
  const topics = await db.select().from(topicsTable);
  const topicTitleById = new Map(topics.map((t) => [t.id, t.title]));

  const answerByProblem = new Map(parsed.data.answers.map((a) => [a.problemId, a]));

  // Grade each problem.
  const graded = await Promise.all(
    problems.map(async (p) => {
      const submitted = answerByProblem.get(p.id);
      const userAnswer = submitted?.answer ?? "";
      const g = await gradeAnswer({
        prompt: p.prompt,
        correctAnswer: p.correctAnswer,
        userAnswer,
      });
      return { problem: p, userAnswer, correct: g.correct, explanation: g.explanation };
    }),
  );
  const score = graded.filter((g) => g.correct).length;
  const total = problems.length;
  const percent = total === 0 ? 0 : (score / total) * 100;

  // Heavy per-problem feedback in a single batched call.
  let feedbackByIndex = new Map<number, string>();
  try {
    const out = await chatJson<{ items: Array<{ index: number; feedback: string }> }>(
      "You are a demanding but supportive critical-thinking coach reviewing a student's practice exam. " +
        "For EACH item, write 3-5 sentences of specific feedback: name the concept being tested, say exactly what the student got right or where their reasoning broke down, contrast their answer with the correct one, and give one concrete thing to do differently next time. Be direct and concrete — no vague praise. " +
        'Respond as strict JSON: {"items": [{"index": number, "feedback": string}]} covering every index given.',
      JSON.stringify({
        items: graded.map((g, i) => ({
          index: i,
          topic: topicTitleById.get(g.problem.topicId) ?? "",
          prompt: g.problem.prompt,
          correctAnswer: g.problem.correctAnswer,
          studentAnswer: g.userAnswer,
          correct: g.correct,
        })),
      }),
    );
    feedbackByIndex = new Map(
      (out.items ?? []).map((it) => [Number(it.index), String(it.feedback ?? "")]),
    );
  } catch {
    feedbackByIndex = new Map();
  }

  const perProblem = graded.map((g, i) => {
    const feedback =
      feedbackByIndex.get(i) ||
      (g.correct
        ? `Correct. ${g.explanation}`
        : `Not quite. ${g.explanation} Re-read how this concept is defined, then re-attempt a similar problem.`);
    return {
      problemId: g.problem.id,
      prompt: g.problem.prompt,
      topicTitle: topicTitleById.get(g.problem.topicId) ?? null,
      userAnswer: g.userAnswer,
      correctAnswer: g.problem.correctAnswer,
      correct: g.correct,
      feedback,
      explanation: g.explanation || g.problem.explanation,
    };
  });

  // Persist answers.
  for (const g of graded) {
    const submitted = answerByProblem.get(g.problem.id);
    const fb = perProblem.find((pp) => pp.problemId === g.problem.id)?.feedback ?? null;
    await db.insert(practiceExamAnswersTable).values({
      sessionId,
      problemId: g.problem.id,
      answer: g.userAnswer,
      correct: g.correct,
      feedback: fb,
      trace: (submitted?.trace ?? null) as object | null,
    });
  }

  // Log per-problem activity into the evolving profile (feeds mastery).
  await Promise.all(
    graded.map((g) =>
      logEvent({
        kind: "practice_exam",
        assignmentId: session.assignmentId,
        weekNumber: assignment?.weekNumber ?? null,
        topicId: g.problem.topicId,
        correct: g.correct,
        difficulty: g.problem.difficulty,
        detail: { action: "answer" },
      }),
    ),
  );
  await logEvent({
    kind: "practice_exam",
    assignmentId: session.assignmentId,
    weekNumber: assignment?.weekNumber ?? null,
    score: percent,
    detail: { action: "submit", score, total },
  });

  // Surgical, analytics-driven focus pointers scoped to this assignment's topics.
  const mastery = await topicMastery();
  const assignmentTopicIds = new Set(problems.map((p) => p.topicId));
  let focusPointers: FocusPointer[] = buildFocusPointers(mastery, {
    restrictTopicIds: assignmentTopicIds,
    limit: 5,
  });
  // If everything in scope already looks strong, surface this attempt's misses.
  if (focusPointers.length === 0) {
    const missed = perProblem.filter((p) => !p.correct);
    focusPointers = missed.slice(0, 4).map((p) => ({
      topicId: null,
      topicTitle: p.topicTitle ?? "This question",
      severity: "minor" as const,
      why: `You missed: "${p.prompt.slice(0, 90)}${p.prompt.length > 90 ? "…" : ""}".`,
      action: `Review why the answer is "${p.correctAnswer}" and try one more like it.`,
    }));
  }

  // Overall narrative + encouragement.
  let overallFeedback = "";
  let encouragement = "";
  try {
    const out = await chatJson<{ overall: string; encouragement: string }>(
      "You are a critical-thinking coach. Given a practice-exam result, write: (1) `overall` — a 3-4 sentence honest summary of how it went, what patterns you see, and the single biggest lever for improvement; (2) `encouragement` — one warm, motivating sentence that nudges the student to keep practicing. " +
        'Respond as strict JSON: {"overall": string, "encouragement": string}.',
      JSON.stringify({
        assignment: assignment?.title ?? "Practice exam",
        kind: assignment?.kind ?? "homework",
        score,
        total,
        percent: Math.round(percent),
        missedTopics: perProblem.filter((p) => !p.correct).map((p) => p.topicTitle),
        focusPointers: focusPointers.map((f) => f.topicTitle),
      }),
    );
    overallFeedback = out.overall ?? "";
    encouragement = out.encouragement ?? "";
  } catch {
    overallFeedback = "";
  }
  if (!overallFeedback) {
    overallFeedback =
      total === 0
        ? "No answers were submitted."
        : `You scored ${score}/${total} (${Math.round(
            percent,
          )}%). Focus your next round on the topics flagged below, then take another practice exam to confirm it stuck.`;
  }
  if (!encouragement) {
    encouragement =
      percent >= 80
        ? "Strong work — one more practice exam and you'll walk into the graded version with confidence."
        : "Every practice exam moves the needle. Run another one and watch these numbers climb.";
  }

  await db
    .update(practiceExamSessionsTable)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      scorePercent: percent,
      overallFeedback,
      focusPointers: focusPointers as unknown as object,
      encouragement,
    })
    .where(eq(practiceExamSessionsTable.id, sessionId));

  res.json(
    SubmitPracticeExamResponse.parse({
      sessionId,
      score,
      total,
      percent,
      perProblem,
      overallFeedback,
      focusPointers,
      encouragement,
    }),
  );
});

// ---------- Feedback dialogue ----------
router.get("/practice-exams/:sessionId/feedback", async (req, res): Promise<void> => {
  const sessionId = parseIdParam(req.params.sessionId);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid session id" });
    return;
  }
  const rows = await db
    .select()
    .from(feedbackMessagesTable)
    .where(eq(feedbackMessagesTable.sessionId, sessionId))
    .orderBy(asc(feedbackMessagesTable.id));
  res.json(
    GetFeedbackMessagesResponse.parse(
      rows.map((m) => ({
        id: m.id,
        role: m.role as "student" | "coach",
        content: m.content,
        at: m.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/practice-exams/:sessionId/feedback/ask", async (req, res): Promise<void> => {
  const sessionId = parseIdParam(req.params.sessionId);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid session id" });
    return;
  }
  const parsed = AskFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db
    .select()
    .from(practiceExamSessionsTable)
    .where(eq(practiceExamSessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "practice exam not found" });
    return;
  }

  // Build grounding context from the graded answers + overall feedback.
  const answers = await db
    .select({
      prompt: practiceExamProblemsTable.prompt,
      correctAnswer: practiceExamProblemsTable.correctAnswer,
      topicTitle: topicsTable.title,
      answer: practiceExamAnswersTable.answer,
      correct: practiceExamAnswersTable.correct,
      feedback: practiceExamAnswersTable.feedback,
    })
    .from(practiceExamAnswersTable)
    .leftJoin(
      practiceExamProblemsTable,
      eq(practiceExamAnswersTable.problemId, practiceExamProblemsTable.id),
    )
    .leftJoin(topicsTable, eq(practiceExamProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceExamAnswersTable.sessionId, sessionId));

  const history = await db
    .select()
    .from(feedbackMessagesTable)
    .where(eq(feedbackMessagesTable.sessionId, sessionId))
    .orderBy(asc(feedbackMessagesTable.id));

  const sys =
    "You are the student's personal critical-thinking coach, continuing a conversation about the feedback on a practice exam they just took. " +
    "You can see every problem, their answer, whether it was correct, and the feedback already given. Answer their follow-up directly and concretely, reference the specific problems, teach the underlying concept, and end by pointing at what to practice next. Keep it focused (3-7 sentences) unless they ask for more.";
  const context = JSON.stringify({
    overallFeedback: session.overallFeedback,
    score: session.scorePercent != null ? Math.round(session.scorePercent) : null,
    problems: answers,
    conversationSoFar: history.map((h) => ({ role: h.role, content: h.content })),
  });

  let reply = "";
  try {
    reply = await chatText(
      sys,
      `EXAM CONTEXT (JSON):\n${context}\n\nStudent's follow-up: ${parsed.data.message}`,
    );
  } catch {
    reply =
      "I'm having trouble reaching the coaching service right now — try again in a moment. In the meantime, re-read the feedback on the questions you missed and note the concept each one tests.";
  }

  await db.insert(feedbackMessagesTable).values({
    sessionId,
    role: "student",
    content: parsed.data.message,
  });
  const [coachMsg] = await db
    .insert(feedbackMessagesTable)
    .values({ sessionId, role: "coach", content: reply })
    .returning();

  await logEvent({
    kind: "feedback_dialogue",
    assignmentId: session.assignmentId,
    detail: { action: "ask" },
  });

  res.json(
    AskFeedbackResponse.parse({
      id: coachMsg?.id ?? 0,
      role: "coach",
      content: reply,
      at: (coachMsg?.createdAt ?? new Date()).toISOString(),
    }),
  );
});

export default router;
