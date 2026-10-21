export type AgentTarget =
    "claude" | "cursor" | "codex" | "windsurf" | "gemini" | "generic";

export type FileTarget =
    | "AGENTS.md"
    | "CLAUDE.md"
    | "GEMINI.md"
    | ".cursorrules"
    | ".windsurfrules"
    | "CURSOR_MDC";

export type Grade = "A" | "B" | "C" | "ungraded";

/** Grades the machine scorer can emit. "F" is local-only — never stored in the registry. */
export type ScoredGrade = "A" | "B" | "C" | "F";

export interface RegistryItemFile {
    path: string;
    target: FileTarget;
    content: string;
    contentType?: "text/plain";
}

export interface ItemSource {
    kind: "curated" | "harvested";
    repo?: string;
    path?: string;
    commit?: string;
    commitDate?: string;
    license?: string;
    url?: string;
}

export interface RegistryExtension {
    stack: string[];
    agents: AgentTarget[];
    grade: Grade;
    score: number | null;
    note?: string;
    source: ItemSource;
    added: string;
    version: string;
}

export interface RegistryItem {
    $schema?: string;
    name: string;
    type: "registry:file";
    title: string;
    description: string;
    files: RegistryItemFile[];
    registry: RegistryExtension;
}

export interface RegistryIndex {
    version: number;
    generatedAt: string;
    count: number;
    items: RegistryItem[];
}

/** Result of machine-checking a config document. */
export interface GradeResult {
    score: number;
    grade: ScoredGrade;
    dimensions: {
        brevity: { points: number; max: number; lines: number; tokens: number };
        structure: {
            points: number;
            max: number;
            present: string[];
            missing: string[];
        };
        testability: { points: number; max: number; mention: string | null };
        actionable: { points: number; max: number; ratio: number };
        freshness: {
            points: number;
            max: number;
            daysSinceCommit: number | null;
        };
        dedupe: { points: number; max: number; duplicateOf: string | null };
    };
    hints: string[];
}

export const AGENT_TARGETS: Record<AgentTarget, FileTarget | FileTarget[]> = {
    claude: ["CLAUDE.md"],
    cursor: "CURSOR_MDC",
    codex: "AGENTS.md",
    windsurf: ".windsurfrules",
    gemini: "GEMINI.md",
    generic: "AGENTS.md",
};

export function targetPathFor(itemName: string, target: FileTarget): string {
    return target === "CURSOR_MDC" ? `.cursor/rules/${itemName}.mdc` : target;
}
