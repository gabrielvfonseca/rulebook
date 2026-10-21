# Usage

Rulebook installs a battle-tested agent config into any agent in one command.

```bash
rulebook <command> [options]
```

## Commands

### `list`

List every registry entry with title, grade, stack, agents, and description.

```bash
rulebook list
```

### `search <q>`

Search entries by name, stack, or description.

```bash
rulebook search nextjs
rulebook search rust
```

### `view <name> [--agent <a>]`

Preview a config in the terminal. Defaults to the canonical `content.md`.

```bash
rulebook view nextjs16-turborepo
rulebook view rust-monorepo-ts-crates --agent cursor
```

### `add <name> [--agent <a>]`

Install a config into the current working directory.

Options:

| Option        | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `--agent <a>` | Target agent: `claude`, `cursor`, `codex`, `windsurf`, `gemini`, `generic` (default: `claude`) |
| `--cwd <dir>` | Install into a specific directory (default: current working directory)                         |
| `--dry-run`   | Print what would be written without writing                                                    |
| `--diff`      | Show a diff of existing vs. new content                                                        |
| `--overwrite` | Replace an existing file                                                                       |
| `--link`      | Symlink to the registry source instead of copying                                              |
| `--all`       | Install the config for every supported agent                                                   |

Examples:

```bash
rulebook add nextjs16-turborepo --agent claude
rulebook add rust-monorepo-ts-crates --all --cwd ./my-project
rulebook add typescript-strict-package --agent cursor --overwrite
```

### `grade [path] [--md]`

Machine-grade a local `CLAUDE.md`/`AGENTS.md`/`.cursorrules`/`.mdc`/`.windsurfrules`/`GEMINI.md`.
Defaults to auto-detecting a config file in the current working directory.

```bash
rulebook grade
rulebook grade ./CLAUDE.md
rulebook grade --md
```

## Supported agent targets

| Agent    | File                       |
| -------- | -------------------------- |
| claude   | `CLAUDE.md`                |
| cursor   | `.cursor/rules/<name>.mdc` |
| codex    | `AGENTS.md`                |
| windsurf | `.windsurfrules`           |
| gemini   | `GEMINI.md`                |
| generic  | `AGENTS.md`                |
