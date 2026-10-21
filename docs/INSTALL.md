# Install

## Requirements

- Node.js >= 18.17
- pnpm (recommended) or npm

## Install from source

```bash
git clone https://github.com/gabrielvfonseca/agent-config.git
cd agent-config
pnpm install
pnpm run build:registry
pnpm run build
```

The compiled CLI is emitted to `dist/cli.js`.

## Install the published package

```bash
npm install -g agent-config
# or
pnpm add -g agent-config
```

Then run:

```bash
agent-config --help
agent-config list
agent-config add nextjs16-turborepo --agent claude
```

## Verify

```bash
pnpm run typecheck
pnpm test
```
