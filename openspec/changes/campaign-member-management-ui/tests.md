---
name: tests
description: Tests for the campaign-member-management-ui change
---

# Tests

## Overview

All work follows strict TDD: write a failing test → write code to pass → refactor.

Test files follow the project pattern:
- Unit tests: `tests/unit/api/campaigns/[id]/members/`
- Integration tests: `tests/integration/`

---

## Test Cases

### task-3: GET /api/campaigns/[id]/members

File: `tests/unit/api/campaigns/[id]/members/route.unit.test.ts` (extend existing file)

**Spec ref:** `specs/member-list.md`

- [ ] **GET — active member retrieves enriched list**
  - Mock `storage.getMember` to return active member for caller
  - Mock `storage.listMembersForCampaign` to return 2 members
  - Mock `db.collection('users').find` to return matching username docs
  - Assert response `200` with `{ members: [{ id, userId, username, role, status }] }`

- [ ] **GET — non-member is denied**
  - Mock `storage.getMember` to return `null`
  - Assert response `403`

- [ ] **GET — inactive member (status: "invited") is denied**
  - Mock `storage.getMember` to return member with `status: "invited"`
  - Assert response `403`

- [ ] **GET — unauthenticated request rejected**
  - Call without auth token
  - Assert response `401`

- [ ] **GET — username enrichment uses $in (no N+1)**
  - Assert `db.collection('users').find` is called exactly once regardless of member count

---

### task-4: DELETE /api/campaigns/[id]/members/[userId]

File: `tests/unit/api/campaigns/[id]/members/[userId]/route.unit.test.ts` (new)

**Spec ref:** `specs/remove-member.md`

- [ ] **DELETE — DM removes active member**
  - Mock caller as active DM; target as `status: "active"`
  - Mock `storage.updateMemberStatus`
  - Assert response `200 { status: 'removed' }`
  - Assert `updateMemberStatus` called with `(campaignId, userId, 'removed', auth.userId)`

- [ ] **DELETE — DM removes invited member**
  - Target `status: "invited"` — same assertions as above

- [ ] **DELETE — non-DM is forbidden**
  - Mock caller as player (role: "player")
  - Assert response `403`
  - Assert `updateMemberStatus` NOT called

- [ ] **DELETE — DM cannot remove themselves**
  - `auth.userId === params.userId`
  - Assert response `400`
  - Assert `updateMemberStatus` NOT called

- [ ] **DELETE — target not found returns 404**
  - Mock `storage.getMember` for target returns `null`
  - Assert response `404`

- [ ] **DELETE — target already removed returns 404**
  - Target `status: "removed"`
  - Assert response `404`

- [ ] **DELETE — target declined returns 404**
  - Target `status: "declined"`
  - Assert response `404`

---

### task-5: app/campaigns/[id]/page.tsx UI

File: `tests/unit/components/CampaignMembersPage.test.tsx` (new)

**Spec ref:** `specs/member-list.md`, `specs/invite-search.md`, `specs/remove-member.md`

- [ ] **Renders member list with role and status badges**
  - Mock `GET /api/campaigns/[id]` and `GET /api/campaigns/[id]/members`
  - Assert username, role badge text, status badge text visible for each member

- [ ] **Invited member shows distinct badge**
  - Members list includes one `status: "invited"` entry
  - Assert "Invited" badge present on that row

- [ ] **DM sees invite section**
  - Current user is DM (`isDM === true`)
  - Assert search input rendered

- [ ] **Non-DM does not see invite section**
  - Current user is player
  - Assert search input not rendered

- [ ] **DM does not see Remove button on own row**
  - Current user is DM; member list includes DM's own entry
  - Assert no Remove button on own row

- [ ] **DM sees Remove button on other members' rows**
  - Assert Remove button present on active/invited members that are not the DM

- [ ] **Invite flow — search results appear after input**
  - Mock `GET /api/users/search?q=ali` to return results
  - Type "ali" into search input
  - Assert result items rendered (after debounce)

- [ ] **Invite flow — clicking Invite calls POST and refreshes list**
  - Mock `POST /api/campaigns/[id]/members` to return `201`
  - Click "Invite" next to a search result
  - Assert member list re-fetched

- [ ] **Invite flow — 409 shows inline error**
  - Mock `POST` to return `409`
  - Assert error message visible; member list unchanged

- [ ] **Remove flow — clicking Remove calls DELETE and refreshes list**
  - Mock `DELETE /api/campaigns/[id]/members/[userId]` to return `200`
  - Click Remove on a member row
  - Assert member list re-fetched

- [ ] **Empty search — no API call made**
  - Input is empty or whitespace
  - Assert `GET /api/users/search` NOT called

---

### task-6: Members link in campaigns/page.tsx

File: `tests/unit/campaigns-dashboard.test.tsx` (extend existing)

**Spec ref:** proposal — add Members link per campaign card

- [ ] **Campaign card renders Members link**
  - Render `CampaignsContent` with a mock campaign
  - Assert a link with `href="/campaigns/<id>"` is present on the campaign card
