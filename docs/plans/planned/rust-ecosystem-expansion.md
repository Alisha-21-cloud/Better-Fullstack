# Rust Ecosystem Expansion

Current state: 3 web frameworks (axum, actix-web, rocket), 2 WASM frontends (leptos, dioxus), 3 ORMs (sea-orm, sqlx, diesel), 2 API layers (tonic, async-graphql), 2 CLI tools (clap, ratatui), expanded core libraries, logging, error handling, caching, auth, realtime, message queue, observability, and templating categories.
Only unfinished follow-ups remain below.

Goal: bring Rust to feature parity with TypeScript's depth across all backend categories.

---

## Web Frameworks

- [ ] Add `loco` — "Rails of Rust". Built-in ORM, migrations, CLI, templating. Fastest-growing Rust web framework. Ideal for CRUD-heavy scaffolding.
- [ ] Add `poem` — built on hyper/tokio, simpler API than Axum, lightweight. Good middle ground.

### Files to touch
- `packages/types/src/schemas.ts` — add values to `RustWebFrameworkSchema`
- `packages/types/src/option-metadata.ts` — add labels
- `apps/cli/src/prompts/rust-ecosystem.ts` — add prompt options
- `apps/web/src/lib/constant.ts` — add builder entries with icons/descriptions
- `packages/template-generator/templates/rust-base/` — add framework-specific templates

---

## Message Queues (new category)

- [ ] Add `rdkafka` — Rust wrapper for librdkafka (Apache Kafka). Production-grade event streaming.

### Implementation
- Current schema: `RustMessageQueueSchema = z.enum(["lapin", "none"])`
- Generate queue consumer/producer scaffolding

---

## Priority Order

1. **Loco or Poem** — decide whether either framework deserves first-class support beside Axum/Actix/Rocket.
2. **Kafka (`rdkafka`)** — remaining event-streaming candidate after RabbitMQ/Lapin.
3. **Generated-project checks** — expand `cargo check`/tests over richer Rust option combinations.
4. **Template depth pass** — verify existing Torii/Lapin/Askama/Tera/OTel choices include meaningful generated usage and docs.
