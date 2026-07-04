# Python Ecosystem Expansion

Current state: 5 web frameworks (fastapi, django, flask, litestar, starlette), 4 ORMs (sqlalchemy, sqlmodel, tortoise-orm, peewee), 1 validation option (pydantic), 10 AI libs, 3 auth options, 5 task queues, 2 GraphQL options, 3 quality options, plus testing, caching, realtime, observability, and CLI-tool categories.
Only unfinished follow-ups remain below.

Goal: bring Python to feature parity with TypeScript's depth across all backend categories.

---

## Search (new category)

- [ ] Add `meilisearch-python` — official Meilisearch SDK. Fast, typo-tolerant.
- [ ] Add `elasticsearch-py` — official Elasticsearch client. Full-text search at scale.

### Implementation
- New schema: `PythonSearchSchema = z.enum(["meilisearch", "elasticsearch", "none"])`
- Generate search client in `src/app/search.py`

---

## Priority Order

1. **Search category** — Meilisearch/Elasticsearch remain the obvious Python-specific service gap.
2. **Generated-project checks** — exercise `uv sync`, compile/test, and framework-specific route checks for richer combos.
3. **Template depth pass** — verify each existing AI/auth/task/cache/realtime option has meaningful generated usage.
4. **Provider setup docs** — Python-specific env/provider instructions for Redis, OTel, auth, and AI SDKs.
