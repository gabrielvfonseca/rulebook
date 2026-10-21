# Changelog

All notable changes to Agent Config are documented here.

## [0.1.0] - 2026-10-21

### Added

- Curated agent config registry with `CLAUDE.md`, `AGENTS.md`, `.cursorrules`,
  `.mdc`, `.windsurfrules`, and `GEMINI.md` targets
- `agent-config` CLI: `list`, `search`, `view`, `add`, `grade`
- Machine rubric grader (brevity, structure, testability, actionable, freshness, dedupe)
- Registry build script that regenerates `registry/index.json`, shadcn-style
  `registry/r/*.json` endpoints, and `README.md`
- Four curated starter entries: `nextjs16-turborepo`, `python-ml-agent`,
  `rust-monorepo-ts-crates`, `typescript-strict-package`
- Changesets for versioning and changelogs
- Husky + lint-staged + Prettier pre-commit quality gate
- GitHub Actions CI workflow
