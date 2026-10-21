import { describe, expect, it } from "vitest";
import {
    approxTokens,
    contentHash,
    gradeConfig,
    gradeForScore,
    markdownBadge,
} from "../src/grade.js";

const GOOD_CONFIG = `# Project Name

A short overview: Next.js 16 + Turborepo monorepo for a marketing site.

## Commands

- \`pnpm dev\` — start the dev server
- \`pnpm test\` — run unit tests with vitest
- \`pnpm build\` — production build

## Architecture

- \`apps/web\` — Next.js App Router app
- \`packages/ui\` — shared components
- \`packages/config\` — shared tsconfig/eslint

## Rules

- Use the App Router only; never add \`pages/\`.
- Prefer server components; add \`"use client"\` only when needed.
- Always run \`pnpm test\` before opening a PR.
- Avoid new dependencies without asking.
- Keep components in \`packages/ui\` generic; no product copy there.
- Never commit secrets; use \`.env.local\`.
- Run \`pnpm lint\` and fix errors before committing.
- Create features as \`apps/web/src/app/<route>/page.tsx\`.
- Read \`docs/architecture.md\` for data-flow details.
- Check \`turbo.json\` before adding new pipeline tasks.
`;

const RAMBLING_CONFIG = `# Notes

This project is a website. It uses React. We like TypeScript quite a bit
and generally follow modern practices. Testing is something we believe in
strongly even though we don't really talk about how to do it here.

The architecture is fine. Things live in folders. The team has opinions
about style but they are mostly unwritten feelings about cleanliness.

We should probably be more specific someday about commands but for now
everyone just kind of knows how to run things locally.
`;

describe("contentHash", () => {
    it("is stable across trailing whitespace", () => {
        expect(contentHash("hello\n")).toBe(contentHash("hello"));
    });
    it("differs for different content", () => {
        expect(contentHash("a")).not.toBe(contentHash("b"));
    });
});

describe("approxTokens", () => {
    it("estimates chars/4", () => {
        expect(approxTokens("abcdefgh")).toBe(2);
    });
});

describe("gradeForScore", () => {
    it("maps thresholds", () => {
        expect(gradeForScore(85)).toBe("A");
        expect(gradeForScore(70)).toBe("B");
        expect(gradeForScore(50)).toBe("C");
        expect(gradeForScore(49)).toBe("F");
    });
});

describe("gradeConfig", () => {
    it("grades a good config A", () => {
        const r = gradeConfig(GOOD_CONFIG);
        expect(r.score).toBeGreaterThanOrEqual(85);
        expect(r.grade).toBe("A");
        expect(r.dimensions.structure.missing).toEqual([]);
        expect(r.dimensions.testability.points).toBe(20);
    });

    it("grades a rambling config low", () => {
        const r = gradeConfig(RAMBLING_CONFIG);
        expect(r.score).toBeLessThan(50);
        expect(r.grade).toBe("F");
        expect(r.hints.length).toBeGreaterThan(0);
    });

    it("flags missing structure sections", () => {
        const r = gradeConfig("# Title\n\nsome text\n");
        expect(r.dimensions.structure.missing).toContain("commands");
        expect(r.dimensions.structure.missing).toContain("architecture");
    });

    it("scores testability higher for copy-pasteable commands", () => {
        const prose = gradeConfig(
            "# T\n\nWe run tests sometimes.\n## Commands\nfoo\n## Architecture\nbar\n## Rules\nbaz\n",
        );
        const cmd = gradeConfig(
            "# T\n\n## Commands\n\n- \`pnpm test\` runs the suite\n\n## Architecture\nbar\n\n## Rules\n- use `x`\n",
        );
        expect(cmd.dimensions.testability.points).toBeGreaterThan(
            prose.dimensions.testability.points,
        );
    });

    it("treats freshness as N/A for local configs", () => {
        const r = gradeConfig(GOOD_CONFIG);
        expect(r.dimensions.freshness.max).toBe(0);
        expect(r.score).toBeLessThanOrEqual(100);
    });

    it("applies freshness when daysSinceCommit given", () => {
        const fresh = gradeConfig(GOOD_CONFIG, { daysSinceCommit: 10 });
        const stale = gradeConfig(GOOD_CONFIG, { daysSinceCommit: 400 });
        expect(fresh.dimensions.freshness.points).toBe(10);
        expect(stale.dimensions.freshness.points).toBe(0);
        expect(stale.score).toBeLessThan(fresh.score);
    });

    it("detects byte-identical duplicates via otherHashes", () => {
        const clean = gradeConfig(GOOD_CONFIG, { otherHashes: new Map() });
        const hashes = new Map([[contentHash(GOOD_CONFIG), "other-item"]]);
        const r = gradeConfig(GOOD_CONFIG, { otherHashes: hashes });
        expect(r.dimensions.dedupe.duplicateOf).toBe("other-item");
        expect(r.dimensions.dedupe.points).toBe(0);
        expect(r.score).toBeLessThan(clean.score);
    });

    it("does not flag short identical content as duplicate", () => {
        const short = "# x\n\nhi\n";
        const hashes = new Map([[contentHash(short), "other"]]);
        const r = gradeConfig(short, { otherHashes: hashes });
        expect(r.dimensions.dedupe.duplicateOf).toBeNull();
    });
});

describe("markdownBadge", () => {
    it("emits shields link and re-grade hint", () => {
        const md = markdownBadge(gradeConfig(GOOD_CONFIG));
        expect(md).toContain("img.shields.io");
        expect(md).toContain("npx agentrules grade");
    });
});
