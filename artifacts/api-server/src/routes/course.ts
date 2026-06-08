import { Router, type IRouter } from "express";
import { eq, asc, sql } from "drizzle-orm";
import {
  db,
  topicsTable,
  lecturesTable,
  assignmentsTable,
  attemptsTable,
} from "@workspace/db";
import {
  GetCourseOverviewResponse,
  GetWeekResponse,
  GetLectureResponse,
  ListTopicsResponse,
  ExpandLectureBody,
  ExpandLectureResponse,
} from "@workspace/api-zod";
import { chatText } from "../lib/ai";
import { logEvent } from "../lib/events";

const router: IRouter = Router();

const WEEK_TITLES: Record<number, { title: string; summary: string }> = {
  1: {
    title: "Week 1 — Foundations of critical thinking",
    summary:
      "Claims and truth, arguments vs. non-arguments, premises and conclusions, reconstructing, diagramming, and charitable interpretation.",
  },
  2: {
    title: "Week 2 — Logic and reasoning",
    summary:
      "Deductive vs. inductive, validity and soundness, categorical and propositional logic, induction, analogy, and causal reasoning.",
  },
  3: {
    title: "Week 3 — Fallacies, bias, and rhetoric",
    summary:
      "Informal fallacies, rhetoric and spin, cognitive biases, language and definition, and judging sources.",
  },
  4: {
    title: "Week 4 — Applied reasoning and capstone",
    summary:
      "Probability, evaluating evidence, decisions under uncertainty, moral reasoning, argumentative writing, misinformation, and the capstone.",
  },
};

async function buildWeek(weekNumber: number) {
  const lectures = await db
    .select({
      id: lecturesTable.id,
      title: lecturesTable.title,
      topicId: lecturesTable.topicId,
    })
    .from(lecturesTable)
    .where(eq(lecturesTable.weekNumber, weekNumber))
    .orderBy(asc(lecturesTable.id));

  const assignments = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.weekNumber, weekNumber))
    .orderBy(asc(assignmentsTable.position));

  const assignmentSummaries = await Promise.all(
    assignments.map(async (a) => {
      const counts = await db.execute(
        sql`select count(*)::int as n from problems where assignment_id = ${a.id}`,
      );
      const n = (counts.rows[0] as { n?: number } | undefined)?.n ?? 0;
      const attempts = await db
        .select()
        .from(attemptsTable)
        .where(eq(attemptsTable.assignmentId, a.id))
        .orderBy(asc(attemptsTable.id));
      const submitted = attempts.filter((x) => x.status === "submitted");
      const inProgress = attempts.find((x) => x.status === "in_progress");
      const best = submitted.reduce(
        (best, x) =>
          x.scorePercent != null && x.scorePercent > best ? x.scorePercent : best,
        -1,
      );
      const status: "not_started" | "in_progress" | "submitted" = inProgress
        ? "in_progress"
        : submitted.length > 0
        ? "submitted"
        : "not_started";
      const last = attempts[attempts.length - 1];
      return {
        id: a.id,
        kind: a.kind as "homework" | "test" | "midterm" | "final",
        title: a.title,
        weekNumber: a.weekNumber,
        problemCount: n,
        isTimed: a.isTimed,
        timeLimitMinutes: a.timeLimitMinutes,
        status,
        bestScore: best < 0 ? null : best,
        lastAttemptId: last?.id ?? null,
      };
    }),
  );

  const meta = WEEK_TITLES[weekNumber] ?? {
    title: `Week ${weekNumber}`,
    summary: "",
  };

  return {
    weekNumber,
    title: meta.title,
    summary: meta.summary,
    lectures,
    assignments: assignmentSummaries,
  };
}

router.get("/course/overview", async (_req, res) => {
  const weeks = await Promise.all([1, 2, 3, 4].map(buildWeek));
  const assignmentsTotal = weeks.reduce((s, w) => s + w.assignments.length, 0);
  const assignmentsCompleted = weeks.reduce(
    (s, w) => s + w.assignments.filter((a) => a.status === "submitted").length,
    0,
  );
  const practiceCountRow = await db.execute(
    sql`select count(*)::int as n from practice_attempts`,
  );
  const practiceCount =
    (practiceCountRow.rows[0] as { n?: number } | undefined)?.n ?? 0;

  res.json(
    GetCourseOverviewResponse.parse({
      title: "Critical Thinking 101",
      weeks,
      totals: { assignmentsCompleted, assignmentsTotal, practiceCount },
    }),
  );
});

router.get("/course/weeks/:weekNumber", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.weekNumber)
    ? req.params.weekNumber[0]
    : req.params.weekNumber;
  const weekNumber = parseInt(raw ?? "", 10);
  if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 4) {
    res.status(400).json({ error: "invalid weekNumber" });
    return;
  }
  const week = await buildWeek(weekNumber);
  res.json(GetWeekResponse.parse(week));
});

router.get("/course/lectures/:lectureId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.lectureId)
    ? req.params.lectureId[0]
    : req.params.lectureId;
  const lectureId = parseInt(raw ?? "", 10);
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
  await logEvent({
    kind: "lecture_view",
    topicId: lecture.topicId,
    weekNumber: lecture.weekNumber,
    detail: { lectureId },
  });
  res.json(GetLectureResponse.parse(lecture));
});

router.post("/course/lectures/:lectureId/expand", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.lectureId)
    ? req.params.lectureId[0]
    : req.params.lectureId;
  const lectureId = parseInt(raw ?? "", 10);
  if (!Number.isFinite(lectureId)) {
    res.status(400).json({ error: "invalid lectureId" });
    return;
  }
  const parsed = ExpandLectureBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const level = parsed.data.level;

  const [lecture] = await db
    .select()
    .from(lecturesTable)
    .where(eq(lecturesTable.id, lectureId));
  if (!lecture) {
    res.status(404).json({ error: "lecture not found" });
    return;
  }

  // Already generated — return as-is (idempotent, instant).
  const existing = level === "medium" ? lecture.bodyMedium : lecture.bodyLong;
  if (existing && existing.trim().length > 0) {
    res.json(ExpandLectureResponse.parse(lecture));
    return;
  }

  const target =
    level === "medium"
      ? "a MEDIUM-length version: noticeably more explanation than the short version, with one or two extra worked examples, while keeping the same concepts, structure, and learning objectives"
      : "a LONG, textbook-depth version: the fullest explanation, multiple worked examples, edge cases, and common pitfalls, while keeping the same concepts and learning objectives";

  res.setTimeout(2 * 60 * 1000);
  let generated = "";
  try {
    generated = await chatText(
      "You rewrite a college critical-thinking lecture at a requested depth. Preserve the original concepts, examples, and learning objectives — only expand explanation and add examples. Output clean Markdown with headings and short paragraphs. Do not add a title line; start with the body.",
      `Rewrite the lecture below as ${target}.\n\nLECTURE TITLE: ${lecture.title}\n\nSHORT VERSION:\n"""\n${lecture.body}\n"""`,
    );
  } catch {
    generated = "";
  }
  if (!generated || generated.trim().length === 0) {
    res.status(502).json({ error: "could not generate expanded lecture, please retry" });
    return;
  }

  const [updated] = await db
    .update(lecturesTable)
    .set(level === "medium" ? { bodyMedium: generated } : { bodyLong: generated })
    .where(eq(lecturesTable.id, lectureId))
    .returning();

  await logEvent({
    kind: "lecture_expand",
    topicId: lecture.topicId,
    weekNumber: lecture.weekNumber,
    detail: { lectureId, level },
  });

  res.json(ExpandLectureResponse.parse(updated ?? lecture));
});

router.get("/course/topics", async (_req, res) => {
  const rows = await db
    .select()
    .from(topicsTable)
    .orderBy(asc(topicsTable.position));
  res.json(ListTopicsResponse.parse(rows));
});

export default router;
