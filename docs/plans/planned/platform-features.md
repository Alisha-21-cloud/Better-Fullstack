# Platform Features

CLI-level and DX improvements that go beyond adding libraries. This file tracks the remaining
platform and DX work.

---

## Post-Scaffold Upgrade Engine

The next major platform feature is `bfs update` / `bfs check`: diff-aware template re-application
against an existing `bts.jsonc` stack, with reviewable file changes and CI drift checks.

- [ ] Record enough scaffold metadata to know the generator/template version used
- [ ] Compare current generated output against the latest template output without overwriting user code
- [ ] Produce a reviewable patch or update plan
- [ ] Add a CI-friendly `bfs check` mode that reports template drift
- [ ] Share conflict detection with MCP stack-update apply logic

---

## Doctor / Health Command

Turn the existing verification and ScaffBench learnings into a local command users can run inside a
generated project.

- [ ] Add `bfs doctor` or `create-better-fullstack doctor --project-dir`
- [ ] Validate `bts.jsonc`, dependency/package-manager consistency, required env vars, and generated scripts
- [ ] Run the narrowest generated-project checks available for the selected ecosystem
- [ ] Return structured JSON for agents and CI

---

## Public Verified-Combination Status

Better Fullstack now has a generated markdown status artifact at `docs/verified-combinations.md`, a
public docs page at `/docs/reference/verified-combinations`, a Shields-compatible badge endpoint at
`/api/verified-combinations`, and source/owner/rerun links for each evidence surface.

- [x] Generate a status artifact from smoke/ScaffBench/release results
- [x] Publish a verified-combinations page
- [x] Add a verified-combinations badge endpoint
- [x] Make failures actionable by linking source artifacts, rerun commands, and owning template/test areas

---

## Priority Order (remaining)

1. **Post-scaffold upgrade engine** — next major moat feature
2. **Doctor / health command** — agent-friendly generated-project diagnostics
3. **Prompt-to-stack builder assistant** — natural language to validated stack
