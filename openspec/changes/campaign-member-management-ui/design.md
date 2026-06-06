## Context

- **Relevant architecture:**
  - Next.js App Router; API routes under `app/api/`; pages under `app/`
  - Auth via `withAuth` / `withAuthAndParams` middleware wrappers
  - MongoDB via `getDatabase()`; member storage via `lib/storage.ts` (`listMembersForCampaign`, `updateMemberStatus`)
  - UI convention: `'use client'` pages, `useParams()` for route params, `ProtectedRoute` wrapper, `ErrorBanner`/`LoadingState` from `lib/components/ui.tsx`, Tailwind with `bg-gray-800` card pattern
  - Username search: `GET /api/users/search?q=` returns `{ results: [{ id, username }] }`
  - Invite API: `POST /api/campaigns/[id]/members` with `{ userId }` — upserts, returns `{ id, status }`

- **Dependencies:**
  - `lib/storage.ts`: `listMembersForCampaign`, `updateMemberStatus`, `getMember`
  - `lib/types.ts`: `CampaignMember`, `MemberStatus`, `MemberRole`
  - `app/api/campaigns/[id]/route.ts`: existing campaign GET (name/details)
  - Issue #305 (2a) closed — invite POST is live

- **Interfaces/contracts touched:**
  - `GET /api/campaigns/[id]/members` — new
  - `DELETE /api/campaigns/[id]/members/[userId]` — new
  - `app/campaigns/[id]/page.tsx` — new
  - `app/campaigns/page.tsx` — add Members link

## Goals / Non-Goals

### Goals

- List all campaign members (with usernames) via a new GET endpoint
- Allow DM to soft-delete a member via a new DELETE endpoint
- Render a campaign home page at `/campaigns/[id]` with full member management UI
- DM: search by username, invite, see pending badges, remove members
- Non-DM: read-only member list

### Non-Goals

- Accept/decline flow (2b/2d)
- Shared campaign layout/tab navigation
- Role promotion/demotion
- Real-time updates

## Decisions

### Decision 1: GET /api/campaigns/[id]/members — access control

- **Chosen:** Any `active` campaign member may call the list endpoint.
- **Alternatives considered:** DM-only access.
- **Rationale:** The campaign home page is visible to all members; showing who is in the party is useful for everyone, not just the DM.
- **Trade-offs:** Slightly broader read access, but membership is not sensitive data.

### Decision 2: Username enrichment strategy

- **Chosen:** In the GET handler, call `listMembersForCampaign`, collect all `userId` values, run one `db.collection('users').find({ _id: { $in: [...] } })` projection `{ username: 1 }`, merge into response.
- **Alternatives considered:** Store username on `CampaignMember` at write time (denormalization); add a separate `/users/[id]` endpoint.
- **Rationale:** `$in` is a single extra query, bounded by campaign size (small). Denormalization risks stale usernames. No need for a per-user endpoint.
- **Trade-offs:** Two DB round-trips per page load; acceptable at current scale.

### Decision 3: Remove member verb — DELETE

- **Chosen:** `DELETE /api/campaigns/[id]/members/[userId]` — soft-delete, sets `status: "removed"`.
- **Alternatives considered:** `PATCH` with `{ action: "remove" }`.
- **Rationale:** User confirmed DELETE. Semantically clear. Uses existing `updateMemberStatus`.
- **Trade-offs:** DELETE with a body is unusual; here we use URL params only (no body needed).

### Decision 4: Remove guards

- **Chosen:** DM-only; cannot remove self; target must exist with a removable status (`active` or `invited`).
- **Rationale:** Removing an already-`removed` or `declined` member is a no-op / 404. DM self-removal would leave campaign with no DM.
- **Trade-offs:** Attempting to remove an already-removed member returns 404, which is correct.

### Decision 5: UI component structure

- **Chosen:** Single file `app/campaigns/[id]/page.tsx` with internal sub-components (`MemberRow`, `InviteSection`). No separate `lib/components/` file.
- **Alternatives considered:** Extracting to `lib/components/CampaignMembersPanel.tsx`.
- **Rationale:** Other campaign sub-pages (sessions, prompts) self-contain their components. Keeps the pattern consistent. Can extract later if reused.
- **Trade-offs:** Larger single file; acceptable for this feature's scope.

### Decision 6: Search debounce

- **Chosen:** Fire `GET /api/users/search?q=` on input change with a 300ms debounce; minimum 1 character.
- **Alternatives considered:** Search-on-submit only.
- **Rationale:** Typeahead feels more natural. Rate limit on the search endpoint (20 req/min) is generous enough for debounced input.
- **Trade-offs:** Slightly more API calls; bounded by debounce + rate limit.

## Proposal to Design Mapping

- Proposal element: `GET /api/campaigns/[id]/members` with username enrichment
  - Design decision: Decision 1 (access control), Decision 2 (enrichment)
  - Validation approach: Unit test — mock `listMembersForCampaign` + `users.$in`, assert enriched response

- Proposal element: `DELETE /api/campaigns/[id]/members/[userId]` soft-delete
  - Design decision: Decision 3, Decision 4
  - Validation approach: Unit test — DM can remove active member; non-DM gets 403; self-remove gets 400

- Proposal element: Campaign home page at `/campaigns/[id]`
  - Design decision: Decision 5
  - Validation approach: E2E or integration test — DM sees invite section; non-DM sees list only

- Proposal element: Username search + invite flow
  - Design decision: Decision 6
  - Validation approach: Unit test search debounce logic; integration test invite round-trip

## Functional Requirements Mapping

- Requirement: DM can search for a user by username prefix
  - Design element: `GET /api/users/search?q=` called from `InviteSection` with 300ms debounce
  - Acceptance criteria reference: specs/invite-search.md
  - Testability notes: Mock fetch; assert results list rendered on input change

- Requirement: DM can invite a found user
  - Design element: "Invite" button calls `POST /api/campaigns/[id]/members { userId }`
  - Acceptance criteria reference: specs/invite-search.md
  - Testability notes: Assert member list refreshes after successful invite

- Requirement: Member list shows role and status for all members
  - Design element: `GET /api/campaigns/[id]/members` → render `MemberRow` per entry
  - Acceptance criteria reference: specs/member-list.md
  - Testability notes: Assert correct badge text for each status/role combination

- Requirement: Pending-invite members are visually highlighted
  - Design element: `MemberRow` renders a distinct badge when `status === 'invited'`
  - Acceptance criteria reference: specs/member-list.md
  - Testability notes: Assert badge presence for invited member

- Requirement: DM can remove an active or invited member
  - Design element: Remove button calls `DELETE /api/campaigns/[id]/members/[userId]`; list refreshes
  - Acceptance criteria reference: specs/remove-member.md
  - Testability notes: Assert member removed from list after successful DELETE

- Requirement: DM cannot remove themselves
  - Design element: Remove button hidden/disabled for own row; API guard returns 400
  - Acceptance criteria reference: specs/remove-member.md
  - Testability notes: Assert button absent on own row

- Requirement: Non-DM sees list read-only (no invite/remove controls)
  - Design element: `isDM` flag derived from member list; controls conditionally rendered
  - Acceptance criteria reference: specs/member-list.md
  - Testability notes: Assert invite section absent when current user is not DM

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Only DM can invite or remove
  - Design element: `getMember` check in POST/DELETE handlers; 403 on failure
  - Acceptance criteria reference: specs/remove-member.md, specs/invite-search.md
  - Testability notes: Unit test with non-DM caller

- Requirement category: security
  - Requirement: Only active campaign members can read the member list
  - Design element: `getMember` check in GET handler; 403 if not active member
  - Acceptance criteria reference: specs/member-list.md
  - Testability notes: Unit test with non-member caller

- Requirement category: performance
  - Requirement: Member list loads in a single page-load cycle
  - Design element: Two sequential DB queries (list + $in); no N+1
  - Acceptance criteria reference: n/a (implicit)
  - Testability notes: Code review; no per-member query loops

## Risks / Trade-offs

- Risk/trade-off: Invited members display `invited` indefinitely until 2b ships
  - Impact: DM sees pending badges with no way for the player to accept yet
  - Mitigation: Badge is informational; documented as expected until 2d ships

- Risk/trade-off: No shared campaign layout means no tab bar between sub-pages
  - Impact: Users must return to campaigns list to navigate to sessions/combat
  - Mitigation: Out of scope; back-link on campaign home is sufficient for now

## Rollback / Mitigation

- **Rollback trigger:** GET/DELETE endpoint errors in production; campaign home page 500s
- **Rollback steps:** Revert the PR; new routes are additive so no DB migration needed; existing sub-pages unaffected
- **Data migration considerations:** None — soft-delete only updates `status` field, which is already present
- **Verification after rollback:** Confirm campaigns list page and sub-pages still load; no member records affected by route-only revert

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or linting before proceeding.
- **If security checks fail:** Block merge; escalate to repo owner (dougis) immediately.
- **If required reviews are blocked/stale:** Ping reviewer after 24h; after 48h escalate to repo owner.
- **Escalation path and timeout:** Repo owner (@dougis) is final arbiter; 48h SLA on review requests.

## Open Questions

No open questions. All design decisions were resolved in pre-proposal exploration session.
