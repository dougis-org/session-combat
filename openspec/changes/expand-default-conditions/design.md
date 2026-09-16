## Context

- Relevant architecture: `lib/data/conditionCatalog.ts` exports `CONDITION_CATALOG: StatusConditionCatalogEntry[]` (a static, hand-authored array of `{ name, description }`). `lib/scripts/seedConditionCatalog.ts` reads that array and upserts each entry into the `conditionCatalog` MongoDB collection by `name`, logging insert vs. update counts. `lib/storage/conditionCatalogRepo.ts` (`loadConditionCatalog`) reads the collection and projects each document down to `{ name, description }` only, stripping `_id` and any other fields. `app/api/conditions/catalog/route.ts` exposes that repo read-only behind authentication. UI: `ConditionFormModal`/`ConditionControls` render the catalog as quick-pick options on combatant cards.
- Dependencies: MongoDB (`conditionCatalog` collection); no external services.
- Interfaces/contracts touched: none change. `StatusConditionCatalogEntry` (`{ name: string; description: string }`) is unchanged. The catalog API response shape is unchanged — only the row count grows from 15 to 18.

## Goals / Non-Goals

### Goals

- Add Slowed, Confused, Turned as first-class catalog entries with SRD-style descriptions, consistent in tone/format with the existing 15.
- Keep the change additive and reversible: no schema change, no API contract change, no removal of existing entries.
- Update the one test that hardcodes the catalog length (and add assertions for the new entries) so CI reflects the new expected state.

### Non-Goals

- No mechanical automation (advantage/disadvantage, forced speed/movement changes) for any condition, new or existing.
- No change to `ConditionFormModal`, `ConditionControls`, `conditionCatalogRepo.ts`, or the API route — they are name/description-agnostic and require zero changes to support 18 vs. 15 entries.
- No addition of Polymorphed, Banished, or any other condition beyond the three aligned on.

## Decisions

### Decision 1: Author entries directly in `CONDITION_CATALOG` as static SRD-style text (no new data source)

- Chosen: Add three plain object literals to the existing array, matching the existing entries' style (a single descriptive paragraph, no markup).
- Alternatives considered: (a) Fetch/generate descriptions dynamically from open5e at seed time; (b) store conditions in a versioned JSON/YAML file instead of a `.ts` module.
- Rationale: The existing 15 are hand-authored constants, not fetched — consistency favors the same approach. There's no local spell dataset (spells come live from open5e per campaign, per proposal's Problem Space), so there's nothing to derive these three from programmatically; SRD text for *Slow*, *Confusion*, and Turn Undead is stable and small enough to hardcode.
- Trade-offs: Static text won't auto-update if a future SRD revision changes wording, same trade-off already accepted for the existing 15.

### Decision 2: Place new entries appended at the end of the array (not alphabetically interleaved)

- Chosen: Append Slowed, Confused, Turned after Unconscious, in that order.
- Alternatives considered: Re-sort the full array alphabetically to interleave the new entries with the existing 15.
- Rationale: Minimizes diff noise and avoids reordering the 15 existing entries (which several tests/snapshots may reference by position or which a human reviewer would otherwise have to re-diff line-by-line). The UI presumably renders these as a list — sort order is a display concern to check for, not something enforced by array order (verified below in Decision 3).
- Trade-offs: The array is no longer alphabetically sorted end-to-end. Acceptable since nothing currently depends on catalog array order (`loadConditionCatalog` returns raw find() order from Mongo, which is insertion-order-ish but not guaranteed sorted either).

### Decision 3: Update `seedConditionCatalog.test.ts` length assertion from 15 to 18, and add coverage asserting the three new names are present with non-empty descriptions

- Chosen: Bump the `toHaveLength(15)` assertion at `tests/unit/lib/scripts/seedConditionCatalog.test.ts:47` to `toHaveLength(18)`; add a small assertion (e.g. `expect(CONDITION_CATALOG.map(c => c.name)).toEqual(expect.arrayContaining(["Slowed", "Confused", "Turned"]))`) so a future accidental removal is caught explicitly, not just via count drift.
- Alternatives considered: Leave the count assertion as a loose `>= 15` — rejected because it weakens the test's ability to catch accidental future removals of any specific entry.
- Rationale: Keeps the test exact and self-documenting; matches existing test style in the same file (a `for` loop already validates each entry has non-empty `name`/`description`, per the current file structure — no change needed to that loop, it will cover the new entries automatically).
- Trade-offs: None material — this is the minimal correct update.

## Proposal to Design Mapping

- Proposal element: "Add three entries to `CONDITION_CATALOG`... each with an SRD-style `name` + `description`."
  - Design decision: Decision 1 (static authored entries), Decision 2 (append order)
  - Validation approach: Unit test asserting the three names/descriptions exist (Decision 3); manual read-through of description text for SRD accuracy during review.
- Proposal element: "Update any test that asserts the catalog's exact contents/length"
  - Design decision: Decision 3
  - Validation approach: `npm test -- tests/unit/lib/scripts/seedConditionCatalog.test.ts` passes with updated expectations; full unit suite run to catch any other hardcoded-15 assertion not yet identified.
- Proposal element: "Re-running `seedConditionCatalog` against each environment's database after merge"
  - Design decision: N/A — operational step, no design decision needed since the script's upsert-by-name logic already handles new entries without modification.
  - Validation approach: Manual/ops verification that `conditionCatalog` collection in each environment has 18 documents post-seed (tracked as a task, not automated by this change).

## Functional Requirements Mapping

- Requirement: The condition catalog includes Slowed, Confused, and Turned with accurate SRD-style descriptions.
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/condition-catalog/spec.md` (new requirement to be added)
  - Testability notes: Directly assertable via unit test reading `CONDITION_CATALOG` — no mocking required, pure data.
- Requirement: The catalog API (`GET /api/conditions/catalog`) returns all 18 entries once seeded, with the same `{name, description}` shape as before.
  - Design element: No code change required (existing `conditionCatalogRepo.ts`/route are shape-agnostic to array length)
  - Acceptance criteria reference: `specs/condition-catalog/spec.md`
  - Testability notes: Existing `conditionCatalogRepo.test.ts` coverage already exercises the shape-preservation/stripping behavior generically (not tied to a specific count), so it needs no change; confidence comes from that test continuing to pass unmodified.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Deploying this change must not require a destructive migration or manual data cleanup.
  - Design element: Upsert-by-name in `seedConditionCatalog.ts` (unchanged) naturally handles the new entries as inserts, existing entries as no-op updates.
  - Acceptance criteria reference: `specs/condition-catalog/spec.md`
  - Testability notes: Verified by existing `seedConditionCatalog` unit tests (insert vs. update counting logic untouched) plus a manual post-deploy check that the script logs "Inserted: Slowed/Confused/Turned" the first time it runs in each environment.

## Risks / Trade-offs

- Risk/trade-off: SRD-style description text for Slowed/Confused/Turned is written by paraphrasing spell/feature text rather than quoting the SRD verbatim (same approach as the existing 15, which are already paraphrased, not literal SRD quotes).
  - Impact: Minor risk of a reviewer flagging wording as imprecise; no legal/licensing risk since this mirrors existing practice.
  - Mitigation: Descriptions reviewed against 5e SRD source content during PR review before merge.
- Risk/trade-off: A test elsewhere in the suite may hardcode "15" or enumerate all condition names without having been found by the grep in this design pass.
  - Impact: A missed test would fail CI post-merge, not silently pass.
  - Mitigation: Full `npm test` run as part of tasks/verification before requesting review; CI itself is the backstop.

## Rollback / Mitigation

- Rollback trigger: SRD accuracy dispute in review, or CI failure that can't be quickly fixed forward.
- Rollback steps: Revert the single commit touching `lib/data/conditionCatalog.ts` and the test file; no database rollback needed pre-deploy. If already deployed and seeded, the three extra `conditionCatalog` documents are harmless leftover data (upsert-by-name is idempotent and non-destructive) — no urgent cleanup required, but they can be manually deleted from the collection by `name` if desired.
- Data migration considerations: None — this is additive seed data, not a schema migration.
- Verification after rollback: Confirm `CONDITION_CATALOG.length` back to 15 in code; existing tests pass unmodified.

## Operational Blocking Policy

- If CI checks fail: Fix forward (most likely cause is the known `toHaveLength(15)` assertion or an undiscovered similar assertion) before merge; do not bypass.
- If security checks fail: Not expected — this change adds static string data only, no new inputs, endpoints, or dependencies. If Codacy/Verity flags something, investigate before waiving; do not waive without a human-cited reason per project policy.
- If required reviews are blocked/stale: Follow standard repo process — ping reviewer, no bypass of branch protection.
- Escalation path and timeout: Standard team process; no special timeout for this low-risk, low-blast-radius change.

## Open Questions

None.
