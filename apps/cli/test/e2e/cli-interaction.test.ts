import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const SMOKE_DIR = join(import.meta.dir, "..", "..", ".smoke-interaction");
const CLI_PATH = join(import.meta.dir, "..", "..", "dist", "cli.mjs");
const EXPLICIT_TS_FLAGS = [
  "--ecosystem", "typescript",
  "--package-manager", "bun",
  "--frontend", "tanstack-router",
  "--backend", "hono",
  "--runtime", "bun",
  "--api", "trpc",
  "--database", "sqlite",
  "--orm", "drizzle",
  "--db-setup", "none",
  "--auth", "none",
  "--payments", "none",
  "--email", "none",
  "--file-upload", "none",
  "--logging", "none",
  "--observability", "none",
  "--feature-flags", "none",
  "--analytics", "none",
  "--effect", "none",
  "--state-management", "none",
  "--forms", "react-hook-form",
  "--validation", "zod",
  "--testing", "vitest",
  "--ai", "none",
  "--realtime", "none",
  "--job-queue", "none",
  "--animation", "none",
  "--css-framework", "tailwind",
  "--ui-library", "none",
  "--cms", "none",
  "--caching", "none",
  "--i18n", "none",
  "--search", "none",
  "--file-storage", "none",
  "--addons", "none",
  "--examples", "none",
  "--ai-docs", "none",
  "--web-deploy", "none",
  "--server-deploy", "none",
  "--no-install",
  "--no-git",
] as const;
const OPENTUI_FLAGS = [
  "--ecosystem", "typescript",
  "--package-manager", "bun",
  "--frontend", "qwik",
  "--backend", "none",
  "--runtime", "none",
  "--api", "none",
  "--database", "none",
  "--orm", "none",
  "--db-setup", "none",
  "--auth", "none",
  "--payments", "none",
  "--email", "none",
  "--file-upload", "uploadthing",
  "--logging", "none",
  "--observability", "none",
  "--feature-flags", "none",
  "--analytics", "none",
  "--effect", "none",
  "--state-management", "xstate",
  "--forms", "modular-forms",
  "--validation", "none",
  "--testing", "jest",
  "--ai", "none",
  "--realtime", "none",
  "--job-queue", "none",
  "--animation", "none",
  "--css-framework", "postcss-only",
  "--ui-library", "none",
  "--cms", "none",
  "--caching", "none",
  "--i18n", "none",
  "--search", "none",
  "--file-storage", "none",
  "--addons", "opentui",
  "--examples", "none",
  "--ai-docs", "none",
  "--web-deploy", "none",
  "--server-deploy", "none",
  "--no-install",
  "--no-git",
] as const;

function runCLI(
  args: string[],
  options?: { timeout?: number; env?: NodeJS.ProcessEnv },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const timeout = options?.timeout ?? 30_000;

  // The CLI requires project path to be relative to cwd.
  // First arg should be the project dir — extract parent and name.
  const projectPath = args[0];
  const parentDir = projectPath ? join(projectPath, "..") : SMOKE_DIR;
  const projectName = projectPath?.split("/").pop() || "test";
  const restArgs = args.slice(1);

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const child = spawn("node", [CLI_PATH, projectName, ...restArgs], {
      stdio: "pipe",
      cwd: parentDir,
      env: { ...process.env, NO_COLOR: "1", TERM: "dumb", ...options?.env },
    });

    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    child.on("close", (code) => {
      if (!settled) {
        settled = true;
        resolve({ exitCode: code ?? 1, stdout, stderr });
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGTERM");
        resolve({ exitCode: 1, stdout, stderr: stderr + "\nTimeout" });
      }
    }, timeout);
  });
}

describe("CLI Interaction Tests", () => {
  beforeAll(async () => {
    await rm(SMOKE_DIR, { recursive: true, force: true });
    await mkdir(SMOKE_DIR, { recursive: true });
  });

  afterAll(async () => {
    await rm(SMOKE_DIR, { recursive: true, force: true });
  });

  describe("--yes mode (non-interactive)", () => {
    it("creates project without prompts", async () => {
      const dir = join(SMOKE_DIR, "yes-mode");
      const result = await runCLI([dir, "--yes", "--no-install", "--no-git"]);
      expect(result.exitCode).toBe(0);
      expect(existsSync(join(dir, "package.json"))).toBe(true);
    });

    it("creates project in CI with --yes and --no-install", async () => {
      const dir = join(SMOKE_DIR, "yes-mode-ci");
      const result = await runCLI([dir, "--yes", "--no-install", "--no-git"], {
        env: { CI: "true" },
      });
      expect(result.exitCode).toBe(0);
      expect(existsSync(join(dir, "bts.jsonc"))).toBe(true);
      expect(existsSync(join(dir, "package.json"))).toBe(true);
    });

    it("outputs a reproducible command", async () => {
      const dir = join(SMOKE_DIR, "repro");
      const result = await runCLI([dir, "--yes", "--no-install", "--no-git"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("create-better-fullstack");
    });
  });

  describe("prompt fallback behavior", () => {
    it("uses addon defaults in CI without prompting for template selection", async () => {
      const dir = join(SMOKE_DIR, "opentui-ci");
      const result = await runCLI([dir, ...OPENTUI_FLAGS], {
        env: { CI: "true" },
        timeout: 120_000,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Using default OpenTUI template: Core");
      expect(result.stdout).not.toContain("Choose a template");
      expect(existsSync(join(dir, "bts.jsonc"))).toBe(true);
      expect(existsSync(join(dir, "apps", "tui"))).toBe(true);
    });

    it("scaffolds without TTY when all flags are provided and version channel is omitted", async () => {
      const dir = join(SMOKE_DIR, "explicit-no-tty");
      const result = await runCLI([dir, ...EXPLICIT_TS_FLAGS], {
        timeout: 120_000,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("Choose dependency version channel");
      expect(existsSync(join(dir, "bts.jsonc"))).toBe(true);
      expect(existsSync(join(dir, "package.json"))).toBe(true);
    });
  });

  describe("flag validation", () => {
    it("rejects incompatible database + ORM combo", async () => {
      const dir = join(SMOKE_DIR, "bad-combo");
      const result = await runCLI([
        dir,
        "--database", "mongodb",
        "--orm", "drizzle",
        "--no-install",
        "--no-git",
      ]);
      expect(result.exitCode).not.toBe(0);
    });

    it("rejects --yes with core stack flags", async () => {
      const dir = join(SMOKE_DIR, "yes-conflict");
      const result = await runCLI([
        dir,
        "--yes",
        "--frontend", "next",
        "--no-install",
        "--no-git",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("ecosystem selection via CLI", () => {
    it("--ecosystem rust + --yes scaffolds Rust project", async () => {
      const dir = join(SMOKE_DIR, "eco-rust");
      const result = await runCLI([dir, "--ecosystem", "rust", "--yes", "--no-install", "--no-git"]);
      expect(result.exitCode).toBe(0);
      expect(existsSync(join(dir, "Cargo.toml"))).toBe(true);
    });

    it("--ecosystem python + --yes scaffolds Python project", async () => {
      const dir = join(SMOKE_DIR, "eco-python");
      const result = await runCLI([dir, "--ecosystem", "python", "--yes", "--no-install", "--no-git"]);
      expect(result.exitCode).toBe(0);
      expect(existsSync(join(dir, "pyproject.toml"))).toBe(true);
    });

    it("--ecosystem go + --yes scaffolds Go project", async () => {
      const dir = join(SMOKE_DIR, "eco-go");
      const result = await runCLI([dir, "--ecosystem", "go", "--yes", "--no-install", "--no-git"]);
      expect(result.exitCode).toBe(0);
      expect(existsSync(join(dir, "go.mod"))).toBe(true);
    });
  });

  describe("directory conflict handling", () => {
    it("--directory-conflict overwrite replaces existing project", async () => {
      const dir = join(SMOKE_DIR, "overwrite");
      // Create first
      await runCLI([dir, "--yes", "--no-install", "--no-git"]);
      expect(existsSync(join(dir, "package.json"))).toBe(true);

      // Overwrite
      const result = await runCLI([dir, "--yes", "--no-install", "--no-git", "--directory-conflict", "overwrite"]);
      expect(result.exitCode).toBe(0);
    });
  });
});
