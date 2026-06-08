---
name: ClearThink practice-exam API
description: Non-obvious URL + payload conventions for the infinite practice-exam / feedback-dialogue feature.
---

# Practice exam + feedback dialogue conventions

**Creating a practice exam is asymmetric with the other practice-exam routes.**
- Create: `POST /api/assignments/:assignmentId/practice` (nested under the assignment, returns a session).
- Everything else is keyed by the returned `sessionId`: `GET /api/practice-exams/:sessionId`,
  `POST /api/practice-exams/:sessionId/submit`, `GET /api/practice-exams/:sessionId/feedback`,
  `POST /api/practice-exams/:sessionId/feedback/ask`.

**Why:** the create call needs the assignment to shape the exam; the rest operate on an existing
session. Easy to wrongly assume create is `POST /api/practice-exams`.

**Submit payload requires a full KeystrokeTrace per answer** — `keystrokeCount`, `eraseCount`,
`bulkInsertCount`, `longestBulkInsertChars`, `rewriteSegments`, `durationMs`. `AnswerInput`
emits these; when there is no captured trace use an explicit `emptyTrace` fallback (all zeros),
never omit fields — the server/zod validation rejects partial traces.

**Feedback dialogue is server-persisted**, not local-only. Read history with
`useGetFeedbackMessages(sessionId)` and after `useAskFeedback` invalidate
`getGetFeedbackMessagesQueryKey(sessionId)` rather than keeping an in-memory thread, so the
conversation survives refresh/navigation. Show the student's just-sent message optimistically
while the mutation is pending, then clear it once the invalidation resolves.

**Graded vs practice tutor rule:** the live tutor (`LiveTutorPane`) appears in ALL practice
surfaces (TopicPractice, PracticeExam) but must NEVER be mounted in `AssignmentRunner` — graded
assignments stay tutor-free by design.
