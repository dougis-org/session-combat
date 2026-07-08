## Context

- Relevant architecture: Next.js App Router API routes under `app/api/**`, wrapped with `withAuth` / `withAuthAndParams` (`lib/middleware.ts`). Storage access goes through the `storage` singleton (`lib/storage.ts`). Party data model is `Party` / `PartyMember` (`lib/types.ts`), already supporting multi-party membership with `addedAt`/`leftAt` history.
- Dependencies: #471 (merged) — `PUT /api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts` already implements self-service character-to-party updates with ownership and authorization checks. This change adds a read path and UI on top; it does not modify that route.
- Interfaces/contracts touched:
  - New: `GET /api/campaigns/[id]/parties/route.ts`
  - New: client component `lib/components/PartyMembershipPanel.tsx`
  - Modified: `app/campaigns/[id]/page.tsx` (render the new panel)
  - Untouched: `lib/components/SharedCharactersPanel.tsx`, `CampaignCharacterShare`-related routes/types (#473 scope)

## Goals / Non-Goals

### Goals

- Any active campaign member can retrieve the list of parties in that campaign, regardless of party ownership.
- Each party in the campaign gets its own independent character multi-select for the current player's own characters.
- Toggling a character's membership in one party has no effect on any other party.
- Reuse the existing PUT endpoint from #471 exactly as-is (no changes to its contract or authorization).

### Non-Goals

- Changing `/api/parties` (owner-scoped) or `PartyEditor` on `/parties`.
- Real-time sync across tabs/users (SSE) for party membership changes.
- Removing `SharedCharactersPanel` or `CampaignCharacterShare` (tracked in #473).

## Decisions

### Decision 1: New GET route authorized by "active campaign member," not by party ownership

- Chosen: `app/api/campaigns/[id]/parties/route.ts` exports `GET = withAuthAndParams<{ id: string }>(...)`. Handler calls `storage.getMember(campaignId, auth.userId)` and requires `member && member.status === 'active'` (any role) before calling `storage.loadPartiesByCampaign(campaignId)` and returning the result.
- Alternatives considered:
  1. Reuse `/api/parties` and filter/expand client-side to include non-owned parties — rejected, would require loosening `loadParties(auth.userId)` globally and leaking non-campaign parties.
  2. Mirror the PUT route's `isAuthorized` (self-or-active-DM) — rejected, that check is about mutating a specific *other* member's data; listing parties has no "target member," so the correct check is simply campaign membership.
- Rationale: Matches how party membership visibility is scoped elsewhere (a campaign's parties are visible to its members) without touching ownership semantics used by `/api/parties`.
- Trade-offs: Introduces a second way to fetch parties (by campaign vs by owner); acceptable since they serve different audiences (DM-authoring view vs player-joining view).

### Decision 2: One independent panel instance per `Party`, keyed by `party.id`

- Chosen: New component `PartyMembershipPanel` takes a single `party: Party` and the player's own `characters: Character[]`. The campaign page fetches `GET /api/campaigns/{id}/parties` once, then renders `parties.map(party => <PartyMembershipPanel key={party.id} party={party} characters={myCharacters} campaignId={id} />)`.
- Alternatives considered:
  1. Single combined component managing a map of `partyId -> Set<characterId>` — rejected, adds shared-state complexity for no benefit since parties are independent; a per-party component keeps each instance's `toggling`/optimistic state isolated for free (same pattern `SharedCharactersPanel` already uses internally).
- Rationale: Matches the confirmed requirement that a character may join multiple parties in a campaign independently, and keeps each panel's request lifecycle self-contained.
- Trade-offs: N components mounted for N parties in a campaign; acceptable given campaigns typically have few parties.

### Decision 3: Optimistic toggle with per-character in-flight guard, PUT sends full active-character-id set for that party

- Chosen: Each panel keeps local state `activeIds: Set<string>` (derived from `party.members` filtered to the player's own character ids with no `leftAt`) and `toggling: Set<string>`. On toggle: optimistically update `activeIds`, add the character id to `toggling` (disabling its checkbox), `PUT` the full `Array.from(activeIds)` for that party+member, and on failure revert `activeIds` to the pre-toggle value. This exactly mirrors the existing pattern in `SharedCharactersPanel.tsx`.
- Alternatives considered:
  1. Send only the delta (single character id + add/remove flag) — rejected, the PUT contract from #471 takes a full `characterIds` array and merges by diff internally; sending a partial set would incorrectly mark other already-active characters as left.
  2. Disable the whole panel during any in-flight request — rejected, unnecessarily blocks unrelated character toggles within the same party.
- Rationale: Reuses a request contract and UI pattern already proven in this codebase; avoids introducing a new interaction model.
- Trade-offs: Two rapid toggles on the *same* character before the first PUT resolves could still race; mitigated by disabling that specific character's checkbox while its request is in flight (same as `SharedCharactersPanel`).

## Proposal to Design Mapping

- Proposal element: New `GET /api/campaigns/{id}/parties` endpoint, active-member auth
  - Design decision: Decision 1
  - Validation approach: Integration test — active member of any role gets 200 with parties; non-member gets 403/404; inactive member gets 403/404.
- Proposal element: One panel per party, independent per-party state, multi-party membership allowed
  - Design decision: Decision 2
  - Validation approach: Unit test — two parties rendered from the same character list; toggling a character in party A does not change party B's checkbox state.
- Proposal element: Toggle wired to existing PUT endpoint, full characterIds per request
  - Design decision: Decision 3
  - Validation approach: Unit test — toggle fires PUT with the full expected characterIds array; failed PUT reverts the checkbox.

## Functional Requirements Mapping

- Requirement: Active campaign member can list all parties in the campaign.
  - Design element: Decision 1 (`GET /api/campaigns/[id]/parties/route.ts`)
  - Acceptance criteria reference: specs/party-membership-panel/spec.md — "member can list campaign parties"
  - Testability notes: Integration test hitting the route with active/inactive/non-member auth contexts.
- Requirement: Player can independently add/remove their own characters to/from each party in the campaign.
  - Design element: Decisions 2 and 3 (`PartyMembershipPanel`)
  - Acceptance criteria reference: specs/party-membership-panel/spec.md — "player toggles character membership per party"
  - Testability notes: Component test simulating checkbox toggles and asserting fetch calls / reverted state on failure.
- Requirement: A character may be an active member of multiple parties in the same campaign simultaneously.
  - Design element: Decision 2
  - Acceptance criteria reference: specs/party-membership-panel/spec.md — "multi-party membership is independent"
  - Testability notes: Component test with two parties sharing a character where one shows checked and the other unchecked.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: A player must not be able to view or modify parties/characters outside their own campaign membership or character ownership.
  - Design element: Decision 1 (GET auth check); existing PUT auth/ownership checks from #471 are reused unchanged.
  - Acceptance criteria reference: specs/party-membership-panel/spec.md — "authorization boundaries"
  - Testability notes: Integration tests asserting 403/404 for non-members and for characters not owned by the caller (already covered by #471's existing tests for the PUT path; new tests only needed for the GET path).
- Requirement category: reliability
  - Requirement: A failed toggle request must not leave the UI showing an incorrect membership state.
  - Design element: Decision 3 (optimistic update + revert on failure)
  - Acceptance criteria reference: specs/party-membership-panel/spec.md — "toggle failure reverts UI"
  - Testability notes: Component test mocking a failed fetch and asserting the checkbox reverts.

## Risks / Trade-offs

- Risk/trade-off: New GET route duplicates some logic conceptually present in the PUT route's membership check (`storage.getMember` + active status).
  - Impact: Minor duplication of an auth check across two route files.
  - Mitigation: Acceptable at this scale; if a third route needs the same check, extract a shared helper then (not now — avoids premature abstraction).
- Risk/trade-off: Rendering N panels for N parties could clutter the campaign page if a campaign has many parties.
  - Impact: Visual noise for campaigns with unusually many parties.
  - Mitigation: Out of scope for this change; campaigns in practice have few parties. Revisit only if it becomes a real problem.

## Rollback / Mitigation

- Rollback trigger: New GET route or panel causes errors on the campaign page, or leaks party data across campaigns.
- Rollback steps: Revert the two new files (`route.ts`, `PartyMembershipPanel.tsx`) and the render call added to `app/campaigns/[id]/page.tsx`. No data migration involved — no schema or stored-data changes are introduced by this change.
- Data migration considerations: None. This change only adds a read endpoint and UI; it reuses the existing `PartyMember`/`Party` shapes and the already-merged PUT endpoint unchanged.
- Verification after rollback: Campaign page loads without the new panel; existing `/parties` DM flow and #471's PUT endpoint continue to work (unaffected by this change or its rollback).

## Operational Blocking Policy

- If CI checks fail: Fix the failing check before merging; do not bypass with admin merge or skip flags.
- If security checks fail: Treat as blocking — review the specific finding (e.g. authorization gap in the new GET route) and fix before proceeding; do not suppress.
- If required reviews are blocked/stale: Follow up with the reviewer; do not merge without required approvals.
- Escalation path and timeout: If blocked for more than one business day with no reviewer response, flag to the repo owner (dougis) directly.

## Open Questions

- None blocking. All prior open questions from proposal.md were resolved during exploration (auth model for GET, per-party UI shape, multi-party independence, #473 boundary).
