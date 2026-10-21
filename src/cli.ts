#!/usr/bin/env node
import {
  readFileSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  symlinkSync,
  readdirSync,
} from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { contentHash, gradeConfig, markdownBadge } from "./lib/grade.js";
import type {
  RegistryIndex,
  RegistryItem,
  RegistryItemFile,
  AgentTarget,
  FileTarget,
} from "./lib/types.js";

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const AGENTS: AgentTarget[] = [
  "claude",
  "cursor",
  "codex",
  "windsurf",
  "gemini",
  "generic",
];

function agentTarget(agent: AgentTarget): FileTarget | FileTarget[] {
  switch (agent) {
    case "claude":
      return ["CLAUDE.md"];
    case "cursor":
      return "CURSOR_MDC";
    case "codex":
      return "AGENTS.md";
    case "windsurf":
      return ".windsurfrules";
    case "gemini":
      return "GEMINI.md";
    case "generic":
      return "AGENTS.md";
  }
  return "AGENTS.md";
}

function loadIndex(): { index: RegistryIndex; registryDir: string } {
  const cwd = process.cwd();
  let cur = resolve(cwd);
  const candidates: string[] = [join(SELF_DIR, "..", "registry", "index.json")];
  for (let i = 0; i < 10; i++) {
    candidates.push(join(cur, "registry", "index.json"));
    const parent = resolve(cur, "..");
    if (parent === cur) break;
    cur = parent;
  }
  for (const c of candidates) {
    if (existsSync(c)) {
      const index = JSON.parse(readFileSync(c, "utf8")) as RegistryIndex;
      return { index, registryDir: dirname(c) };
    }
  }
  console.error(
    "error: could not find registry/index.json. Run `pnpm build:registry` first.",
  );
  process.exit(1);
  return { index: {} as RegistryIndex, registryDir: "" };
}

function itemForName(
  index: RegistryIndex,
  name: string,
): RegistryItem | undefined {
  return index.items.find((i) => i.name === name);
}

function fileForAgent(
  item: RegistryItem,
  agent: AgentTarget,
): RegistryItemFile | undefined {
  const target = agentTarget(agent);
  if (Array.isArray(target)) {
    return item.files.find((f) => target.includes(f.target));
  }
  if (target === "CURSOR_MDC") {
    return item.files.find((f) => f.target === "CURSOR_MDC");
  }
  return item.files.find((f) => f.target === target);
}

function outPathFor(
  item: RegistryItem,
  agent: AgentTarget,
  targetDir: string,
): string {
  const f = fileForAgent(item, agent);
  if (!f) throw new Error(`no file for agent ${agent}`);
  const p =
    f.target === "CURSOR_MDC"
      ? join(".cursor/rules", `${item.name}.mdc`)
      : f.path;
  return join(targetDir, p);
}

interface Parsed {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

const SHORT: Record<string, string> = {
  a: "agent",
  c: "cwd",
  d: "dry-run",
  D: "diff",
  o: "overwrite",
  l: "link",
  A: "all",
  m: "md",
  h: "help",
};

function flagValue(
  flags: Record<string, string | boolean>,
  key: string,
): string | undefined {
  const v = flags[key];
  return typeof v === "string" ? v : undefined;
}

function flagBool(
  flags: Record<string, string | boolean>,
  key: string,
): boolean {
  return flags[key] === true;
}

function parse(argv: string[]): Parsed {
  const flags: Record<string, string | boolean> = {};
  const args: string[] = [];
  let i = 0;
  while (i < argv.length) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      let key: string;
      let val: string | undefined;
      if (eq !== -1) {
        key = a.slice(2, eq);
        val = a.slice(eq + 1);
      } else {
        key = a.slice(2);
        val = undefined;
      }
      const long = SHORT[key] ?? key;
      if (val !== undefined) {
        flags[long] = val;
        i += 1;
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("-")) {
          flags[long] = next;
          i += 2;
        } else {
          flags[long] = true;
          i += 1;
        }
      }
    } else if (a.startsWith("-") && a.length === 2) {
      const ch = a.charAt(1);
      const long = SHORT[ch] ?? ch;
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        flags[long] = next;
        i += 2;
      } else {
        flags[long] = true;
        i += 1;
      }
    } else {
      args.push(a);
      i += 1;
    }
  }
  return { command: args[0] ?? "", args: args.slice(1), flags };
}

function help(): void {
  console.log(
    `agentrules - install a battle-tested agent config into any agent

Usage: agentrules <command> [options]

Commands:
  list                         list every registry entry
  search <q>                   search by name, stack, or description
  view <name> [--agent <a>]    preview a config (default: canonical content.md)
  add <name> [--agent <a>]     install a config into the cwd
                               options: --agent, --cwd, --dry-run, --diff, --overwrite, --link, --all
  grade [path] [--md]          machine-grade a local CLAUDE.md/AGENTS.md

Options:
  --help, -h                   show this help

Agents: claude, cursor, codex, windsurf, gemini, generic
`,
  );
}

function gradeRow(item: RegistryItem): string[] {
  const g = item.registry.grade;
  const s = item.registry.score === null ? "—" : `${item.registry.score}/100`;
  const stack = item.registry.stack.slice(0, 4).join(", ");
  const agents = item.registry.agents.filter((a) => a !== "generic").join(", ");
  return [item.name, item.title, `${g} ${s}`, stack, agents, item.description];
}

function printTable(rows: string[][]): void {
  const widths = rows[0]!.map((_, ci) =>
    Math.max(...rows.map((r) => (r[ci] ?? "").length)),
  );
  const line = widths.map((w) => "-".repeat(w)).join("-+-");
  console.log(
    rows
      .map((r) => r.map((c, i) => (c ?? "").padEnd(widths[i]!)).join(" | "))
      .join("\n"),
  );
  console.log(line);
}

function installItem(
  item: RegistryItem,
  agent: AgentTarget,
  targetDir: string,
  flags: Record<string, string | boolean>,
  registryDir: string,
): void {
  const f = fileForAgent(item, agent);
  if (!f) {
    console.error(`error: no file for agent ${agent}`);
    process.exit(1);
  }
  const out = outPathFor(item, agent, targetDir);
  const rel = relative(targetDir, out);
  if (existsSync(out) && !flagBool(flags, "overwrite")) {
    console.error(`error: ${rel} already exists. Use --overwrite to replace.`);
    process.exit(1);
  }
  if (flagBool(flags, "dry-run")) {
    console.log(
      `[dry-run] would write ${rel} (agent=${agent}, target=${f.target})`,
    );
    console.log("---");
    console.log(f.content);
    console.log("---");
    return;
  }
  if (flagBool(flags, "diff")) {
    let existing = "";
    if (existsSync(out)) {
      existing = readFileSync(out, "utf8");
    }
    console.log(`diff for ${rel} (agent=${agent}):`);
    if (existing && existing !== f.content) {
      console.log("--- existing");
      console.log(existing.slice(0, 2000));
      console.log("+++ new");
    }
    console.log(f.content.slice(0, 2000));
    if (!flagBool(flags, "overwrite") && existsSync(out)) {
      console.error(`\nuse --overwrite to write ${rel}`);
      return;
    }
  }
  mkdirSync(dirname(out), { recursive: true });
  if (flagBool(flags, "link")) {
    const src = join(registryDir, "items", item.name, "content.md");
    try {
      symlinkSync(src, out);
    } catch {
      writeFileSync(out, f.content);
    }
  } else {
    writeFileSync(out, f.content);
  }
  console.log(`installed ${item.name} as ${rel} (agent=${agent})`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    help();
    process.exit(argv.length === 0 ? 0 : 0);
    return;
  }

  const { command, args, flags } = parse(argv);

  switch (command) {
    case "list": {
      const { index } = loadIndex();
      const rows = [
        ["NAME", "TITLE", "GRADE", "STACK", "AGENTS", "DESCRIPTION"],
        ...index.items.map(gradeRow),
      ];
      printTable(rows);
      break;
    }
    case "search": {
      const q = args[0];
      if (!q) {
        console.error("error: search requires a query");
        process.exit(2);
      }
      const { index } = loadIndex();
      const ql = q.toLowerCase();
      const hits = index.items.filter(
        (i) =>
          i.name.toLowerCase().includes(ql) ||
          i.title.toLowerCase().includes(ql) ||
          i.description.toLowerCase().includes(ql) ||
          i.registry.stack.some((s) => s.toLowerCase().includes(ql)),
      );
      if (hits.length === 0) {
        console.log(`no entries matched "${q}"`);
        break;
      }
      const rows = [
        ["NAME", "TITLE", "GRADE", "STACK", "AGENTS", "DESCRIPTION"],
        ...hits.map(gradeRow),
      ];
      printTable(rows);
      break;
    }
    case "view": {
      const name = args[0];
      if (!name) {
        console.error("error: view requires a name");
        process.exit(2);
      }
      const { index } = loadIndex();
      const item = itemForName(index, name);
      if (!item) {
        console.error(`error: unknown entry "${name}"`);
        process.exit(1);
      }
      const agent = (flagValue(flags, "agent") as AgentTarget) ?? "claude";
      if (!AGENTS.includes(agent)) {
        console.error(`error: unknown agent "${agent}"`);
        process.exit(2);
      }
      const f = fileForAgent(item, agent);
      if (!f) {
        console.error(`error: no file for agent ${agent}`);
        process.exit(1);
      }
      const label =
        f.target === "CURSOR_MDC" ? `.cursor/rules/${item.name}.mdc` : f.path;
      console.log(`### ${item.title}  (${label})`);
      console.log(f.content);
      break;
    }
    case "add": {
      const name = args[0];
      if (!name) {
        console.error("error: add requires a name");
        process.exit(2);
      }
      const { index, registryDir } = loadIndex();
      const item = itemForName(index, name);
      if (!item) {
        console.error(`error: unknown entry "${name}"`);
        process.exit(1);
      }
      const agent = (flagValue(flags, "agent") as AgentTarget) ?? "claude";
      if (!AGENTS.includes(agent)) {
        console.error(
          `error: unknown agent "${agent}" (use one of ${AGENTS.join(", ")})`,
        );
        process.exit(2);
      }
      const targetDir = flagValue(flags, "cwd") ?? process.cwd();
      if (flagBool(flags, "all")) {
        const seen = new Set<string>();
        for (const a of AGENTS) {
          const f = fileForAgent(item, a);
          if (!f) continue;
          const key =
            f.target === "CURSOR_MDC"
              ? join(".cursor/rules", `${item.name}.mdc`)
              : f.path;
          if (seen.has(key)) continue;
          seen.add(key);
          installItem(item, a, targetDir, flags, registryDir);
        }
        break;
      }
      installItem(item, agent, targetDir, flags, registryDir);
      break;
    }
    case "grade": {
      const [pathArg] = args;
      const cwd = process.cwd();
      let targetPath: string | undefined = pathArg;
      if (!targetPath) {
        const candidates = [
          "CLAUDE.md",
          "AGENTS.md",
          "GEMINI.md",
          ".cursorrules",
          ".windsurfrules",
        ];
        for (const cand of candidates) {
          const c = join(cwd, cand);
          if (existsSync(c)) {
            targetPath = c;
            break;
          }
        }
        // fall back to any .cursor/rules/*.mdc
        if (!targetPath) {
          const rulesDir = join(cwd, ".cursor", "rules");
          if (existsSync(rulesDir)) {
            const mdc = readdirSync(rulesDir).find((f) => f.endsWith(".mdc"));
            if (mdc) targetPath = join(rulesDir, mdc);
          }
        }
      }
      if (!targetPath) {
        console.error(
          "error: no config file found. Pass a path, or place CLAUDE.md/AGENTS.md in cwd.",
        );
        process.exit(1);
      }
      if (!existsSync(targetPath)) {
        console.error(`error: config not found: ${targetPath}`);
        process.exit(1);
      }
      const content = readFileSync(targetPath, "utf8");
      const result = gradeConfig(content);
      const showBadge = flagBool(flags, "md");
      console.log(`grade for ${relative(cwd, targetPath)}`);
      console.log(`  score: ${result.score}/100  grade: ${result.grade}`);
      console.log(
        `  brevity:   ${result.dimensions.brevity.points}/${result.dimensions.brevity.max} (${result.dimensions.brevity.lines} lines, ~${result.dimensions.brevity.tokens} tokens)`,
      );
      console.log(
        `  structure: ${result.dimensions.structure.points}/${result.dimensions.structure.max} missing: ${result.dimensions.structure.missing.join(", ") || "none"}`,
      );
      console.log(
        `  testability: ${result.dimensions.testability.points}/${result.dimensions.testability.max} ${result.dimensions.testability.mention ?? "no mention"}`,
      );
      console.log(
        `  actionable:  ${result.dimensions.actionable.points}/${result.dimensions.actionable.max} ratio=${result.dimensions.actionable.ratio}`,
      );
      console.log(
        `  freshness:   ${result.dimensions.freshness.points}/${result.dimensions.freshness.max}`,
      );
      console.log(
        `  dedupe:      ${result.dimensions.dedupe.points}/${result.dimensions.dedupe.max}`,
      );
      if (result.hints.length) {
        console.log("\nHints:");
        for (const h of result.hints) console.log(`  - ${h}`);
      }
      if (showBadge) {
        console.log("\n" + markdownBadge(result));
      }
      break;
    }
    default:
      console.error(`error: unknown command "${command}"`);
      help();
      process.exit(2);
  }
}

main().catch((err) => {
  console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
