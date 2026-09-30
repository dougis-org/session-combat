---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-party-campaign-authz` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `PartyCampaignAuthorizationError`

- [ ] `lib/storage/errors.ts`: `new PartyCampaignAuthorizationError(campaignId, userId)` is `instanceof Error`, has `.name === 'PartyCampaignAuthorizationError'`, and exposes `.campaignId`/`.userId`.

### Task 2 — `campaignId` classification helper

- [ ] `parseCampaignIdInput(undefined)` returns `{ kind: 'omit' }`.
- [ ] `parseCampaignIdInput('')` returns `{ kind: 'set', value: '' }`.
- [ ] `parseCampaignIdInput('  camp-1  ')` returns `{ kind: 'set', value: 'camp-1' }` (trimmed).
- [ ] `parseCampaignIdInput(null)` returns `{ kind: 'invalid' }`.
- [ ] `parseCampaignIdInput(123)` returns `{ kind: 'invalid' }`.
- [ ] `parseCampaignIdInput(true)` returns `{ kind: 'invalid' }`.
- [ ] `parseCampaignIdInput([])` returns `{ kind: 'invalid' }`.
- [ ] `parseCampaignIdInput({})` returns `{ kind: 'invalid' }`.

_Maps to: tasks.md Task 2; specs/party-campaign-authorization/spec.md → "ADDED Reject non-string `campaignId`" (all scenarios)._

### Task 3 — `addPartyToCampaign` DM-authorization gate

- [ ] Given `getMember(campaignId, callerId)` mocked to resolve `{ role: 'dm', status: 'active', ... }`, `addPartyToCampaign(campaignId, partyId, callerId)` resolves without throwing and performs the existing link-write behavior (unchanged from current tests).
- [ ] Given `getMember` mocked to resolve `{ role: 'player', status: 'active', ... }`, `addPartyToCampaign(campaignId, partyId, callerId)` rejects with `PartyCampaignAuthorizationError` and does not write any link (`db.collection('campaigns').updateOne`/`findOne` link-mutating calls not invoked, or invoked count asserted as before the throw only).
- [ ] Given `getMember` mocked to resolve `{ role: 'dm', status: 'invited', ... }` (not active), `addPartyToCampaign` rejects with `PartyCampaignAuthorizationError`.
- [ ] Given `getMember` mocked to resolve `null` (no membership row for that campaign), `addPartyToCampaign` rejects with `PartyCampaignAuthorizationError`.
- [ ] Given `getMember` mocked to resolve an active DM row for a *different* campaign id than the one passed to `addPartyToCampaign`, the call still rejects (confirms the check queries `getMember(campaignId, callerId)` with the exact target `campaignId`, not any campaign the caller happens to DM).

_Maps to: tasks.md Task 3; specs/party-campaign-authorization/spec.md → "ADDED Party-campaign link authorization" (all scenarios)._

### Task 4 — `reassignPartyCampaign` extraction

- [ ] `reassignPartyCampaign(updatedParty, undefined, existingCampaignId, callerId)` is a no-op: `getMember` is not called at all, `removePartyFromAllCampaigns` and `addPartyToCampaign` are not called, and `updatedParty.campaignId` is left as-is (per existing `campaignId === undefined` short-circuit).
- [ ] `reassignPartyCampaign(updatedParty, '', 'camp-1', callerId)` (explicit unlink), with `getMember('camp-1', callerId)` mocked to resolve an active DM row, calls `removePartyFromAllCampaigns(updatedParty.id)` and does not call `addPartyToCampaign`.
- [ ] **`reassignPartyCampaign(updatedParty, '', 'camp-1', callerId)` (explicit unlink), with `getMember('camp-1', callerId)` mocked to resolve `null`, a non-DM role, or an inactive status, rejects with `PartyCampaignAuthorizationError` and `removePartyFromAllCampaigns` is NOT called.** This is the regression test for the Verity-flagged gap: the unlink path must authorize the campaign being removed, not just a campaign being added.
- [ ] `reassignPartyCampaign(updatedParty, 'camp-2', 'camp-1', callerId)` (relink), with `getMember` mocked so `callerId` is an active DM of both `camp-1` and `camp-2`, calls `removePartyFromAllCampaigns` then `addPartyToCampaign('camp-2', updatedParty.id, callerId)`.
- [ ] `reassignPartyCampaign(updatedParty, 'camp-2', 'camp-1', callerId)`, with `callerId` an active DM of `camp-1` but NOT of `camp-2`, rejects with `PartyCampaignAuthorizationError` (thrown from `addPartyToCampaign`); verify whatever rollback behavior is implemented (e.g. whether `camp-1`'s link is restored or left removed) is asserted explicitly and documented in the PR description if changed from today's `reassignCampaign` rollback.
- [ ] `reassignPartyCampaign(updatedParty, 'camp-2', 'camp-1', callerId)`, with `callerId` NOT an active DM of `camp-1` (the campaign being removed) — even if they ARE an active DM of `camp-2` — rejects with `PartyCampaignAuthorizationError` before `removePartyFromAllCampaigns` or `addPartyToCampaign` is called.

_Maps to: tasks.md Task 4; specs/party-campaign-authorization/spec.md → "ADDED Party-campaign link authorization" scenarios "Active DM relinks...", "Active DM explicitly unlinks...", and "Non-DM cannot unlink a party from a campaign they don't run", plus Non-Functional "Malformed input never produces an unhandled 500" where relevant._

### Task 5 — `POST /api/parties` route

- [ ] `campaignId: null` (or `123`, `true`, `[]`, `{}`) → 400, party not created, `partyRepo.saveParty`/`addPartyToCampaign` not called.
- [ ] `campaignId: undefined` (omitted from body) → existing behavior unchanged: party created without a campaign link, `addPartyToCampaign` not called. (Regression test for existing passing case "no share check when campaignId absent".)
- [ ] `campaignId: 'camp-1'`, character-share check passes, `addPartyToCampaign` mocked to reject with `PartyCampaignAuthorizationError` → 403, and the existing compensating `partyRepo.deleteParty` is still called (rollback preserved).
- [ ] `campaignId: 'camp-1'`, character-share check passes, `addPartyToCampaign` mocked to resolve → 201, response body includes the created party (regression test for existing passing case "returns 201 when campaignId set and shared character allowed").
- [ ] `partyRepo.addPartyToCampaign` is called with `auth.userId` as its third argument (confirms `callerId` threading, not just that it's called).

_Maps to: tasks.md Task 5; specs/party-campaign-authorization/spec.md → "ADDED Party-campaign link authorization" and "ADDED Reject non-string `campaignId`"._

### Task 6 — `PUT /api/parties/[id]` route

- [ ] Raw JSON body `null` → 400, no repo calls made (`partyRepo.loadParties` not called, or called but no mutation calls follow — assert no `saveParty`/`reassignPartyCampaign` call).
- [ ] Raw JSON body `[]` (array) → 400.
- [ ] Raw JSON body `"a string"` → 400.
- [ ] Raw JSON body `42` → 400.
- [ ] Valid object body with `campaignId: null` (or `123`, `true`, `[]`, `{}`) → 400, `reassignPartyCampaign` not called.
- [ ] Valid object body with `campaignId` omitted → existing behavior unchanged (regression test for existing passing case around `campaignId` undefined / no-op path).
- [ ] Valid object body with `campaignId: ''`, `reassignPartyCampaign` mocked to resolve → 200, party's `campaignId` field removed from the response (regression test for existing passing case "removes campaignId when empty string provided").
- [ ] Valid object body with `campaignId: 'camp-2'`, `reassignPartyCampaign` mocked to reject with `PartyCampaignAuthorizationError` → 403, `partyRepo.saveParty` not called (update is not persisted when the campaign link is unauthorized).
- [ ] Valid object body with `campaignId: ''` (unlink attempt), `reassignPartyCampaign` mocked to reject with `PartyCampaignAuthorizationError` → 403, `partyRepo.saveParty` not called. Route-level regression test for the non-DM-unlink case; the route itself is agnostic to *why* `reassignPartyCampaign` rejected (removal-side vs. addition-side authorization), so this exercises the same 403 path as the relink-rejection case above but confirms it also fires for a pure unlink.
- [ ] Valid object body with `campaignId: 'camp-2'`, `reassignPartyCampaign` mocked to resolve → 200 (regression test for existing passing case "sets campaignId when non-empty string provided").
- [ ] `partyRepo.reassignPartyCampaign` is called with `auth.userId` as its fourth argument.

_Maps to: tasks.md Task 6; specs/party-campaign-authorization/spec.md → all three ADDED requirements._

### Task 7 — Existing test/mock updates

- [ ] `tests/unit/api/parties/route.test.ts`'s `jest.mock("@/lib/storage/partyRepo", ...)` factory includes `reassignPartyCampaign: jest.fn()` alongside the existing mocked exports.
- [ ] Every existing assertion on `addPartyToCampaign`'s call arguments is updated to expect the new 3-arg call (`campaignId, partyId, callerId`), and passes.
- [ ] Full existing test file run (`npm run test:unit -- tests/unit/api/parties/route.test.ts`) passes with zero regressions before adding the new cases from Tasks 5/6/8.

### Task 8 — Full spec coverage sweep

- [ ] Every scenario listed in `specs/party-campaign-authorization/spec.md` has at least one corresponding test case above (cross-checked against the spec's Traceability section).
- [ ] `npm run test:unit` passes with all new and existing tests green.
- [ ] `npm run test:integration` passes (confirms no integration-level regression in `tests/integration/api/parties.test.ts` / `tests/integration/api/campaignParties.test.ts`, which exercise these routes against a real/in-memory DB).
- [ ] `npm run typecheck` passes (confirms the `addPartyToCampaign`/`reassignPartyCampaign` signature changes don't leave any stale call sites).
