---
name: Diagnostic assessments (CCTST)
description: Design rules for the /assessments diagnostic feature in qr-course — re-takeable graded slots, 20% grade wiring, question uniqueness, naming vs operator /diagnostics.
---

# Diagnostic assessments (`/assessments`)

CCTST-inspired student-facing reasoning diagnostics, separate from the operator-only system-health `/diagnostics` endpoints. Do not conflate the two namespaces.

- **Slots:** 5 graded RE-TAKEABLE (`baseline`, `module_1..4`) + 1 unlimited ungraded `self`. By design the student may retake any graded slot as often as they want; each fresh start generates new unique questions. Graded = taking counts as pass (`passed=true`); `self` is `passed=null`.
- **Grade math:** lives in `computeGrade()` in `analytics.ts`, used by BOTH `/analytics/summary` and `/analytics/report` — keep them in lockstep. `officialAverage = 0.8*assignmentAverage + 0.2*(gradedTaken/5*100)`. `gradedTaken` is counted over DISTINCT graded slots (a `Set`/existence check), so the many submitted rows a retake produces for one slot can never push the 20% component past its weight. This `Set` dedup — NOT any one-time block — is the sole thing that keeps the 20% robust now that retakes are unlimited.
- **Answer-leakage rule:** `start` and in-progress session fetch expose only `{id, skill, prompt, options}` (no `correctIndex`/`explanation`). Only `submit` and a *submitted* session fetch include the answer + explanation.
- **Retake model (NO one-time block):** graded slots are unlimited-retake by design. `start` does NOT 409 on a prior submitted session — it only resumes an existing in-progress one (so a half-finished attempt isn't orphaned), otherwise creates a fresh session. `submit` does NOT re-check for a prior submitted row per slot. The ONLY remaining guard is the per-session atomic claim (`WHERE id AND status='in_progress'` + `.returning()`), which still stops the SAME session being submitted twice. Multiple submitted rows per slot are expected and fine — the grade `Set`/existence dedup neutralizes them.
- **Overview during an active retake:** a slot can hold a completed attempt AND an in-progress retake simultaneously. The overview sets `status` to `in_progress` (so UI shows Resume) but keeps `scorePercent`/`passed`/`submittedAt` + `sessionId` pointing at the LATEST SUBMITTED attempt (so "View results" still works). Critically, `gradedTaken` is computed from submitted-session EXISTENCE, decoupled from `status`, so starting a retake never drops the 20% credit already earned. Frontend consumers must key "already completed" off `submittedAt != null`, NOT `status === 'submitted'` (Dashboard's baseline prompt depends on this).
- **Question uniqueness:** prior stems are collected across ALL sessions and fed to the generator. The static `FALLBACK_BANK` must hold MULTIPLE distinct stems per skill (≥3) and `fallbackFor(skill, usedSet)` must skip already-used stems — otherwise the 2 slots for a skill (and successive administrations) can collapse to identical fallback questions when generation degrades.

**Why:** the product's whole pitch is "each instance UNIQUE + longitudinal proof of improvement," so any path (including the never-blocks fallback) that repeats questions breaks the core promise.

## Generation latency

Generating all 10 questions in one `chatJson` call on the heavy default model took ~30-34s — felt like a frozen page behind bare skeletons. Fix that brought it to ~10s: (1) fan out one request PER SKILL concurrently (`Promise.all`) so wall-clock ≈ slowest single 2-question call, not the sum; (2) use `FAST_MODEL` with `reasoningEffort: "low"`; (3) show an explicit "Building your diagnostic…" message, not bare skeletons.

**Why:** these gpt-5-family models have high per-call latency that scales with output size; splitting the output across parallel small calls is the biggest lever. `chatJson` takes an optional `{ reasoningEffort }` (passes `reasoning_effort` through to the OpenAI call).
**How to apply:** any on-demand multi-item LLM generation in this app that blocks a user-facing spinner should fan out + drop reasoning effort before reaching for a bigger model.

## Never run /diagnostics/reset while the user may be using the app

`/api/diagnostics/reset` deletes ALL `diagnostic_sessions` rows. Running it as "test cleanup" wiped a user's in-flight attempt: their `start` had created the row, reset deleted it mid-attempt, then `submit` updated zero rows but still returned 200, and the result page 404'd on a dead session. To clean up your own test data, DELETE only the specific session ids you created (targeted SQL), never the blanket reset endpoint.

**Why:** the preview/published app shares one DB with no per-user isolation (single-user course), so a global reset is indistinguishable from destroying live data.
**How to apply:** prefer `DELETE FROM diagnostic_sessions WHERE id IN (...)` for cleanup; reserve the reset endpoint for the user's explicit "Reset course" action.

## Submit must be state-atomic, not just existence-checked

The diagnostic `submit` handler now updates with predicate `id = :id AND status = 'in_progress'` plus `.returning()`. Zero rows back → re-read: missing row = 404, still-present row = 409 ("already submitted"). A read-then-write keyed only by `id` is NOT safe: a delete (reset) or a concurrent second submit can land between the SELECT and UPDATE and the write silently no-ops while returning 200.

**Why:** drizzle/pg `update` does not throw on zero matched rows; without `.returning()` you get a phantom success that sends the client to a dead result page.
**How to apply:** for any one-shot state transition (in_progress → submitted), put the expected current state in the WHERE clause and assert on `.returning().length`.
