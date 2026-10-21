# Rust + TypeScript Monorepo

A polyglot monorepo: Rust crates and TypeScript packages under one Turborepo, with buf/protobuf codegen and Changesets versioning.

## Commands

- `bun run build` — build all TS packages
- `bun run test` — run all TS tests
- `bun run lint` — lint TS with Biome
- `bun run typecheck` — TS type checking
- `bun run gen` — run code generators (Plop)
- `cargo build --workspace` — build all Rust crates
- `cargo test --workspace` — run all Rust tests
- `cargo clippy --workspace -- -D warnings` — lint Rust, deny warnings

## Architecture

- `packages/*` — TypeScript packages, built with `tsup`, linted with Biome
- `crates/*` — Rust crates, edition 2024, clippy + rustfmt
- `apps/*` — application services (Hono for APIs, Next.js for web)
- `proto/*` — protobuf definitions; run codegen via `bun run gen`
- Root `Cargo.toml` — Rust workspace with shared dependencies (workspace inheritance)
- Root `tsconfig.json` — TypeScript base config with path aliases
- `turbo.json` — build task orchestration

## Rules

- Use strict TypeScript with no unused variables; resolve internal imports through tsconfig path aliases.
- For Rust, enable `clippy::pedantic`, use workspace inheritance for shared dependency versions, and avoid `unsafe` unless there is a documented, measured reason.
- Use workspace inheritance for both Cargo dependencies and shared tsconfig settings — never duplicate versions across crates/packages.
- Format TS/JS with Biome and Rust with rustfmt; do not hand-style around the formatters.
- Follow conventional commits (`feat:`, `fix:`, `chore:`, etc.); PRs need a semver label and conventional title.
- Run `bun run test` and `cargo test --workspace` before opening a PR.
- Never add comments unless the code's purpose is unclear.
- Never add empty export stubs.
- Follow existing patterns in the codebase before introducing a new one.
- Keep functions small and focused; use meaningful names.
- Prefer named exports over default exports; use `import type` for type-only imports.
- When changing `.proto` files, run `bun run gen` and commit the regenerated code.
