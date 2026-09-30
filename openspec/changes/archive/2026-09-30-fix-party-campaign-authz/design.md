## Context

- Relevant architecture: Next.js API routes under `app/api/parties/route.ts` (POST/GET) and `app/api/parties/[id]/route.ts` (GET/PUT/DELETE), backed by `lib/storage/partyRepo.ts` (MongoDB-backed repo functions) and `lib/storage/membershipRepo.ts` (campaign membership lookups, `getMember`).
- Dependencies: `lib/storage/errors.ts` (existing `StorageError` convention), `lib/middleware.ts` (`withAuth`/`withAuthAndParams`, supplies `auth.userId`), `lib/validation/core.ts` (`validateStringArray`, existing validation helper pattern).
- Interfaces/contracts touched:
  - `partyRepo.addPartyToCampaign(campaignId, partyId)` → becomes `addPartyToCampaign(campaignId, partyId, callerId)`.
  - New `partyRepo.reassignPartyCampaign(existingParty, campaignId, callerId)` (extracted from the route-local `reassignCampaign` in `app/api/parties/[id]/route.ts`).
  - New error class `PartyCampaignAuthorizationError` in `lib/storage/errors.ts`.
  - New shared validator `parseCampaignIdInput(value: unknown)` in `lib/validation/core.ts` (or colocated in `partyRepo.ts` if it needs no route-layer reuse beyond the two routes — see Decision 3).

## Goals / Non-Goals

### Goals

- Enforce that only an active DM of the *target* campaign can link, relink, or unlink a party to/from that campaign, at the repository layer so the check can't be bypassed by any current or future caller.
- Reject non-string, non-`undefined` `campaignId` values with 400 in both `POST /api/parties` and `PUT /api/parties/[id]`, without changing the meaning of `undefined` (no change) or `''` (explicit unlink).
- Reject non-object (or `null`/array) request bodies in `PUT /api/parties/[id]` with 400 before any field destructuring.
- Cover all of the above with unit tests in `tests/unit/api/parties/route.test.ts` and `partyRepo`'s own test suite.

### Non-Goals

- Changing the legacy `partyIds`-vs-`parties.campaignId` migration logic inside `addPartyToCampaign`/`removePartyFromCampaign`.
- Any frontend changes — `app/parties/page.tsx` already only ever sends a string `campaignId`.
- Broadening `canAddToCampaignParty`'s existing character-share semantics.
- Auditing other routes for similar authorization gaps.

## Decisions

### Decision 1: Enforce DM authorization inside `partyRepo`, not only in route handlers

- Chosen: `partyRepo.addPartyToCampaign(campaignId, partyId, callerId)` gains a required `callerId` param and, as its first step, verifies `getMember(campaignId, callerId)` returns a member with `role === 'dm'` and `status === 'active'`; throws `PartyCampaignAuthorizationError` if not. The route-local `reassignCampaign` helper in `app/api/parties/[id]/route.ts` is extracted into `partyRepo.reassignPartyCampaign(existingParty, campaignId, callerId)`, which internally calls `removePartyFromAllCampaigns` and `addPartyToCampaign`. Critically, `reassignPartyCampaign` also authorizes the *removal* side: whenever a change is requested (`campaignId !== undefined`) and the party currently has an `existingCampaignId`, it verifies `getMember(existingCampaignId, callerId)` is an active DM **before** calling `removePartyFromAllCampaigns` — an explicit unlink (`campaignId: ''`) is just as much a mutation of that campaign's party roster as a link, and requires the same authority. When `campaignId === undefined` (no change requested), no membership lookup is performed at all — this remains a pure no-op. So: relinking to a new campaign requires DM authority on *both* the old campaign (to remove) and the new one (to add, via `addPartyToCampaign`); a pure unlink (`campaignId: ''`) requires DM authority on the old campaign only (there is no new campaign to check).
- Alternatives considered:
  - Check only in route handlers (mirroring `canAddToCampaignParty`'s current boolean-check-in-route pattern): rejected because it doesn't protect any other current or future caller of `addPartyToCampaign` (e.g. scripts in `lib/scripts/`), and the issue explicitly asks for authorization "before linking" at the operation itself, not just at the HTTP boundary.
  - Fold the DM check into `canAddToCampaignParty`: rejected — that function authorizes *which characters* may be added given a campaign link already exists/is being requested; it is called once per character and would need to be needlessly re-run per character for what is a single campaign-level check. Keeping them separate keeps each function's contract single-purpose.
  - Authorize only the *new* campaign on relink/link, leaving `removePartyFromAllCampaigns` unauthorized: rejected — a non-DM (or a DM of an unrelated campaign) could otherwise strip any party's existing campaign link merely by sending `campaignId: ''`, which is exactly the kind of unauthorized mutation this change exists to close. Flagged by Verity's pre-commit gate during artifact drafting; folded in before implementation.
- Rationale: matches the "push the check into the methods themselves" decision; defense-in-depth so authorization survives future refactors of the route layer; symmetric authorization (both add and remove sides of a campaign-link mutation require DM authority on the campaign being mutated) closes the gap a new-campaign-only check would leave open.
- Trade-offs: `addPartyToCampaign`'s signature change requires updating its two existing call sites; the extraction of `reassignCampaign` into `partyRepo` slightly increases that module's surface area but consolidates the unlink+relink rollback logic in one tested place instead of duplicated per-route logic; a pure unlink now costs one extra `getMember` read it didn't need before (acceptable — single indexed lookup).

### Decision 2: Authorization failure surfaces as a distinct thrown error, mapped to 403 in routes

- Chosen: Add `export class PartyCampaignAuthorizationError extends Error` to `lib/storage/errors.ts` (constructed with `campaignId` and `userId` for logging), thrown by `addPartyToCampaign`/`reassignPartyCampaign` when the DM check fails. Both `POST /api/parties` and `PUT /api/parties/[id]` catch this specific error type before their generic `catch (error)` block and return `NextResponse.json({ error: 'Not authorized to link this campaign' }, { status: 403 })`; all other errors keep existing 500 handling.
- Alternatives considered: return a boolean/result type (mirrors `canAddToCampaignParty`) and have callers check it — rejected per Decision 1's rationale: a boolean return can be silently ignored by a careless caller, defeating defense-in-depth; a thrown error cannot be silently ignored.
- Rationale: consistent with `lib/storage/errors.ts`'s existing pattern of typed errors (`StorageError`) that callers can catch by `instanceof`.
- Trade-offs: routes need an extra `catch` branch (checked via `instanceof PartyCampaignAuthorizationError`) ahead of the generic handler; minor added branching, no behavioral downside.

### Decision 3: `campaignId` validation — reject non-string values only; preserve `''` and `undefined` semantics

- Chosen: Add a small shared helper (co-located in `lib/storage/partyRepo.ts` since both routes already import from it, or `lib/validation/core.ts` alongside `validateStringArray` for consistency with existing validation-helper placement — implementer's choice, prefer `lib/validation/core.ts`) that classifies `campaignId`:
  - `undefined` → `{ kind: 'omit' }` (no change to campaign link; `POST` = create without a link).
  - `typeof value === 'string'` → `{ kind: 'set', value: value.trim() }` (an empty-after-trim string is an explicit unlink request; a non-empty string is a link/relink request — both are *requests*, subject to the DM-authorization check in `partyRepo` per Decision 1 before they take effect).
  - anything else (`null`, number, boolean, array, object) → `{ kind: 'invalid' }`, and the route returns 400 immediately.
  - Both `POST` and `PUT` call this helper right after body-shape validation and before any repo calls.
- Alternatives considered: reject empty string too, requiring a different explicit-unlink signal (e.g. `campaignId: null`) — rejected per user decision; would require a frontend contract change (`app/parties/page.tsx`), which is out of scope and unnecessary since `''` unambiguously means "None" in the existing UI (`app/parties/page.tsx:352-356`) and is never ambiguous with "malformed."
- Rationale: matches confirmed frontend behavior exactly (frontend only ever sends a string); tightens validation only for values no legitimate caller sends.
- Trade-offs: a direct API caller (not the app's own frontend) that was previously sending a non-string `campaignId` and relying on the silent-unlink coercion will now get 400 instead — accepted, since that was undocumented, unintended behavior sitting on top of a bug.

## Proposal to Design Mapping

- Proposal element: "authorization is gated on the caller having active DM membership on the target campaign, enforced at the repository layer"
  - Design decision: Decision 1
  - Validation approach: unit tests in `partyRepo`'s test suite mocking `getMember` to return non-DM/inactive/absent members and asserting `addPartyToCampaign`/`reassignPartyCampaign` throw `PartyCampaignAuthorizationError`; route-level tests asserting 403 propagation.
- Proposal element: "the repo-level authorization error is caught by route handlers and mapped to 403"
  - Design decision: Decision 2
  - Validation approach: route unit tests mocking `partyRepo.addPartyToCampaign` (and `reassignPartyCampaign`) to reject with `PartyCampaignAuthorizationError` and asserting the HTTP response is 403 with a clear error body.
- Proposal element: "a `campaignId` that is not a string and not `undefined` is rejected with 400; `''` and `undefined` keep their existing meanings"
  - Design decision: Decision 3
  - Validation approach: route unit tests with `campaignId` set to `null`, `123`, `[]`, `{}`, `true` (expect 400), `''` (expect unlink succeeds), `undefined` (expect no-op / omitted from repo calls).
- Proposal element: "`PUT`'s body is validated as a non-null plain object before any field is destructured"
  - Design decision: (new, not separately numbered — implemented as a guard clause at the top of `PUT`, same file as Decision 3's helper) `typeof body === 'object' && body !== null && !Array.isArray(body)` checked immediately after `await request.json()`, before destructuring; else 400.
  - Validation approach: route unit tests sending `null`, `[]`, `"a string"`, `42` as the raw JSON body and asserting 400 (not 500).

## Functional Requirements Mapping

- Requirement: Non-DM active campaign member cannot link/relink/unlink a party to a campaign they don't run.
  - Design element: Decision 1 + Decision 2 (`addPartyToCampaign`/`reassignPartyCampaign` throw, routes map to 403).
  - Acceptance criteria reference: `specs/party-campaign-authorization/spec.md` (new capability spec, see below).
  - Testability notes: fully unit-testable by mocking `membershipRepo.getMember`; no real DB needed given existing mock-based test conventions in `tests/unit/api/parties/route.test.ts`.
- Requirement: DM of an unrelated campaign cannot link a party into a campaign they don't run.
  - Design element: Decision 1 (check is scoped to `getMember(campaignId, callerId)` for the *target* `campaignId`, not any campaign the caller happens to DM).
  - Acceptance criteria reference: same spec as above.
  - Testability notes: mock `getMember` to return an active DM row for a *different* campaign id than the one being linked; assert rejection.
- Requirement: Malformed (non-string) `campaignId` is rejected with 400, not silently coerced to unlink.
  - Design element: Decision 3.
  - Acceptance criteria reference: `specs/party-campaign-authorization/spec.md`.
  - Testability notes: parametrized unit tests over `[null, 123, true, [], {}]`.
- Requirement: Non-object `PUT` request body is rejected with 400, not a generic 500.
  - Design element: body-shape guard (see mapping above).
  - Acceptance criteria reference: `specs/party-campaign-authorization/spec.md`.
  - Testability notes: parametrized unit tests over `[null, [], "str", 42]` as the raw body.
- Requirement: Legitimate flows are unaffected for the actual DM — valid unlink (`campaignId: ''`) by the DM of the currently-linked campaign, valid link/relink by the DM of the target campaign(s), and no-op (`campaignId: undefined`) all continue to succeed.
  - Design element: Decision 3 (explicit `omit`/`set('')` classification preserves existing input semantics); Decision 1 adds authorization on both the add and remove sides but does not change the happy path *for an authorized DM*.
  - Acceptance criteria reference: `specs/party-campaign-authorization/spec.md`.
  - Testability notes: regression-test the existing passing cases already in `tests/unit/api/parties/route.test.ts` (e.g. "removes campaignId when empty string provided") continue to pass once the test's mocked caller is given active DM membership on the relevant campaign(s).
- Requirement: A non-DM (or a DM of an unrelated campaign) cannot strip an existing party-campaign link by sending an explicit unlink (`campaignId: ''`).
  - Design element: Decision 1 (`reassignPartyCampaign` authorizes `existingCampaignId` before calling `removePartyFromAllCampaigns`).
  - Acceptance criteria reference: `specs/party-campaign-authorization/spec.md`.
  - Testability notes: mock `getMember(existingCampaignId, callerId)` to return `null`/non-DM/inactive and assert `reassignPartyCampaign` throws `PartyCampaignAuthorizationError` without calling `removePartyFromAllCampaigns`.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Authorization check cannot be bypassed by calling the repo function directly (i.e., it's not solely an HTTP-layer concern).
  - Design element: Decision 1 (check lives inside `partyRepo.addPartyToCampaign`/`reassignPartyCampaign`).
  - Acceptance criteria reference: `specs/party-campaign-authorization/spec.md`.
  - Testability notes: unit test calls `partyRepo.addPartyToCampaign` directly (not through a route) with a non-DM `callerId` and asserts it throws.
- Requirement category: reliability
  - Requirement: Malformed input never produces a 500; it's always classified into a clear 400.
  - Design element: Decision 3 + body-shape guard.
  - Acceptance criteria reference: `specs/party-campaign-authorization/spec.md`.
  - Testability notes: assert response status and JSON error body shape for every malformed-input test case.
- Requirement category: performance
  - Requirement: The added `getMember` lookups are single indexed reads, bounded by the number of campaigns being mutated (at most one for a link or a pure unlink, at most two for a relink — old campaign + new campaign), never proportional to `characterIds.length`; no N+1 relative to existing `canAddToCampaignParty` per-character checks.
  - Design element: Decision 1 (`addPartyToCampaign` issues one `getMember` call for the target campaign; `reassignPartyCampaign` issues up to one additional `getMember` call for `existingCampaignId` before removal, independent of `characterIds` length).
  - Acceptance criteria reference: n/a (no explicit perf spec item; called out here for reviewer awareness).
  - Testability notes: covered implicitly — unit tests assert `getMember` (mocked) is called at most twice per `PUT` campaign-reassignment operation (once per campaign touched), never once per character.

## Risks / Trade-offs

- Risk/trade-off: `addPartyToCampaign` signature change (`callerId` added) is a breaking change to its call sites.
  - Impact: Any missed call site fails to compile (TypeScript), or if untyped, could throw at runtime with `undefined` caller.
  - Mitigation: Both known call sites (`POST /api/parties`, and the new `reassignPartyCampaign` used by `PUT`) updated in this change; `tsc --noEmit` (or project's typecheck script) run before completion confirms no other call sites exist.
- Risk/trade-off: Extracting `reassignCampaign` out of `app/api/parties/[id]/route.ts` into `partyRepo.reassignPartyCampaign` changes where that logic's unit tests live.
  - Impact: Existing tests in `tests/unit/api/parties/route.test.ts` that exercise PUT's campaign-reassignment behavior via HTTP-level mocks of `partyRepo` functions need their mocks updated to mock `reassignPartyCampaign` instead of (or in addition to) `addPartyToCampaign`/`removePartyFromAllCampaigns` individually.
  - Mitigation: Update `tests/unit/api/parties/route.test.ts` mocks alongside the extraction in the same task; add new direct unit tests for `reassignPartyCampaign` in partyRepo's own test suite for the parts no longer exercised through the route mock.
- Risk/trade-off: Tightening `campaignId` type validation could reject a request some undiscovered caller relies on.
  - Impact: A caller sending a non-string `campaignId` would start getting 400 instead of a silent (and buggy) unlink.
  - Mitigation: Confirmed via `app/parties/page.tsx:352-356` that the only first-party caller sends strings exclusively; this is treated as fixing a bug, not a supported contract, consistent with the issue's ask.

## Rollback / Mitigation

- Rollback trigger: Post-merge, a legitimate caller is found to send a non-string `campaignId` or a non-object PUT body and is now broken (unexpected 400s in logs/monitoring), or a legitimate DM-role assignment path is found to not be reflected correctly by `getMember` (unexpected 403s for actual DMs).
- Rollback steps: Revert the PR (single self-contained commit set: `partyRepo.ts`, `lib/storage/errors.ts`, both route files, and their tests). No data migration was performed, so revert is a pure code rollback — no compensating data fix-up needed.
- Data migration considerations: None — no schema or stored-data changes; only authorization/validation logic in application code.
- Verification after rollback: Confirm `POST`/`PUT` party-campaign linking resumes previous (pre-fix) behavior via the existing pre-change test suite; re-open issue #782 to re-scope the fix.

## Operational Blocking Policy

- If CI checks fail: Fix the failing check (typecheck, lint, unit tests) before proceeding; do not bypass with `--no-verify` or admin-merge overrides (per project convention — see `[[feedback_no_admin_merge]]`).
- If security checks fail: This change is itself a security fix; any Verity/Codacy finding raised against the new code must be resolved or explicitly waived per `CLAUDE.md`'s waiver policy (human-approved reason required), never self-judged.
- If required reviews are blocked/stale: Follow standard PR process — do not force-merge; escalate to the requester (issue #782 author) if a reviewer is unresponsive beyond the team's normal SLA.
- Escalation path and timeout: If blocked for more than one business day awaiting review or CI infrastructure recovery, flag to the user directly rather than working around the gate.

## Open Questions

- None outstanding — the campaignId/empty-string question raised during proposal was resolved with the user before this design was written (empty string remains a valid unlink signal; only non-string values are rejected).
