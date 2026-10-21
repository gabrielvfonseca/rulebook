# Install

## Requirements

- Node.js >= 18.17
- pnpm (recommended) or npm

## Install from source

```bash
git clone https://github.com/gabrielvfonseca/rulebook.git
cd rulebook
pnpm install
pnpm run build:registry
pnpm run build
```

The compiled CLI is emitted to `dist/cli.js`.

## Install the published package

```bash
npm install -g rulebook
# or
pnpm add -g rulebook
```

Then run:

```bash
rulebook --help
rulebook list
rulebook add nextjs16-turborepo --agent claude
```

## Verify

```bash
pnpm run typecheck
pnpm test
```
