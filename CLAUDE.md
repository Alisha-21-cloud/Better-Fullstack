# CLAUDE.md

Canonical agent instructions live in [`AGENTS.md`](./AGENTS.md). This file exists so Claude Code loads those instructions automatically.

Read `AGENTS.md` for all project conventions, guidelines, and workflow rules.

## Code Style

- Always strive for concise, simple solutions.
- If a problem can be solved in a simpler way, propose it.

## General preferences

- If asked to do too much work at once, stop and state that clearly.
- If computer use is helpful for completing or verifying work, shell out to gpt-5.6 with Codex for it.

## Picking the right models for workflows and subagents

Rankings, higher = better. Cost reflects what I actually pay (OpenAI is near-free for me due to a deal), not list price. Intelligence is how hard a problem you can hand the model unsupervised. Taste covers UI/UX, code quality, API design, and copy.

| model         | cost | intelligence | taste |
|---------------|------|--------------|-------|
| gpt-5.6-sol   | 9    | 9            | 6     |
| gpt-5.6-terra | 9    | 8            | 5     |
| gpt-5.6-luna  | 9    | 7            | 5     |
| sonnet-5      | 5    | 5            | 7     |
| opus-4.8      | 4    | 7            | 8     |
| fable-5       | 2    | 9            | 9     |

GPT-5.6 tier notes (GPT-5.5 is retired — don't use it):

- **Sol** — the GPT flagship. Frontier-level agentic coding (Terminal-Bench 88.8%, ~Mythos 5 level); writes tight, restrained code. Use for hard unsupervised problems where taste doesn't matter. Supports `max` and `ultra` reasoning efforts (`ultra` spawns subagents — always pair with `rollout_token_budget`). Taste improved over 5.5 but still below Fable/Opus — user-facing work stays on Claude models.
- **Terra** — the everyday workhorse, GPT's sonnet-5 equivalent (but smarter: ≈GPT-5.5 level). Use for routine well-specified implementation and mid-weight investigation where Sol is overkill. Since my OpenAI cost is flat, Terra's cost advantage over Sol is irrelevant — its niche is mostly rate-limit headroom.
- **Luna** — smallest and fastest tier. Beats Opus 4.8 on agentic coding (82.5% vs 78.9% Terminal-Bench) but weaker on open-ended reasoning. Default for bulk mechanical work: migrations, sweeps across many files, data grinding, cheap first-pass verification — anywhere throughput/latency matters more than depth.

How to apply:

- These are defaults, not limits. You have standing permission to override them: if a chosen model's output doesn't meet the bar, rerun or redo the work with a smarter model without asking. Judge the output, not the price tag. Escalating costs less than shipping mediocre work.
- Cost is a tie-breaker only: when axes conflict for anything that ships, intelligence > taste > cost.
- Don't let cost prevent you from using the right model for the job. Instead, take advantage of cheaper options to get more information and try things before moving the work to a more expensive option.
- Bulk/mechanical work (clear-spec implementation, data analysis, migrations): gpt-5.6-luna — effectively free and fastest. Escalate to terra when the spec has ambiguity, sol when it's genuinely hard.
- Anything user-facing (UI, copy, API design) needs taste ≥ 7.
- Reviews of plans/implementations: fable-5 or opus-4.8, optionally gpt-5.6-sol as an extra independent perspective.
- Never use Haiku.
- Mechanics: GPT models are only reachable through the Codex CLI — `codex exec` / `codex review` (my ~/.codex/config.toml defaults to gpt-5.6-sol). Pick a tier per call with `codex exec -m gpt-5.6-luna|terra|sol`. Use the codex-implementation, codex-review, and codex-computer-use skills; for work they don't cover (investigation, data analysis), run `codex exec -s read-only` directly with a self-contained prompt.
- Claude models (sonnet-5, opus-4.8, fable-5) run via the Agent/Workflow model parameter.

Using GPT-5.6 inside workflows and subagents (the model parameter only takes Claude models, so use a wrapper):

- Spawn a thin Claude wrapper agent with `model: 'sonnet', effort: 'low'` whose prompt instructs it to write a self-contained codex prompt, run `codex exec` via Bash, and return the report (use `schema` on the wrapper to get structured output back).
- Always label these agents with the real worker tier as prefix, e.g. `{label: 'gpt-5.6-sol:review-auth'}` or `{label: 'gpt-5.6-luna:migrate-batch-3'}` — the workflow UI shows the wrapper's Claude model, so the label is the only indication of the actual GPT model.
- Codex runs can exceed Bash's 10-minute timeout: pass an explicit timeout, or run in the background and poll for the report file.
- Parallel GPT implementation agents must use `isolation: 'worktree'` so codex edits don't collide in the shared checkout.
- Workflow token budgets only count Claude tokens; codex work is free and invisible to `budget.spent()`.