## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Encounter callers import encounterRepo directly

The system SHALL have every listed Encounter storage caller invoke `lib/storage/encounterRepo.ts` functions via a direct import, instead of via the `storage` facade from `@/lib/storage`.

#### Scenario: Pure-Encounter caller has no remaining facade import

- **Given** `app/api/encounters/[id]/route.ts`, `app/api/encounters/route.ts`, `app/api/campaigns/[id]/encounters/route.ts`, and `lib/scripts/backfillCampaignEncounters.ts` after the change
- **When** the file's imports and Encounter-related call sites are inspected
- **Then** each file imports the specific Encounter functions it calls (`loadEncounters`, `saveEncounter`, `deleteEncounter`, `loadEncountersByIds`, `addEncounterToCampaign` as applicable) from `@/lib/storage/encounterRepo`, calls them unqualified, and contains no import of `@/lib/storage`

#### Scenario: Mixed-domain caller keeps both imports

- **Given** `app/api/campaigns/global/[id]/copy/route.ts`, which also calls `storage.loadGlobalCampaignTemplateById` and `storage.addMember` (non-Encounter, campaign-domain functions)
- **When** the file's imports and call sites are inspected after the change
- **Then** it retains `import { storage } from "@/lib/storage"` for the two campaign-domain calls, additionally imports `saveEncounter` from `@/lib/storage/encounterRepo`, and its Encounter call site uses `saveEncounter(...)` unqualified rather than `storage.saveEncounter(...)`

## MODIFIED Requirements

### Requirement: MODIFIED encounterRepo.saveEncounters calls the local saveEncounter directly

The system SHALL have `lib/storage/encounterRepo.ts`'s `saveEncounters` function call its own module-local `saveEncounter` function directly, and SHALL NOT import `@/lib/storage` from `lib/storage/encounterRepo.ts`.

#### Scenario: No self-referential facade import remains

- **Given** `lib/storage/encounterRepo.ts` after the change
- **When** its `saveEncounters` function body and its top-level imports are inspected
- **Then** `saveEncounters` invokes `saveEncounter(encounter)` (the function defined earlier in the same file) for each item, and the file contains no `import { storage } from "@/lib/storage"` statement

#### Scenario: saveEncounters behavior and telemetry are unchanged

- **Given** `tests/unit/lib/storage/encounterRepo.test.ts`'s existing coverage of `saveEncounters`
- **When** the test suite is run unmodified after the change
- **Then** it passes with the same assertions on per-item `saveEncounter` invocation and `runStorageOp` telemetry ("saveEncounter", collection "encounters") as before the change

## Traceability

- Proposal element: Swap `storage.*` imports for `encounterRepo.*` in the 5 listed caller files → Requirement: ADDED Encounter callers import encounterRepo directly
- Proposal element: Fix `encounterRepo.ts`'s internal self-call → Requirement: MODIFIED encounterRepo.saveEncounters calls the local saveEncounter directly
- Design decision: Decision 1 (direct named imports), Decision 2 (mixed-domain file) → Requirement: ADDED Encounter callers import encounterRepo directly
- Design decision: Decision 3 (self-call fix) → Requirement: MODIFIED encounterRepo.saveEncounters calls the local saveEncounter directly
- Requirement: ADDED Encounter callers import encounterRepo directly → Task(s): per-file caller migration tasks (tasks.md)
- Requirement: MODIFIED encounterRepo.saveEncounters calls the local saveEncounter directly → Task(s): encounterRepo self-call fix task (tasks.md)

## Non-Functional Acceptance Criteria

### Requirement: Performance

Not applicable — this change is import-source and mock-target edits only; no code path's runtime behavior, call count, or I/O pattern changes. No latency budget applies.

### Requirement: Security

Not applicable — no new input handling, auth, or data-access logic is introduced or altered. No distinct security scenario beyond the functional scenarios above.

### Requirement: Reliability

#### Scenario: Facade shape and unrelated storage tests remain unaffected

- **Given** `tests/unit/lib/storage/facadeShape.test.ts` and `tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage.campaignEncounters.test.ts`, `tests/unit/storage/storage.test.ts` (which exercise `storage.ts`'s own re-export/pass-through behavior, not caller wiring)
- **When** the full test suite is run after the change
- **Then** all four files pass without any modification, confirming `storage.ts`'s Encounter re-exports and facade shape are untouched
