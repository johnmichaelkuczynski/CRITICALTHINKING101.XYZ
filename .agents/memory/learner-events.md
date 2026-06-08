---
name: ClearThink learner events vs. mastery
description: Which data sources feed topic mastery vs. which are activity-log only — to avoid double-counting.
---

# Learner events vs. mastery

**Topic mastery is computed from exactly two sources** (see `topicMastery`):
the `practice_attempts` table (adaptive topic practice) UNION `learner_events` rows with
`kind = 'practice_exam'`. Nothing else counts toward mastery/accuracy.

**Therefore the event `kind` is load-bearing, not cosmetic.** When logging activity, use:
- `practice` for adaptive topic-practice grades — its mastery already comes from
  `practice_attempts`, so logging it as `practice` keeps it activity-only and avoids
  double-counting. Do NOT log topic practice as `practice_exam`.
- `assignment` for graded-assignment submits — activity feed only; graded attempts are
  intentionally excluded from mastery (mastery reflects *practice*, not the graded run).
- `lecture_view`, `lecture_expand`, `tutor`, `feedback_dialogue` — activity-only.
**Why:** the "every activity is logged" requirement is about the evolving learner profile /
activity feed; mastery is a separate, narrower signal. Mixing kinds silently corrupts accuracy.

**Practice-exam submit is idempotent.** A `submitted` session re-submitting returns the stored
result (reconstructed from `practice_exam_answers`) instead of re-grading — otherwise it would
duplicate answer rows and learner events.
