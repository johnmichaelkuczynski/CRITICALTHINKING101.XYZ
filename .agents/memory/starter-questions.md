---
name: ClearThink starter questions (tutor suggestions)
description: Durable constraints on lecture starter questions — what they must be, and why they are cached + warmed.
---

# Starter questions / tutor suggestions

**Questions must be APPLIED, never recall — and this covers EVERY generated question** (tutor
starters, practice-exam problems, adaptive practice problems alike), enforced from ONE shared
standard module so the three generators can't drift. Each question must embed its own concrete
real-world situation and be answerable by anyone who knows the principles whether or not they
read that lecture: no "define / what is / why is / distinguish-from", no pointers to specific
source material ("the lecture's test", "the rabbit in the text").
**Why:** university sales demo; recall/text-bound questions read as a worse product. Product
owner is adamant about this.
**The durable lesson:** a "must contain a quoted example" filter is GAMEABLE — the model satisfied
it by quoting a *definition* and still referencing "the lecture's test". So reject by SHAPE, not
by presence of a quote: block definitional question-openers and source-material references; treat
a quoted span only as a soft preference. A rejected question is NEVER restored by any fallback.
**Watch the two failure modes when tuning the reject patterns:** (1) too loose lets definitional
questions through; (2) too broad nukes valid applied scenarios and over-triggers canned fallbacks
("the **text** message", "a news **article** claims", "my **professor** argued", "tries to
**define** X" are all legitimate). Keep openers/comparison-phrasings narrow and lecture-reference
nouns lecture-specific. Do NOT add a hard quote/concreteness gate — it rejects valid unquoted
concrete questions and spikes fallbacks. The home of the standard is grep-able as `APPLIED_RULES`.

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
