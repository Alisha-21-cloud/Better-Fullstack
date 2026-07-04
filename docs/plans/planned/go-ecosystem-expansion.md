# Go Ecosystem Expansion

Current state: 4 web frameworks (gin, echo, fiber, chi), 3 ORMs (gorm, sqlc, ent), 2 API layers (grpc-go, gqlgen), 3 CLI tools (cobra, bubbletea, urfave-cli), 4 logging options (zap, zerolog, slog, logrus), 3 auth options (casbin, jwt, goth), testing, realtime, messaging, caching, config, and observability categories.
Only unfinished follow-ups remain below.

Goal: bring Go to feature parity with TypeScript's depth across all backend categories.

---

## Web Frameworks

- [ ] Add `stdlib` (net/http) — Go 1.22+ pattern routing makes the standard library viable without any framework. Offer as a "no framework" option.

### Files to touch
- `packages/types/src/schemas.ts` — add values to `GoWebFrameworkSchema`
- `packages/types/src/option-metadata.ts` — add labels
- `apps/cli/src/prompts/go-ecosystem.ts` — add prompt options
- `apps/web/src/lib/constant.ts` — add builder entries
- `packages/template-generator/templates/go-base/cmd/server/` — add framework-specific main.go and handler patterns

---

## ORMs / Database

- [ ] Add `bun` — lightweight, PostgreSQL-focused ORM with SQL-shaped query builder. Less overhead than GORM.

### Files to touch
- `packages/types/src/schemas.ts` — add to `GoOrmSchema`
- `packages/template-generator/templates/go-base/internal/database/` — add Ent schema definitions and Bun setup

---

## Search (new category)

- [ ] Add `meilisearch-go` — official Go SDK for Meilisearch. Fast, typo-tolerant.
- [ ] Add `bleve` — full-text search library in pure Go. Embedded, no external service needed.

### Implementation
- New schema: `GoSearchSchema = z.enum(["meilisearch", "bleve", "none"])`
- Generate search client in `internal/search/`

---

## Priority Order

1. **stdlib `net/http` framework option** — only web-framework addition still called out here.
2. **Bun ORM/query builder** — decide if it is worth adding beside GORM, SQLC, and Ent.
3. **Search category** — Meilisearch/Bleve or a shared search projection for Go.
4. **Generated-project quality checks** — run `go test` / `go build` coverage for richer option combinations.
5. **Template depth pass** — make sure existing categories include meaningful usage, not just deps.
