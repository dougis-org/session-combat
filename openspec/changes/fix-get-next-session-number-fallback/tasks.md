## 1. Storage layer

- [ ] 1.1 In `lib/storage.ts`, rewrite `getNextSessionNumber(userId, campaignId)` to wrap its existing `findOne` query in `runStorageOp({ name: "getNextSessionNumber", collection: "sessionLogs" }, fn)` (no `isEmpty` classifier), returning `runStorageOp`'s result directly.
- [ ] 1.2 Remove the method's existing `try/catch` + `console.error` + `return 1` fallback — failures must propagate as the `StorageError` thrown by `runStorageOp`.
- [ ] 1.3 Confirm imports for `runStorageOp` (`@/lib/storage/runOp`) are added to `lib/storage.ts`.

## 2. API error handling — sessions/route.ts

- [ ] 2.1 In `app/api/campaigns/[id]/sessions/route.ts`, isolate the `await storage.getNextSessionNumber(...)` call (used only when `sessionNumber` is not supplied in the body) in its own try/catch, separate from the handler's outer try/catch.
- [ ] 2.2 On catch, log the error distinctly (e.g. `console.error("Error determining next session number:", error)`) and return `NextResponse.json({ error: "Failed to determine next session number", code: "SESSION_NUMBER_UNAVAILABLE" }, { status: 503 })`.
- [ ] 2.3 Confirm the explicit-`sessionNumber` request path (where `getNextSessionNumber` is never called) is unaffected.

## 3. API error handling — sessions/active/route.ts

- [ ] 3.1 In `app/api/campaigns/[id]/sessions/active/route.ts`, reorder the handler to call `storage.getNextSessionNumber(campaign.userId, campaignId)` *before* `storage.claimActiveCampaignSession(...)`, per design.md Decision 4 — this closes the failure window where a claimed `activeSessionId` could be left with no matching `SessionLog`.
- [ ] 3.2 Wrap the (now earlier) `getNextSessionNumber` call in its own try/catch, separate from the handler's outer try/catch.
- [ ] 3.3 On catch, return the same distinguishable response shape as task 2.2 (`SESSION_NUMBER_UNAVAILABLE`, 503) — since this now runs before `claimActiveCampaignSession`, no rollback is needed: nothing has been mutated yet.
- [ ] 3.4 Confirm the existing "already active" 409 check (`if (campaign.activeSessionId)`) still runs first, ahead of the reordered `getNextSessionNumber` call, so an already-active campaign short-circuits before any lookup.

## 4. Tests

- [ ] 4.1 Add/extend unit tests for `storage.getNextSessionNumber` in the existing `lib/storage.ts` test suite: on DB failure, it rejects with a `StorageError` (not a resolved `1`).
- [ ] 4.2 Add a unit test proving no-collision: given an existing session numbered `1` for a campaign, a simulated DB failure on the next `getNextSessionNumber` call throws rather than resolving to `1` again.
- [ ] 4.3 Add/extend route tests for `POST /api/campaigns/[id]/sessions` (no `sessionNumber` in body): on `getNextSessionNumber` throwing, assert status `503`, `code: "SESSION_NUMBER_UNAVAILABLE"`, and that `storage.saveSessionLog` was never called.
- [ ] 4.4 Add/extend route tests for `POST /api/campaigns/[id]/sessions/active`: same failure-path assertions as 4.3, plus asserting `storage.claimActiveCampaignSession` was never called when `getNextSessionNumber` throws (proving the reorder in task 3.1 closed the dangling-claim window).
- [ ] 4.5 Add/extend a route test for `POST /api/campaigns/[id]/sessions` confirming the explicit-`sessionNumber` path still succeeds even when `getNextSessionNumber` would fail (proving it's never invoked).

## 5. Documentation

- [ ] 5.1 Confirm `design.md`'s "reference-example caveat for #504" note accurately reflects the final implementation.
