import { createHash } from "node:crypto";
import type { GradeResult, ScoredGrade } from "./types.js";

export function contentHash(content: string): string {
    return createHash("sha256").update(content.trim(), "utf8").digest("hex");
}

export function approxTokens(content: string): number {
    return Math.ceil(content.length / 4);
}

export function gradeForScore(score: number): ScoredGrade {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 50) return "C";
    return "F";
}

export interface GradeOptions {
    /** Days since the pinned source commit. null/undefined = freshness N/A. */
    daysSinceCommit?: number | null;
    /** hash -> item name for every other registry entry (dedupe check). */
    otherHashes?: Map<string, string>;
}

const SECTION_PATTERNS: Record<string, RegExp> = {
    overview: /^#\s+\S|^.*\b(overview|introduction|about|what is)\b/im,
    commands:
        /\b(commands|development|setup|usage|getting started|scripts|workflow)\b/i,
    architecture:
        /\b(architecture|structure|directory layout|project structure|repo structure|layout)\b/i,
    rules: /\b(rules|conventions|style guide|guidelines|standards|conventions and|coding style)\b/i,
};

const TEST_MENTION =
    /\b(tests?|pytest|vitest|jest|mocha|cargo test|go test|make test|tox|rspec|phpunit)\b/i;

const JS_RUNNERS = ["npx", "pnpm", "npm", "yarn", "bun"] as const;
const NATIVE_TEST_PREFIXES = ["cargo", "go", "make", "just"] as const;

function normalizeLine(raw: string): string {
    return raw
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
        .replace(/[`$]/g, "")
        .trim();
}

function looksLikeTestCommand(line: string): boolean {
    const jsRunner = JS_RUNNERS.some((r) =>
        new RegExp(`^(?:${r})\\s+(?:run\\s+)?[\\w.-]*test`, "i").test(line),
    );
    const native = NATIVE_TEST_PREFIXES.some((p) =>
        new RegExp(`^${p}\\s+test`).test(line),
    );
    const python =
        /^python3?\s+(?:-m\s+)?pytest/i.test(line) || /^pytest\b/i.test(line);
    const bareRunner = /^(?:vitest|jest)\s/i.test(line);
    return jsRunner || native || python || bareRunner;
}

function hasCopyPasteableTestCommand(content: string): boolean {
    return content
        .split("\n")
        .some((raw) => looksLikeTestCommand(normalizeLine(raw)));
}

const IMPERATIVE_START =
    /^(\s*[-*+]\s+|\s*\d+\.\s+)?\s*(use|run|avoid|prefer|keep|never|always|add|create|make|write|read|check|ensure|do|don'?t|dont|install|set|put|place|call|pass|return|include|remove|delete|rename|follow|stick|stay|leave|see|open|start|stop|commit|push|merge|rebase|review|test|build|deploy|define|declare|export|import|extend|implement|wrap|throw|catch|log|cache|type|lint|format|scope|name|label|tag|pin|bump|draft|fill|point|link|cite|quote|summarize|split|merge)\b/i;

const BACKTICK_CONCRETE = /`[^`\n]+`/;

function headings(content: string): string[] {
    return content
        .split("\n")
        .filter((l) => /^#{1,6}\s+/.test(l))
        .map((l) => l.replace(/^#{1,6}\s+/, "").trim());
}

function isActionable(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^#{1,6}\s+/.test(trimmed)) return false;
    if (/^```/.test(trimmed)) return false;
    if (/^\|/.test(trimmed)) return false;
    if (/^<!--/.test(trimmed)) return false;
    if (IMPERATIVE_START.test(trimmed)) return true;
    if (BACKTICK_CONCRETE.test(trimmed)) return true;
    return false;
}

export function gradeConfig(
    content: string,
    opts: GradeOptions = {},
): GradeResult {
    const lines = content.split("\n");
    const nonBlank = lines.filter((l) => l.trim().length > 0);
    const tokens = approxTokens(content);
    const hints: string[] = [];

    // --- Brevity (20) ---
    const linePts = 20 * clamp((250 - nonBlank.length) / (250 - 150), 0, 1);
    const tokenPts = 20 * clamp((6000 - tokens) / (6000 - 4000), 0, 1);
    const brevityPts = Math.min(linePts, tokenPts);
    if (nonBlank.length > 200) {
        hints.push(
            `Config is ${nonBlank.length} lines — aim for ≤150. Cut anything the model already knows.`,
        );
    } else if (tokens > 4000) {
        hints.push(
            `~${tokens} tokens — aim for ≤4,000. Trim boilerplate sections.`,
        );
    }

    // --- Structure (20) ---
    const heads = headings(content);
    const headBlob = heads.join("\n");
    const present: string[] = [];
    const missing: string[] = [];
    for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
        const ok =
            section === "overview"
                ? /^#\s+\S/.test(content) || pattern.test(headBlob)
                : pattern.test(headBlob);
        (ok ? present : missing).push(section);
    }
    const structurePts = present.length * 5;
    if (missing.length > 0) {
        hints.push(
            `Missing section${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Add a short "${missing[0]}" heading.`,
        );
    }

    // --- Testability (20) ---
    const mention = content.match(TEST_MENTION)?.[0] ?? null;
    let testabilityPts = 0;
    if (mention) {
        testabilityPts = hasCopyPasteableTestCommand(content) ? 20 : 10;
        if (testabilityPts === 10) {
            hints.push(
                "Test command mentioned but not copy-pasteable — show it, e.g. `pnpm test`.",
            );
        }
    } else {
        hints.push(
            "No test command found. Agents skip verification without one — add how to run tests.",
        );
    }

    // --- Actionable density (20) ---
    const eligible = nonBlank.filter((l) => !/^#{1,6}\s+/.test(l.trim()));
    const actionable = eligible.filter(isActionable).length;
    const ratio = eligible.length > 0 ? actionable / eligible.length : 0;
    const actionablePts = 20 * clamp(ratio / 0.4, 0, 1);
    if (ratio < 0.4) {
        hints.push(
            `Only ${Math.round(ratio * 100)}% of lines are actionable (aim ≥40%). Prefer imperatives and concrete paths over prose.`,
        );
    }

    // --- Freshness (10) — registry items only ---
    let freshnessPts: number | null = null;
    const days = opts.daysSinceCommit ?? null;
    if (days !== null) {
        freshnessPts = 10 * clamp((365 - days) / (365 - 180), 0, 1);
        if (days > 180) {
            hints.push(
                `Source commit is ${days} days old — update the pinned commit or re-verify.`,
            );
        }
    }

    // --- Dedupe (10) ---
    let dedupePts: number | null = null;
    let duplicateOf: string | null = null;
    const hash = contentHash(content);
    if (opts.otherHashes) {
        const other = opts.otherHashes.get(hash);
        if (other && content.trim().length >= 200) {
            dedupePts = 0;
            duplicateOf = other;
            hints.push(
                `Byte-identical to registry entry "${other}" — make it original.`,
            );
        } else {
            dedupePts = 10;
        }
    }

    const earned =
        brevityPts +
        structurePts +
        testabilityPts +
        actionablePts +
        (freshnessPts ?? 0) +
        (dedupePts ?? 0);
    const applicableMax =
        100 - (freshnessPts === null ? 10 : 0) - (dedupePts === null ? 10 : 0);
    const score = Math.round((earned / applicableMax) * 100);

    return {
        score,
        grade: gradeForScore(score),
        dimensions: {
            brevity: {
                points: round1(brevityPts),
                max: 20,
                lines: nonBlank.length,
                tokens,
            },
            structure: {
                points: structurePts,
                max: 20,
                present,
                missing,
            },
            testability: {
                points: testabilityPts,
                max: 20,
                mention,
            },
            actionable: {
                points: round1(actionablePts),
                max: 20,
                ratio: round1(ratio),
            },
            freshness: {
                points: freshnessPts === null ? 0 : round1(freshnessPts),
                max: freshnessPts === null ? 0 : 10,
                daysSinceCommit: days,
            },
            dedupe: {
                points: dedupePts === null ? 0 : dedupePts,
                max: dedupePts === null ? 0 : 10,
                duplicateOf,
            },
        },
        hints,
    };
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

export function badgeColor(grade: string): string {
    switch (grade) {
        case "A":
            return "BRIGHTGREEN";
        case "B":
            return "blue";
        case "C":
            return "yellow";
        default:
            return "red";
    }
}

export function markdownBadge(result: GradeResult): string {
    const label = encodeURIComponent(`rulebook ${result.score}`);
    const color = badgeColor(result.grade);
    return [
        `[![rulebook](https://img.shields.io/badge/${label}-${result.grade}-${color})](https://github.com/gabrielvfonseca/rulebook)`,
        "",
        `<!-- rulebook grade: ${result.score}/100 (machine-checked) · re-grade: npx rulebook grade -->`,
    ].join("\n");
}
