---
name: No-argot question rule (reasoning, not labels)
description: Where the "questions must test reasoning in plain language, not term recall/classification" rule has to be enforced — and the surfaces that bypass the generation guard.
---

# No-argot question rule

Course questions (practice, homework, tests, midterm, final, diagnostics) must test **reasoning/judgment in plain language**. They must NOT ask a student to supply, recognize, name, classify, categorize, or label a term as the answer. Terminology is allowed in LECTURES ONLY.

**Why:** the user was strongly frustrated by a "best classified as what?" question whose canonical answer was a term ("false belief") — a correct reasoned answer got marked wrong. Term-answer questions punish students for not parroting jargon.

## How to apply — enforce in THREE independent places, not one

1. **`questions.ts` `violatesStandard()` + `answerIsBareLabel()`** — guard AI-*generated* questions (practice + practice-exam + diagnostics generation). `violatesStandard` regex-checks the PROMPT (`LABEL_RECALL`/`CLASSIFICATION`/`DEFINITIONAL`); `answerIsBareLabel` checks the ANSWER against a `LABEL_TERMS` denylist. **Both are required** — a model can write a clean scenario prompt yet still return a bare-label answer ("false belief", "ad hominem"), which the prompt guard alone misses. Enforced at: practice.ts (reject→fallback), practiceExams.ts (accept only if neither fires), diagnostics.ts `sanitizeQuestion` (checks the CORRECT option). `answerIsBareLabel` only fires on short answers (≤6 words) that, stripped of articles/filler, equal a denylist term — so "ERROR" and reasoning sentences pass; bare "false belief" fails.
2. **Static seed (`seed.ts` `ASSIGNMENTS`)** — graded assignments (`routes/assignments.ts`) serve and grade the seed problems **verbatim**, completely bypassing `violatesStandard()`. So the seed prompts/answers themselves must already be plain-language reasoning. Editing the guard does nothing for graded assignments.
3. **Fallback banks in route files** — `routes/practice.ts` and `routes/practiceExams.ts` have hardcoded fallback questions used when LLM generation fails or is rejected. These are LIVE paths and easy to miss; they must also be plain-language reasoning (no canonical-term answers). A source scan for term answers must include these literals.

## Two more gotchas

- **`seedIfEmpty()` skips an already-populated DB.** Editing seed.ts does not update an existing database. `syncCourseContent()` (runs on boot after seedIfEmpty) UPDATEs existing problem rows in place, matched by **(assignment title, problem position)**, so seed edits reach live DBs without a destructive reset (preserves attempts). Limitation: it only updates existing rows — it does NOT insert/delete rows, so changing the problem COUNT per assignment leaves stale rows. Titles are assumed unique (no DB constraint enforces it).
- **Grading** (`grading.ts` `gradeAnswer`) must accept plain-language equivalents and never require the canonical term, or reasoning answers to reasoning questions still get marked wrong.
