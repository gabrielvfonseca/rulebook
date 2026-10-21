# /review — Review a diff or file like a senior engineer

Review the provided diff or file for: correctness, TypeScript strictness,
actionable conventions, missing tests, and registry grading alignment.

Steps:

1. Read the changed files in full.
2. Check TypeScript strict + `noUncheckedIndexedAccess` compliance.
3. Verify tests exist and pass (`pnpm test`).
4. If registry items changed, confirm `pnpm run build:registry` passes.
5. Confirm Prettier formatting (`pnpm exec prettier --write`).
6. Suggest a changeset (`pnpm changeset`) if behavior changed.

Output a short list of required fixes, then an optional "looks good" if clean.
