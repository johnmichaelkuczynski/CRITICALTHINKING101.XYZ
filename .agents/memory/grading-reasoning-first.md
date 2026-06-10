---
name: Grading is reasoning-first, not template-match
description: How short-answer grading must work in this critical-thinking course, and why.
---

# Grading judges the student's reasoning, not proximity to the stored answer

The single shared grader `gradeAnswer` (artifacts/api-server/src/lib/grading.ts) is
reused by every graded surface: assignments, practice, practice exams, diagnostics,
assessments. Fix it once and you fix grading everywhere.

**Rule:** the grader must judge whether the student's answer is TRUE, valid, and a
genuine answer to the QUESTION — judged against the question itself, NOT against the
stored `correctAnswer`. The `correctAnswer` is ONE illustrative example (a fallible
author wrote it; it can be narrow or partly wrong). The prompt must forbid scoring
proximity to it and must credit answers that differ from, omit, reframe, use
different examples than, or even contradict the example — as long as they correctly
answer what was asked. Mark wrong ONLY for a false claim, invalid reasoning, the
wrong phenomenon, or not addressing the question; resolve genuine ambiguity in the
student's favor.

**Why:** template-anchored grading marked a correct answer wrong (Week 1 Test Q4:
"give support that would NOT make 'I'll ace the final' reasonable" — student said
"he flunked all 30 practice finals," which plainly fails to support acing, but the
grader wanted the example's specific *irrelevant-evidence* flavor). For a course
whose entire purpose is assessing reasoning, grade-by-template is failing at its own
founding purpose. After the rewrite, the same six answers scored 6/6.

**How to apply:** keep the exact-match / numeric-tolerance shortcuts (they only ever
mark CORRECT, never wrong). All wrong verdicts come from the LLM prompt — that prompt
is the lever. Keep "grade the phenomenon not the label" and "substance not format."

**Feedback contract (results screen, AssignmentRunner.tsx review/result view):**
every graded problem must show (1) the original question, (2) the student's answer,
(3) an explicit Correct/Incorrect grade, (4) the reason for the grade. The question
prompt is pulled client-side by matching `perProblem.problemId` to
`assignment.problems` (no API change needed). Label the reference as "one example,"
not "the correct answer," to stay consistent with reasoning-first grading.
