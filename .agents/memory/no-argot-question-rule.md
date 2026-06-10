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

## Plain language is necessary but NOT sufficient

Avoiding term-answers is only half the bar. A prompt can be 100% plain-language and still be a recognition task — "what's wrong with this reply?", "which is the support?", "does this follow?" only ask the student to *spot* the flaw, not *do* anything with it. The user's stronger requirement: every graded question must demand **active reasoning on a messy/realistic scenario** — evaluate, construct (a counterexample/steelman), compute (expected value, base-rate false-positive), diagnose (self-sealing/circular), decide+justify, design a controlled test. Categorizing a clean textbook example fails even with zero jargon. When auditing, ask "could a student answer by recognizing a pattern, or must they perform a reasoning operation?"

**The "which is which" trap is labeling in disguise.** A two-scenario prompt that says "one is X, the other is Y — which is which?" forces the student to sort each item into a named bucket BEFORE any reasoning; the user explicitly rejects this even when a "and explain why" rider follows. Fix by deleting the sort step and asking the student to *act on each item directly*: "For each one, decide whether [the operation applies] and explain…". The `violatesStandard` CLASSIFICATION list now regex-rejects `which is which` so generated questions can't reintroduce it — but the static seed bypasses the guard, so audit `seed.ts` prompts by hand. ("Which is safe to rely on / better on average" is fine — that's evaluating/computing, not sorting into a taxonomy.)

## Two more gotchas

- **`seedIfEmpty()` skips an already-populated DB.** Editing seed.ts does not update an existing database. `syncCourseContent()` (runs on boot after seedIfEmpty) UPDATEs existing problem rows in place, matched by **(assignment title, problem position)**, so seed edits reach live DBs without a destructive reset (preserves attempts). Limitation: it only updates existing rows — it does NOT insert/delete rows, so changing the problem COUNT per assignment leaves stale rows. Titles are assumed unique (no DB constraint enforces it).
- **Grading** (`grading.ts` `gradeAnswer`) must accept plain-language equivalents and never require the canonical term, or reasoning answers to reasoning questions still get marked wrong.
