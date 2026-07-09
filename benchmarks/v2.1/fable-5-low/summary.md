# ScaffBench 2 Run

Harness: 2.0.0
Agent: Claude Code (single agent; single model family per row)
Specs: ai-search-workbench, rust-leptos-axum, python-ingestion-api, go-realtime-api, multi-dotnet-ops, ts-svelte-edge-orpc, dotnet-blazor-cqrs, multi-ts-go-grpc, java-spring-jooq-keycloak, elixir-broadway-absinthe, react-native-expo, frontier-polyglot-proto, frontier-effect-eventsourcing
Repeats: 1
Prompt style: explicit

## Path × effort summary

This is an ablation across creation paths and reasoning effort for one agent
(Claude Code), not a cross-vendor leaderboard. Pass rate is over *scored* runs:
infra-inconclusive runs (missing toolchain, validation timeout, exhausted token
budget, or a crash with no output) are excluded from the denominator.

"Pass@1" is the CORE pass rate — install + build + typecheck + native compile,
i.e. does the project actually build and run. "Quality" is the stricter advisory
tier (core + lint/format/test/doctor/route): a project can be Pass@1-green but
Quality-red because it is mis-formatted or a style-lint warns. Formatting is a
quality metric, never a brokenness verdict, so it does not move Pass@1. "Wired
libs" is scored from the generated artifact (deps + imports + files);
"Faithful" is the assisted-path bts.jsonc-vs-requested diagnostic.

Reliability is reported per spec, not pooled: "Macro" is the mean of per-spec
pass rates; "pass@k" counts specs solved on at least one repeat and "pass^k"
specs solved on every repeat. The Wilson "CI95" is shown only when a cell has
≥ 8 scored runs (below that it reads `n<8`, since e.g. 3/3 and 0/3
intervals overlap and the interval is not informative).

"Index" is the single rankable 0-100 composite the table is sorted by:
60% macro validation + 25% wired-libs + 15% command discipline,
weighted toward the least saturated signal. Latency is median / p95 (wall-clock
moves with provider load, so the mean alone is misleading over small samples).

| Model | Effort | Effective reasoning | Path | Index | Pass@1 | Quality | Inconclusive | Macro | pass@k | pass^k | CI95 | Wired libs | Faithful | Acceptance | Command discipline | Median / p95 | Avg output tokens | Avg cost | Failure tags |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
claude-fable-5 | low | low | prompt | 66 | 6/13 | 31% | 0 | 46% | 6/13 | 6/13 | 46% (23-71) | 95% | — | — | 100% | 232.6s / 379.7s | 21959 | 2.119 | lint-failed:3, typecheck-failed:2, validation-failed:7, build-failed:5, stack-mismatch:5, install-failed:1

## Runs

| Spec | Trial | Effort | Effective reasoning | Model | Path | Validation | Failure tags | Claude exit | Time | Output tokens | Cost | Wired % | Wired | Faithful | Acceptance | Install | Build | Typecheck | Lint | Test | Validation cache |
| --- | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
ai-search-workbench | 1 | low | low | claude-fable-5 | prompt | fail | lint-failed, typecheck-failed, validation-failed | 0 | 379.7s | 38256 | 3.313 | 100 | 21/21 | — | — | 0 | 0 | 2 | 1 |  | miss
rust-leptos-axum | 1 | low | low | claude-fable-5 | prompt | fail | build-failed, stack-mismatch, validation-failed | 0 | 195.7s | 19606 | 1.798 | 92 | 11/12 | — | — |  | 101 |  |  |  | miss
python-ingestion-api | 1 | low | low | claude-fable-5 | prompt | pass |  | 0 | 164.5s | 13487 | 1.456 | 100 | 13/13 | — | — | 0 |  | 0 |  |  | miss
go-realtime-api | 1 | low | low | claude-fable-5 | prompt | fail | install-failed, validation-failed | 0 | 324.1s | 29074 | 2.917 | 100 | 13/13 | — | — | 1 |  |  |  |  | miss
multi-dotnet-ops | 1 | low | low | claude-fable-5 | prompt | pass | lint-failed, stack-mismatch | 0 | 243.1s | 23866 | 2.168 | 92 | 12/13 | — | — | 0 | 0 |  | 1 |  | miss
ts-svelte-edge-orpc | 1 | low | low | claude-fable-5 | prompt | fail | build-failed, validation-failed | 0 | 217.7s | 17376 | 1.872 | 100 | 10/10 | — | — | 0 | 2 |  |  |  | miss
dotnet-blazor-cqrs | 1 | low | low | claude-fable-5 | prompt | fail | build-failed, validation-failed | 0 | 257.2s | 25914 | 2.316 | 100 | 13/13 | — | — | 0 | 1 |  |  |  | miss
multi-ts-go-grpc | 1 | low | low | claude-fable-5 | prompt | pass | stack-mismatch | 0 | 232.6s | 22892 | 2.141 | 88 | 14/16 | — | — | 0 |  |  |  |  | miss
java-spring-jooq-keycloak | 1 | low | low | claude-fable-5 | prompt | pass |  | 0 | 239.1s | 20442 | 2.180 | 100 | 14/14 | — | — | 0 | 0 |  |  |  | miss
elixir-broadway-absinthe | 1 | low | low | claude-fable-5 | prompt | pass |  | 0 | 367.9s | 34769 | 3.103 | 100 | 13/13 | — | — | 0 | 0 |  |  |  | miss
react-native-expo | 1 | low | low | claude-fable-5 | prompt | pass | lint-failed, stack-mismatch | 0 | 161.8s | 12551 | 1.428 | 88 | 7/8 | — | — | 0 |  | 0 | 127 |  | miss
frontier-polyglot-proto | 1 | low | low | claude-fable-5 | prompt | fail | build-failed, stack-mismatch, validation-failed | 0 | 127.9s | 10177 | 1.146 | 75 | 3/4 | — | — | 0 | 2 |  |  |  | miss
frontier-effect-eventsourcing | 1 | low | low | claude-fable-5 | prompt | fail | build-failed, typecheck-failed, validation-failed | 0 | 217.4s | 17059 | 1.708 | 100 | 4/4 | — | — | 0 | 2 | 2 |  |  | miss
