## Context

- Relevant architecture:
  - `lib/storage/campaignRepo.ts` — `loadCampaigns(userId)` (owner-only `find({ userId })`) and `listCampaignsForMember(userId)` (already joins `campaignMembers → campaigns`, but returns only `{ id, name }` and is unused — no route/UI calls it).
  - `campaignMembers` collection: `{ id, campaignId, userId, role: 'dm'|'player', status: 'active'|'invited'|'declined'|'removed', history }`. Every campaign gets a `role: 'dm', status: 'active'` row for its creator at creation time (`app/api/campaigns/route.ts` POST), so ownership is already expressed as membership.
  - `app/api/campaigns/route.ts` GET — the only caller of `loadCampaigns` (confirmed via repo-wide grep; `lib/storage.ts:102` just re-exports it). Safe to change its query directly with no other server-side callers to reconcile.
  - `app/campaigns/page.tsx` — the only page rendering the full campaign list; fetches `GET /api/campaigns` and renders every item with the DM-oriented card (Edit/Delete/Members/Session Log actions), with no role awareness.
  - Two other client call sites of `GET /api/campaigns` exist: `app/parties/page.tsx` (reads `Campaign[]` fields `id`/`name` only, to build an id→name map) and `lib/components/ActiveCampaignBanner.tsx` (reads `data.campaigns`, which is `undefined` against today's bare-array response — a pre-existing, unrelated bug that already makes this banner permanently empty; out of scope, not touched by this change, called out so it isn't mistaken for something this change introduces).
  - `lib/utils/campaign.ts` `assertCampaignAccess(campaignId, userId)` — membership-based (`status === 'active'`), used by `/api/campaigns/[id]` and members sub-routes. Confirmed correct for non-owner members already; not modified by this change.
  - `PATCH /api/campaigns/[id]/members/me` — existing accept/decline endpoint for `invited` memberships; reused as-is by the new list-card action, no new endpoint.
- Dependencies: none new. No new packages, no schema migration (campaign creation already writes the DM membership row for every existing campaign going forward; historical campaigns created before the `campaignMembers` collection existed are assumed already backfilled, since `assertCampaignAccess` already depends on this today for the detail page to work for owners — if that assumption is wrong, it would already be breaking `/campaigns/[id]` today, so we treat it as a pre-existing invariant, not something this change must migrate).
- Interfaces/contracts touched:
  - `GET /api/campaigns` response shape: `Campaign[]` → `(Campaign & { memberRole: 'dm' | 'player'; memberStatus: 'active' | 'invited' })[]`. Additive fields only (no existing field renamed or removed), chosen with names that do not collide with `Campaign.status` (campaign lifecycle status) or any existing field, so `app/parties/page.tsx` and `ActiveCampaignBanner.tsx` keep working unchanged (they only read pre-existing `Campaign` fields).
  - `campaignRepo.loadCampaigns` signature/behavior changes from owner-only to membership-based; its single caller (`app/api/campaigns/route.ts`) is updated in the same change.

## Goals / Non-Goals

### Goals

- A member (DM, active player, or invited player) sees every campaign they have a live (`active`/`invited`) `campaignMembers` row for, on `/campaigns`.
- Each campaign in the list is labeled with the caller's relationship to it: DM, Player, or Invited.
- Invited rows offer inline Accept/Decline without navigating to a page that would 404 them.
- DM-owned campaigns keep today's full-featured card unchanged; Player/Invited campaigns get a lighter card that shares/extends the base card's presentational attributes instead of duplicating markup.
- `openspec/specs/campaign-crud/spec.md` no longer contradicts actual behavior.

### Non-Goals

- Changing `assertCampaignAccess` or unlocking detail-page access for `invited` members.
- Changing how invitations are created or how a DM discovers users to invite.
- Pagination/sorting/filtering of the list.
- Fixing the pre-existing `ActiveCampaignBanner` `data.campaigns` bug (unrelated, pre-dates this change).
- Real-time list updates via SSE when membership changes in another tab/session.

## Decisions

### Decision 1: Collapse `loadCampaigns` into a single membership-based query

- Chosen: Replace `campaignRepo.loadCampaigns(userId)`'s owner-only `find({ userId })` with a query that joins the caller's `campaignMembers` rows (`status in ['active', 'invited']`) to `campaigns`, returning each `Campaign` annotated with `memberRole` and `memberStatus` from that row. This becomes the one function `GET /api/campaigns` calls; `listCampaignsForMember`/`CampaignMemberSummary` (the unused `{id,name}`-only helper) is deleted as superseded — grep confirmed no other consumer.
- Alternatives considered:
  1. Keep `loadCampaigns` as owner-only and add a second query for member-only campaigns, merging both arrays in the route handler.
  2. Keep `loadCampaigns` as-is and merge client-side (two `fetch` calls from `app/campaigns/page.tsx`).
- Rationale: Since every campaign (including owned ones) already has a `campaignMembers` row for the owner (`role: 'dm'`), a single membership join covers DM, Player, and Invited uniformly — there is no real "owner" case distinct from "member" to special-case. This avoids two queries, two round trips, and de-duplication logic that alternative 1 would need (a campaign could never appear in both sets, but the code would still need to prove that). Server-side merge (over alternative 2) keeps authorization logic (which campaigns a user may see) in one server-side place rather than trusting the client to combine two responses correctly, consistent with how `assertCampaignAccess` already centralizes membership checks server-side.
- Trade-offs: The query is now a two-step read (memberships, then campaigns by id) inside `campaignRepo`, same pattern `listCampaignsForMember` already used — no new query complexity, but `loadCampaigns` callers elsewhere (none currently) would need to adapt to the new return shape if added later.

### Decision 2: Additive response fields, not a wrapper object

- Chosen: `GET /api/campaigns` returns a flat array of `Campaign & { memberRole, memberStatus }`, not `{ campaigns: [...], role: ... }` or similar wrapper.
- Alternatives considered: Wrapper object (`{ campaigns: [...] }`) — this is actually what `ActiveCampaignBanner.tsx` already (incorrectly) assumes the shape to be.
- Rationale: The route today returns a bare array and two working call sites (`app/campaigns/page.tsx`, `app/parties/page.tsx`) depend on that. Switching to a wrapper would require updating both and would only "fix" `ActiveCampaignBanner` as an incidental side effect of an unrelated bug — not worth entangling with this change. Flat array + additive fields is the smallest-blast-radius option.
- Trade-offs: `ActiveCampaignBanner`'s pre-existing bug remains unfixed (tracked as an out-of-scope observation, not silently masked).

### Decision 3: Lighter player-facing card extends the base card's shared building blocks

- Chosen: Factor the DM card's shared, non-DM-specific pieces (title/status badge row, module name line, chapter info line) out of `app/campaigns/page.tsx`'s current inline JSX into small shared presentational pieces (e.g. `CampaignCardHeader`), then build a new `PlayerCampaignCard` (or similarly named) component that composes those shared pieces plus role/status badge and role-appropriate actions (Player: link to Session Log only, no Edit/Delete/Members; Invited: Accept/Decline buttons calling `PATCH /api/campaigns/[id]/members/me`, no navigation links at all since the detail page 404s for non-active members). The existing full card keeps its DM-only actions (Members, Edit, Delete, Prompt Builder, Library, Encounters, Start Combat) unchanged.
- Alternatives considered: One `CampaignCard` component branching internally on `memberRole`/`memberStatus` for which actions to render.
- Rationale: Matches the user's explicit decision ("lighter player specific card... could extend the base attributes to prevent duplication"). Extracting shared header pieces avoids duplicating the title/badge/module/chapter markup between the two card variants, while keeping the DM card's already-large action set out of a single component that would otherwise need many conditional branches.
- Trade-offs: One extra layer of component decomposition vs. a single branching component; judged worth it given how large/DM-specific the existing card already is (six action links plus notes/party roster sections).

### Decision 4: Accept/decline stays on the list card, not a new page

- Chosen: Invited rows render Accept/Decline buttons directly in `PlayerCampaignCard`, calling the existing `PATCH /api/campaigns/[id]/members/me` with `{ action: 'accept' | 'decline' }`, then re-fetching the list on success (same pattern `saveCampaign`/`deleteCampaign` already use in `app/campaigns/page.tsx` — call, then `loadAll()`).
- Alternatives considered: Linking Invited rows to a dedicated `/campaigns/[id]/invite` confirmation page.
- Rationale: No new route needed; the endpoint already exists and already returns the new `status`. A dedicated page would be extra surface for a two-button decision, and the detail page can't be reused here since `assertCampaignAccess` 404s non-active members by design (Non-Goal: not changing that gate).
- Trade-offs: None significant — this is the minimal-surface option consistent with existing patterns in the file.

## Proposal to Design Mapping

- Proposal element: Replace owner-only query with membership-based query (Scope)
  - Design decision: Decision 1
  - Validation approach: Unit test on `campaignRepo` covering DM-owned, active-player, invited, declined, and removed membership rows; integration test on `GET /api/campaigns` asserting response shape and exclusion of declined/removed.
- Proposal element: Update `campaign-crud` spec (Scope)
  - Design decision: Decision 1 (behavioral basis for the spec rewrite)
  - Validation approach: `specs/campaign-crud/spec.md` scenario review against the new behavior; no automated check beyond existing spec-conformance tests if any exist.
- Proposal element: Split `/campaigns` page rendering into DM/Player/Invited (Scope)
  - Design decision: Decisions 2, 3
  - Validation approach: RTL component test on `CampaignsContent` rendering all three groupings from a mocked `GET /api/campaigns` response.
- Proposal element: Lighter player-facing card extending shared attributes (Scope, user decision)
  - Design decision: Decision 3
  - Validation approach: RTL test on the new card component in isolation (props → rendered role badge + correct action set).
- Proposal element: Invited rows offer inline accept/decline (Scope, user decision)
  - Design decision: Decision 4
  - Validation approach: RTL test simulating Accept/Decline click → asserts `PATCH .../members/me` called with correct body and list re-fetches.
- Proposal element: Remove/repurpose `listCampaignsForMember`/`CampaignMemberSummary` (Open Question in proposal)
  - Design decision: Decision 1 (resolved: delete, no other consumer found)
  - Validation approach: Grep-based confirmation already performed during design; no runtime test needed for a deletion, but existing tests referencing the deleted symbol must be removed/updated.

## Functional Requirements Mapping

- Requirement: A campaign owner (DM) continues to see all campaigns they created, unchanged in presentation.
  - Design element: Decision 1 query includes `memberRole: 'dm'` rows; Decision 3 keeps the existing full card for these.
  - Acceptance criteria reference: `specs/campaign-crud/spec.md` — revised "Listing campaigns" scenarios (DM case).
  - Testability notes: Existing owner-listing tests should continue to pass with `memberRole: 'dm'` asserted additively.
- Requirement: A user with an `active` `player` membership sees the campaign, labeled "Player", with a lighter card.
  - Design element: Decision 1 (query), Decision 3 (card).
  - Acceptance criteria reference: `specs/campaign-crud/spec.md` — new "Player" scenario.
  - Testability notes: `campaignRepo` unit test + `CampaignsContent` RTL test with a mocked active-player row.
- Requirement: A user with an `invited` membership sees the campaign, labeled "Invited", with Accept/Decline actions, and no navigable Members/Session Log links.
  - Design element: Decision 1 (query includes `invited` status), Decision 3 (card variant), Decision 4 (actions).
  - Acceptance criteria reference: `specs/campaign-crud/spec.md` — new "Invited" scenario.
  - Testability notes: RTL test asserting no `href` link to `/campaigns/[id]` renders for Invited rows, and that Accept/Decline call the `members/me` endpoint.
- Requirement: `declined`/`removed` memberships never appear in the list.
  - Design element: Decision 1 query filter (`status in ['active','invited']` only).
  - Acceptance criteria reference: `specs/campaign-crud/spec.md` — exclusion scenario.
  - Testability notes: `campaignRepo` unit test asserting a `declined` row is excluded from results.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Listing campaigns remains a small, bounded number of queries (no N+1 per campaign).
  - Design element: Decision 1 — two queries total (memberships for user, then campaigns by `$in` ids), matching the existing `listCampaignsForMember` pattern being replaced.
  - Acceptance criteria reference: design review only (no explicit perf test planned; existing pattern already used in production for `listCampaignsForMember`).
  - Testability notes: Not separately tested; inherits the already-proven two-query shape.
- Requirement category: security
  - Requirement: A user must never see a campaign they hold no live membership row for.
  - Design element: Decision 1 — query is strictly membership-driven; no fallback to broader visibility.
  - Acceptance criteria reference: `specs/campaign-crud/spec.md` — negative scenario (user with no membership sees nothing for that campaign).
  - Testability notes: `campaignRepo` unit test with a campaign the caller has zero membership rows for, asserting it is absent from results.
- Requirement category: reliability
  - Requirement: Existing consumers of `GET /api/campaigns` (`app/parties/page.tsx`) do not regress.
  - Design element: Decision 2 — additive-only response shape.
  - Acceptance criteria reference: existing `app/parties/page.tsx` tests, if any, continue passing unmodified.
  - Testability notes: Re-run existing test suite for `app/parties/page.tsx` after the change; no new fields expected to be consumed there.

## Risks / Trade-offs

- Risk/trade-off: Deleting `listCampaignsForMember`/`CampaignMemberSummary` removes a public-shaped helper that, while unused today, was purpose-built in an earlier change (`2026-05-31-campaign-members-collection`) potentially for future reuse.
  - Impact: Low — grep-confirmed zero current consumers; if a future need arises, the new unified query in `campaignRepo` already provides a superset of that data.
  - Mitigation: Call out the deletion explicitly in tasks.md so it's a deliberate, reviewable line in the diff rather than incidental.
- Risk/trade-off: Splitting `/campaigns` page rendering into three groupings changes visual structure for DM users too (their campaigns move into an explicit "DM" grouping/label where today there's no label at all).
  - Impact: Minor UX change for the majority (DM) user path.
  - Mitigation: Keep DM section visually primary/first (matches today's "Active Campaigns" + full list ordering) and treat the DM label as an additive badge, not a structural demotion.

## Rollback / Mitigation

- Rollback trigger: `GET /api/campaigns` regressions reported (wrong campaigns visible/missing) or `/campaigns` page test failures post-merge that aren't caught pre-release.
- Rollback steps: Revert the `campaignRepo`/route/page commits (this change is additive-schema, no destructive migration, so a straight `git revert` of the PR is sufficient); `campaignMembers` and `campaigns` collections are untouched in shape.
- Data migration considerations: None — no schema change, no data backfill introduced by this change (the DM membership row already exists for all campaigns as a pre-existing invariant, not something this change creates).
- Verification after rollback: Confirm `GET /api/campaigns` reverts to returning only owner campaigns and `/campaigns` page renders the single unlabeled grid as before.

## Operational Blocking Policy

- If CI checks fail: Fix the failing test/build before merge; do not merge with red CI. No exceptions carved out by this change.
- If security checks fail: Treat as blocking; this change touches authorization-adjacent code (what a user may list), so any security-scan finding on the new query/route must be resolved or explicitly waived per the repo's `verity waive` policy (requires a cited human-accepted source), not silently ignored.
- If required reviews are blocked/stale: Follow standard repo PR process (no special-casing here); ping reviewer or reassign per normal team practice.
- Escalation path and timeout: No change-specific escalation beyond standard repo practice; this is a UI/query change with a straightforward rollback, not an operationally sensitive path (no cron jobs, no external integrations).

## Open Questions

- None beyond those already tracked as non-blocking in `proposal.md` (badge visual convention, and whether declined/removed should ever resurface as a "past campaigns" view). Both are deferred to implementation-time judgment / follow-up, not blockers for `tasks`/`specs`.
