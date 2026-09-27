## Context

- Relevant architecture: `lib/storage.ts` is a thin facade (Epic #499 god-object decomposition). For Encounter it does nothing but `import * as encounterRepo from "./storage/encounterRepo"` and re-export 7 functions unchanged (`lib/storage.ts:36` + per-function delegations). `lib/storage/encounterRepo.ts` is the real implementation, already using `runStorageOp` for telemetry/error wrapping and already covered by its own `tests/unit/lib/storage/encounterRepo.test.ts`.
- Dependencies: none beyond existing modules — no new packages, no schema changes.
- Interfaces/contracts touched: import statements and mock targets only. `lib/storage/encounterRepo.ts`'s exported function signatures, `lib/storage.ts`'s public re-exports, and all HTTP/API contracts are unchanged.

## Goals / Non-Goals

### Goals

- Every listed caller imports Encounter functions from `@/lib/storage/encounterRepo` directly instead of via `storage.<fn>`.
- `lib/storage/encounterRepo.ts` no longer imports `@/lib/storage` (its `saveEncounters` calls the local `saveEncounter`).
- The two test files that mock `@/lib/storage` for encounter functions mock `@/lib/storage/encounterRepo` instead, following the existing split-mock pattern both files already use for `campaignRepo`.
- `storage.ts`'s Encounter re-exports remain, so any file outside this change's scope that still calls `storage.<encounterFn>` keeps working unmodified.

### Non-Goals

- Changing `encounterRepo.ts` function behavior, signatures, or `runStorageOp` telemetry names/shapes.
- Removing Encounter functions from `storage.ts`.
- Touching any non-Encounter storage domain or any test that exercises `storage.ts`'s own re-export/pass-through behavior (`tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage.campaignEncounters.test.ts`, `tests/unit/storage/storage.test.ts`).

## Decisions

### Decision 1: One direct named-import per caller file, no barrel/re-export layer

- Chosen: Each caller imports exactly the encounter functions it uses directly from `@/lib/storage/encounterRepo`, e.g. `import { saveEncounter, loadEncounters, deleteEncounter } from "@/lib/storage/encounterRepo";`, then calls them unqualified (`saveEncounter(...)` not `encounterRepo.saveEncounter(...)`).
- Alternatives considered: (a) `import * as encounterRepo from "@/lib/storage/encounterRepo"` and keep `encounterRepo.saveEncounter(...)` call sites; (b) introduce a new intermediate re-export module.
- Rationale: Named imports match the pattern already used inside `encounterRepo.ts` itself for its own dependencies (e.g. `import { runStorageOp } from "./runOp"`) and is the stated pattern in issue #684 ("Replace `import { storage } from '@/lib/storage'` with a direct import of the relevant narrow repo"). It's also the smallest possible diff per call site — no `encounterRepo.` prefix churn beyond the import line.
- Trade-offs: If a file uses many encounter functions, the import line grows long; acceptable since no caller here uses more than 4 distinct functions (`app/api/encounters/[id]/route.ts` is the largest, using `loadEncounters`, `saveEncounter`, `deleteEncounter`).

### Decision 2: Mixed-domain file keeps both imports side by side

- Chosen: `app/api/campaigns/global/[id]/copy/route.ts` keeps `import { storage } from "@/lib/storage"` (for `storage.loadGlobalCampaignTemplateById` and `storage.addMember`) and adds `import { saveEncounter } from "@/lib/storage/encounterRepo"`, replacing only the `storage.saveEncounter(...)` call site.
- Alternatives considered: Leaving this file untouched (contradicts issue #684's "find all callers" scope); migrating its other calls too (out of scope — those are campaign-domain, not part of this issue).
- Rationale: Matches the proposal's confirmed mixed-usage finding; minimizes blast radius to only the Encounter call in this file.
- Trade-offs: This file ends up with two storage-related imports instead of one, which is expected/temporary until a future campaign-domain issue migrates its remaining `storage.*` calls.

### Decision 3: `encounterRepo.ts` self-call fix calls the local function directly (no re-export indirection)

- Chosen: In `lib/storage/encounterRepo.ts`, `saveEncounters` calls `saveEncounter(encounter)` (the function defined earlier in the same file) instead of `storage.saveEncounter(encounter)`, and the `import { storage } from "@/lib/storage"` line is deleted from that file.
- Alternatives considered: Keep the facade import for this one call (rejected — defeats the point of the migration, and is the last remaining reason this file imports `@/lib/storage` at all).
- Rationale: `storage.saveEncounter` already delegates straight to `encounterRepo.saveEncounter` (`lib/storage.ts` line ~136), so this is a no-op behavior change — same function, called directly instead of through a round-trip. Confirmed no other `storage.*` calls exist in `encounterRepo.ts`.
- Trade-offs: None identified — this removes a self-referential import cycle risk (`encounterRepo.ts` → `storage.ts` → `encounterRepo.ts`) that exists today only because of this one call.

### Decision 4: Test mocks follow the existing split-mock pattern already present in both affected test files

- Chosen: In `tests/unit/scripts/backfillCampaignEncounters.test.ts` and `tests/unit/api/campaigns/[id]/encounters/route.test.ts`, add `jest.mock("@/lib/storage/encounterRepo", () => ({ ... }))` and move the encounter-function mock properties (`loadEncountersByIds`, `saveEncounter`, `addEncounterToCampaign` as applicable) out of the existing `jest.mock("@/lib/storage", ...)` block into the new one. Update `expect(...)` assertions and `as jest.Mock` casts to reference the new mocked module instead of `storage`.
- Alternatives considered: Leave `jest.mock("@/lib/storage")` mocking encounter functions even though the code under test no longer calls through it (rejected — the mock would silently stop intercepting calls once the caller migrates, and any remaining assertions on `storage.saveEncounter` etc. would fail or, worse, pass vacuously with 0 calls).
- Rationale: Both files already separate `@/lib/storage/campaignRepo` from `@/lib/storage` in exactly this way (see `tests/unit/scripts/backfillCampaignEncounters.test.ts:8-9` and `tests/unit/api/campaigns/[id]/encounters/route.test.ts:18,26`), so this is a proven, low-risk pattern in this codebase rather than a new convention.
- Trade-offs: Slightly more mock boilerplate per file (one more `jest.mock` call), consistent with existing precedent.

### Decision 5: Do not touch storage.ts or facade-testing test files

- Chosen: `lib/storage.ts` is left byte-for-byte unchanged for Encounter re-exports. `tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage.campaignEncounters.test.ts`, `tests/unit/storage/storage.test.ts`, and `tests/unit/lib/storage/facadeShape.test.ts` are not edited.
- Alternatives considered: Pruning Encounter re-exports from `storage.ts` now that all known callers are migrated (rejected — out of scope per issue #684, which only asks for caller migration; facade shrinkage is a separate later step in Epic #499 once every domain's callers are confirmed migrated, and other repos/branches may still reference `storage.<encounterFn>`).
- Rationale: Keeps this change reviewable as a pure mechanical caller-migration with zero behavior or facade-shape change, matching the proposal's Non-Goals.
- Trade-offs: `storage.ts` still re-exports Encounter functions with (after this change) zero internal callers of its own for that domain — acceptable, tracked as follow-up scope in Epic #499, not this change.

## Proposal to Design Mapping

- Proposal element: Swap `storage.*` imports for `encounterRepo.*` in the 5 listed caller files.
  - Design decision: Decision 1 (direct named imports), Decision 2 (mixed-domain file keeps both imports).
  - Validation approach: Existing test suites for each caller file must pass unmodified (for the 3 pure-Encounter API route files and the script) or with only the mock-target changes from Decision 4 (for the 2 files with `jest.mock("@/lib/storage")`); `tsc`/type-check confirms no unresolved imports.
- Proposal element: Fix `encounterRepo.ts`'s internal self-call through the facade.
  - Design decision: Decision 3.
  - Validation approach: `tests/unit/lib/storage/encounterRepo.test.ts`'s existing `saveEncounters` test(s) must still pass unmodified — same call count/behavior, different call target.
- Proposal element: Update test mocks that stub `storage.<encounterFn>`.
  - Design decision: Decision 4.
  - Validation approach: Full unit test run for both affected test files; assert mocked-call-count expectations still reference the correct (now `encounterRepo`) mock.
- Proposal element: Leave `storage.ts` and facade-shape/pass-through tests untouched.
  - Design decision: Decision 5.
  - Validation approach: `tests/unit/lib/storage/facadeShape.test.ts`'s `OWN_KEY_COUNT` assertion and the 3 untouched storage-facade test files pass with no diff required.

## Functional Requirements Mapping

- Requirement: Each of the 5 listed caller files calls Encounter storage functions via a direct `@/lib/storage/encounterRepo` import, not `storage.*`.
  - Design element: Decisions 1, 2.
  - Acceptance criteria reference: `tasks.md` per-file migration tasks (to be created).
  - Testability notes: Static — grep for `storage\.(loadEncounters|saveEncounter|saveEncounters|deleteEncounter|loadEncountersByIds|addEncounterToCampaign|removeEncounterFromCampaign)` in the 5 files must return zero matches after the change (except the two non-Encounter `storage.*` calls retained in the copy route).
- Requirement: `encounterRepo.ts` has no import of `@/lib/storage`.
  - Design element: Decision 3.
  - Acceptance criteria reference: `tasks.md` encounterRepo self-call task.
  - Testability notes: Static — `grep -n "@/lib/storage\"" lib/storage/encounterRepo.ts` (exact facade import, not the `./storage/...` relative sibling imports already there) returns zero matches.
- Requirement: No behavior change — all existing tests for touched files pass without assertion changes beyond mock-target renaming.
  - Design element: Decisions 1-4.
  - Acceptance criteria reference: `tests.md` (to be created).
  - Testability notes: Dynamic — run the full Jest suite scoped to the touched files and confirm green; run full repo test suite once to catch any missed cross-file dependency.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No change to `runStorageOp` telemetry (`name`, `collection`, `isEmpty` fields) for any Encounter operation.
  - Design element: Non-Goals; Decision 3 preserves the exact same underlying function call.
  - Acceptance criteria reference: `tests/unit/lib/storage/encounterRepo.test.ts` (unmodified) continues to assert telemetry/error-wrapping behavior.
  - Testability notes: No new test needed — existing coverage is sufficient since the function bodies are untouched.
- Requirement category: operability
  - Requirement: `storage.ts`'s facade shape (key count, function identity) is unchanged, so any other in-flight branch/PR still compiles against it.
  - Design element: Decision 5.
  - Acceptance criteria reference: `tests/unit/lib/storage/facadeShape.test.ts` (unmodified, must still pass).
  - Testability notes: Run that specific test file as a regression check before considering the change done.

## Risks / Trade-offs

- Risk/trade-off: Removing the `storage` import from a file that turns out to have a missed non-Encounter usage (beyond what grep found) would cause a compile error.
  - Impact: Build failure caught immediately by `tsc`/lint, not a silent runtime issue.
  - Mitigation: Re-run `grep -n "storage\."` per file immediately before removing its `storage` import, as the last step for that file, not just once at design time.
- Risk/trade-off: The two test files with split mocks (Decision 4) could have their `describe`/`beforeEach` blocks structured so `jest.mock` factory hoisting makes it easy to duplicate or drop a mocked property.
  - Impact: Test could silently pass a mock into the wrong target or leave a `describe` block using an undefined mock function.
  - Mitigation: After edit, run just those two test files in isolation (`--testPathPatterns` per project convention — see `.verity/memory` note that this project's Jest 30 requires the plural flag) and confirm the same assertions still exercise the same call counts as before the change.

## Rollback / Mitigation

- Rollback trigger: Any of the 5 caller files' test suites fail after migration and the fix isn't a trivial mock-target correction within the same review pass; or `tests/unit/lib/storage/facadeShape.test.ts` breaks (indicates an accidental facade edit).
- Rollback steps: `git revert` the single commit/PR for this change (all edits are import-line and mock-target swaps with no data or schema changes, so a revert is a clean, complete undo). No feature flag needed — this is not runtime-conditional behavior.
- Data migration considerations: None — no persisted data, schema, or API contract is touched.
- Verification after rollback: Re-run the full Jest suite and confirm it matches pre-change green state; confirm `storage.ts` and `encounterRepo.ts` diffs are fully reverted via `git diff` against the pre-change commit.

## Operational Blocking Policy

- If CI checks fail: Fix forward within this change's PR since all edits are mechanical and low-risk; do not merge with failing tests. If a failure reveals a missed mixed-domain usage (per the Risks section), extend the task list to handle it rather than reducing scope silently.
- If security checks fail: Not expected (no new dependencies, no input handling changes, no auth/data-access logic touched) — treat any such finding as a signal that an unrelated pre-existing issue was surfaced, and report it rather than waiving it per this repo's CLAUDE.md accepted-risk policy (no self-judged waivers).
- If required reviews are blocked/stale: This is a small, mechanical, low-risk change; ping the reviewer directly rather than working around the block. Do not merge without review regardless of change size.
- Escalation path and timeout: If blocked more than one business day with no reviewer response, flag to the user (issue #684 author, `dougis`) for reprioritization; no automatic merge bypass.

## Open Questions

- None outstanding. All design decisions above were derived directly from confirmed code inspection (facade structure, exact call sites, exact test-mock structures) rather than assumption; the proposal's Open Questions section already recorded that no ambiguity blocks this change.
