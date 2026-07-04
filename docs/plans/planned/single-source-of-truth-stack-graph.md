# Single Source of Truth for the Stack Graph

> **Active design doc — keep this updated as decisions land.**
> Status: **Phase 3 compatibility consolidation shipped; Phase 4 storage/settings cleanup remains**
> Last updated: 2026-07-02

## Active State (read this first)

- **Goal:** Move toward a *single source of truth* for stack configuration so Solo and Multi-Ecosystem creation cannot drift apart.
- **Foundation:** the **stack-graph model** (`packages/types/src/stack-graph.ts`), graph-shaped schemas/compatibility/translation, CLI scoped `--part` parsing/emission, graph threading through the template generator, and the multi-ecosystem web builder redesign are in place. The graph currently lives **alongside** the flat `ProjectConfig` (dual representation); it is not yet the sole source of truth.
- **Direction:** The **graph (`stackParts`) becomes the single source of truth**; the flat `ProjectConfig` becomes a *derived, generator-only projection*. Foundation and compatibility consolidation are in place for promoted graph-owned roles; storage/settings cleanup is the remaining work.
- **Settled decision:** Libraries are **owned by their part** (`ownerPartId`), the same way `orm`/`api`/`auth` already work — not global per-project fields.
- **Storage decision:** `bts.jsonc` stores `stackParts` as the authoritative graph and keeps top-level option fields as a derived compatibility cache for older integrations and simple readers.
- **Constraint:** Neither Solo nor Multi is "legacy." Both are first-class creation modes. (See memory: project-creation-modes.) "Legacy" only ever refers to the flat config *data shape*.

---

## Problem Statement

Today configuration truth lives in two places, and which one is authoritative **flips depending on the creation mode**. That flip is the root drift risk that `compareLegacyConfigToStackParts` was written to detect after the fact instead of preventing.

## Current Reality (grounded in code)

There are **two categories** of configuration data and they behave differently:

### 1. Structural parts — frontend / backend / mobile / database (+ orm / api / auth)

- `legacyProjectConfigToStackParts` (`packages/types/src/stack-graph.ts:584-690`) round-trips **only** these roles.
- Authority **flips by mode**:
  - **Solo:** flat fields (`backend`, `goWebFramework`, …) are authoritative; the graph is derived on read (`apps/cli/src/utils/bts-config.ts` migration).
  - **Multi:** `stackPartSpecs` is authoritative; `stackPatchFromGraphSpecs` (`apps/web/src/components/stack-builder/stack-builder.tsx:521-600`) mirrors the graph back down into the flat fields.
- This mode-dependent flip is the real drift surface. `compareLegacyConfigToStackParts` (`stack-graph.ts:782-814`) exists to catch divergence.

### 2. Libraries — cssFramework / uiLibrary / mobileNavigation / testing / logging / forms / addons / examples / …

- Flat fields in **both** modes; **never** round-tripped through the graph (`legacyProjectConfigToStackParts` does not emit them).
- The CLI appends them as plain flags (`--css-framework scss`) alongside `--part` specs.
- **Schema is already ready:** `StackPartRoleSchema` (`packages/types/src/schemas.ts:11-45`) already defines 30 roles including `css`, `ui`, `testing`, `logging`, `forms`, `validation`, `observability`, `caching`, `stateManagement`, etc. The graph *can* represent libraries as owned parts today — the translation layer just doesn't use those roles.

## Why libraries genuinely differ between modes

- **Solo:** a library has exactly one possible owner (the single ecosystem), so a global flat field like `cssFramework` is unambiguous — it implicitly belongs to "the frontend."
- **Multi:** `cssFramework: "scss"` is ambiguous — does it belong to the TS web frontend, the React Native mobile, or both? A single global field cannot say. The correct home is a `css` part with `ownerPartId` pointing at the specific part it configures.

**Key insight:** This is not "graph vs flat." Structural data has a mode-dependent *owner of truth* (a real drift bug); library data has a representation that is *correct for solo but lossy for multi*. Making libraries **owned parts** turns the per-mode difference into an ownership/rendering detail rather than two separate truths.

## Decisions

| Decision | Choice | Notes |
|---|---|---|
| Source of truth | **Graph (`stackParts`)** | Flat `ProjectConfig` becomes a derived projection. Solo = a one-ecosystem graph with implicit single owners. |
| Library scoping | **Owned by their part** (`ownerPartId`) | Solo writes one owner → collapses to today's behavior. Multi can scope per part. Mirrors how `orm`/`api`/`auth` already work. |
| Mode framing | Both first-class | Neither Solo nor Multi is "legacy." |
| `bts.jsonc` storage | **Graph + derived cache** | `stackParts` is authoritative when present. Top-level fields remain for backward compatibility and are overwritten from the graph on write/read. |

## Target Model (proposed)

1. **Graph is authoritative for everything** — structural parts *and* libraries.
2. **Flat `ProjectConfig` is a pure derived projection** consumed only by the generator/templates. Never stored as authority, never edited directly.
3. **Solo = a graph constrained to one ecosystem** with implicit single owners. Library scoping collapses automatically (one owner → no ambiguity), so today's solo behavior is preserved without special-casing.
4. **Libraries promoted to owned parts** (`css`/`ui`/`testing`/`logging`/… with `ownerPartId`). No global flat-field ambiguity in multi.
5. `compareLegacyConfigToStackParts` stops being a drift guard and becomes (or is replaced by) a pure one-way transform graph → flat view.

## Open Questions (to resolve before implementation)

1. **Solo UI:** Keep editing flat-style fields and translate-through to the graph on write, or re-platform the solo builder onto the graph directly?
2. **Settings shape:** Which final flat-only settings should become graph settings, remain derived cache fields, or stay explicit flat compatibility inputs?
3. **Backward compat:** Which external callers still emit flat fields as new categories are promoted, and where does the flat → graph importer need additional coverage?

## Risks

- **Large surface:** every library category touches the tool registry, compatibility engine, translation layer, both UIs, the CLI flag generator, and the generator.
- **Compatibility duplication:** risk of two compatibility systems (flat `compatibility.ts` vs graph `getStackPartCompatibilityIssue`) drifting — ideally consolidate.
- **URL/state back-compat:** existing shared builder URLs encode flat selections; the importer must keep round-tripping them.
- **Generator coupling:** templates read flat `ProjectConfig`; the derived projection must stay byte-for-byte equivalent to avoid scaffold regressions.

## Remaining Implementation Sketch

- [x] **Phase 3 — Consolidate compatibility:** promoted library, ecosystem, addon/example, deploy, database setup, mobile, Java/.NET/Elixir, and shared backend-service disabled reasons now route through graph candidate checks. Graph-complete bindings are authoritative, so clean graph results no longer fall through to duplicated flat library branches. Global backend locks and intentionally setting-shaped checks remain flat.
- [ ] **Phase 4 — Storage cleanup:** current graph-authoritative cache guards now cover saved config, URL/import paths, MCP previews, stack-update/generated-project updates, reproducible commands, config-file replay, and full history replay. Keep extending those guards as additional categories are promoted, and finish retiring flat-authoritative storage paths.
- [ ] Keep deferred single-option/settings-shaped fields, such as `elixirJson` and Astro/shadcn detail settings, flat until their final graph-settings shape is settled.

## Reference Map (files)

- `packages/types/src/stack-graph.ts` — graph engine, translation (`legacyProjectConfigToStackParts:584`, `stackPartsToLegacyProjectConfigPartial:702`, `compareLegacyConfigToStackParts:782`).
- `packages/types/src/schemas.ts:11-45` — `StackPartRoleSchema` (30 roles, library roles already present).
- `packages/types/src/compatibility.ts` — current flat compatibility engine (UI library / addon / API-frontend matrices).
- `packages/types/src/stack-translation.ts` — URL/UI ↔ ProjectConfig ↔ stackParts translation.
- `apps/web/src/components/stack-builder/stack-builder.tsx:521-600` — `stackPatchFromGraphSpecs` (graph → flat mirror in multi mode).
- `apps/cli/src/utils/bts-config.ts` — persistence + legacy↔graph migration.
- `apps/cli/src/utils/generate-reproducible-command.ts` — flag/`--part` emission.
- `packages/template-generator/src/generator.ts` — `processGraphTemplates`, consumes flat projection per ecosystem.

## Remaining Decisions

- [ ] Decide when the solo builder should edit graph parts directly instead of flat-style fields that translate through to the graph.
- [ ] Decide when the final flat-only settings should become graph settings, remain derived cache fields, or stay explicit flat compatibility inputs.
