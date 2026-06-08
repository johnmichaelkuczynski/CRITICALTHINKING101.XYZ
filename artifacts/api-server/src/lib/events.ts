import { db, learnerEventsTable } from "@workspace/db";

export type LearnerEventInput = {
  // practice | practice_exam | assignment | lecture_view | lecture_expand | tutor | feedback_dialogue
  kind: string;
  topicId?: number | null;
  weekNumber?: number | null;
  assignmentId?: number | null;
  correct?: boolean | null;
  score?: number | null;
  difficulty?: number | null;
  detail?: unknown;
};

/**
 * Append a single activity event to the evolving learner profile.
 * Logging must never block or fail the request that triggered it.
 */
export async function logEvent(e: LearnerEventInput): Promise<void> {
  try {
    await db.insert(learnerEventsTable).values({
      kind: e.kind,
      topicId: e.topicId ?? null,
      weekNumber: e.weekNumber ?? null,
      assignmentId: e.assignmentId ?? null,
      correct: e.correct ?? null,
      score: e.score ?? null,
      difficulty: e.difficulty ?? null,
      detail: (e.detail ?? null) as object | null,
    });
  } catch {
    // swallow — profiling is best-effort and must not break the user flow
  }
}

export async function logEvents(events: LearnerEventInput[]): Promise<void> {
  await Promise.all(events.map(logEvent));
}
