# TypeScript — Expand Existing Categories

These are additions to categories that already exist. Status was refreshed against
`packages/types/src/schemas.ts`, `packages/template-generator/templates/`, CLI prompts, and web
builder metadata on 2026-06-30. Only unfinished work remains here.

---

## Analytics

- [ ] Add `posthog` (full platform) — all-in-one: analytics, session replay, feature flags, experiments, error tracking, surveys. Replaces multiple tools.

### Note
PostHog is already a feature flags option. Consider promoting it to analytics category too, or making it a cross-category integration.

---

## Caching (current: upstash-redis)

- [ ] Add `redis` (standalone) — self-hosted Redis. For teams not using Upstash serverless.
- [ ] Add `memcached` — in-memory caching. Simpler than Redis for pure caching use cases.
- [ ] Add `dragonfly` — Redis-compatible, 25x faster. Modern drop-in replacement.

---

## File Storage

- [ ] Add `supabase-storage` — S3-compatible storage with Supabase. Row-level security, CDN, image transformations.

## Database Setup

- [ ] Revisit generated provider setup depth: credentials, branch/database creation hints, and MCP stack-update defaults.

---

## AI SDK (current: vercel-ai, mastra, voltagent, langgraph, openai-agents, google-adk, modelfusion, langchain, llamaindex, tanstack-ai)

- [ ] Add `anthropic-sdk` (direct) — if not already available via vercel-ai. Claude API direct integration.
- [ ] Add `instructor` — structured output extraction from LLMs. Works with any provider. Pydantic-validated responses.

---

## UI Library

- [ ] Add `heroui` — formerly NextUI, rebranded Jan 2025. Growing beyond Next.js. Beautiful defaults.

---

## Data Fetching

- [ ] Decide whether data-fetching should stay addon-shaped or become a dedicated stack graph role alongside TanStack Query.

---

## API

- [ ] Add `effect-http` — Effect-ts as API layer. Type-safe, composable. For `--effect` users. (better-t-stack #815)

---

## Priority Order

1. **Payments depth** — Creem, Autumn, Commet, plus Better Auth payment-plugin wiring.
2. **Generated-project CI quality** — polish the GitHub Actions addon and make generated projects self-checking.
3. **Analytics depth** — decide whether PostHog should exist in analytics as well as feature flags.
4. **Caching expansion** — standalone Redis, Dragonfly, or Memcached if demand justifies more than Upstash.
5. **Supabase Storage** — remaining obvious storage provider gap.
6. **Effect HTTP** — API layer for Effect-heavy stacks.
7. **HeroUI** — revisit naming/compatibility now that `nextui` already exists.
8. **Data-fetching role** — decide whether SWR/TanStack Query should move out of addon semantics.
