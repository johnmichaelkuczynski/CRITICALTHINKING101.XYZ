---
name: ClearThink Google/Clerk auth decision
description: Why ClearThink has Clerk login but leaves all routes public; scope boundary for future auth work.
---

# ClearThink Clerk auth = identity UX only, routes stay public

Google sign-in on the ClearThink web app (`qr-course` + `api-server`) uses
Replit-managed Clerk. The home/dashboard route and **every** course + `/api`
route are intentionally left ungated (no `requireAuth`). The sidebar account
panel is the only auth surface: "Sign in with Google" when signed-out, avatar +
email + logout when signed-in.

**Why:** the product is single-user / self-paced, and the request was only to
"create Google login," not to lock down content. The clerk-auth skill also
forbids dropping unauthenticated users onto a sign-in screen at the base path,
so the dashboard must stay public.

**How to apply:** if the audience ever broadens to multi-user, add `requireAuth`
to the **destructive diagnostics endpoints first** (`/api/diagnostics/reset`,
`/api/diagnostics/expand-lectures`) before gating the rest of the course. Do not
gate the base path. Keep the Clerk wiring (publishableKeyFromHost, proxyUrl,
routerPush/routerReplace, `/sign-in/*?` + `/sign-up/*?`) verbatim — only theme is
custom. Google is enabled by default on the managed dev tenant; provider toggles
live in the Auth pane, not code.
