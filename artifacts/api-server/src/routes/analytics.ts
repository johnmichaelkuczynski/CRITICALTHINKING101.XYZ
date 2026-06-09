import { Router, type IRouter } from "express";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  topicsTable,
  attemptsTable,
  practiceAttemptsTable,
  assignmentsTable,
  problemsTable,
  practiceExamSessionsTable,
  learnerEventsTable,
  diagnosticSessionsTable,
} from "@workspace/db";
import {
  GetAnalyticsSummaryResponse,
  GetTopicAnalyticsResponse,
  GetRecentActivityResponse,
  GenerateReportResponse,
  GetAssignmentReadinessResponse,
  GetLearnerProfileResponse,
} from "@workspace/api-zod";
import { chatJson } from "../lib/ai";
import { topicMastery, buildFocusPointers } from "../lib/profile";

const router: IRouter = Router();

type StrengthLabel = "strong" | "solid" | "developing" | "weak" | "untested";
function labelFor(accuracy: number, attempts: number): StrengthLabel {
  if (attempts === 0) return "untested";
  if (accuracy >= 0.9) return "strong";
  if (accuracy >= 0.75) return "solid";
  if (accuracy >= 0.5) return "developing";
  return "weak";
}

async function topicStats() {
  const topics = await db
    .select()
    .from(topicsTable)
    .orderBy(asc(topicsTable.position));
  const stats = await db.execute(sql`
    select topic_id, count(*)::int as n, avg(case when correct then 1.0 else 0.0 end) as acc
    from practice_attempts group by topic_id
  `);
  const byId = new Map<number, { n: number; acc: number }>();
  for (const r of stats.rows as Array<{ topic_id: number; n: number; acc: number }>) {
    byId.set(Number(r.topic_id), { n: Number(r.n), acc: Number(r.acc) });
  }
  return topics.map((t) => {
    const s = byId.get(t.id);
    const attempts = s?.n ?? 0;
    const accuracy = attempts === 0 ? 0 : s!.acc;
    return {
      topicId: t.id,
      topicTitle: t.title,
      weekNumber: t.weekNumber,
      attempts,
      accuracy: Number(accuracy.toFixed(3)),
      strengthLabel: labelFor(accuracy, attempts),
    };
  });
}

// Final grade = 80% assignments (equally-weighted submitted attempts) + 20%
// diagnostics (the 5 graded diagnostics are pass/fail; taking one = pass).
const DIAGNOSTIC_WEIGHT = 0.2;
const GRADED_DIAGNOSTIC_TOTAL = 5;
async function computeGrade() {
  const submitted = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.status, "submitted"));
  const assignmentAverage =
    submitted.length === 0
      ? 0
      : submitted.reduce((s, a) => s + (a.scorePercent ?? 0), 0) / submitted.length;

  const diagnosticsSubmitted = await db
    .select()
    .from(diagnosticSessionsTable)
    .where(eq(diagnosticSessionsTable.status, "submitted"));
  const gradedTaken = new Set(
    diagnosticsSubmitted.filter((d) => d.slot !== "self").map((d) => d.slot),
  ).size;
  const diagnosticComponent = (gradedTaken / GRADED_DIAGNOSTIC_TOTAL) * 100;

  const officialAverage =
    (1 - DIAGNOSTIC_WEIGHT) * assignmentAverage +
    DIAGNOSTIC_WEIGHT * diagnosticComponent;

  return {
    submittedCount: submitted.length,
    assignmentAverage,
    gradedTaken,
    diagnosticComponent,
    officialAverage,
  };
}

router.get("/analytics/summary", async (_req, res) => {
  const submitted = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.status, "submitted"));
  const { officialAverage } = await computeGrade();

  const practice = await db.select().from(practiceAttemptsTable);
  const practiceCorrect = practice.filter((p) => p.correct).length;
  const practiceAccuracy =
    practice.length === 0 ? 0 : (practiceCorrect / practice.length) * 100;

  const days = new Set<string>();
  for (const p of practice) days.add(new Date(p.createdAt).toISOString().slice(0, 10));
  for (const a of submitted)
    if (a.submittedAt) days.add(new Date(a.submittedAt).toISOString().slice(0, 10));

  // streak: consecutive days ending today
  let streakDays = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streakDays++;
    else if (i > 0) break;
  }

  const topics = await topicStats();
  const tested = topics.filter((t) => t.attempts > 0);
  tested.sort((a, b) => b.accuracy - a.accuracy);
  const strongest = tested[0]?.topicTitle ?? null;
  const weakest = tested[tested.length - 1]?.topicTitle ?? null;

  res.json(
    GetAnalyticsSummaryResponse.parse({
      officialAverage: Number(officialAverage.toFixed(2)),
      practiceAccuracy: Number(practiceAccuracy.toFixed(2)),
      attemptsCount: submitted.length,
      practiceCount: practice.length,
      streakDays,
      strongestTopic: strongest,
      weakestTopic: weakest,
    }),
  );
});

router.get("/analytics/topics", async (_req, res) => {
  const rows = await topicStats();
  res.json(GetTopicAnalyticsResponse.parse(rows));
});

router.get("/analytics/activity", async (_req, res) => {
  const recentPractice = await db
    .select({
      id: practiceAttemptsTable.id,
      createdAt: practiceAttemptsTable.createdAt,
      correct: practiceAttemptsTable.correct,
      topicId: practiceAttemptsTable.topicId,
    })
    .from(practiceAttemptsTable)
    .orderBy(desc(practiceAttemptsTable.id))
    .limit(20);
  const topics = await db.select().from(topicsTable);
  const topicById = new Map(topics.map((t) => [t.id, t.title]));

  const recentAttempts = await db
    .select({
      id: attemptsTable.id,
      submittedAt: attemptsTable.submittedAt,
      scorePercent: attemptsTable.scorePercent,
      assignmentId: attemptsTable.assignmentId,
    })
    .from(attemptsTable)
    .where(eq(attemptsTable.status, "submitted"))
    .orderBy(desc(attemptsTable.id))
    .limit(20);
  const assignments = await db.select().from(assignmentsTable);
  const aById = new Map(assignments.map((a) => [a.id, a.title]));

  const items = [
    ...recentPractice.map((p) => ({
      id: p.id,
      kind: "practice" as const,
      title: `Practice — ${topicById.get(p.topicId) ?? "Topic"}`,
      at: p.createdAt.toISOString(),
      score: p.correct ? 100 : 0,
      topicTitle: topicById.get(p.topicId) ?? null,
    })),
    ...recentAttempts.map((a) => ({
      id: a.id + 1_000_000,
      kind: "assignment" as const,
      title: aById.get(a.assignmentId) ?? "Assignment",
      at: (a.submittedAt ?? new Date()).toISOString(),
      score: a.scorePercent ?? null,
      topicTitle: null,
    })),
  ].sort((x, y) => y.at.localeCompare(x.at));

  res.json(GetRecentActivityResponse.parse(items.slice(0, 30)));
});

router.post("/analytics/report", async (_req, res) => {
  const topics = await topicStats();
  const submitted = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.status, "submitted"));
  const { officialAverage } = await computeGrade();

  const tested = topics.filter((t) => t.attempts > 0);
  tested.sort((a, b) => a.accuracy - b.accuracy);
  const weakest = tested.slice(0, 3).map((t) => t.topicTitle);
  const strongest = tested.slice(-3).reverse().map((t) => t.topicTitle);

  let narrative = "";
  let recommendations: string[] = [];
  try {
    const out = await chatJson<{ narrative: string; recommendations: string[] }>(
      "You are an academic advisor for a college critical-thinking course. Write a 2-paragraph, encouraging but honest narrative summary, then list 3 concrete next-step recommendations. Strict JSON: {\"narrative\": string, \"recommendations\": string[]}.",
      JSON.stringify({
        officialAverage,
        attempts: submitted.length,
        weakestTopics: weakest,
        strongestTopics: strongest,
        perTopic: topics,
      }),
    );
    narrative = out.narrative;
    recommendations = out.recommendations ?? [];
  } catch {
    narrative =
      tested.length === 0
        ? "You haven't accumulated enough graded work yet to draw conclusions. Try a practice session or finish a homework, then regenerate this report."
        : `You're averaging ${officialAverage.toFixed(
            1,
          )}% on official assignments. Your strongest area so far is ${
            strongest[0] ?? "n/a"
          }; your weakest is ${weakest[0] ?? "n/a"}.`;
    recommendations =
      weakest.length > 0
        ? weakest.map((w) => `Run a focused practice session on ${w}.`)
        : ["Open a homework and start with a small set of problems."];
  }

  res.json(
    GenerateReportResponse.parse({
      generatedAt: new Date().toISOString(),
      narrative,
      strengths: strongest,
      weaknesses: weakest,
      recommendations,
    }),
  );
});

router.get("/assignments/:assignmentId/readiness", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.assignmentId)
    ? req.params.assignmentId[0]
    : req.params.assignmentId;
  const assignmentId = parseInt(raw ?? "", 10);
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

  const topicRows = await db
    .selectDistinct({ topicId: problemsTable.topicId })
    .from(problemsTable)
    .where(eq(problemsTable.assignmentId, assignmentId));
  const assignmentTopicIds = new Set(topicRows.map((r) => r.topicId));

  const mastery = await topicMastery();
  const scoped = mastery.filter((m) => assignmentTopicIds.has(m.topicId));

  // Readiness: average accuracy across the assignment's topics, where untested
  // topics count as a low 0.3 so the score pushes the student to practice.
  const perTopicReadiness = scoped.map((m) => (m.attempts === 0 ? 0.3 : m.accuracy));
  const avg =
    perTopicReadiness.length === 0
      ? 0
      : perTopicReadiness.reduce((s, v) => s + v, 0) / perTopicReadiness.length;
  const readiness = Math.round(avg * 100);

  const label: "not_ready" | "getting_there" | "ready" | "mastered" =
    readiness < 40
      ? "not_ready"
      : readiness < 65
      ? "getting_there"
      : readiness < 85
      ? "ready"
      : "mastered";

  const pointers = buildFocusPointers(mastery, {
    restrictTopicIds: assignmentTopicIds,
    limit: 5,
  });

  // How many practice exams the student has taken for this assignment.
  const examRows = await db
    .select({ id: practiceExamSessionsTable.id })
    .from(practiceExamSessionsTable)
    .where(eq(practiceExamSessionsTable.assignmentId, assignmentId));
  const practiceCount = examRows.length;

  const summary =
    label === "mastered"
      ? `You're ready. You're consistently strong across the ${scoped.length} topics on this ${assignment.kind}. Take one more practice exam to lock it in, then sit the graded version.`
      : label === "ready"
      ? `You're close. Most topics on this ${assignment.kind} are solid — clear the focus areas below with one more practice exam and you're set.`
      : label === "getting_there"
      ? `You're getting there, but a few topics on this ${assignment.kind} aren't reliable yet. Practice the focus areas below before the graded version.`
      : `Not ready yet. Build up the topics on this ${assignment.kind} with practice exams first — the focus areas below are where to start.`;

  res.json(
    GetAssignmentReadinessResponse.parse({
      assignmentId,
      assignmentTitle: assignment.title,
      kind: assignment.kind as "homework" | "test" | "midterm" | "final",
      readiness,
      label,
      summary,
      pointers,
      practiceCount,
      recommendPractice: readiness < 85 || practiceCount === 0,
    }),
  );
});

router.get("/profile", async (_req, res): Promise<void> => {
  const mastery = await topicMastery();

  const totalEventsRow = await db.execute(
    sql`select count(*)::int as n from learner_events`,
  );
  const totalEvents = (totalEventsRow.rows[0] as { n?: number } | undefined)?.n ?? 0;

  const examSubmittedRow = await db.execute(
    sql`select count(*)::int as n from practice_exam_sessions where status = 'submitted'`,
  );
  const practiceExamCount =
    (examSubmittedRow.rows[0] as { n?: number } | undefined)?.n ?? 0;

  const practiceRow = await db.execute(
    sql`select count(*)::int as n from practice_attempts`,
  );
  const practiceCount = (practiceRow.rows[0] as { n?: number } | undefined)?.n ?? 0;

  const gradedRow = await db.execute(
    sql`select count(*)::int as n from attempts where status = 'submitted'`,
  );
  const gradedCount = (gradedRow.rows[0] as { n?: number } | undefined)?.n ?? 0;

  const tested = mastery.filter((m) => m.attempts > 0);
  const strengthsSorted = [...tested].sort((a, b) => b.accuracy - a.accuracy);
  const strengths = strengthsSorted
    .filter((m) => m.accuracy >= 0.75)
    .slice(0, 4)
    .map((m) => m.topicTitle);

  const focusAreas = buildFocusPointers(mastery, { limit: 6 });

  let narrative = "";
  try {
    const out = await chatJson<{ narrative: string }>(
      "You are the student's critical-thinking learning coach. Using their evolving profile, write a 2-3 sentence narrative: where they stand, what's trending, and the single most useful thing to do next. Honest, specific, encouraging. Strict JSON: {\"narrative\": string}.",
      JSON.stringify({
        totalEvents,
        practiceExamCount,
        practiceCount,
        gradedCount,
        strengths,
        focusAreas: focusAreas.map((f) => f.topicTitle),
        topics: mastery,
      }),
    );
    narrative = out.narrative ?? "";
  } catch {
    narrative = "";
  }
  if (!narrative) {
    narrative =
      totalEvents === 0
        ? "Your learning profile is empty so far. Start a practice session or a practice exam and this profile will begin tracking your strengths and focus areas."
        : `You've logged ${totalEvents} learning actions so far. ${
            strengths.length > 0
              ? `You're strongest in ${strengths[0]}. `
              : ""
          }${
            focusAreas.length > 0
              ? `Your best next move is to practice ${focusAreas[0]!.topicTitle}.`
              : "Keep practicing to sharpen every topic."
          }`;
  }

  res.json(
    GetLearnerProfileResponse.parse({
      generatedAt: new Date().toISOString(),
      totalEvents,
      practiceExamCount,
      practiceCount,
      gradedCount,
      narrative,
      strengths,
      focusAreas,
      topics: mastery.map((m) => ({
        topicId: m.topicId,
        topicTitle: m.topicTitle,
        weekNumber: m.weekNumber,
        mastery: Math.round(m.accuracy * 100),
        attempts: m.attempts,
        label: m.label,
      })),
    }),
  );
});

export default router;
