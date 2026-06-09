---
name: Diagnostic assessments (CCTST)
description: Design rules for the /assessments diagnostic feature in qr-course — graded one-time slots, 20% grade wiring, question uniqueness, naming vs operator /diagnostics.
---

# Diagnostic assessments (`/assessments`)

CCTST-inspired student-facing reasoning diagnostics, separate from the operator-only system-health `/diagnostics` endpoints. Do not conflate the two namespaces.

- **Slots:** 5 graded one-time (`baseline`, `module_1..4`) + 1 unlimited ungraded `self`. Graded = taking counts as pass (`passed=true`); `self` is `passed=null`.
- **Grade math:** lives in `computeGrade()` in `analytics.ts`, used by BOTH `/analytics/summary` and `/analytics/report` — keep them in lockstep. `officialAverage = 0.8*assignmentAverage + 0.2*(gradedTaken/5*100)`. `gradedTaken` is counted over DISTINCT graded slots (a `Set`), so duplicate submitted rows for one slot can never push the 20% component past its weight — the grade is robust even if one-time enforcement is bypassed.
- **Answer-leakage rule:** `start` and in-progress session fetch expose only `{id, skill, prompt, options}` (no `correctIndex`/`explanation`). Only `submit` and a *submitted* session fetch include the answer + explanation.
- **One-time enforcement:** `start` blocks retake on an existing submitted session (409) and resumes an in-progress one; `submit` additionally re-checks for any prior submitted row for the graded slot (409) to stop double-counting from a stray 2nd tab. There is no DB-level partial unique index — acceptable because this is a single-user self-paced course AND the grade `Set` already neutralizes duplicates.
- **Question uniqueness:** prior stems are collected across ALL sessions and fed to the generator. The static `FALLBACK_BANK` must hold MULTIPLE distinct stems per skill (≥3) and `fallbackFor(skill, usedSet)` must skip already-used stems — otherwise the 2 slots for a skill (and successive administrations) can collapse to identical fallback questions when generation degrades.

**Why:** the product's whole pitch is "each instance UNIQUE + longitudinal proof of improvement," so any path (including the never-blocks fallback) that repeats questions breaks the core promise.
