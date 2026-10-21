# Usage

Agent Config installs a battle-tested agent config into any agent in one command.

```bash
agent-config <command> [options]
```

## Commands

### `list`

List every registry entry with title, grade, stack, agents, and description.

```bash
agent-config list
```

### `search <q>`

Search entries by name, stack, or description.

```bash
agent-config search nextjs
agent-config search rust
```

### `view <name> [--agent <a>]`

Preview a config in the terminal. Defaults to the canonical `content.md`.

```bash
agent-config view nextjs16-turborepo
agent-config view rust-monorepo-ts-crates --agent cursor
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
agent-config add nextjs16-turborepo --agent claude
agent-config add rust-monorepo-ts-crates --all --cwd ./my-project
agent-config add typescript-strict-package --agent cursor --overwrite
```

### `grade [path] [--md]`

Machine-grade a local `CLAUDE.md`/`AGENTS.md`/`.cursorrules`/`.mdc`/`.windsurfrules`/`GEMINI.md`.
Defaults to auto-detecting a config file in the current working directory.

```bash
agent-config grade
agent-config grade ./CLAUDE.md
agent-config grade --md
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
