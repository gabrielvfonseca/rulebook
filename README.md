# agentrules

> **Install a battle-tested agent config into any agent, in one command.**
>
> `npx agentrules add rust-monorepo-ts-crates --agent cursor` → writes `.cursor/rules/rust-monorepo-ts-crates.mdc`
>
> The same config installs as `CLAUDE.md` / `AGENTS.md` / `.cursorrules` / `.mdc` / `GEMINI.md`. Every curated entry is machine-graded against a [published rubric](docs/RUBRIC.md).

[![npm](https://img.shields.io/npm/v/agentrules)](https://www.npmjs.com/package/agentrules)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Why

Everyone copy-pastes random `CLAUDE.md` / `.cursorrules` files and nobody knows what good looks like. This is a small, curated registry of configs that actually ship in real repos — each one installable into **any** agent format, each one scored against a transparent rubric. It piggybacks on the [shadcn registry item shape](https://ui.shadcn.com/docs/registry/registry-item), so registry-aware tooling can consume it directly.

## Install

```bash
npx agentrules add <name> --agent claude|cursor|codex|windsurf|gemini|all
```

| Command                      | What it does                                                           |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npx agentrules list`        | list every entry                                                       |
| `npx agentrules search <q>`  | search by name, stack, or description                                  |
| `npx agentrules view <name>` | preview a config in the terminal                                       |
| `npx agentrules add <name>`  | install it (`--agent`, `--dry-run`, `--diff`, `--overwrite`, `--link`) |
| `npx agentrules grade`       | machine-grade your local `CLAUDE.md`/`AGENTS.md` (`--md` for a badge)  |

## Curated configs

| Config                                                                               | Description                                                                                                                                       | Stack                             | Agents                                  | Grade                                                               | Install                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| **[Next.js 16 + Turborepo](registry/items/nextjs16-turborepo/content.md)**           | Next.js 16 App Router monorepo with React 19, Turborepo, pnpm, Tailwind v4, shadcn/ui, strict TS, Biome, and Vitest + Playwright.                 | nextjs, react, typescript, turbo  | Claude, Cursor, Codex, Windsurf, Gemini | ![A](https://img.shields.io/badge/agentrules-100%2F100-brightgreen) | `npx agentrules add nextjs16-turborepo`        |
| **[Python ML Pipeline](registry/items/python-ml-agent/content.md)**                  | Python 3.11+ ML pipeline: collector → features → models → decisions → actions, with scikit-learn/PyTorch, SQLite, autonomy gating, and typed CLI. | python, ml, scikit-learn, pytorch | Claude, Cursor, Codex, Windsurf, Gemini | ![A](https://img.shields.io/badge/agentrules-98%2F100-brightgreen)  | `npx agentrules add python-ml-agent`           |
| **[Rust + TypeScript Monorepo](registry/items/rust-monorepo-ts-crates/content.md)**  | Polyglot monorepo: Rust crates + TypeScript packages under Turborepo, with buf/protobuf codegen, Biome, clippy::pedantic, and Changesets.         | rust, typescript, turbo, biome    | Claude, Cursor, Codex, Windsurf, Gemini | ![A](https://img.shields.io/badge/agentrules-100%2F100-brightgreen) | `npx agentrules add rust-monorepo-ts-crates`   |
| **[TypeScript Strict Library](registry/items/typescript-strict-package/content.md)** | Publishable strict TypeScript package: tsup dual builds, Vitest, Biome, Changesets, no-any discipline, and explicit public API typing.            | typescript, tsup, vitest, biome   | Claude, Cursor, Codex, Windsurf, Gemini | ![A](https://img.shields.io/badge/agentrules-100%2F100-brightgreen) | `npx agentrules add typescript-strict-package` |

## By stack

- **biome** — `nextjs16-turborepo`, `rust-monorepo-ts-crates`, `typescript-strict-package`
- **bun** — `rust-monorepo-ts-crates`
- **changesets** — `typescript-strict-package`
- **library** — `typescript-strict-package`
- **ml** — `python-ml-agent`
- **mypy** — `python-ml-agent`
- **nextjs** — `nextjs16-turborepo`
- **pnpm** — `nextjs16-turborepo`
- **protobuf** — `rust-monorepo-ts-crates`
- **python** — `python-ml-agent`
- **pytorch** — `python-ml-agent`
- **react** — `nextjs16-turborepo`
- **ruff** — `python-ml-agent`
- **rust** — `rust-monorepo-ts-crates`
- **scikit-learn** — `python-ml-agent`
- **sqlite** — `python-ml-agent`
- **tailwind** — `nextjs16-turborepo`
- **tsup** — `typescript-strict-package`
- **turbo** — `nextjs16-turborepo`, `rust-monorepo-ts-crates`
- **typescript** — `nextjs16-turborepo`, `rust-monorepo-ts-crates`, `typescript-strict-package`
- **vitest** — `nextjs16-turborepo`, `typescript-strict-package`

## Recently added

- `nextjs16-turborepo` (100/100) — Next.js 16 + Turborepo, added 2026-10-18
- `python-ml-agent` (98/100) — Python ML Pipeline, added 2026-10-18
- `rust-monorepo-ts-crates` (100/100) — Rust + TypeScript Monorepo, added 2026-10-18
- `typescript-strict-package` (100/100) — TypeScript Strict Library, added 2026-10-18

## Grading

Every curated entry is scored 0–100 against a [published rubric](docs/RUBRIC.md) —
brevity, structure, testability, actionable density, freshness, dedupe — using
the same code as `npx agentrules grade`. The score is machine-checked; the
editorial one-liner in each `item.json` is the human judgment. Grading is the
quiet signal — **the product is one-command, cross-agent install.**

Harvested configs (Phase 2) will appear with provenance and links only — no
public failing grades for work whose authors never opted in.

## Contributing

Add a new entry under `registry/items/<slug>/` with `item.json` +
`content.md`, then run:

```bash
pnpm install
pnpm build:registry   # validates, grades, regenerates index.json + README
pnpm test
```

Curated entries must machine-score ≥50. See [docs/RUBRIC.md](docs/RUBRIC.md)
for what's checked and what stays editorial.

## Registry protocol

This registry speaks the [shadcn registry item](https://ui.shadcn.com/docs/registry/registry-item)
format. Per-item endpoints live at `registry/r/<name>.json`; the manifest is
`registry/index.json`. Registry-aware agents and tools can consume either.

## License

MIT
