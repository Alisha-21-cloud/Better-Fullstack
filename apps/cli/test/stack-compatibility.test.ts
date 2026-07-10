import { describe, expect, it } from "bun:test";

import type { ProjectConfig } from "../src/types";

import { resolveCompatibilityAdjustments } from "../src/utils/stack-compatibility";

const TS_FLAG_BASE: Partial<ProjectConfig> = {
  ecosystem: "typescript",
  frontend: ["svelte"],
  backend: "hono",
  runtime: "bun",
  database: "sqlite",
  orm: "drizzle",
  auth: "none",
  api: "trpc",
};

describe("resolveCompatibilityAdjustments", () => {
  it("adjusts trpc to orpc for non-React frontends with a from/to message", () => {
    const { changes, adjustments } = resolveCompatibilityAdjustments(TS_FLAG_BASE, {
      onlyDefinedKeys: true,
    });

    expect(changes).toEqual({ api: "orpc" });
    expect(adjustments).toHaveLength(1);
    expect(adjustments[0]).toStartWith("api: trpc → orpc — ");
  });

  it("stays silent for a compatible stack", () => {
    const result = resolveCompatibilityAdjustments(
      { ...TS_FLAG_BASE, frontend: ["tanstack-router"], auth: "better-auth" },
      { onlyDefinedKeys: true },
    );

    expect(result).toEqual({ changes: {}, adjustments: [] });
  });

  it("stays silent for a valid Effect backend stack (no spurious backendLibraries change)", () => {
    const result = resolveCompatibilityAdjustments(
      {
        ...TS_FLAG_BASE,
        frontend: ["tanstack-router"],
        backend: "effect",
        effect: "effect-full",
        validation: "effect-schema",
        api: "orpc",
      },
      { onlyDefinedKeys: true },
    );

    expect(result).toEqual({ changes: {}, adjustments: [] });
  });

  it("only touches keys the caller defined when onlyDefinedKeys is set", () => {
    const { changes } = resolveCompatibilityAdjustments(
      { ecosystem: "typescript", frontend: ["svelte"], api: "trpc" },
      { onlyDefinedKeys: true },
    );

    expect(Object.keys(changes).every((key) => ["frontend", "api"].includes(key))).toBe(true);
    expect(changes.api).toBe("orpc");
  });

  it("skips non-TypeScript ecosystems", () => {
    const result = resolveCompatibilityAdjustments({
      ecosystem: "rust",
      rustWebFramework: "axum",
    });

    expect(result).toEqual({ changes: {}, adjustments: [] });
  });

  it("skips graph-driven (--part) configs", () => {
    const result = resolveCompatibilityAdjustments({
      ...TS_FLAG_BASE,
      stackParts: [
        {
          id: "backend-1",
          role: "backend",
          ecosystem: "typescript",
          toolId: "hono",
          source: "selected",
        },
      ] as ProjectConfig["stackParts"],
    });

    expect(result).toEqual({ changes: {}, adjustments: [] });
  });
});
