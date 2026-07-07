import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

type StackValue = string | boolean | string[];

// Envelope fields handled explicitly (not part of the stack config).
const META_KEYS = new Set([
  "eventType",
  "source",
  "machineId",
  "success",
  "errorName",
  "setupFailures",
  "durationMs",
  "fileCount",
  "cli_version",
  "node_version",
  "platform",
  "options",
]);

// Never store these even if a client sends them (potential PII / paths).
const BLOCKED_KEYS = new Set([
  "projectName",
  "projectDir",
  "relativePath",
  "targetDir",
  "workspaceRoot",
]);

const MAX_STACK_KEYS = 256;
const KEY_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;
const MAX_VALUE_LENGTH = 200;
const MAX_ARRAY_ITEMS = 32;

function sanitizeString(value: string): string | undefined {
  const trimmed = value.trim().slice(0, MAX_VALUE_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Build the generic stack record from an arbitrary payload: every
 * non-envelope key with a string / boolean / string[] value. New CLI
 * options are captured automatically — no server change needed.
 */
function extractStack(body: Record<string, unknown>): Record<string, StackValue> {
  const stack: Record<string, StackValue> = {};
  for (const [key, value] of Object.entries(body)) {
    if (Object.keys(stack).length >= MAX_STACK_KEYS) break;
    if (META_KEYS.has(key) || BLOCKED_KEYS.has(key) || !KEY_PATTERN.test(key)) continue;
    if (typeof value === "boolean") {
      stack[key] = value;
    } else if (typeof value === "string") {
      const clean = sanitizeString(value);
      if (clean !== undefined) stack[key] = clean;
    } else if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      const items = value
        .slice(0, MAX_ARRAY_ITEMS)
        .map((item) => sanitizeString(item))
        .filter((item): item is string => item !== undefined);
      if (items.length > 0) stack[key] = items;
    }
  }
  return stack;
}

const str = (value: unknown): string | undefined =>
  typeof value === "string" ? sanitizeString(value) : undefined;
const bool = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;
const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
const strArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
        .slice(0, MAX_ARRAY_ITEMS)
        .map((item) => sanitizeString(item))
        .filter((item): item is string => item !== undefined)
    : undefined;

const http = httpRouter();

http.route({
  path: "/api/analytics/ingest",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return new Response("Bad Request", { status: 400 });
    }

    const stack = extractStack(body);

    try {
      await ctx.runMutation(internal.analytics.ingestEvent, {
        // Envelope
        eventType: str(body.eventType),
        source: str(body.source),
        machineId: str(body.machineId),
        success: bool(body.success),
        errorName: str(body.errorName),
        setupFailures: strArray(body.setupFailures),
        durationMs: num(body.durationMs),
        fileCount: num(body.fileCount),
        stack: Object.keys(stack).length > 0 ? stack : undefined,
        // Legacy named fields, kept so the per-field aggregates and old
        // payload shapes keep working.
        ecosystem: str(body.ecosystem),
        database: str(body.database),
        orm: str(body.orm),
        backend: str(body.backend),
        runtime: str(body.runtime),
        frontend: strArray(body.frontend),
        api: str(body.api),
        auth: str(body.auth),
        dbSetup: str(body.dbSetup),
        webDeploy: str(body.webDeploy),
        serverDeploy: str(body.serverDeploy),
        addons: strArray(body.addons),
        examples: strArray(body.examples),
        payments: str(body.payments),
        email: str(body.email),
        fileUpload: str(body.fileUpload),
        astroIntegration: str(body.astroIntegration),
        cssFramework: str(body.cssFramework),
        uiLibrary: str(body.uiLibrary),
        stateManagement: str(body.stateManagement),
        forms: str(body.forms),
        animation: str(body.animation),
        validation: str(body.validation),
        realtime: str(body.realtime),
        jobQueue: str(body.jobQueue),
        caching: str(body.caching),
        logging: str(body.logging),
        observability: str(body.observability),
        ai: str(body.ai),
        cms: str(body.cms),
        testing: str(body.testing),
        effect: str(body.effect),
        rustWebFramework: str(body.rustWebFramework),
        rustFrontend: str(body.rustFrontend),
        rustOrm: str(body.rustOrm),
        rustApi: str(body.rustApi),
        rustCli: str(body.rustCli),
        rustLibraries: strArray(body.rustLibraries),
        git: bool(body.git),
        packageManager: str(body.packageManager),
        install: bool(body.install),
        cli_version: str(body.cli_version),
        node_version: str(body.node_version),
        platform: str(body.platform),
      });
    } catch (error) {
      console.error("Failed to ingest analytics:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
    return new Response("ok");
  }),
});

export default http;
