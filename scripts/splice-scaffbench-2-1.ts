/**
 * Splice new model rows into apps/web/src/components/home/scaffbench-2-1-data.ts
 * WITHOUT regenerating the existing rows.
 *
 * build-scaffbench-2-1-data.ts is a full regenerate that reads every RUN_SOURCES
 * summary — but most of those testing/ dirs are gitignored and gone, so a full
 * regen would silently drop opus/sonnet/spark/gemini/free-tier. This script instead
 * imports the committed data, computes ONLY the new (model,effort) rows below, and
 * merges them in. Same per-cell computation as the build script.
 *
 * Run with `bun run scripts/splice-scaffbench-2-1.ts`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { corePass, fullPass } from "./build-scaffbench-data";
import { extractToolUses, providerForModel } from "./scaffbench-v2-lib";
import {
  SCAFFBENCH21_CELLS as EXISTING_CELLS,
  SCAFFBENCH21_META as EXISTING_META,
  SCAFFBENCH21_MODELS as EXISTING_MODELS,
  SCAFFBENCH21_SPECS as EXISTING_SPECS,
} from "../apps/web/src/components/home/scaffbench-2-1-data";

// hy3 published WITHOUT the two opencode free-tier infra deaths (elixir stalled
// mid-stream, react-native-expo returned 0 bytes — both are endpoint failures,
// not model build failures). The two frontier specs never generated. So hy3 is
// scored only on the 9 specs that genuinely ran.
const HY3_GOOD = [
  "ai-search-workbench",
  "rust-leptos-axum",
  "python-ingestion-api",
  "go-realtime-api",
  "multi-dotnet-ops",
  "ts-svelte-edge-orpc",
  "dotnet-blazor-cqrs",
  "multi-ts-go-grpc",
  "java-spring-jooq-keycloak",
];

// New (model, effort) rows to add. Sol is intentionally excluded for now.
const RUN_SOURCES: { dir: string; specs?: string[] }[] = [
  { dir: "testing/llm-benchmarks/v2-codex/gpt-5-6-luna-medium-2026-07-09" },
  { dir: "testing/llm-benchmarks/v2-codex-terra/gpt-5-6-terra-medium-2026-07-09" },
  { dir: "testing/llm-benchmarks/v2-f/hy3-free-2026-07-09", specs: HY3_GOOD },
];

const MODEL_LABELS: Record<string, string> = {
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gpt-5.6-terra": "GPT-5.6 Terra",
  "opencode/hy3-free": "Hy3",
};

const PATH_ORDER = ["prompt", "mcp", "cli"] as const;
const GATE = /^(lint|format|test|doctor|route)$/i;
const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const W = { macroPass: 0.6, wired: 0.25, cmd: 0.15 };

function prettyModel(model: string): string {
  if (MODEL_LABELS[model]) return MODEL_LABELS[model];
  if (/^gpt/i.test(model)) return model.toUpperCase();
  return model
    .replace(/^claude-/, "")
    .replace(/(\d)-(\d)/g, "$1.$2")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function coreStepCount(result: any): number {
  const steps = result?.validation?.steps ?? {};
  return Object.entries(steps).filter(([k, s]: any) => !GATE.test(k) && s && s.status !== "na")
    .length;
}

type Cell = (typeof EXISTING_CELLS)[number];
type Model = (typeof EXISTING_MODELS)[number];

function computeNew() {
  const models: Model[] = [];
  const cells: Cell[] = [];
  for (const source of RUN_SOURCES) {
    const s = JSON.parse(readFileSync(`${source.dir}/summary.json`, "utf8"));
    const first = s.results[0] ?? {};
    const model: string = first.model ?? s.options.model;
    const effort: string = first.effort ?? s.options.efforts[0];
    const provider = providerForModel(model);
    const modelKey = `${model}|${effort}`;
    const resByCell = new Map(s.results.map((r: any) => [`${r.path}|${r.specId}`, r]));
    const wanted = source.specs ? new Set(source.specs) : null;

    const coreFlags: boolean[] = [];
    const wiredAll: number[] = [];
    const cmdAll: number[] = [];
    for (const c of s.aggregates.bySpecCell) {
      if (wanted && !wanted.has(c.specId)) continue;
      const result: any = resByCell.get(`${c.path}|${c.specId}`);
      let stdout = "";
      try {
        stdout = readFileSync(path.join(result.runDir, "claude.stdout.json"), "utf8");
      } catch {}
      const measurable = coreStepCount(result) > 0;
      const scored = c.scoredRuns > 0 && measurable;
      const core = scored ? corePass(result) : false;
      const cost = c.avgCostUsd && c.avgCostUsd > 0 ? c.avgCostUsd : null;
      cells.push({
        modelKey,
        path: c.path,
        spec: c.specId,
        scored,
        corePass: core,
        fullPass: scored ? fullPass(result) : false,
        wiredPct: c.stackPercent ?? 0,
        cmdPct: c.commandDisciplinePercent ?? 0,
        costUsd: cost,
        outTokens: c.avgOutputTokens && c.avgOutputTokens > 0 ? Math.round(c.avgOutputTokens) : null,
        steps: extractToolUses(stdout).length,
        durationMs: c.medianDurationMs && c.medianDurationMs > 0 ? Math.round(c.medianDurationMs) : null,
      } as Cell);
      if (scored) {
        coreFlags.push(core);
        wiredAll.push(c.stackPercent ?? 0);
        cmdAll.push(c.commandDisciplinePercent ?? 0);
      }
    }
    const coreMacro = coreFlags.length
      ? (100 * coreFlags.filter(Boolean).length) / coreFlags.length
      : 0;
    const sortIndex = Math.round(
      W.macroPass * coreMacro + W.wired * mean(wiredAll) + W.cmd * mean(cmdAll),
    );
    models.push({
      key: modelKey,
      model,
      effort,
      effectiveReasoning: (resByCell.values().next().value as any)?.effectiveReasoning ?? effort,
      provider,
      label: prettyModel(model),
      sortIndex,
    } as Model);
  }
  return { models, cells };
}

function main() {
  const { models: newModels, cells: newCells } = computeNew();
  const newKeys = new Set(newModels.map((m) => m.key));

  // Merge: keep every existing row whose key we are not replacing, add the new ones.
  const models = [...EXISTING_MODELS.filter((m) => !newKeys.has(m.key)), ...newModels];
  const cells = [...EXISTING_CELLS.filter((c) => !newKeys.has(c.modelKey)), ...newCells];

  // Re-sort exactly like the build script: models by index desc; cells by model
  // rank, then path order, then the canonical spec order.
  models.sort((a, b) => b.sortIndex - a.sortIndex);
  const modelRank = new Map(models.map((m, i) => [m.key, i]));
  const specIds = [...EXISTING_SPECS];
  cells.sort(
    (a, b) =>
      modelRank.get(a.modelKey)! - modelRank.get(b.modelKey)! ||
      PATH_ORDER.indexOf(a.path as any) - PATH_ORDER.indexOf(b.path as any) ||
      specIds.indexOf(a.spec) - specIds.indexOf(b.spec),
  );

  const out = `// AUTO-GENERATED from the ScaffBench V2.1 run summaries (see scripts/build-scaffbench-2-1-data.ts,
// spliced by scripts/splice-scaffbench-2-1.ts). V2.1 is the expanded 13-spec suite.
import type { ScaffbenchCell, ScaffbenchModel } from "./scaffbench-2-data";

export const SCAFFBENCH21_META = ${JSON.stringify(EXISTING_META, null, 2)} as const;

export const SCAFFBENCH21_SPECS = ${JSON.stringify(specIds)} as const;

export const SCAFFBENCH21_MODELS: readonly ScaffbenchModel[] = ${JSON.stringify(models, null, 2)};

export const SCAFFBENCH21_CELLS: readonly ScaffbenchCell[] = ${JSON.stringify(cells, null, 2)};
`;
  const target = "apps/web/src/components/home/scaffbench-2-1-data.ts";
  writeFileSync(target, out);
  console.error(
    `Wrote ${target}: ${models.length} models (${newModels.length} new), ${cells.length} cells`,
  );
  for (const m of newModels) {
    const mc = newCells.filter((c) => c.modelKey === m.key && c.path === "prompt");
    const scored = mc.filter((c) => c.scored);
    const pass = scored.filter((c) => c.corePass);
    console.error(
      `  + ${m.label} (${m.effort}): ${pass.length}/${scored.length} pass, index ${m.sortIndex}`,
    );
  }
}

main();
