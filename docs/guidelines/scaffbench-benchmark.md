# ScaffBench Benchmark

Read this when the task involves running ScaffBench, benchmarking a model/CLI, adding a spec, or publishing benchmark results to the site/blog.

ScaffBench measures whether an LLM coding agent can scaffold a **working, correctly-wired fullstack project** from a spec. Each spec describes a target stack; the agent builds it; the harness installs, builds, type-checks, and native-compiles the result, then scores it.

## Layout

- `scripts/scaffbench-v2-lib.ts` — the harness (specs, adapters, scoring, reporting). All logic lives here.
- `scripts/scaffbench-v2.ts` — thin entry point: `bun scripts/scaffbench-v2.ts <flags>`.
- `scripts/scaffbench-v2-lib.test.ts` — harness unit tests. Run after any harness edit: `bun test scripts/scaffbench-v2-lib.test.ts`.
- `scripts/build-scaffbench-2-1-data.ts` — turns raw run out-dirs into the web leaderboard data.
- `benchmarks/{v1,v2,v2.1}/` — committed public result artifacts (summaries only).
- `package.json` → `scaffbench:2*` scripts — convenience wrappers (they inherit the current defaults).

Current suite: **V2.1**, harness version `2.0.0`, 13 core specs.

## Creation paths (how the agent is asked to build)

- **`prompt`** — hand-write the project from scratch, no Better-Fullstack tooling. **THE DEFAULT — the only path we run by default.** Tests raw model capability. The whole committed leaderboard is prompt-only.
- **`mcp`** — drive the Better-Fullstack MCP server. **Opt-in** (`--paths mcp`); not run by default.
- **`cli`** — map requirements to Better-Fullstack CLI flags. **Legacy** — still works, no longer part of the methodology.

`--paths` default is `prompt`. `mcp`/`cli` were the V2 (pre-2026-07) methodology; keep them out of default runs.

## Supported agents / CLIs

The driving CLI is inferred from the **model-id prefix** by `providerForModel()`. Each needs its CLI installed and authenticated.

| Agent | CLI | Model-id prefix / examples | Notes |
| --- | --- | --- | --- |
| Claude Code | `claude` | `opus`, `claude-opus-4-8`, `sonnet` | Default provider. |
| Codex (GPT/o-series) | `codex` | `gpt-5.5`, `o3`, `codex-*` | `runCodex` uses `--ignore-user-config`; effort → `model_reasoning_effort`. |
| opencode | `opencode` | `opencode/*` (free), `opencode-go/*` (paid Go sub), `cloudflare-ai-gateway/*` | `--dangerously-skip-permissions` mandatory (baked in). `opencode models` lists ids. Auth via `opencode auth list`. |
| Kilo Code | `kilo` | `kilo/*` | Same adapter as opencode; also reads `opencode.json`. |
| Antigravity (Gemini) | `agy` | `gemini-3.5-flash`, `gemini-*` | Plain-text output → no token/cost/session data (fields show `—`). Effort is a name suffix, not a flag. |

Adding a new CLI = add a prefix branch to `providerForModel()`, a `runX` adapter, and a `parseXResult`. Lock the routing with a test.

## How to run

Default one-pass run (prompt-only, 13 core specs, default effort, 1 repeat):

```bash
bun scripts/scaffbench-v2.ts --model claude-opus-4-8
```

Per-CLI examples:

```bash
# Claude
bun scripts/scaffbench-v2.ts --model claude-opus-4-8 --out-dir testing/llm-benchmarks/v2/opus48-<date>
# Codex (GPT-5.5)
bun scripts/scaffbench-v2.ts --model gpt-5.5 --efforts high --out-dir testing/llm-benchmarks/v2-codex/gpt55-<date>
# opencode — free tier
bun scripts/scaffbench-v2.ts --model opencode/deepseek-v4-flash-free --out-dir testing/llm-benchmarks/v2-f/<slug>-<date>
# opencode — paid Go subscription
bun scripts/scaffbench-v2.ts --model opencode-go/deepseek-v4-pro --out-dir testing/llm-benchmarks/v2-go/<slug>-<date>
# Kilo Code
bun scripts/scaffbench-v2.ts --model "kilo/nvidia/nemotron-3-super-120b-a12b:free" --out-dir testing/llm-benchmarks/v2-k/<slug>-<date>
# Gemini via Antigravity
bun scripts/scaffbench-v2.ts --model gemini-3.5-flash --efforts high --out-dir testing/llm-benchmarks/v2-gemini/<slug>-<date>
```

Useful flags:

- `--paths prompt|mcp|cli` (comma list) — default `prompt`; add `mcp`/`cli` only for an assisted-path ablation.
- `--specs core` (13 specs, default) | `extended` | comma list of ids. `--list-specs` prints them.
- `--efforts default|low|medium|high|xhigh|max` (comma list).
- `--repeats <n>`, `--out-dir <path>`, `--max-budget-usd <n>` (default 12).
- `--prompt-style explicit|natural` — `natural` is the discovery lane (capabilities described, not libraries named).
- Two-phase: `--generate-only` then later `--validate-existing` (validation is cached by source hash). Re-running the same `--out-dir` resumes safely (completed runs skipped).
- `--quality-gate --doctor-check --route-check` — stricter advisory validation. `--skip-validation` / `--write-matrix-only` for dry structural checks.

Runs are queued per out-dir (`scaffbench:2` scripts inherit this). Never point two runs at the same out-dir concurrently.

## Scoring (headline)

- **Index** (0–100, the rankable composite): 60% macro validation + 25% wired-libs + 15% command discipline.
- **Pass@1** = CORE pass: install + build + typecheck + native compile actually green.
- **Quality** = stricter advisory tier (core + lint/format/test/doctor/route). Formatting never demotes Pass@1.
- **Wired libs** = right libraries actually present in the artifact (deps + imports + files).
- **Inconclusive** (missing toolchain, validation timeout, exhausted budget, no-output crash) is excluded from the pass-rate denominator.

## Publishing results + updating the blog

Publishing a run is a **multi-file** change — do all of it, not just the data:

1. **Commit the summary** under `benchmarks/v2.1/<model-slug>/summary.md` (summaries only, not scaffolded trees).
2. **Update the leaderboard data** `apps/web/src/components/home/scaffbench-2-1-data.ts` via `scripts/build-scaffbench-2-1-data.ts`. **Splice-merge the single new model — do NOT full-regen**: the builder reads gitignored `testing/` artifacts, most of which are gone, so a full regen drops existing rows. Add the model's label to `MODEL_LABELS` if the slug is ugly.
3. **Set the tier correctly.** Leaderboard splits **paid** vs a **"Free tier"** divider. `opencode-go/*` and other subscription models report `cost = $0` but are **paid** — they must land in the paid tier, not the free divider. Only genuinely free ids (`*-free`, `:free`) go under the divider.
4. **Update the blog.** `apps/web/content/blog/scaffbench-2-1.mdx` (and `scaffbench-2.mdx` for the V2 story) carries the narrative — add/adjust the leaderboard section and any "findings" prose when the standings change. A new model is not published until the blog reflects it.

## History

- **V1** — original benchmark. Artifacts in `benchmarks/v1`, built by `scripts/build-scaffbench-data.ts`. Superseded.
- **V2** (2026-06-26) — added the opencode + Kilo Code adapters (4th/5th backends). 5 core specs, ran all **three paths** (mcp/cli/prompt). First free-model study (North-mini, Nemotron). Caught + fixed the vacuous-pass scoring bug (a 0-step run read as 100% Full).
- **V2.1** (2026-06-30 → 07-06) — 13-spec suite; frontier prompt-only specs; Java/Elixir validators; honest-pass fix (Full ⊆ Core). **Prompt-only became the methodology** — the committed leaderboard is 100% `prompt`. Added Codex (GPT), Antigravity (Gemini), and more free models.
- **2026-07-09** — added `opencode-go/*` (paid OpenCode Go subscription) + Cloudflare-gateway routing to `providerForModel()`; made `--paths prompt` the default (mcp opt-in, cli legacy).

## Gotchas

- **opencode/Kilo need `--dangerously-skip-permissions`** (baked into the adapter). Without it, every tool call is auto-rejected in headless mode and the agent scaffolds nothing.
- **Validation timeout doesn't kill the process tree.** A watcher/dev-server-style build (e.g. `ts-svelte-edge-orpc`) can hang a run indefinitely — the 10-min per-step cap never fires. Use a watchdog on `validate.log` mtime (>12 min stall = hang) or exclude the spec. Real fix TODO: detached/process-group kill in `runCommand`.
- **macOS has no `timeout`** — use `gtimeout` or a background-PID kill loop.
- **Cloudflare Workers AI models hang here** (dead/expired token) — uncallable regardless of routing.
- **`build-scaffbench-2-1-data.ts` reads tool-steps from `claude.stdout.json`**, so opencode/kilo runs show `steps = 0` in the data.
- **.NET specs** (`multi-dotnet-ops`, `dotnet-blazor-cqrs`) need the .NET SDK installed, or they score inconclusive.
- **Adding a spec:** calibrate on a WEAK model AND a STRONG model — keep it only if the weak model fails while the strong one passes. Both-pass = saturated, cut it. "Fancy framework" is not "hard spec."
