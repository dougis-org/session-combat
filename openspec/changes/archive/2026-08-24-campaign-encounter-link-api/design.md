## Context

- Relevant architecture: Next.js API routes under `app/api/**/route.ts`, using `withAuth` / `withAuthAndParams` middleware (`lib/middleware.ts`) to resolve `auth.userId`. Storage is a thin wrapper (`lib/storage.ts`) directly over the MongoDB native driver — no ORM, no transactions anywhere in the codebase. Campaign membership/role is resolved via `assertCampaignAccess()` (`lib/utils/campaign.ts`), which calls `storage.getMember(campaignId, userId)` (role `'dm' | 'player'`, must be `status: 'active'`) and `storage.loadCampaignByIdAny(campaignId)`.
- Dependencies: #535 (merged) — `Campaign.encounterIds?: string[]` in `lib/types.ts`, defaulted to `[]` in `normalizeCampaign()` (`lib/storage.ts:56-64`).
- Interfaces/contracts touched:
  - New: `GET /api/campaigns/[id]/encounters`, `POST /api/campaigns/[id]/encounters`, `DELETE /api/campaigns/[id]/encounters/[encounterId]`
  - Modified: `POST /api/encounters` (optional `campaignId` in body)
  - New `lib/storage.ts` methods (see Decision 2)

## Goals / Non-Goals

### Goals

- Any active campaign member can read the campaign's resolved encounter list (combat setup must work for players, not just the DM).
- Only the campaign's DM can create or remove a link.
- Linking is idempotent; unlinking is idempotent.
- Unlinking never deletes the underlying `Encounter` document.
- Creating an encounter with a `campaignId` links it in one request when the requester is that campaign's DM, without introducing transactional complexity the rest of the codebase doesn't have.
- Every new route follows the existing 404-only, `withAuth`/`withAuthAndParams` + `NextResponse.json` conventions already in `app/api/campaigns/[id]/route.ts` and `app/api/encounters/route.ts`.

### Non-Goals

- Cross-user encounter sharing or a `campaignEncounterShares`-style join collection (no precedent needed — encounters are always owned by the campaign's own DM in this model).
- Introducing Mongo transactions/sessions to the storage layer.
- Any UI or hook changes (`CombatSetupView`, `useCombat`, encounters-management page) — separate issues.

## Decisions

### Decision 1: Authorization split — read is membership-gated, write is DM-gated

- Chosen: `GET /api/campaigns/[id]/encounters` calls `assertCampaignAccess(id, auth.userId)` and proceeds for any role (`'dm'` or `'player'`) as long as `status === 'active'`. `POST` and `DELETE` call the same `assertCampaignAccess`, then additionally check `if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })` — identical to the existing pattern in `app/api/campaigns/[id]/route.ts` PATCH/DELETE.
- Alternatives considered: (a) Gate `GET` to DM-only too, matching the issue's literal ownership-check wording. (b) Gate `GET` to DM-only *and* have the picker call a different, player-facing endpoint later.
- Rationale: The design spec (`docs/superpowers/specs/2026-08-23-campaign-encounter-linking-design.md`) states `CombatSetupView` via `useCombat({ campaignId })` fetches the campaign's linked encounters for *any* campaign member running combat, not just the DM. Gating `GET` to DM-only would break that consumer before it's even built. Mutation stays DM-only because encounter curation (what's "in" the campaign's library) is a DM responsibility, mirroring chapter/status edits in `PATCH /api/campaigns/[id]`.
- Trade-offs: Players can see (but not modify) the DM's full linked-encounter list, including encounter details (monster stat blocks) that could be spoilers if a DM links an encounter before it's meant to be revealed. Accepted as consistent with how `PATCH` campaign chapters already expose DM-authored content to all members; no spoiler-gating exists elsewhere in the codebase either.

### Decision 2: New storage methods, no query filtering by requester userId in resolution

- Chosen: Add to `lib/storage.ts`:
  - `async loadEncountersByIds(ids: string[], ownerUserId: string): Promise<Encounter[]>` — `db.collection<Encounter>("encounters").find({ id: { $in: ids }, userId: ownerUserId }).toArray()`, mapped through `normalizeStoredEntityId`. `ownerUserId` is the **campaign's** `userId` (`campaign.userId`, the DM who owns the campaign doc), not the requester's `auth.userId`. Returns `[]` immediately if `ids.length === 0` (skip the query).
  - `async addEncounterToCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void>` — `updateOne({ id: campaignId, userId: dmUserId }, { $addToSet: { encounterIds: encounterId } })`.
  - `async removeEncounterFromCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void>` — `updateOne({ id: campaignId, userId: dmUserId }, { $pull: { encounterIds: encounterId } })`.
- Alternatives considered: (a) Do the `$in`/`$addToSet`/`$pull` queries inline in the route handlers instead of adding storage methods. (b) Filter `loadEncountersByIds` by the *requester's* `userId` per the issue's literal text.
- Rationale: Every other route in the codebase delegates persistence to `lib/storage.ts` (see `saveCampaign`, `saveEncounter`) — inline queries in route handlers would break that convention. Filtering by `campaign.userId` (not requester) is required for Decision 1 to work: a player calling `GET` must still see the DM's encounters. Since encounter linking is DM-only (Decision 1), `campaign.userId` and "the owner of every linked encounter" are always the same identity by construction — no cross-user ambiguity.
- Trade-offs: `addEncounterToCampaign`/`removeEncounterFromCampaign` scope the `updateOne` filter by `{ id: campaignId, userId: dmUserId }` rather than `{ id: campaignId }` alone. If campaign ownership (`campaign.userId`) and DM membership role ever diverge (e.g. DM role transferred to a different member without transferring `campaign.userId`), the mutation would silently match zero documents. Out of scope to fix here — matches the existing assumption baked into `saveCampaign`/`deleteCampaign`, which use the same `{ id, userId }` filter shape.

### Decision 3: Encounter ownership check on POST /api/campaigns/[id]/encounters

- Chosen: Before calling `addEncounterToCampaign`, verify the encounter being linked exists and belongs to `auth.userId` (the requesting DM), via a single `db.collection<Encounter>("encounters").findOne({ id: encounterId, userId: auth.userId })` (or reuse `loadEncountersByIds([encounterId], auth.userId)` and check length). If not found, return 404.
- Alternatives considered: Skip the ownership check and let `$addToSet` succeed unconditionally, relying on `loadEncountersByIds` at read time to silently exclude encounters that don't belong to the campaign owner.
- Rationale: The issue's acceptance criteria explicitly requires "Linking an encounter you don't own returns 403/404, not a silent no-op." Silently accepting the link (and having it vanish at read time) violates that criterion — the write must fail loudly.
- Trade-offs: One extra query per link call. Negligible cost; consistent with `canAddToCampaignParty`'s existing precedent of checking ownership before mutating (`lib/storage.ts:1173`).

### Decision 4: POST /api/encounters + campaignId — validate before create, no rollback after

- Chosen: In `app/api/encounters/route.ts` `POST`, if `campaignId` is present in the body:
  1. Call `assertCampaignAccess(campaignId, auth.userId)`; if not found or `role !== 'dm'`, return 404 **before** creating the encounter.
  2. Create and save the encounter exactly as today.
  3. Call `addEncounterToCampaign(campaignId, encounter.id, auth.userId)`.
  4. If step 3 throws, catch it, log it, and return `201` with the created encounter plus a non-fatal `linkError` field in the response body (e.g. `{ ...encounter, linkWarning: 'Encounter created but could not be linked to campaign; link it manually.' }`), rather than a 500 that would suggest total failure.
- Alternatives considered: (a) Wrap creation + link in a manual compensating transaction (delete the encounter if link fails). (b) Return 500 on link failure, discarding the encounter reference from the response (client would need to re-fetch to discover the orphan).
- Rationale: Matches the proposal's explicit decision that orphaned-but-preserved beats deleted. Returning the encounter with a warning field lets the client show "created, but not linked — try again from the Encounters tab" without a second round trip to discover what happened.
- Trade-offs: Introduces a response shape with an optional `linkWarning` field that callers must know to check; only surfaces on an already-rare failure path (DB error between two calls milliseconds apart), so the added client complexity is minor and isolated to this one endpoint.

### Decision 5: Error status codes

- Chosen: All new/modified routes return 404 (never 403) for: campaign not found, requester not an active member (GET), requester not DM (POST/DELETE), encounterId not found or not owned by the campaign's DM (POST link), encounterId not currently linked (DELETE — see below).
- Alternatives considered: Introduce 403 for role-based denials (member exists but wrong role) to distinguish from true not-found.
- Rationale: Zero existing routes in this codebase use 403; introducing it here would be an inconsistent one-off. Matches proposal Non-Goals.
- Trade-offs: Slightly less informative API responses; acceptable, matches app-wide precedent.

### Decision 6: DELETE unlink semantics

- Chosen: `DELETE /api/campaigns/[id]/encounters/[encounterId]` always returns 200 with a success message if the campaign exists and the requester is its DM, regardless of whether `encounterId` was actually present in `encounterIds` (`$pull` is naturally idempotent — removing a non-member is a no-op, not an error).
- Alternatives considered: 404 if `encounterId` isn't currently linked.
- Rationale: Matches the proposal's stated edge case ("Unlinking an encounter that isn't currently linked is a no-op success"). Avoids a redundant existence check before the `$pull`.
- Trade-offs: A client typo'd `encounterId` gets a silent 200 instead of a clear error. Acceptable — the endpoint's job is "ensure this id is not in the list," which is trivially true either way.

## Proposal to Design Mapping

- Proposal element: `GET /api/campaigns/[id]/encounters` readable by any campaign member
  - Design decision: Decision 1, Decision 2
  - Validation approach: Integration test — player member (non-DM) of a campaign with linked encounters calls `GET` and receives the full resolved list.
- Proposal element: `POST`/`DELETE` restricted to DM
  - Design decision: Decision 1
  - Validation approach: Integration test — player member calls `POST`/`DELETE` and receives 404.
- Proposal element: Linking an encounter you don't own returns 404
  - Design decision: Decision 3
  - Validation approach: Integration test — DM attempts to link another user's encounter id, receives 404, `encounterIds` unchanged.
- Proposal element: Linking twice is idempotent
  - Design decision: Decision 2 (`$addToSet`)
  - Validation approach: Integration test — POST same `encounterId` twice, `encounterIds` contains it once.
- Proposal element: Unlinking never deletes the `Encounter` document
  - Design decision: Decision 2, Decision 6
  - Validation approach: Integration test — DELETE link, then `GET /api/encounters/[id]` still returns the encounter.
- Proposal element: `POST /api/encounters` + `campaignId` creates and links atomically-from-caller's-perspective, orphan-on-link-failure
  - Design decision: Decision 4
  - Validation approach: Unit test with a mocked/forced storage failure on the link step, asserting the encounter is still created and the response signals `linkWarning` rather than throwing/500ing.
- Proposal element: 404-only convention
  - Design decision: Decision 5
  - Validation approach: Integration tests across all new routes assert no 403 is ever returned.

## Functional Requirements Mapping

- Requirement: Resolve a campaign's linked encounters for any active member
  - Design element: Decision 1, Decision 2 (`loadEncountersByIds`)
  - Acceptance criteria reference: Issue #536 — "resolve `campaign.encounterIds` to full `Encounter[]`"
  - Testability notes: Seed a campaign with a DM, a player member, and 2 linked + 1 unlinked encounter owned by the DM; assert player's `GET` returns exactly the 2 linked encounters.
- Requirement: DM-only link/unlink
  - Design element: Decision 1
  - Acceptance criteria reference: Exploration decision 1 (this proposal)
  - Testability notes: Assert player role gets 404 on POST and DELETE; DM gets 200/201.
- Requirement: Ownership-checked linking
  - Design element: Decision 3
  - Acceptance criteria reference: Issue #536 acceptance criteria — "Linking an encounter you don't own returns 403/404, not a silent no-op"
  - Testability notes: Attempt link with another user's encounter id; assert 404 and no mutation to `encounterIds`.
- Requirement: Idempotent link/unlink
  - Design element: Decision 2, Decision 6
  - Acceptance criteria reference: Issue #536 acceptance criteria
  - Testability notes: Double-POST and double-DELETE both assert stable end state and 2xx response each time.
- Requirement: `POST /api/encounters` create+link convenience
  - Design element: Decision 4
  - Acceptance criteria reference: Issue #536 — "creates and links atomically from the caller's perspective"
  - Testability notes: Happy path integration test (encounter created, `encounterIds` updated); failure-path unit test per Decision 4.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: No route leaks existence/ownership info via status code
  - Design element: Decision 5
  - Acceptance criteria reference: Proposal Non-Goals — "changing the 404-only error convention"
  - Testability notes: Grep-level check in review — no `status: 403` introduced anywhere in the diff.
- Requirement category: reliability
  - Requirement: Partial failure in create+link never loses user data
  - Design element: Decision 4
  - Acceptance criteria reference: Proposal Problem Space edge cases
  - Testability notes: Forced-failure unit test asserts the encounter row exists in storage even when the link call throws.
- Requirement category: performance
  - Requirement: Resolving a campaign's encounters is a single `$in` query, not N+1
  - Design element: Decision 2
  - Acceptance criteria reference: n/a (implementation quality)
  - Testability notes: Code review — `loadEncountersByIds` must be one `find()` call, not a loop over `loadEncounters` + filter.

## Risks / Trade-offs

- Risk/trade-off: Players can view full details (including stat blocks) of every encounter the DM has linked to a shared campaign, with no reveal/hide mechanism.
  - Impact: Potential spoilers for players if a DM links an encounter before the party is meant to see its contents.
  - Mitigation: Out of scope for this issue (no existing precedent for content-hiding in campaigns); flagged in Decision 1 for awareness. If this becomes a real problem, a future issue could add a `revealed: boolean` flag — not needed now.
- Risk/trade-off: `addEncounterToCampaign`/`removeEncounterFromCampaign` filter by `{ id: campaignId, userId: dmUserId }`, assuming `campaign.userId === ` the DM's id.
  - Impact: If a campaign is ever transferred to a different DM without updating `campaign.userId`, link/unlink would silently no-op (0 matched documents) rather than erroring.
  - Mitigation: Matches the existing assumption in `saveCampaign`/`deleteCampaign`. Not a new risk introduced by this change; no campaign-transfer feature exists today.

## Rollback / Mitigation

- Rollback trigger: New routes cause errors in production (e.g. 500s from a storage query bug) or the `POST /api/encounters` extension breaks the existing no-`campaignId` path.
- Rollback steps: Revert the PR(s) implementing this change. All new behavior is additive (new routes, an optional request field) — reverting drops the new routes and restores `POST /api/encounters` to its pre-change body-parsing behavior. No data migration was performed (`encounterIds` already exists and defaults safely per #535), so no data cleanup is needed on rollback.
- Data migration considerations: None — `Campaign.encounterIds` already exists and normalizes safely; this change only adds read/write access to a field that already tolerates being absent or empty.
- Verification after rollback: Confirm `POST /api/encounters` (no `campaignId`) and `GET /api/encounters` behave exactly as before the change; confirm the new `/api/campaigns/[id]/encounters` routes 404 (route no longer exists) rather than erroring.

## Operational Blocking Policy

- If CI checks fail: Fix before merge; do not bypass. Test failures on the new routes are expected to be tight (small surface area) — investigate rather than skip.
- If security checks fail: Fix before merge. Given this touches authorization logic (DM-only mutation gating), any security scanner flag on auth checks must be resolved, not suppressed.
- If required reviews are blocked/stale: Follow existing repo convention — no admin-merge bypass, no branch-protection bypass (per team's standing policy). Ping repo owner (doug) for review.
- Escalation path and timeout: If blocked more than one business day, flag to repo owner directly rather than working around the block.

## Open Questions

- Should `POST /api/encounters` with a `campaignId` the requester doesn't DM return 400 or 404? Defaulted to 404 in Decision 4 (treated as "campaign not found" per `assertCampaignAccess`'s existing 404-only shape) — carried over unresolved from proposal.md, non-blocking.
- Should link/unlink routes validate `encounterId` format before querying? Defaulted to no pre-validation (consistent with `app/api/encounters/[id]/route.ts`) — carried over unresolved from proposal.md, non-blocking.
