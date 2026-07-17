# Agent Tasks

Last updated: 2026-06-23

## Active Task

- None currently assigned after normalizing the shared agent context.

## Requested By User

- Create a shared context system so Codex, Gemini, Antigravity, OOS, and other models/apps can understand the current project state when the user switches between them.
- Review whether OOS/Antigravity changed the context correctly.
- Fix the context if it contained unverified assumptions.

## Completed

- Created `AGENTS.md` as the root instruction file for coding agents.
- Created `.agent/STATUS.md` for current state and recent work.
- Created `.agent/TASKS.md` for active tasks, completed work, blockers, and handoff notes.
- Read the OOS/Antigravity rewrite of `AGENTS.md`.
- Normalized `AGENTS.md` to match verified repo facts.
- Updated this file and `.agent/STATUS.md` so the handoff context reflects the latest work.

## Blockers

- None.

## Handoff Notes

### 2026-06-23 - Codex

Goal:
- Make cross-agent handoff context reliable after OOS/Antigravity expanded `AGENTS.md`.

Changed:
- Rewrote `AGENTS.md` to keep useful structure while removing unverified claims about missing scripts, future tools, missing API routes, Docker, tests, and style systems.
- Updated `.agent/STATUS.md` with the current verified state.
- Updated `.agent/TASKS.md` with completed work and handoff notes.

Verified:
- Ran `git status --short`.
- Read `package.json`.
- Listed actual routes under `src/app`.

Next:
- For future feature work, start by reading `AGENTS.md`, `.agent/STATUS.md`, and `.agent/TASKS.md`.

Risks:
- Existing modified files in `db/` and `package*.json` predate this context work and were not inspected or changed during normalization.

## Handoff Notes Template

Use this section format when leaving work for the next agent:

```md
### YYYY-MM-DD - Agent Name

Goal:
- What the user asked for.

Changed:
- Files changed and why.

Verified:
- Commands run and results.

Next:
- What should happen next.

Risks:
- Anything uncertain, broken, or intentionally skipped.
```

