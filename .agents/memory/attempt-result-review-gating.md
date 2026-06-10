---
name: Attempt result/review endpoint gating
description: Why the assignment review endpoint must require submitted status before returning graded data
---

Any endpoint that reconstructs a graded attempt result (per-problem `correctAnswer` + `explanation` from stored rows) MUST gate on `attempt.status === "submitted"` and reject otherwise.

**Why:** Taking/retaking assignments is intentionally always allowed (the course is self-paced, single-user, and the user explicitly demanded "any student can take any assignment at any time"). But a review/result endpoint exposes the answer key. Without a submitted-status guard, a student can start an attempt to get an in-progress attemptId, then immediately call the result endpoint to reveal every answer before submitting — defeating timed tests and integrity. The take-anytime requirement does NOT extend to revealing answers for unsubmitted work.

**How to apply:** In `artifacts/api-server/src/routes/assignments.ts`, the `GET /assignments/attempts/:attemptId/result` route returns 409 unless the attempt is submitted. Keep this guard on any future endpoint that returns correct answers/explanations keyed off an attempt. The "take/retake" routes (start) stay ungated by design.
