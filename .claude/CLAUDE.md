# Rulebook — Claude Code tool configuration

This directory configures Claude Code for the Rulebook project: a curated,
machine-graded registry of agent configs (`CLAUDE.md`, `AGENTS.md`,
`.cursorrules`, `.mdc`, `.windsurfrules`, `GEMINI.md`) plus a CLI to install
one into any repo.

## Project truth

- Registry entries live under `registry/items/<slug>/` (`item.json` + `content.md`).
- `scripts/build.ts` validates, grades, and regenerates `registry/index.json`,
  `registry/r/*.json`, and `README.md`.
- Every curated entry must machine-score ≥ 50 against `docs/RUBRIC.md`.

## Preferred commands

- `pnpm run typecheck` — TypeScript strict typecheck
- `pnpm test` — Vitest suite (root `tests/`)
- `pnpm run build:registry` — validate + grade + regenerate artifacts
- `pnpm run build` — compile `src/` to `dist/`
- `pnpm exec prettier --write` — format
- `pnpm changeset` — add a changeset for the next release

## Style

TypeScript strict + `noUncheckedIndexedAccess`. Double quotes, semicolons,
trailing commas, 2-space indentation. Prefer named exports and `import type`
for type-only imports.
