## GitHub Issues

- #714

## Why

- Problem statement: A user who is a member of a campaign they do not own (a player, or a user who has been invited but has not yet accepted) cannot see that campaign anywhere in the app. `GET /api/campaigns` and the `/campaigns` page only ever query `campaigns.userId = <caller>`, so campaigns where the caller merely holds a `campaignMembers` row are invisible to them.
- Why now: Reported directly by the product owner (issue #714, filed 2026-09-13) as a functional gap — players currently cannot find campaigns they've been added to at all, short of someone sending them a direct link.
- Business/user impact: Blocks the core "player" persona from using the campaign list entirely. Any campaign feature reachable from `/campaigns` (session log, prompts, library, encounters, combat) is effectively unreachable for non-DM members unless they bookmark a raw campaign URL.

## Problem Space

- Current behavior:
  - `campaignRepo.loadCampaigns(userId)` filters `campaigns` by `userId` (owner) only.
  - `app/campaigns/page.tsx` renders only what `GET /api/campaigns` returns — owned campaigns, unconditionally rendered with full DM-oriented cards (Edit/Delete/Members/Session Log actions).
  - A separate, already-built path exists but is unwired: `storage.listCampaignsForMember` / `campaignRepo.listCampaignsForMember(userId)` joins `campaignMembers → campaigns` and returns `{ id, name }[]`. Nothing calls it — no route, no UI.
  - Every campaign, owned or not, already has a `campaignMembers` row for its creator (`role: 'dm', status: 'active'`, written at creation time in `app/api/campaigns/route.ts` POST). So "owner" is not a distinct concept from "member" at the data layer — it is just `role === 'dm'` on the caller's own membership row.
  - `assertCampaignAccess` (`lib/utils/campaign.ts`) already gates `/api/campaigns/[id]` (detail, PATCH, DELETE) and the members sub-routes by membership (`status === 'active'`) rather than ownership, and further restricts mutations to `role === 'dm'`. This path already works correctly for non-owner members today; investigation found no gap here.
- Desired behavior: A user sees every campaign they hold an active or invited membership in, DM-owned or not, on `/campaigns`, each labeled with their role/status (DM, Player, or Invited). Invited-but-not-accepted campaigns offer accept/decline inline rather than linking into the detail page (which 404s for non-active members).
- Constraints:
  - `assertCampaignAccess` requires `status === 'active'` to view `/campaigns/[id]`; this change does not alter that gate — invited members act from the list card, not the detail page.
  - Existing owner-only spec scenario (`openspec/specs/campaign-crud/spec.md:26`, "Listing campaigns returns only the user's own campaigns") is being superseded by this change and must be revised, not left contradicting the new behavior.
- Assumptions:
  - There are no other server-side callers of `campaignRepo.loadCampaigns` that depend on its owner-only semantics in a way that would break if the underlying query changes (to be confirmed in design/investigation — see Open Questions).
  - `campaignMembers` rows are the sole source of truth for "who can see this campaign"; there is no separate sharing/ACL mechanism to reconcile.
- Edge cases considered:
  - A campaign with zero non-owner members: behaves identically to today (single `dm` row, unchanged list).
  - A declined or removed membership: must not resurface the campaign in the list (only `active` and `invited` statuses are listed).
  - A user who is both the historical owner and has multiple membership history entries (e.g. left and rejoined a party) — campaign-level membership status is what's queried, this is unaffected by party-level rejoin history ([[n001-preserve-party-membership-history-on-rejoin]] concerns `Party.members`, a different collection).
  - Very large membership counts (many campaigns per user) — out of scope for pagination in this change; existing `/campaigns` page has no pagination for owned campaigns either.

## Scope

### In Scope

- Replace the owner-only campaign query behind `GET /api/campaigns` with a membership-based query returning every campaign the caller has an `active` or `invited` `campaignMembers` row for, each annotated with `role` and `status`.
- Update `openspec/specs/campaign-crud/spec.md` to reflect membership-based listing (superseding the "only the user's own campaigns" scenario).
- Update `app/campaigns/page.tsx` to render three groupings/labels off the single list: DM (existing full card, unchanged), Player (new lighter card), Invited (lighter card + Accept/Decline wired to the existing `PATCH /api/campaigns/[id]/members/me` endpoint).
- Introduce a lighter player-facing campaign card that extends/reuses the base card's shared attributes (name, status badge, module name, chapter info) rather than duplicating markup, per user decision.
- Remove or repurpose the now-redundant `listCampaignsForMember` / `CampaignMemberSummary` if the new unified query replaces its purpose (design.md to confirm final shape).

### Out of Scope

- Changing `assertCampaignAccess` or detail-page (`/campaigns/[id]`) behavior for `invited` members — they still cannot open the detail page; they interact via the list-card accept/decline action only.
- Changing invitation creation/notification flows (how a DM invites a player) — unaffected.
- Pagination, sorting, or filtering controls for the campaign list.
- Any change to party-level (`PartyMember`) membership or history semantics.
- Mobile/responsive layout redesign beyond fitting the new card variant into the existing grid.

## What Changes

- `campaignRepo`: new or revised query returning full `Campaign` objects joined with the caller's `role`/`status` from `campaignMembers`, replacing (or superseding as the primary path) `loadCampaigns`'s owner-only query.
- `GET /api/campaigns` route: returns the membership-annotated list instead of owner-only campaigns.
- `app/campaigns/page.tsx`: splits the unified response into DM / Player / Invited groups (or labels), renders the existing card for DM rows and a new lighter card for Player/Invited rows, and wires Invited rows to accept/decline.
- New lightweight player-facing campaign card component (name TBD in design.md), sharing base attributes with the existing card to avoid duplication.
- `openspec/specs/campaign-crud/spec.md`: revise the listing requirement/scenario to describe membership-based visibility with role/status labeling.

## Risks

- Risk: Query/route change silently breaks another caller of `campaignRepo.loadCampaigns` or `GET /api/campaigns` that assumes owner-only results.
  - Impact: Could leak or over-expose campaign data to unexpected call sites, or break an unrelated feature relying on the owner-only contract.
  - Mitigation: Design phase enumerates all callers of `loadCampaigns` and `GET /api/campaigns` before changing the query; add/keep an owner-only helper if any caller genuinely needs owner-only semantics.
- Risk: Merging DM-owned and player/invited campaigns into one response changes the response shape (`Campaign[]` → `Campaign & { role, status }[]`), which could break any existing client code or tests that assume the old shape.
  - Impact: Test failures or subtle UI bugs on `/campaigns` and anywhere else consuming `GET /api/campaigns`.
  - Mitigation: Grep all `fetch('/api/campaigns')` call sites during design; add `role`/`status` as additive fields so existing consumers relying only on `Campaign` fields keep working.
- Risk: Invited-status campaigns showing an accept/decline action directly in the list duplicates or diverges from the existing `/members/me` PATCH flow's own UX assumptions.
  - Impact: Inconsistent accept/decline experience between list and any other place it might already surface (need to confirm none exists).
  - Mitigation: Reuse the existing `PATCH /api/campaigns/[id]/members/me` endpoint as-is; no new backend endpoint for accept/decline.

## Open Questions

- Question: Should `declined` or `removed` memberships ever be surfaced (e.g., a small "past campaigns" affordance), or strictly excluded as this proposal assumes?
  - Needed from: Product owner.
  - Blocker for apply: no (default to excluded; easy to extend later).
- Question: Exact visual differentiation for the three labels (DM / Player / Invited) — badge text/color convention to follow the existing `statusBadgeClass`/`statusLabel` pattern?
  - Needed from: Design phase judgment call, confirm during design.md.
  - Blocker for apply: no.
- Question: Does `listCampaignsForMember`/`CampaignMemberSummary` get deleted outright, or kept for another current/future use (e.g., a lightweight campaign picker elsewhere)?
  - Needed from: Codebase check during design (grep for other consumers); confirm with user if any found.
  - Blocker for apply: no.

## Non-Goals

- Building a general-purpose sharing/ACL system beyond the existing DM/player role model.
- Supporting roles beyond the existing `MEMBER_ROLES = ['dm', 'player']`.
- Real-time (SSE) updates to the campaign list when membership changes elsewhere (e.g., another tab accepts an invite) — a page refresh is sufficient for this change.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
