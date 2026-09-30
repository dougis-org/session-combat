## GitHub Issues

- #686

## Why

- Problem statement: `lib/storage.ts` (the storage god-object, tracked under Epic #499) still exposes Monster & Spell Template operations as thin delegating wrappers around `lib/storage/monsterTemplateRepo.ts` and `lib/storage/spellRepo.ts`. Callers still import the wide `storage` facade instead of the narrow repo modules the facade already delegates to.
- Why now: The narrow repos (`monsterTemplateRepo.ts`, `spellRepo.ts`) are complete and already the source of truth behind the facade (`lib/storage.ts:81-222`). Leaving callers on the facade keeps the god-object's surface area alive for no functional reason and blocks eventually deleting the dead delegation code.
- Business/user impact: None visible to end users -- this is a purely internal, mechanical import-path change with no behavior change.

## Problem Space

- Current behavior: 9 call sites (8 production files + shared logic in `lib/import/dedupeEngine.ts`) import `{ storage } from '@/lib/storage'` and call Monster/Spell Template methods (`saveMonsterTemplate`, `loadMonsterTemplates`, `loadAllMonsterTemplates`, `loadGlobalMonsterTemplates`, `deleteMonsterTemplate`, `saveManyMonsterTemplates`, `deleteMonsterTemplatesByIds`, `findExistingMonsterKeys`, `findMonsterByNameAndSource`, `loadSpells`, `loadSpellById`, `saveSpellTemplate`, `deleteSpellTemplate`, `spellExistsByNameAndSource`). `lib/storage.ts:81-222` just forwards each of these 1:1 to `monsterTemplateRepo` / `spellRepo`.
- Desired behavior: All 9 call sites import `monsterTemplateRepo` and/or `spellRepo` directly and call the same methods on those modules instead of on `storage`. No change to method names, signatures, or runtime behavior.
- Constraints: Purely mechanical -- no behavior change permitted. Must not touch any other domain still served by the `storage` facade (character sheets, sessions, rolls, shares, campaign templates, etc.).
- Assumptions: `monsterTemplateRepo.ts` and `spellRepo.ts` already export every method the callers need (confirmed -- all 13 methods used across the 9 files exist verbatim on both repo modules). No new repo functions need to be written.
- Edge cases considered:
  - `lib/import/dedupeEngine.ts` calls into both `monsterTemplateRepo` (monster path) and `spellRepo` (spell path) from the same file -- needs both imports, chosen per call site.
  - `lib/storage/campaignTemplateRepo.ts` matched an initial grep for "storage" but does not import the `storage` facade at all (it imports `runStorageOp` from `lib/storage/runOp`) -- confirmed out of scope, not a caller.
  - Test files that import `{ storage }` and assert against Monster/Spell Template behavior (`tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage.characterization.test.ts`, `tests/unit/import/dedupeEngine.test.ts`, `tests/unit/api/monsters/upload.route.test.ts`) mock or import the facade; whether/how they migrate is addressed explicitly in Scope below.

## Scope

### In Scope

- Update these 9 files to import `monsterTemplateRepo` and/or `spellRepo` directly, replacing `storage.<method>(...)` calls with `<repo>.<method>(...)`:
  - `lib/import/dedupeEngine.ts`
  - `app/api/monsters/route.ts`
  - `app/api/monsters/[id]/route.ts`
  - `app/api/monsters/[id]/duplicate/route.ts`
  - `app/api/monsters/global/route.ts`
  - `app/api/monsters/global/[id]/route.ts`
  - `app/api/monsters/upload/route.ts`
  - `app/api/spells/route.ts`
  - `app/api/spells/[id]/route.ts`
- Updating any test file that imports/mocks `storage` specifically to exercise Monster/Spell Template behavior, so tests continue to reflect what production code actually imports.
- Running the full test suite to confirm no behavior change.

### Out of Scope

- Removing the now-unused Monster/Spell Template delegation methods from `lib/storage.ts` (lines 81-222). The facade stays intact until every domain it still serves is migrated (tracked separately under Epic #499); deleting dead code here is a follow-up, not this change.
- Any other `storage.ts` domain (character sheets, sessions, rolls, shares, campaign templates, user preferences, etc.) -- those are separate #499 sub-issues.
- Any behavior, validation, or API contract change to Monster/Spell Template operations.
- `lib/storage/campaignTemplateRepo.ts` -- confirmed not a caller of the `storage` facade.

## What Changes

- 9 production files change their import statement and call-site prefix only (`storage.` -> `monsterTemplateRepo.` and/or `spellRepo.`).
- Any tests directly coupled to the `storage` facade for these methods are updated to match.
- No new files, no deleted files, no signature changes, no new dependencies.

## Risks

- Risk: Missing a call site or mis-mapping a method to the wrong repo (e.g. a Monster method accidentally pointed at `spellRepo`) causes a runtime `TypeError`.
  - Impact: Broken API route at request time (500s on monster/spell CRUD endpoints).
  - Mitigation: Full test suite run after migration; the method list per repo is enumerated in this proposal and cross-checked against actual repo exports before implementation.
- Risk: Test files that mock `@/lib/storage` (`jest.mock('@/lib/storage', ...)`) silently stop covering the code path once production code no longer imports `storage`, giving a false-positive green suite.
  - Impact: Reduced test coverage without visible failure.
  - Mitigation: Explicitly locate and update every test file that mocks or asserts against `storage` for Monster/Spell Template behavior as part of this change (see Scope), not left for later.
- Risk: `lib/storage.ts` still re-exports these methods after this change, so a future contributor could accidentally reintroduce a `storage.saveMonsterTemplate` call.
  - Impact: Regression of the "narrow import" goal, low severity (behavior still correct, just architecturally sloppy).
  - Mitigation: Accepted for this change; flagged as the natural follow-up (delete dead facade methods) once all #499 sub-issues for other domains are done.

## Open Questions

- None -- this proposal follows directly from `/opsx:explore` on issue #686, where the caller inventory, repo-completeness check, and campaign-template false-positive were already resolved in conversation, and the user then explicitly instructed proceeding to proposal.

## Non-Goals

- Deleting or deprecating `lib/storage.ts`'s Monster/Spell Template delegation code.
- Migrating any other `storage.ts` domain.
- Changing Monster/Spell Template validation, error handling, or API behavior.
- Introducing a lint rule or CI check to prevent future `storage.<domain>` regressions (could be proposed separately, but not part of this mechanical migration).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
