import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { contentHash, gradeConfig } from "../src/lib/grade.js";
import type {
  FileTarget,
  Grade,
  GradeResult,
  RegistryIndex,
  RegistryItem,
  RegistryItemFile,
} from "../src/lib/types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = join(ROOT, "registry", "items");
const SCHEMA_PATH = join(ROOT, "schema", "item.schema.json");

const ALL_TARGETS: FileTarget[] = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  ".cursorrules",
  ".windsurfrules",
  "CURSOR_MDC",
];

/** Source item: item.json may declare grade/score as placeholders; build computes them. */
interface SourceItemJson {
  $schema?: string;
  name: string;
  type: "registry:file";
  title: string;
  description: string;
  registry: RegistryItem["registry"];
}

function fail(message: string): never {
  throw new Error(`build: ${message}`);
}

function daysBetween(isoDate: string, now: Date): number {
  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  return Math.floor((now.getTime() - then) / 86_400_000);
}

function mdcVariant(content: string, description: string): string {
  const safeDesc = description.replace(/"/g, '\\"');
  return `---\ndescription: "${safeDesc}"\nalwaysApply: false\n---\n\n${content.trim()}\n`;
}

function buildFiles(
  canonical: string,
  description: string,
  targets: FileTarget[],
): RegistryItemFile[] {
  return targets.map((target) => {
    const content =
      target === "CURSOR_MDC"
        ? mdcVariant(canonical, description)
        : canonical.trim() + "\n";
    const path = target === "CURSOR_MDC" ? "content.mdc" : target;
    return { path, target, content, contentType: "text/plain" };
  });
}

function loadSourceItems(now: Date): {
  items: RegistryItem[];
  results: Map<string, GradeResult>;
} {
  const parsed: Array<{ slug: string; meta: SourceItemJson; content: string }> =
    [];

  for (const dirEntry of readdirSync(ITEMS_DIR, { withFileTypes: true })) {
    if (!dirEntry.isDirectory()) continue;
    const slug = dirEntry.name;
    const itemPath = join(ITEMS_DIR, slug, "item.json");
    let meta: SourceItemJson;
    try {
      meta = JSON.parse(readFileSync(itemPath, "utf8")) as SourceItemJson;
    } catch (err) {
      fail(`cannot parse ${itemPath}: ${(err as Error).message}`);
    }
    if (meta.name !== slug) {
      fail(`item "${slug}": name "${meta.name}" must match directory name`);
    }
    const content = readFileSync(join(ITEMS_DIR, slug, "content.md"), "utf8");
    parsed.push({ slug, meta, content });
  }

  // Grade every item against the full corpus (dedupe) + its own freshness.
  const hashes = new Map<string, string>();
  const preHashes = new Map<string, string>();
  for (const { slug, content } of parsed) {
    preHashes.set(contentHash(content), slug);
  }

  const items: RegistryItem[] = [];
  const results = new Map<string, GradeResult>();

  for (const { meta, content } of parsed) {
    const commitDate = meta.registry.source.commitDate;
    const days = commitDate ? daysBetween(commitDate, now) : null;
    const otherHashes = new Map(
      [...preHashes].filter(([hash, name]) => name !== meta.name),
    );
    const result = gradeConfig(content, {
      daysSinceCommit: days,
      otherHashes,
    });
    if (meta.registry.source.kind === "curated" && result.score < 50) {
      fail(
        `item "${meta.name}" scored ${result.score} (<50, grade ${result.grade}) — curated items must score ≥50. Hints:\n  - ${result.hints.join("\n  - ")}`,
      );
    }
    results.set(meta.name, result);

    const grade: Grade =
      meta.registry.source.kind === "harvested"
        ? "ungraded"
        : (result.grade as Grade);
    const targets = ALL_TARGETS;

    const item: RegistryItem = {
      $schema:
        "https://raw.githubusercontent.com/gabrielvfonseca/agentrules/main/schema/item.schema.json",
      name: meta.name,
      type: "registry:file",
      title: meta.title,
      description: meta.description,
      files: buildFiles(content, meta.description, targets),
      registry: {
        ...meta.registry,
        grade,
        score: grade === "ungraded" ? null : result.score,
      },
    };
    items.push(item);
    hashes.set(contentHash(content), meta.name);
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { items, results };
}

function validateSchema(items: RegistryItem[]): void {
  const ajv = new (Ajv as unknown as new (opts: unknown) => any)({
    allErrors: true,
    strict: true,
  });
  (addFormats as unknown as (ajv: unknown) => void)(ajv);
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  const validate = ajv.compile(schema);
  for (const item of items) {
    if (!validate(item)) {
      fail(
        `schema validation failed for "${item.name}":\n${JSON.stringify(validate.errors, null, 2)}`,
      );
    }
  }
}

function writeIndex(items: RegistryItem[], now: Date): void {
  const index: RegistryIndex = {
    version: 1,
    generatedAt: now.toISOString(),
    count: items.length,
    items,
  };
  writeFileSync(
    join(ROOT, "registry", "index.json"),
    JSON.stringify(index, null, 2) + "\n",
  );
}

function writeShadcnEndpoints(items: RegistryItem[]): void {
  const rDir = join(ROOT, "registry", "r");
  mkdirSync(rDir, { recursive: true });
  for (const item of items) {
    // shadcn registry-item shape: same object, served at /r/{name}.json
    writeFileSync(
      join(rDir, `${item.name}.json`),
      JSON.stringify(item, null, 2) + "\n",
    );
  }
  const index = {
    $schema: "https://ui.shadcn.com/schema/registry-index.json",
    version: 1,
    items: items.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      registryDependencies: [],
      files: item.files.map((f) => ({
        path: f.path,
        content: f.content,
        type: "registry:file",
        target:
          f.target === "CURSOR_MDC"
            ? `.cursor/rules/${item.name}.mdc`
            : f.target,
      })),
    })),
  };
  writeFileSync(
    join(rDir, "index.json"),
    JSON.stringify(index, null, 2) + "\n",
  );
}

function gradeBadge(grade: Grade, score: number | null): string {
  if (grade === "ungraded" || score === null) return "—";
  const color =
    grade === "A" ? "brightgreen" : grade === "B" ? "blue" : "yellow";
  return `![${grade}](https://img.shields.io/badge/agentrules-${score}%2F100-${color})`;
}

function agentBadges(agents: string[]): string {
  return agents
    .map(
      (a) =>
        ({
          claude: "Claude",
          cursor: "Cursor",
          codex: "Codex",
          windsurf: "Windsurf",
          gemini: "Gemini",
          generic: "Generic",
        })[a] ?? a,
    )
    .join(", ");
}

function generateReadme(
  items: RegistryItem[],
  results: Map<string, GradeResult>,
): void {
  const curated = items.filter((i) => i.registry.source.kind === "curated");
  const rows = curated
    .map((item) => {
      const name = `**[${item.title}](registry/items/${item.name}/content.md)**`;
      const stack = item.registry.stack.slice(0, 4).join(", ");
      const agents = agentBadges(
        item.registry.agents.filter((a) => a !== "generic"),
      );
      const grade = gradeBadge(item.registry.grade, item.registry.score);
      const install = `\`npx agentrules add ${item.name}\``;
      return `| ${name} | ${item.description} | ${stack} | ${agents} | ${grade} | ${install} |`;
    })
    .join("\n");

  const byStack = new Map<string, string[]>();
  for (const item of curated) {
    for (const tag of item.registry.stack) {
      const names = byStack.get(tag) ?? [];
      names.push(item.name);
      byStack.set(tag, names);
    }
  }
  const stackLines = [...byStack.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([tag, names]) =>
        `- **${tag}** — ${names.map((n) => `\`${n}\``).join(", ")}`,
    )
    .join("\n");

  const recent = [...curated]
    .sort((a, b) => b.registry.added.localeCompare(a.registry.added))
    .map((item) => {
      const r = results.get(item.name);
      const score = r ? `${r.score}/100` : "—";
      return `- \`${item.name}\` (${score}) — ${item.title}, added ${item.registry.added}`;
    })
    .join("\n");

  const readme = `# agentrules

> **Install a battle-tested agent config into any agent, in one command.**
>
> \`npx agentrules add rust-monorepo-ts-crates --agent cursor\` → writes \`.cursor/rules/rust-monorepo-ts-crates.mdc\`
>
> The same config installs as \`CLAUDE.md\` / \`AGENTS.md\` / \`.cursorrules\` / \`.mdc\` / \`GEMINI.md\`. Every curated entry is machine-graded against a [published rubric](docs/RUBRIC.md).

[![npm](https://img.shields.io/npm/v/agentrules)](https://www.npmjs.com/package/agentrules)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Why

Everyone copy-pastes random \`CLAUDE.md\` / \`.cursorrules\` files and nobody knows what good looks like. This is a small, curated registry of configs that actually ship in real repos — each one installable into **any** agent format, each one scored against a transparent rubric. It piggybacks on the [shadcn registry item shape](https://ui.shadcn.com/docs/registry/registry-item), so registry-aware tooling can consume it directly.

## Install

\`\`\`bash
npx agentrules add <name> --agent claude|cursor|codex|windsurf|gemini|all
\`\`\`

| Command | What it does |
|---|---|
| \`npx agentrules list\` | list every entry |
| \`npx agentrules search <q>\` | search by name, stack, or description |
| \`npx agentrules view <name>\` | preview a config in the terminal |
| \`npx agentrules add <name>\` | install it (\`--agent\`, \`--dry-run\`, \`--diff\`, \`--overwrite\`, \`--link\`) |
| \`npx agentrules grade\` | machine-grade your local \`CLAUDE.md\`/\`AGENTS.md\` (\`--md\` for a badge) |

## Curated configs

| Config | Description | Stack | Agents | Grade | Install |
|---|---|---|---|---|---|
${rows}

## By stack

${stackLines}

## Recently added

${recent}

## Grading

Every curated entry is scored 0–100 against a [published rubric](docs/RUBRIC.md) —
brevity, structure, testability, actionable density, freshness, dedupe — using
the same code as \`npx agentrules grade\`. The score is machine-checked; the
editorial one-liner in each \`item.json\` is the human judgment. Grading is the
quiet signal — **the product is one-command, cross-agent install.**

Harvested configs (Phase 2) will appear with provenance and links only — no
public failing grades for work whose authors never opted in.

## Contributing

Add a new entry under \`registry/items/<slug>/\` with \`item.json\` +
\`content.md\`, then run:

\`\`\`bash
pnpm install
pnpm build:registry   # validates, grades, regenerates index.json + README
pnpm test
\`\`\`

Curated entries must machine-score ≥50. See [docs/RUBRIC.md](docs/RUBRIC.md)
for what's checked and what stays editorial.

## Registry protocol

This registry speaks the [shadcn registry item](https://ui.shadcn.com/docs/registry/registry-item)
format. Per-item endpoints live at \`registry/r/<name>.json\`; the manifest is
\`registry/index.json\`. Registry-aware agents and tools can consume either.

## License

MIT
`;

  writeFileSync(join(ROOT, "README.md"), readme);
}

function main(): void {
  const now = new Date();
  const { items, results } = loadSourceItems(now);
  validateSchema(items);
  writeIndex(items, now);
  writeShadcnEndpoints(items);
  generateReadme(items, results);

  const summary = items
    .map((item) => {
      const r = results.get(item.name);
      return `  ${item.name}: ${r?.score ?? "?"}/100 (${item.registry.grade})`;
    })
    .join("\n");
  console.log(`build: ${items.length} items\n${summary}`);
}

main();
