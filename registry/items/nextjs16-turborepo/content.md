# Next.js 16 Turborepo

A Next.js 16 (App Router, React 19) + Turborepo + pnpm monorepo with Tailwind CSS v4, shadcn/ui, strict TypeScript, Biome, and Vitest + Playwright.

## Commands

- `pnpm dev` — start all dev servers via Turborepo
- `pnpm build` — build all packages and apps
- `pnpm test` — run all Vitest tests
- `pnpm test:e2e` — run Playwright E2E tests
- `pnpm typecheck` — TypeScript validation across the workspace
- `pnpm lint` — lint with Biome
- `pnpm format` — auto-fix formatting with Biome
- `pnpm --filter <pkg> <cmd>` — run a script in one workspace package

## Architecture

- `apps/*` — deployable applications (Next.js app lives in `apps/web`)
- `packages/*` — shared workspace packages (one concern each: ui, config, lib)
- `packages/typescript-config` — shared tsconfig presets; every package extends them
- `packages/config` — shared Biome/eslint config
- `turbo.json` — build task orchestration; add new tasks here, not as ad-hoc scripts
- `pnpm-workspace.yaml` — workspace definition

## Rules

- Use the App Router only — never add a `pages/` directory.
- Keep React Server Components the default; add `"use client"` only when the component needs state, effects, or browser APIs.
- Follow the composition pattern: a data-fetching parent component delegates rendering to a `*List` presentational child.
- Use kebab-case for file names and PascalCase named function exports for components.
- Define props as a local `interface XxxProps` in the same file; mark members `readonly` where possible.
- Prefer named exports over default exports everywhere except Next.js route files.
- Use `type` imports for type-only imports (`import type { … }`).
- Validate all runtime data with Zod; infer types with `z.infer<typeof schema>`.
- Validate env vars at startup with a typed env schema — never read `process.env` ad hoc.
- Style with Tailwind utilities via `cn()` (clsx + tailwind-merge); no CSS modules.
- Use Tailwind v4 CSS-first config (`@import "tailwindcss"`); no `tailwind.config.ts` unless necessary.
- Co-locate tests: unit tests next to source (`*.test.ts`), E2E in `tests/e2e/`.
- Run `pnpm typecheck && pnpm test` before opening a PR.
- Follow conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Never commit secrets; validate env vars through the schema, not `.env` reading in components.
- Never add comments unless the code's intent is genuinely unclear.
