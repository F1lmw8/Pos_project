# Agent Handoff Guide

This file is the shared operating context for Codex, Gemini, Antigravity, OOS, and any other coding agent working in this repository.

## Project

- Name: `POS_project` / `rdu-app`
- Path: `/Users/filmw8/project/POS_project`
- App type: Next.js App Router project for pharmacy/POS and RDU drug information workflows.
- Language: JavaScript and JSX with ESM.
- UI: React 19, Next.js 15, `lucide-react`, `recharts`, local CSS.
- Data/API: PostgreSQL helper utilities through `pg`; database files live in `db/`.
- AI/chat dependencies: `ai`, `@ai-sdk/google`, `@ai-sdk/openai`.

## Verified Project Map

These paths exist in the current repo:

- `src/app/page.jsx` - main app page.
- `src/app/layout.jsx` - root app layout.
- `src/app/globals.css` - global styles.
- `src/app/drug/[id]/page.jsx` - drug detail route.
- `src/app/dashboard/page.jsx` - dashboard route.
- `src/app/dashboard/stock/page.jsx` - stock dashboard route.
- `src/app/dashboard/stock-in/page.jsx` - stock-in route.
- `src/app/dashboard/sales-logs/page.jsx` - sales logs route.
- `src/app/api/products/route.js` - products API.
- `src/app/api/sales/route.js` - sales API.
- `src/app/api/chat/route.js` - chat API.
- `src/app/api/dashboard/reports/route.js` - dashboard reports API.
- `src/app/api/dashboard/inventory-alerts/route.js` - dashboard inventory alerts API.
- `src/app/api/dashboard/inventory-stock/route.js` - dashboard inventory stock API.
- `src/components/*` - shared UI components.
- `src/utils/*` - shared utilities.
- `src/data/*` - local drug data.
- `db/*` - schema, seed, and database helper scripts.
- `public/*` - static assets.

Do not document non-existing routes, scripts, frameworks, or tools as facts. If something is only a recommendation or future idea, label it as future work.

## Coordination Files

Agents must read these before editing code:

1. `AGENTS.md` - long-lived repo rules and verified project map.
2. `.agent/STATUS.md` - current state, recent work, and known local changes.
3. `.agent/TASKS.md` - active tasks, completed work, blockers, and handoff notes.

Update `.agent/STATUS.md` and `.agent/TASKS.md` whenever you finish a meaningful change, discover a blocker, or leave work partially complete.

## Working Rules

- Keep changes scoped to the user's current request.
- Do not revert, overwrite, or "clean up" user/prior-agent changes unless the user explicitly asks.
- Run `git status --short` before and after edits.
- Prefer existing patterns in `src/app`, `src/components`, `src/utils`, and `db`.
- Use JavaScript/JSX style already present in the repository.
- Keep user-facing Thai text intact where it already exists.
- Do not edit `.env` unless the user explicitly asks.
- Do not commit, push, or create branches unless the user asks.
- If another agent changed these handoff files, verify their claims against the repo before relying on them.

## Available Commands

These scripts are currently defined in `package.json`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Notes:

- There is currently no `format` script in `package.json`.
- There is currently no configured test script in `package.json`.
- Verify `npm run lint` before relying on it; the script is `next lint`, and Next.js lint behavior can vary by version.

## Environment Notes

- `.env` exists locally and may contain secrets. Treat it as private.
- `node_modules` and `.next` may exist locally; do not edit generated output.
- The user switches between Codex, Antigravity/Gemini, OOS, and possibly other models, so written handoff notes are part of the workflow.

## Handoff Protocol

When starting:

1. Read `AGENTS.md`.
2. Read `.agent/STATUS.md`.
3. Read `.agent/TASKS.md`.
4. Run `git status --short`.
5. Identify whether existing modified files are related to the user's request.

When finishing:

1. Summarize what changed.
2. Record verification commands and results.
3. Add blockers or next steps if any.
4. Update `.agent/STATUS.md` and `.agent/TASKS.md`.

## Revision History

- 2026-06-23 - Codex: Created initial agent handoff files.
- 2026-06-23 - OOS/Antigravity: Expanded `AGENTS.md`.
- 2026-06-23 - Codex: Normalized `AGENTS.md` to remove unverified assumptions and align with the current repository.

