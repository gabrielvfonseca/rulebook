# Contributing

Thank you for helping improve Rulebook. This project is a curated, machine-graded
registry of agent configs (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.mdc`,
`.windsurfrules`, `GEMINI.md`) plus a CLI to install one into any repo.

## How contributions work

1. Fork the repo and create a feature branch from `main`.
2. Add a new registry entry under `registry/items/<slug>/` with `item.json` +
   `content.md`, following the schema in `schema/item.schema.json`.
3. Run `pnpm build:registry` to validate, grade, and regenerate `registry/index.json`,
   `registry/r/*.json`, and `README.md`.
4. Run `pnpm test` and `pnpm run typecheck` to keep the build green.
5. Add a changeset with `pnpm changeset` so the release is versioned and logged.
6. Open a pull request against `main`.

## Curated entry requirements

Curated entries must machine-score at least 50 (grade C or better). See
`docs/RUBRIC.md` for the scored dimensions: brevity, structure, testability,
actionable density, freshness, and dedupe.

## Repository layout

- `src/` — TypeScript CLI and grader (flat layout)
- `tests/` — Vitest test suite (root level)
- `registry/items/<slug>/` — curated config entries (`item.json` + `content.md`)
- `registry/index.json` — generated manifest (do not edit by hand)
- `registry/r/<name>.json` — generated shadcn-style registry endpoints
- `schema/item.schema.json` — JSON schema for registry items
- `docs/` — comprehensive project documentation
- `.github/` — CI, issue, and pull request templates

## Commands

| Command                   | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `pnpm install`            | install dependencies                           |
| `pnpm run typecheck`      | TypeScript typecheck                           |
| `pnpm test`               | run the Vitest suite                           |
| `pnpm run build:registry` | validate, grade, regenerate registry artifacts |
| `pnpm run build`          | compile `src/` to `dist/`                      |
| `pnpm changeset`          | create a changeset for the next release        |

## Code style

This repo uses Prettier (enforced by `lint-staged` on the pre-commit hook). Run
`pnpm exec prettier --write` before committing, or let the pre-commit hook handle it.
