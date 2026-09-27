## GitHub Issues

- #684

## Why

- Problem statement: `lib/storage.ts` is a god-object facade being decomposed per Epic #499. For the Encounter domain, the real implementation already lives in `lib/storage/encounterRepo.ts`; `storage.ts` now only re-exports those seven functions (`loadEncounters`, `saveEncounter`, `saveEncounters`, `deleteEncounter`, `loadEncountersByIds`, `addEncounterToCampaign`, `removeEncounterFromCampaign`) unchanged. Callers still import the facade instead of the narrow repo, so the facade cannot be shrunk or removed for this domain.
- Why now: this is the last step for the Encounter slice of the storage refactor; the domain module and its own test file already exist and are stable, so the remaining work is import-site mechanical.
- Business/user impact: none directly (no behavior change for end users). Reduces coupling to the shrinking `storage.ts` facade and unblocks eventual removal of the Encounter surface from it, in line with the rest of Epic #499 (see `.verity/memory` — content/reference clusters already migrated in #504/#672/#673).

## Problem Space

- Current behavior: `app/api/campaigns/global/[id]/copy/route.ts`, `app/api/encounters/[id]/route.ts`, `app/api/encounters/route.ts`, `app/api/campaigns/[id]/encounters/route.ts`, and `lib/scripts/backfillCampaignEncounters.ts` all call `storage.<fn>(...)` for encounter operations. `lib/storage/encounterRepo.ts` itself also round-trips through the facade: its own `saveEncounters` calls `storage.saveEncounter(...)` instead of the local `saveEncounter`. Several unit test files mock `storage.<fn>` for these same operations.
- Desired behavior: every listed caller imports `lib/storage/encounterRepo.ts` functions directly (e.g. `import { saveEncounter } from "@/lib/storage/encounterRepo"`); `encounterRepo.ts`'s `saveEncounters` calls its own local `saveEncounter`; corresponding test mocks target `@/lib/storage/encounterRepo` instead of `@/lib/storage`. `storage.ts` keeps re-exporting the same functions (removing them is out of scope — other domains/tests may still reference `storage.*` for Encounter until this and sibling issues land across the epic), so no behavior or public API changes.
- Constraints: purely mechanical — no logic, signature, or behavior changes; must not touch other domains' storage functions or facade entries; must keep `tests/unit/lib/storage/facadeShape.test.ts`'s facade key-count assertion valid (facade still re-exports the same functions, just with fewer internal callers).
- Assumptions: `lib/storage/encounterRepo.ts`'s existing exports and behavior are correct and won't change; `storage.ts` will not be pruned of Encounter re-exports in this change (that's a separate, later step per the epic, since other files not in this scope may still reference `storage.<encounterFn>`).
- Edge cases considered: `encounterRepo.ts`'s internal `saveEncounters` self-call through the facade must be swapped to a local call without changing its per-item error/telemetry behavior (it must still call `runStorageOp`-wrapped `saveEncounter` once per item — swapping to the local function preserves this since the local `saveEncounter` is the same implementation `storage.saveEncounter` currently delegates to).

## Scope

### In Scope

- Swap `import { storage } from "@/lib/storage"` (or equivalent) for direct `lib/storage/encounterRepo.ts` imports in:
  - `app/api/campaigns/global/[id]/copy/route.ts`
  - `app/api/encounters/[id]/route.ts`
  - `app/api/encounters/route.ts`
  - `app/api/campaigns/[id]/encounters/route.ts`
  - `lib/scripts/backfillCampaignEncounters.ts`
- Fix `lib/storage/encounterRepo.ts`'s `saveEncounters` to call its local `saveEncounter` instead of `storage.saveEncounter`, removing that file's only remaining import of `@/lib/storage`.
- Update test mocks whose `jest.mock("@/lib/storage")` stubs encounter functions to consume caller-facing behavior, redirecting those stubs to `@/lib/storage/encounterRepo` instead:
  - `tests/unit/scripts/backfillCampaignEncounters.test.ts` (already mocks `@/lib/storage` and, separately, `@/lib/storage/campaignRepo` — same split pattern applies here for `encounterRepo`)
  - `tests/unit/api/campaigns/[id]/encounters/route.test.ts` (same split pattern: already separately mocks `@/lib/storage/campaignRepo` alongside `@/lib/storage`)
- Remove now-unused `storage` imports from each migrated caller file if no other domain's storage calls remain in that file.

### Out of Scope

- Any change to `lib/storage/encounterRepo.ts`'s public function signatures or behavior (other than the internal self-call fix above).
- Removing the Encounter re-exports from `lib/storage.ts` itself (kept for now; other epic issues cover facade shrinkage/removal once all domains are migrated).
- Migrating any non-Encounter storage domain (spell, roll, session-log, share, campaign, party, etc.).
- `tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage.campaignEncounters.test.ts`, and `tests/unit/storage/storage.test.ts` — these call `storage.<encounterFn>` directly (no `jest.mock("@/lib/storage")`) against a mocked `@/lib/db`, testing the facade's own re-export/pass-through behavior rather than any caller. `storage.ts` is unchanged by this proposal, so these stay as-is.
- `tests/unit/lib/storage/encounterRepo.test.ts` (already tests the repo module directly, per existing pattern) and `tests/unit/lib/storage/facadeShape.test.ts` (asserts facade shape, not caller wiring) — reviewed for impact only, not rewritten, unless the caller migration is found to break their assertions.

## What Changes

- 5 caller files switch from `storage.<encounterFn>` to direct `encounterRepo.<encounterFn>` imports.
- `lib/storage/encounterRepo.ts` no longer imports `@/lib/storage` (drops its self-referential facade call).
- 2 test files (`backfillCampaignEncounters.test.ts`, `campaigns/[id]/encounters/route.test.ts`) update their `jest.mock("@/lib/storage")` encounter-function stubs to target `@/lib/storage/encounterRepo` instead.
- No new files, no deleted files, no schema/API/contract changes.

## Risks

- Risk: A caller file mixes Encounter storage calls with other-domain `storage.*` calls. Confirmed for `app/api/campaigns/global/[id]/copy/route.ts`, which also calls `storage.loadGlobalCampaignTemplateById` and `storage.addMember` (campaign domain).
  - Impact: Removing the `storage` import there would break the file.
  - Mitigation: Keep the `storage` import alongside the new `encounterRepo` import in that file; only its `storage.saveEncounter` call is swapped. The other 4 caller files are pure-Encounter and can drop the `storage` import entirely.
- Risk: `tests/unit/scripts/backfillCampaignEncounters.test.ts` and `tests/unit/api/campaigns/[id]/encounters/route.test.ts` each set up `jest.mock("@/lib/storage", ...)` with a manually-shaped mock object used across the whole file.
  - Impact: A careless edit could remove assertions/mocks unrelated to Encounter calls.
  - Mitigation: Both files already separately `jest.mock("@/lib/storage/campaignRepo")` alongside `@/lib/storage` — follow that existing split-mock pattern by adding a `jest.mock("@/lib/storage/encounterRepo")` and moving only the encounter-function mock properties and assertions there.
- Risk: `tests/unit/lib/storage/facadeShape.test.ts` asserts an exact key count (`OWN_KEY_COUNT = 75`) on the facade.
  - Impact: If any accidental edit to `storage.ts` removes an Encounter re-export, this test fails.
  - Mitigation: Tasks must explicitly leave `storage.ts`'s Encounter re-exports untouched; verify this test still passes unmodified after the change.

## Open Questions

- None — this proposal was developed via `/opsx:explore` against the live codebase (facade re-export structure, exact caller call sites, and affected test files were all confirmed via direct code search before this proposal was written), and the user has explicitly instructed proceeding to proposal artifacts. No unresolved ambiguity blocks design/specs/tasks.

## Non-Goals

- Removing `storage.ts` or shrinking its public surface.
- Changing Encounter storage behavior, error handling, or telemetry (`runStorageOp` usage stays as-is).
- Addressing other Epic #499 domains not named in Scope.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
