# The rulebook rubric

Every curated entry in this registry is scored against this rubric. The score is
**machine-checked only** — see [Machine-checked vs editorial](#machine-checked-vs-editorial).
The `rulebook grade` CLI command runs the exact same checks on your local config.

## Scored dimensions (100 points)

| Dimension              | Points | How it's checked                                                                                                                                                                                                                 |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brevity**            | 20     | ≤200 lines AND ≤4,000 tokens (approx: characters/4). Full points at ≤150 lines; zero past 250.                                                                                                                                   |
| **Structure**          | 20     | Required sections present: overview (title/what-it-is), commands (dev/test/build), architecture (structure/directory layout), rules (conventions/style/rules). 5 points each.                                                    |
| **Testability**        | 20     | A concrete test command is present (`test`, `pytest`, `cargo test`, `vitest`, `npm test`, …). 10 pts for any mention; +10 if the command is copy-pasteable (appears as a command, not just prose).                               |
| **Actionable density** | 20     | Fraction of non-heading, non-blank lines that are actionable: start with an imperative verb (use, run, avoid, prefer, keep, never, always, add, create, …), or contain a concrete path/command in backticks. ≥40% = full points. |
| **Freshness**          | 10     | Registry items only: source commit pinned within the last 180 days. Local configs: not scored (N/A).                                                                                                                             |
| **Dedupe**             | 10     | Not byte-identical (≥200 bytes) to another registry entry. Phase 2 adds fuzzy shingle similarity; today this is a hash check.                                                                                                    |

Grades: **A** ≥ 85 · **B** ≥ 70 · **C** ≥ 50 · below = not published.

## Machine-checked vs editorial

The score is a **signal, not a verdict**. These criteria are judgment calls and are
deliberately **not** folded into the number:

- **Specificity** — are the commands and paths real for _this_ stack, or generic filler?
- **Non-redundancy** — does it restate what the model already knows, or encode project truth?
- **Boundaries** — is there a real do-not-touch list, or vague hand-waving?

Instead, curated entries carry a one-line **editorial note** (`registry.note` in
`item.json`) written by a human. If the machine score and the note disagree, trust
the note — it's the part a person staked their judgment on.

## Grades and harvested configs

**Curated entries are graded openly.** They were written or hand-picked for this
registry, and the grade is part of the curation promise.

**Harvested entries are never given a public failing grade.** Harvested configs
appear with provenance (source repo, path, pinned commit, license) and a link —
no letter grade, no score. They're graded only if/when a human promotes them to
the curated tier. We're not handing public report cards to people who never
opted in.

## Scoring your own config

```bash
npx rulebook grade          # scores ./CLAUDE.md or ./AGENTS.md
npx rulebook grade --md     # emits a markdown badge block for your README
```

The CLI uses this same rubric, same code. What you see is what we grade with.
