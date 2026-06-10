---
name: Lecture content sync & real-example convention
description: How editing course lecture bodies reaches the live DB, and the "real verifiable examples only" rule for lectures.
---

# Editing lecture content (qr-course / api-server)

The Short baseline of every lecture lives in the `TOPICS` array in
`artifacts/api-server/src/lib/seed.ts`. Medium/Long versions are LLM rewrites
cached in the DB (`lectures.body_medium` / `body_long`), generated on demand by
the prompt in `artifacts/api-server/src/routes/course.ts`. Starter questions are
also cached (`lectures.starter_questions`) and warmed on boot.

## Editing a TOPIC body alone is NOT enough
`seedIfEmpty()` only populates an empty DB, so editing `TOPICS` does nothing to
an already-seeded database. `syncCourseContent()` (runs every boot:
`seedIfEmpty -> syncCourseContent -> warmStarterQuestions`) is what pushes
changes to the live DB.

**Rule:** when you change a lecture body/title, the sync must UPDATE the lecture
**and NULL `bodyMedium`, `bodyLong`, `starterQuestions`, `bodyPersonalized`,
`personalizationInstruction`** so the stale cached depth-rewrites, starters, and
the student's "My version" rewrite all regenerate/clear from the new source.
(`bodyPersonalized`/`personalizationInstruction` back the in-app "Rewrite this
lecture" feature — a one-per-lecture student rewrite shown as a "My version"
depth option; a lingering personalization on top of changed source is wrong.)

**Why:** otherwise the Short version updates but expanded views and starter
questions keep serving old content.

**How to apply:** guard the write on an actual change
(`if (lecture.body === t.body && lecture.title === t.lectureTitle) continue;`).
This keeps restarts idempotent (no churn) and avoids wiping student-triggered
expansions on every boot. Sync only touches `lectures`/`problems`, never
`attempts`/`answers`/sessions, so student work is safe.

## Real-examples convention for lectures
Lecture examples should use **real, verifiable** news/historical cases
(named events, cases, studies, people) — never fabricated facts, stats, quotes,
or dates. The course-wide pass used e.g. Theranos, Wakefield MMR retraction,
I-35W bridge, 1936 Literary Digest poll, John Snow/Broad Street, thalidomide,
Concorde fallacy, Pluto 2006 IAU, Sally Clark, cold fusion, Hume is-ought.
The Medium/Long rewrite prompt in `course.ts` also enforces this and forbids
fabrication — but enforcement is prompt-only (no post-generation fact gate).

**Why:** explicit, emphatic user requirement; fabricated "real" examples are
worse than abstract ones. Formal/structural lectures (e.g. categorical logic,
truth tables, essay structure) may legitimately have no news example — don't
force one. Everyday illustrative scenarios (a friend's claim, an ad, a dorm
anecdote) are allowed and encouraged for relatability — they are clearly
hypothetical teaching examples, not fabricated "real" news, so they don't
violate the rule; just don't dress them up as verifiable named events.

## Business-first framing convention
Lecture bodies AND the three generation prompts (course.ts depth-rewrite,
tutor.ts STARTER_SYSTEM/starterPrompt, practice.ts problem-gen) are steered to
teach each concept primarily through business/entrepreneurship scenarios
(pricing, customers, ads, hiring, fundraising, product/venture decisions)
alongside everyday examples. **Why:** the audience will mostly have to run their
own ventures, so reasoning is shown applied to money decisions.
**How to apply:** when adding/editing examples, lead with a hypothetical
business scenario ("Suppose a founder…") or a real verifiable business case
(Theranos, Concorde) — but keep the no-fabrication rule: never invent
real-sounding named companies/stats.

## Markdown `$` triggers LaTeX math rendering — avoid bare dollar signs
The lecture renderer in qr-course parses `$...$` as inline math (there's a Math
keyboard feature). A body like "a $12 charger ... a $25 one" renders the span
between the dollar signs as italic math garbage ("12charger...25"). Write money
as "12-dollar" / "twelve dollars" instead of "$12" in lecture bodies.
**How to apply:** after any lecture body edit with currency, screenshot
`/lectures/N` and confirm dollar amounts render as plain text.
