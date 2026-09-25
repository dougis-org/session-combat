## GitHub Issues

- #683

## Why

- Problem statement: `lib/storage.ts` is a god-object facade in front of per-domain repo modules (Epic #499). For the Party domain, the facade (`storage.loadParties`, `storage.saveParty`, etc.) already just delegates to `lib/storage/partyRepo.ts`, but 8 API route files still call these methods through the `storage` facade instead of importing `partyRepo` directly. Three campaign-party linking functions (`addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns`) never got a repo home at all — they still live as raw inline MongoDB code inside `lib/storage.ts`.
- Why now: #683 is the next slice of Epic #499's caller-migration work (following #504, which already migrated the session-log/share/spell/roll clusters in PRs #672/#673). Doing Party now keeps the epic moving domain-by-domain.
- Business/user impact: none directly — this is an internal maintainability change. It reduces `lib/storage.ts`'s surface area and makes the Party domain's dependency graph explicit, which lowers the risk of future edits touching the wrong domain.

## Problem Space

- Current behavior: 8 route files under `app/api/parties/` and `app/api/campaigns/` import `{ storage } from '@/lib/storage'` and call a mix of party methods (`loadParties`, `saveParty`, `saveParties`, `deleteParty`, `loadPartiesByCampaign`, `buildSharedCharacterEntries`, `setPartyMemberLeftAt`, `canAddToCampaignParty`) and non-party methods (`getMember`, `addMember`, `updateMemberStatus`, `addShare`, `removeShare`, `listSharesForCampaign`, `listAllSharesForCampaign` — membershipRepo/shareRepo domains) on the same `storage` object. Separately, `addPartyToCampaign`, `removePartyFromCampaign`, and `removePartyFromAllCampaigns` are defined directly on the `storage` object in `lib/storage.ts` with inline `db.collection("campaigns")` / `db.collection("parties")` logic — they are not exported by `partyRepo.ts` at all, even though they exist only to maintain party/campaign linkage.
- Desired behavior: the 8 caller files import `partyRepo` directly (`import * as partyRepo from '@/lib/storage/partyRepo'`) for all eight party methods listed above, plus the three campaign-linking functions once moved. Calls to non-party storage methods in the same files continue to go through the existing `storage` import, unchanged. `lib/storage.ts` no longer contains the inline campaign-party linking logic; instead it re-delegates to `partyRepo` for those three functions, the same pattern it already uses for `saveParty`/`deleteParty`.
- Constraints: no behavior change — this is a mechanical import/location change only. `storage.ts`'s public method signatures for `addPartyToCampaign`/`removePartyFromCampaign`/`removePartyFromAllCampaigns` must remain callable exactly as before for any caller not touched by this change (defense in depth — verified none exist outside the 8 files, but the facade should still delegate rather than disappear, to avoid a silent breaking change if something was missed).
- Assumptions: `partyRepo.ts`'s existing `runStorageOp`/`getDatabase` imports are sufficient for the three relocated functions (they already use these exact primitives in their current `storage.ts` location).
- Edge cases considered: files that call `storage.canAddToCampaignParty` or `storage.setPartyMemberLeftAt` inside `.map()`/`Promise.all()` callbacks (e.g. `app/api/parties/route.ts`, `app/api/parties/[id]/route.ts`, `app/api/campaigns/[id]/members/[userId]/route.ts`) need the callback's captured reference switched from `storage.X` to `partyRepo.X` without altering the surrounding control flow.

## Scope

### In Scope

- Update imports and call sites in the 8 identified caller files to use `partyRepo` for the 8 existing party methods plus the 3 relocated campaign-linking methods.
- Move `addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns` from `lib/storage.ts` into `lib/storage/partyRepo.ts`, preserving their implementation verbatim (including `runStorageOp` call shape).
- Update `lib/storage.ts` to re-delegate to `partyRepo.addPartyToCampaign` / `partyRepo.removePartyFromCampaign` / `partyRepo.removePartyFromAllCampaigns`, matching the existing delegation style for `saveParty`/`deleteParty`.
- Update/adjust existing unit tests that mock `storage.saveParty`, `storage.loadParties`, `storage.deleteParty`, `storage.loadPartiesByCampaign`, `storage.canAddToCampaignParty`, `storage.setPartyMemberLeftAt`, `storage.addPartyToCampaign`, `storage.removePartyFromCampaign`, `storage.removePartyFromAllCampaigns`, or `storage.buildSharedCharacterEntries` in the 8 affected route files' test suites, so mocks target `partyRepo` where the production code now calls `partyRepo`.

### Out of Scope

- Any other domain's callers (membershipRepo, shareRepo, campaignRepo, etc.) — those keep using `storage` in this change.
- Removing `storage.loadParties`/`storage.saveParty`/etc. from `lib/storage.ts` itself — the facade methods stay (still delegating to `partyRepo`) since other, unmigrated callers or future code may still reference `storage.*` for these; only this issue's 8 call sites move to the narrow import.
- Any change to `partyRepo.ts`'s existing exported function behavior, signatures, or the `Party`/`LegacyPartyDoc` types.
- Renaming or restructuring `partyRepo.ts` beyond adding the 3 relocated functions.

## What Changes

- `app/api/parties/route.ts` — switch `loadParties`, `saveParty`, `canAddToCampaignParty`, `addPartyToCampaign`, `deleteParty` calls to `partyRepo.*`; keep `storage` import for nothing else currently used here (verify no other storage calls remain in this file).
- `app/api/parties/[id]/route.ts` — switch `loadParties`, `saveParty`, `deleteParty`, `canAddToCampaignParty`, `removePartyFromAllCampaigns`, `addPartyToCampaign` calls to `partyRepo.*`.
- `app/api/campaigns/route.ts` — switch `saveParty`, `deleteParty` calls to `partyRepo.*`; keep `storage.addMember` on `storage`.
- `app/api/campaigns/[id]/parties/route.ts` — switch `loadPartiesByCampaign` to `partyRepo.*`; keep `storage.getMember`.
- `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts` — switch `saveParty`, `loadPartiesByCampaign` to `partyRepo.*`; keep `storage.getMember`.
- `app/api/campaigns/[id]/members/[userId]/route.ts` — switch `setPartyMemberLeftAt` to `partyRepo.*`; keep `storage.getMember`, `storage.updateMemberStatus`, `storage.listAllSharesForCampaign`.
- `app/api/campaigns/[id]/characters/route.ts` — switch `buildSharedCharacterEntries` to `partyRepo.*`; keep `storage.getMember`, `storage.addShare`, `storage.listSharesForCampaign`.
- `app/api/campaigns/[id]/characters/[cid]/route.ts` — switch `setPartyMemberLeftAt` to `partyRepo.*`; keep `storage.getMember`, `storage.removeShare`.
- `lib/storage/partyRepo.ts` — add `addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns` (moved verbatim from `lib/storage.ts`), with their `runStorageOp`/`getDatabase` imports.
- `lib/storage.ts` — remove the inline bodies of the 3 relocated functions; replace with thin delegations to `partyRepo.addPartyToCampaign` / `partyRepo.removePartyFromCampaign` / `partyRepo.removePartyFromAllCampaigns`.
- Test files covering the 8 route files — update `jest.mock('@/lib/storage', ...)` / spy setups so mocked party-method calls target `partyRepo` instead of (or alongside, where mixed) `storage`.

## Risks

- Risk: A test mocks the whole `storage` module and implicitly relies on `storage.saveParty` etc. being called; switching the production code to call `partyRepo.saveParty` instead will make that mock assertion silently stop matching (test still passes if it only asserts on the wrong object, or fails clearly if it asserts call counts).
  - Impact: False confidence from tests that no longer exercise the real call path, or test breakage requiring rework.
  - Mitigation: Task list explicitly includes updating each affected test's mocks to target `partyRepo`; run the full affected test suite after each file's migration, not just at the end.
- Risk: `.map()`/`Promise.all()` callback sites (`canAddToCampaignParty`, `setPartyMemberLeftAt`) are easy to miss when swapping `storage.X` for `partyRepo.X` inside a callback body, since they're not top-level `await storage.X()` calls.
  - Impact: Partial migration — some call sites in a file still reference `storage` for a method that should now go through `partyRepo`, defeating the point of the change and creating an inconsistent file.
  - Mitigation: Tasks are scoped per-file with an explicit list of every call site (including callback-embedded ones) found during exploration; a final grep for `storage\.(loadParties|saveParty|saveParties|deleteParty|loadPartiesByCampaign|buildSharedCharacterEntries|setPartyMemberLeftAt|canAddToCampaignParty|addPartyToCampaign|removePartyFromCampaign|removePartyFromAllCampaigns)` across the repo should return zero matches after the change (only `partyRepo.ts`'s own definitions and `storage.ts`'s delegation lines, which use `partyRepo.` not `storage.`, should remain).
- Risk: Moving `addPartyToCampaign`/`removePartyFromCampaign`/`removePartyFromAllCampaigns` changes their module of origin, which could break any test that imports `lib/storage.ts` and expects these as own-module functions (as opposed to `storage.X` facade methods, which are unaffected).
  - Impact: Test import errors if a test directly imports the standalone functions (unlikely, since they were previously only accessible as `storage.X` properties, not named exports) rather than through the `storage` object.
  - Mitigation: Verify via search that no test imports these three by name from `lib/storage.ts` before removing their inline bodies.

## Open Questions

- None — this proposal was developed in `/opsx:explore` (see prior conversation), and the two open questions raised there (mixed-import end state; whether to bring the 3 campaign-linking functions along) were both resolved by explicit user answers before this proposal was written.

## Non-Goals

- Migrating any non-Party domain's callers off the `storage` facade.
- Deleting `storage.loadParties`/`storage.saveParty`/etc. from `lib/storage.ts` (they remain as delegating facade methods for now).
- Introducing a `campaignPartyRepo` or otherwise reorganizing beyond placing the 3 functions in the existing `partyRepo.ts`.
- Any change to party data shape, validation, or API response contracts.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
