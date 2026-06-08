import { db, topicsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

export type StrengthLabel = "strong" | "solid" | "developing" | "weak" | "untested";
export type Severity = "critical" | "important" | "minor";

export function labelFor(accuracy: number, attempts: number): StrengthLabel {
  if (attempts === 0) return "untested";
  if (accuracy >= 0.9) return "strong";
  if (accuracy >= 0.75) return "solid";
  if (accuracy >= 0.5) return "developing";
  return "weak";
}

export function severityFor(accuracy: number, attempts: number): Severity {
  if (attempts === 0) return "important";
  if (accuracy < 0.5) return "critical";
  if (accuracy < 0.75) return "important";
  return "minor";
}

export type TopicMastery = {
  topicId: number;
  topicTitle: string;
  weekNumber: number;
  attempts: number;
  accuracy: number; // 0..1
  label: StrengthLabel;
};

/**
 * Combined per-topic mastery across adaptive practice (practice_attempts) and
 * graded-style practice exams (learner_events, kind='practice_exam'). These two
 * sources never overlap, so the union is a clean total.
 */
export async function topicMastery(): Promise<TopicMastery[]> {
  const topics = await db.select().from(topicsTable).orderBy(sql`position asc`);
  const stats = await db.execute(sql`
    select topic_id, sum(n)::int as n, sum(c)::int as c from (
      select topic_id,
             count(*)::int as n,
             sum(case when correct then 1 else 0 end)::int as c
      from practice_attempts
      group by topic_id
      union all
      select topic_id,
             count(*)::int as n,
             sum(case when correct then 1 else 0 end)::int as c
      from learner_events
      where kind = 'practice_exam' and topic_id is not null and correct is not null
      group by topic_id
    ) t
    group by topic_id
  `);
  const byId = new Map<number, { n: number; c: number }>();
  for (const r of stats.rows as Array<{ topic_id: number; n: number; c: number }>) {
    byId.set(Number(r.topic_id), { n: Number(r.n), c: Number(r.c) });
  }
  return topics.map((t) => {
    const s = byId.get(t.id);
    const attempts = s?.n ?? 0;
    const accuracy = attempts === 0 ? 0 : s!.c / s!.n;
    return {
      topicId: t.id,
      topicTitle: t.title,
      weekNumber: t.weekNumber,
      attempts,
      accuracy: Number(accuracy.toFixed(3)),
      label: labelFor(accuracy, attempts),
    };
  });
}

export type FocusPointer = {
  topicId: number | null;
  topicTitle: string;
  severity: Severity;
  why: string;
  action: string;
};

/**
 * Turn weak/untested topics into surgical, analytics-driven focus pointers.
 * `restrictTopicIds` scopes the pointers to a specific assignment's topics.
 */
export function buildFocusPointers(
  mastery: TopicMastery[],
  opts: { restrictTopicIds?: Set<number>; limit?: number } = {},
): FocusPointer[] {
  const pool = opts.restrictTopicIds
    ? mastery.filter((m) => opts.restrictTopicIds!.has(m.topicId))
    : mastery;

  const weak = pool.filter((m) => m.attempts === 0 || m.accuracy < 0.75);
  weak.sort((a, b) => {
    // untested first, then lowest accuracy
    const ua = a.attempts === 0 ? -1 : a.accuracy;
    const ub = b.attempts === 0 ? -1 : b.accuracy;
    return ua - ub;
  });

  const pointers = weak.map((m): FocusPointer => {
    const severity = severityFor(m.accuracy, m.attempts);
    if (m.attempts === 0) {
      return {
        topicId: m.topicId,
        topicTitle: m.topicTitle,
        severity,
        why: `You haven't practiced ${m.topicTitle} yet, so there's no evidence you're ready for it on the graded version.`,
        action: `Run a short practice set on ${m.topicTitle} before you sit the graded assignment.`,
      };
    }
    const pct = Math.round(m.accuracy * 100);
    return {
      topicId: m.topicId,
      topicTitle: m.topicTitle,
      severity,
      why: `You're hitting only ${pct}% on ${m.topicTitle} (${m.attempts} attempt${
        m.attempts === 1 ? "" : "s"
      }) — that's your soft spot.`,
      action:
        severity === "critical"
          ? `Re-read the ${m.topicTitle} lecture, then drill it in practice until you clear ~80%.`
          : `Do a focused practice round on ${m.topicTitle} to push past 80% before grading.`,
    };
  });

  const limit = opts.limit ?? 6;
  return pointers.slice(0, limit);
}
