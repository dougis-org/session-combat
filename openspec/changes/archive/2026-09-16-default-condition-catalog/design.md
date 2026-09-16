## Context

- Relevant architecture:
  - Storage follows a per-domain repo pattern: `lib/storage/<domain>Repo.ts` files own their `db.collection<T>("name")` calls, each wrapped in `runStorageOp({ name, collection, isEmpty? }, fn)` (`lib/storage/runOp.ts`) for consistent error/telemetry handling. `lib/storage.ts` is a thin façade re-exporting repo functions (e.g. `loadGlobalMonsterTemplates` → `monsterTemplateRepo.loadGlobalMonsterTemplates`).
  - Global/admin-controlled reference data (e.g. `monsterTemplates` with a `GLOBAL_USER_ID` sentinel, campaign templates) is precedent for a shared, non-per-user collection.
  - Collection index/setup lives in `lib/db.ts` (`initializeDatabase`), which runs on first connect.
  - Seed scripts live in `lib/scripts/` (e.g. `seedCampaignTemplates.ts`, `seedGlobalMonsters.ts`) and are invoked via a CLI entry (`runCli`).
  - API routes under `app/api/**/route.ts` use `withAuth`/`withAuthAndParams` wrappers and call into `storage.*`.
  - UI: `lib/components/combatant-card/ConditionFormModal.tsx` (add-condition form), `ConditionControls.tsx` (expand/collapse list + remove), both driven by `StatusCondition` (`lib/types.ts:522`) and `CombatantCard.tsx` (composition root, owns `addConditionOpen` state).
- Dependencies: MongoDB (existing `lib/db.ts` connection), no new external packages.
- Interfaces/contracts touched:
  - New `StatusConditionCatalogEntry` type (name + description).
  - New `lib/storage/conditionCatalogRepo.ts` + `storage.loadConditionCatalog()` façade method.
  - New `GET /api/conditions/catalog` route (read-only, requires auth like other data routes — no new admin-write route in this change).
  - `ConditionFormModal` props/behavior change: consumes the catalog list instead of only free text.
  - `StatusCondition.description` becomes populated (previously always `''`).

## Goals / Non-Goals

### Goals

- Store the 15 standard D&D 5e conditions (name + SRD description) in a new MongoDB collection, seeded once via script.
- Let a DM pick a condition from a dropdown sourced from that collection, or choose "Custom…" to fall back to today's free-text entry.
- Show each applied condition's description inline in the existing collapsed "Conditions (N)" list — no tooltip, no badge/chiclet component.
- Degrade gracefully to "Custom only" if the catalog is empty/unreachable.

### Non-Goals

- Admin UI to edit/add catalog entries.
- Mechanical enforcement of condition effects.
- Changes to `CombatInfoIcon`'s tooltip.
- Per-user/per-campaign catalogs.

## Decisions

### Decision 1: New `conditionCatalog` collection + repo, following the existing per-domain repo pattern

- Chosen: Add `lib/storage/conditionCatalogRepo.ts` exporting `loadConditionCatalog(): Promise<StatusConditionCatalogEntry[]>`, backed by `db.collection<StatusConditionCatalogEntry>("conditionCatalog")`, wrapped in `runStorageOp({ name: "loadConditionCatalog", collection: "conditionCatalog", isEmpty: (res) => res.length === 0 })`. Expose it from `lib/storage.ts` as `storage.loadConditionCatalog()`, matching `loadGlobalMonsterTemplates`'s shape (no `userId` param — this is a single global collection, not scoped by `GLOBAL_USER_ID` since it isn't user-editable data at all).
- Alternatives considered:
  - Hardcoded TS constant (`lib/constants/conditions.ts`): rejected per explicit proposal requirement — a DB-backed catalog can be corrected without a deploy.
  - Reusing `monsterTemplates`-style `GLOBAL_USER_ID` scoping: rejected — that pattern exists to let global and per-user rows share one collection/shape; conditions have no per-user variant, so a dedicated collection with no `userId` field is simpler and avoids implying user-owned rows exist.
- Rationale: Matches established repo/façade/runStorageOp conventions so this change reads like existing code, not a new pattern.
- Trade-offs: One more collection + index bootstrap entry to maintain; acceptable given it's read-only and rarely changes shape.

### Decision 2: Seed via script, not runtime auto-seed

- Chosen: `lib/scripts/seedConditionCatalog.ts` (mirrors `seedGlobalMonsters.ts`/`seedCampaignTemplates.ts` shape: idempotent upsert by condition `name`, `runCli()` entry point). Document running it as a one-time setup/deploy step in `tasks.md`.
- Alternatives considered: Auto-seed on first `loadConditionCatalog()` call if the collection is empty. Rejected — adds write-on-read complexity and a race between concurrent first-reads; the project's existing precedent (monsters, campaign templates) is explicit script-based seeding.
- Rationale: Consistent with existing seeding precedent; keeps the read path simple and side-effect-free.
- Trade-offs: A fresh environment (new dev DB, new deploy target) sees an empty catalog until someone runs the seed script — mitigated by Decision 4's graceful-empty UI.

### Decision 3: Dropdown + "Custom…" in `ConditionFormModal`, catalog fetched once per modal open

- Chosen: `ConditionFormModal` fetches `GET /api/conditions/catalog` when it mounts (modal is only rendered while `addConditionOpen` is true, so this is on-demand, not on every card render). Render a `<select>` of catalog entries by name plus a trailing "Custom…" option. Selecting a catalog entry sets `name` + `description` from that entry (locked, not editable) and keeps the existing duration input. Selecting "Custom…" reveals today's free-text name input (`parseConditionForm` validation unchanged) with `description: ''`.
- Alternatives considered:
  - Fetch catalog once at a higher level (e.g. `CombatantCard` or a page-level context) and pass down: rejected for this change's scope — every card would need the same data plumbed through props; a small, infrequently-opened modal fetching its own reference data is simpler and consistent with the modal already owning its local form state.
  - Client-side caching (SWR/react-query): no such library is in use elsewhere in this codebase for simple reference lookups; a plain `fetch` in a `useEffect` matches existing patterns and avoids introducing a new dependency for one call.
- Rationale: Keeps the change localized to the modal that already owns condition-creation UI; avoids new global state.
- Trade-offs: Each modal open re-fetches the catalog (no caching). Acceptable — this is a small (~15-row), infrequently-opened, cheap read; can be revisited if usage patterns show otherwise.

### Decision 4: Graceful empty/error catalog state

- Chosen: If the fetch fails or returns zero entries, the dropdown is skipped/hidden and the form falls back directly to the existing free-text ("Custom") input, with a small muted note ("No default conditions loaded — enter a custom one.") so the empty state is visibly intentional, not a rendering bug.
- Alternatives considered: Block condition entry entirely until the catalog loads. Rejected — proposal explicitly requires the feature not lock out condition tracking.
- Rationale: Matches proposal's edge-case requirement; a DM must always be able to add *some* condition.
- Trade-offs: None significant — this is the safe default already implied by keeping "Custom" as a fallback path.

### Decision 5: `ConditionControls` renders description inline, only when non-empty

- Chosen: In the expanded "Conditions (N)" list row, add a second line under the name/duration span showing `condition.description` in smaller/muted text, rendered only `{condition.description && (...)}` — so custom conditions (description `''`) add no extra line/height.
- Alternatives considered: Always reserve a description line (empty string renders as blank space) for visual consistency. Rejected — proposal flagged card-height growth as a risk; suppressing the empty case keeps custom-condition rows exactly as compact as today.
- Rationale: Matches the proposal's explicit choice ("info section... rather than mouse-over") and its stated risk mitigation.
- Trade-offs: Rows for catalog vs. custom conditions have slightly different heights within the same list — acceptable, minor visual inconsistency.

## Proposal to Design Mapping

- Proposal element: New MongoDB collection storing the default condition catalog
  - Design decision: Decision 1
  - Validation approach: Unit test for `conditionCatalogRepo.loadConditionCatalog()` against an in-memory/test Mongo instance (existing test DB harness), asserting shape and `isEmpty` telemetry hook.
- Proposal element: Seed script/data for the 15 standard conditions
  - Design decision: Decision 2
  - Validation approach: Unit test for the seed script's idempotency (running twice yields 15 rows, not 30); manual/CI verification the script exits 0.
- Proposal element: Read API/route to fetch the catalog
  - Design decision: Decision 1
  - Validation approach: Route-level test (existing `app/api/**` test conventions) asserting 200 + correct shape for an authenticated request.
- Proposal element: Dropdown + "Custom…" fallback in `ConditionFormModal`
  - Design decision: Decisions 3, 4
  - Validation approach: Component tests (`tests/unit/components/combatant-card/ConditionFormModal.test.tsx`, already exists) covering: catalog populated → selecting an entry sets description; "Custom…" selected → free-text path unchanged; fetch failure/empty catalog → falls back to custom-only with the muted note.
- Proposal element: Populate `StatusCondition.description` from catalog pick
  - Design decision: Decision 3
  - Validation approach: Same `ConditionFormModal` tests; assert `onSubmit` payload includes the catalog entry's `description` verbatim.
- Proposal element: `ConditionControls` expanded list shows description inline
  - Design decision: Decision 5
  - Validation approach: `tests/unit/components/combatant-card/ConditionControls.test.tsx` (already exists) — add cases for description present vs. empty.

## Functional Requirements Mapping

- Requirement: DM can select a standard condition from a dropdown and have its description auto-populated.
  - Design element: Decision 3
  - Acceptance criteria reference: specs/condition-catalog/spec.md (to be authored) — "Scenario: Selecting a catalog condition populates its description"
  - Testability notes: Component test with a mocked catalog fetch response.
- Requirement: DM can still add a custom, free-text condition with no description.
  - Design element: Decisions 3, 4
  - Acceptance criteria reference: specs/condition-catalog/spec.md — "Scenario: Custom condition entry unchanged"
  - Testability notes: Reuse existing `parseConditionForm` unit tests; add a modal-level test selecting "Custom…" explicitly.
- Requirement: Expanded conditions list on the combatant card shows each condition's description when one exists.
  - Design element: Decision 5
  - Acceptance criteria reference: specs/condition-catalog/spec.md — "Scenario: Description shown inline for catalog conditions" / "Scenario: No description line for custom conditions"
  - Testability notes: `ConditionControls` component test asserting presence/absence of the description text node.
- Requirement: Feature does not block condition entry when the catalog is empty or fails to load.
  - Design element: Decision 4
  - Acceptance criteria reference: specs/condition-catalog/spec.md — "Scenario: Catalog fetch failure falls back to custom entry"
  - Testability notes: Component test mocking a rejected/empty fetch.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: A catalog read failure must not throw an unhandled error into the modal or crash the combatant card.
  - Design element: Decision 4 (fetch failure handled locally in the modal, same `try/catch` discipline `runStorageOp` already applies server-side).
  - Acceptance criteria reference: specs/condition-catalog/spec.md — "Scenario: Catalog fetch failure falls back to custom entry"
  - Testability notes: Mock `fetch` to reject; assert modal still renders and Add still works via Custom.
- Requirement category: security
  - Requirement: Catalog entries read from MongoDB (an external-ish, DB-sourced trust boundary) must not inject unexpected markup/fields into the rendered UI.
  - Design element: Repo/route return only the typed `{ name, description }` shape (no pass-through of arbitrary DB fields); React's default text rendering (no `dangerouslySetInnerHTML`) escapes content in both the dropdown and the inline description line.
  - Acceptance criteria reference: specs/condition-catalog/spec.md — "Scenario: Catalog entry fields are rendered as plain text"
  - Testability notes: Route test asserting the response is limited to the typed fields even if the stored document has extra keys; component test with a description containing HTML-like text, asserting it renders literally (no injected elements).
- Requirement category: performance
  - Requirement: Catalog fetch must not noticeably delay opening the Add Condition modal.
  - Design element: Decision 3 — catalog is ~15 small rows, fetched only when the modal opens, not on every card render; no blocking of modal render (loading state shows the form immediately, dropdown populates when the fetch resolves).
  - Acceptance criteria reference: specs/condition-catalog/spec.md — "Scenario: Modal is usable while catalog is loading"
  - Testability notes: Component test asserting the free-text/Custom path is available before the mocked fetch resolves.

## Risks / Trade-offs

- Risk/trade-off: No caching of the catalog fetch (Decision 3) means repeated network calls per modal open across a session.
  - Impact: Minor, avoidable extra requests; negligible given catalog size and modal-open frequency.
  - Mitigation: Revisit with a simple module-level cache if telemetry/user feedback shows it matters; out of scope for this change.
- Risk/trade-off: Empty catalog in a freshly provisioned environment until the seed script is run (Decision 2).
  - Impact: Feature silently degrades to "Custom only" with no catalog options.
  - Mitigation: Decision 4's explicit empty-state note; document the seed step clearly in `tasks.md` and in deploy runbook notes.
- Risk/trade-off: Two visual heights for "Conditions (N)" rows depending on whether a description exists (Decision 5).
  - Impact: Minor cosmetic inconsistency within one list.
  - Mitigation: Accepted per proposal's explicit height-risk mitigation (no line rendered when empty).

## Rollback / Mitigation

- Rollback trigger: Catalog fetch causing UI errors/regressions in `ConditionFormModal`, or the new collection/seed step blocking a deploy.
- Rollback steps: Revert the `ConditionFormModal`/`ConditionControls` UI changes (feature-flag-free, plain code revert since this is additive to existing free-text behavior); the new `conditionCatalog` collection and repo can remain unused/dormant without harming other code paths (no other feature depends on it). No destructive migration was performed on `StatusCondition` data, so no data rollback is needed.
- Data migration considerations: None — `StatusCondition.description` already exists on the type and was already always `''`; this change only starts populating it for new catalog-based entries. No backfill of existing combatants' already-applied conditions.
- Verification after rollback: Existing `ConditionFormModal`/`ConditionControls` test suites pass unchanged; manual smoke test of adding a free-text condition still works.

## Operational Blocking Policy

- If CI checks fail: Fix the failing tests/lint/build before merging; do not bypass with `--no-verify` or skip flags (per project conventions).
- If security checks fail (Codacy/Verity): Treat as blocking; if a finding is a confirmed false positive, use the project's `verity feedback finding` process rather than waiving; only waive with an explicit human-approved reason per `CLAUDE.md`'s quality-gate policy.
- If required reviews are blocked/stale: Do not merge via admin bypass (per project's "No admin merge bypass" convention); ping for review or address requested changes.
- Escalation path and timeout: Flag to Doug (project owner) if blocked more than one work session; no automated timeout/escalation exists in this repo's workflow beyond human follow-up.

## Open Questions

- Should "Custom…" conditions optionally support a free-text description field? (Carried from proposal.md; not a blocker — default is description-less, matching current behavior.)
