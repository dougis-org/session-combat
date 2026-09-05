## GitHub Issues

- #708
- #499

## Why

- Problem statement: `lib/storage.ts` (#499's god-object refactor) was migrated
  to a centralized `runStorageOp`/`logStorageEvent` telemetry seam across
  #500–#506, and #499 was tracked as fully closed. An audit on 2026-09-04
  found 7 methods that were never inventoried by any sub-issue and still
  bypass the seam: `savedContent.list/create/update/remove` and
  `loadEncountersByIds`/`addEncounterToCampaign`/`removeEncounterFromCampaign`.
  `savedContent.list()` still catches a DB outage and silently returns `[]` —
  the exact failure class #499 was written to eliminate (the same bug pattern
  as the original `loadSpellById()` swallow fixed in #504).
- Why now: #499's own Definition of Done ("every storage operation logs
  through `logStorageEvent`", "no method silently swallows a real failure")
  is not actually satisfied while these 7 methods remain outside the seam.
  Leaving it as-is means the tracking issue is closed on a false premise.
- Business/user impact: a MongoDB outage while listing saved content
  (`savedContent.list`) currently looks identical to "campaign has no saved
  content yet" to the end user and produces no alertable telemetry — same
  class of masked-outage bug as the pre-#504 spell-lookup issue.

## Problem Space

- Current behavior: 7 methods in `lib/storage.ts` still wrap their own
  `try/catch` around `getDatabase()` calls and log via raw
  `console.error`/`console.warn`, invisible to the `logStorageEvent`
  telemetry seam built in #501/#505. `savedContent.list()` returns `[]` on
  error (silent swallow); the other 6 rethrow but without structured
  telemetry or `StorageError` wrapping.
- Desired behavior: all 7 methods run through `runStorageOp`, following the
  exact pattern already used by every other migrated method in
  `encounterRepo.ts` and the other per-domain repo files. `savedContent.*`
  moves into a new `savedContentRepo.ts` (no existing repo owns this
  collection); the 3 encounter-linking methods move into the existing
  `encounterRepo.ts` alongside `loadEncounters`/`saveEncounter`/etc.
- Constraints: `lib/storage.ts` must keep re-exporting the identical public
  shape — same method names, same signatures, same object nesting
  (`storage.savedContent.list(...)` etc.) — because 11 test files mock
  `storage` directly and 36 non-test files import it.
- Assumptions: no caller currently depends on `savedContent.list()`'s
  swallow-to-`[]` behavior on a genuine DB failure (as opposed to a
  legitimately-empty result set); this mirrors the same assumption already
  validated for `loadSpellById()` in #504.
- Edge cases considered:
  - `savedContent.list()` returning `[]` for "no saved content" (a real,
    non-error empty result) must remain unchanged — only a thrown/caught
    error path changes behavior. `runStorageOp`'s `isEmpty` predicate can
    distinguish this the same way encounter/character repos already do.
  - `addEncounterToCampaign`/`removeEncounterFromCampaign` are idempotent
    Mongo `$addToSet`/`$pull` updates with no "not found" semantics to
    preserve; only their error path changes.

## Scope

### In Scope

- Move `savedContent.list/create/update/remove` into a new
  `lib/storage/savedContentRepo.ts`, built on `runStorageOp`.
- Move `loadEncountersByIds`, `addEncounterToCampaign`,
  `removeEncounterFromCampaign` into the existing `lib/storage/encounterRepo.ts`,
  built on `runStorageOp`.
- Update `lib/storage.ts` to delegate all 7 methods to their new repo
  functions, preserving the exact existing public shape.
- Remove the now-dead `console.error`/`console.warn` call sites for these 7
  methods (zero remaining in `lib/storage.ts` after this change).
- Update #499's Definition of Done checkboxes once merged.

### Out of Scope

- Any other behavior change to `savedContent` or encounter-campaign linking
  (e.g. new validation, new fields, new endpoints).
- #506-style caller migration off the `storage` facade to narrow imports —
  out of scope here, tracked separately if ever revisited.
- OpenTelemetry exporter changes (#505's seam is reused as-is).

## What Changes

- New file: `lib/storage/savedContentRepo.ts` (4 functions, `runStorageOp`-backed).
- Modified: `lib/storage/encounterRepo.ts` (+3 functions).
- Modified: `lib/storage.ts` (7 methods become thin delegations; 7
  `console.error`/`console.warn` sites removed).
- Modified: GitHub issue #499 (Definition of Done checkboxes flip to done
  once #708 merges — already updated to reference #708 during triage).

## Risks

- Risk: `savedContent.list()`'s behavior change (swallow → throw) could
  surface a previously-hidden error path in a caller that assumed it always
  gets an array back.
  - Impact: an API route calling `storage.savedContent.list(...)` could now
    propagate a 500 instead of rendering an empty list.
  - Mitigation: grep all call sites of `storage.savedContent.list` before
    changing behavior and confirm each caller already handles a thrown
    error (or add handling); this is the same verification #504 did for
    `loadSpellById()`.
- Risk: test mocks of `storage.savedContent.*` or the 3 encounter methods
  may assert on the old inline implementation (e.g. spy on `console.error`).
  - Impact: test breakage unrelated to real behavior.
  - Mitigation: run the full existing test suite before and after; update
    any mock/assertion that specifically targeted `console.error` calls for
    these methods.

## Open Questions

- None blocking. This change is scoped tightly to closing a well-defined,
  already-audited gap using an established, proven pattern (`runStorageOp`
  applied identically to how #502/#503/#504 applied it). No unresolved
  ambiguity remains from the exploration that preceded this proposal.

## Non-Goals

- Introducing any new storage abstraction beyond the existing
  `runStorageOp`/`logStorageEvent` seam.
- Changing `savedContent`'s MongoDB schema or collection name.
- Revisiting #506 (optional caller-narrowing migration).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
