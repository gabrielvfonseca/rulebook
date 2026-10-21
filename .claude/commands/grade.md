# /grade — Machine-grade a local agent config

Run `pnpm agentrules grade` (or `node dist/cli.js grade`) against the local
`CLAUDE.md`/`AGENTS.md`/`.cursorrules`/`.mdc`/`.windsurfrules`/`GEMINI.md`.

Report:

- score /100 and letter grade
- each rubric dimension (brevity, structure, testability, actionable, freshness, dedupe)
- hints with line references

If score < 50, list required fixes before proceeding.
