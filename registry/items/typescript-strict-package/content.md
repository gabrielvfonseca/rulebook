# TypeScript Strict Library

A strict, publishable TypeScript package (library or ORM/tooling) built with tsup, tested with Vitest, linted with Biome, released with Changesets.

## Commands

- `pnpm install` — install dependencies
- `pnpm build` — build with tsup (ESM + CJS + d.ts)
- `pnpm test` — run Vitest
- `pnpm test:watch` — Vitest in watch mode
- `pnpm typecheck` — `tsc --noEmit` against strict settings
- `pnpm lint` — lint with Biome
- `pnpm changeset` — create a changeset for the next release
- `pnpm release` — build and publish

## Architecture

- `src/index.ts` — public entry; re-export only the intentional public API
- `src/**/*.ts` — one concept per module; colocate `*.test.ts` next to source
- `tsup.config.ts` — build config; entry points listed explicitly
- `tsconfig.json` — strict mode enabled, noImplicitOverrides, exactOptionalPropertyTypes
- `.changeset/` — release notes and version bumps

## Rules

- Enable `"strict": true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride` in tsconfig.
- Never use `any` — use `unknown` and narrow, or write a proper generic.
- Avoid non-null assertions (`!`); narrow with type guards instead.
- Prefer `interface` for object shapes you expect consumers to extend; use `type` for unions, mapped, and conditional types.
- Use `import type` for all type-only imports.
- Prefer named exports over default exports.
- Keep functions pure where possible; isolate side effects at module boundaries.
- Type public API surfaces explicitly — annotate every exported function's parameters and return type; never rely on inference across the public boundary.
- Write one test file per module: `src/foo.ts` → `src/foo.test.ts`; cover the error paths, not just the happy path.
- Use Vitest mocks sparingly; prefer dependency injection over module mocking.
- Document every exported symbol with TSDoc (`@param`, `@returns`, `@throws`).
- Never add runtime dependencies for something under ~50 lines — inline it.
- Build ESM + CJS and ship `.d.ts`; verify with `pnpm build && node -e "require('./dist/index.cjs')"`.
- Run `pnpm typecheck && pnpm test && pnpm lint` before opening a PR.
- Every user-facing change needs a changeset (`pnpm changeset`).
- Follow conventional commits (`feat:`, `fix:`, `chore:`, etc.).
