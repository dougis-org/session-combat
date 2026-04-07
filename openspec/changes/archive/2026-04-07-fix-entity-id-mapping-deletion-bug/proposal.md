## GitHub Issues

- #123 (party deletion fails)
- #126 (loadGlobalMonsterTemplates same bug + admin userId mismatch)

## Why

- Problem statement: Deleting a party, encounter, or user-owned monster template silently does nothing. The API returns HTTP 200, the UI re-fetches, and the record reappears. The root cause is a one-character ordering error in three `load*` functions in `lib/storage.ts`: they map entity `id` to `_id.toString()` instead of preserving the UUID stored in `id`, so the subsequent `deleteOne({ id, userId })` query never matches any document.
- Why now: Issue #123 was filed 2026-04-05 by the repo owner after manual testing confirmed the failure. The bug affects every user of the app for three entity types (parties, encounters, monster templates). Characters are unaffected — their loader already uses the correct order.
- Business/user impact: Users cannot delete parties, encounters, or monster templates. Workarounds require direct DB access. Trust in data management features is broken.

## Problem Space

- Current behavior: `loadParties`, `loadEncounters`, `loadMonsterTemplates`, and `loadGlobalMonsterTemplates` all return entities where `id` has been overwritten with `_id.toString()` (the MongoDB ObjectId string). When the UI sends that ObjectId string to a DELETE route, `storage.deleteXxx(id, userId)` calls `deleteOne({ id: ObjectIdString, userId })`. The stored document's `id` field contains a UUID (`crypto.randomUUID()`), not the ObjectId string, so the query matches nothing. MongoDB returns `deletedCount: 0` without throwing, so the API returns 200 and the caller never learns deletion failed.
- Desired behavior: `load*` functions return the UUID stored in the `id` field. Delete routes receive the UUID, and `deleteOne({ id: UUID, userId })` matches the document correctly.
- Constraints: The fix must not break `loadCharacters`, which already uses the correct order (`id: char.id || char._id?.toString()`). The same correct pattern must be applied to the four broken loaders.
- Assumptions: All parties, encounters, and monster templates in the database were created via the app's POST routes, which always set `id: crypto.randomUUID()`. No documents exist that lack an `id` field (this assumption is tracked for audit in #125).
- Edge cases considered:
  - Documents without an `id` field (legacy data): the `|| _id.toString()` fallback in the corrected expression handles these gracefully.
  - Global monster templates (`loadGlobalMonsterTemplates`): use the same fix. A secondary issue — the admin delete route passes `auth.userId` instead of `GLOBAL_USER_ID` to `deleteMonsterTemplate` — is tracked in #126 and is out of scope here.
  - The `saveParty` dual-query logic (tracked in #125) is not modified by this change.

## Scope

### In Scope

- Fix `id` mapping order in `loadParties` (`lib/storage.ts:114`)
- Fix `id` mapping order in `loadEncounters` (`lib/storage.ts:30`)
- Fix `id` mapping order in `loadMonsterTemplates` (`lib/storage.ts:133`)
- Fix `id` mapping order in `loadGlobalMonsterTemplates` (`lib/storage.ts:152`)
- Add/strengthen E2E test assertions for party deletion to verify the record is gone post-delete (not just that the API returned 200)

### Out of Scope

- `saveParty` dual-query audit (#125)
- Admin global monster template userId mismatch (#126)
- `loadCharacters` (already correct)
- Any UI changes
- Database migrations

## What Changes

- Four single-line changes in `lib/storage.ts`: `_id?.toString() || id` → `id || _id?.toString()`
- One E2E test improvement in `tests/e2e/parties.spec.ts`: add assertion that the party count drops to 0 after delete (the assertion already exists on line 167; verify it is sufficient or tighten it)

## Risks

- Risk: A document in production lacks the `id` UUID field (violating the assumption above)
  - Impact: The `id || _id?.toString()` fallback returns the ObjectId string for that document, same as today — no regression
  - Mitigation: Low risk; the fallback is correct. #125 tracks the audit.
- Risk: Other code depends on entities having an ObjectId string as their `id`
  - Impact: Any such code would break after the fix
  - Mitigation: Grep confirms no other code compares entity IDs to ObjectId-shaped strings. The UI receives and round-trips whatever the loader returns.

## Open Questions

No unresolved ambiguity. All questions from the explore session were resolved:
- Characters are already correct — confirmed by code inspection.
- The `loadGlobalMonsterTemplates` secondary userId bug is real but tracked separately (#126) and explicitly out of scope here.
- The E2E deletion test at `parties.spec.ts:147` does assert that the party disappears — it should fail with the current bug, confirming it is a valid regression guard.

## Non-Goals

- Refactoring the ID strategy (UUID vs ObjectId) across the codebase
- Fixing the admin global template delete route's userId bug
- Adding deletion E2E tests for encounters or monster templates (separate concern)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
