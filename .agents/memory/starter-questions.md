---
name: ClearThink starter questions (tutor suggestions)
description: Durable constraints on lecture starter questions — what they must be, and why they are cached + warmed.
---

# Starter questions / tutor suggestions

**Questions must be APPLIED, never recall.** The product owner is adamant: no
"define X / what is X / why is X / distinguish X from Y". Every question must embed its own
concrete example and ask the student to classify / reconstruct / diagnose / judge it.
**Why:** this is a university sales demo; recall questions read as a worse product.
**How enforced:** the prompt requires the example wrapped in quotes; a filter then keeps only
questions containing a quoted span, plus a guard that drops outputs where the model splices in
non-Latin script (Devanagari/CJK/etc.) mid-sentence.

**Use the strong text model, not the fast one.** `gpt-5-mini` does NOT reliably follow the
applied-question constraints — most outputs come back abstract. Generation is backgrounded +
cached, so the strong model's latency is fine.

**Cached + warmed, never generated on the hot path.** Questions live in
`lectures.starter_questions`; a background warmer fills NULLs on boot. A live on-view LLM call
took 10–15s and read as broken to a buyer.
**Regenerating after a prompt change:** there is no admin endpoint — NULL the column with a
one-off `npx tsx` script (tsx is only reachable via `npx tsx` from repo root, not via pnpm
exec), then re-warm by curling every lecture's suggestions endpoint. Always curl via
`localhost:80/api/...`; the server DB is the user's Neon — never the code_execution executeSql DB.
