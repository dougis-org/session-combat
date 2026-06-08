---
name: tests
description: Tests for the player-invitations-inbox change
---

# Tests

## Overview

Tests for the `player-invitations-inbox` change. All work follows strict TDD: write failing test → write implementation → refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Write the test before any implementation. Run it and confirm it fails.
2. **Write code to pass the test:** Write the minimum code to make it green.
3. **Refactor:** Improve structure while keeping tests green.

## Test Cases

### Task 1 — `lib/components/Toast.tsx`

File: `tests/unit/components/Toast.test.tsx`
Spec scenarios: "Toast renders on showToast call", "Toast auto-dismisses after 3 seconds", "Toast renders error variant"

- [ ] **TC-T1-1:** `useToast()` — initial state renders no toast element
  - Given: component mounts with `<Toast toast={null} />`
  - When: rendered
  - Then: no toast element in DOM

- [ ] **TC-T1-2:** `showToast("Joined!", "success")` — renders success toast
  - Given: component mounts with `useToast()` and `<Toast>`
  - When: `showToast("Joined!", "success")` is called
  - Then: element with text "Joined!" is in DOM; element has green background class

- [ ] **TC-T1-3:** `showToast("Oops", "error")` — renders error toast
  - Given: component mounts with `useToast()` and `<Toast>`
  - When: `showToast("Oops", "error")` is called
  - Then: element with text "Oops" is in DOM; element has red background class

- [ ] **TC-T1-4:** Toast auto-dismisses after 3000ms
  - Given: a success toast is visible
  - When: `jest.advanceTimersByTime(3000)` is called
  - Then: toast element is no longer in DOM

### Task 2 — `lib/components/NavBar.tsx`

File: `tests/unit/components/NavBar.test.tsx`
Spec scenarios: "Badge shows count when invitations exist", "Badge is hidden when no invitations", "Badge is hidden when unauthenticated", "NavBar fetch failure does not break navigation"

- [ ] **TC-T2-1:** Renders "Invitations (2)" link when fetch returns 2 invitations
  - Given: `useAuth` returns `{ isAuthenticated: true, loading: false }`
  - And: `fetch('/api/me/invitations')` resolves to `{ invitations: [{...}, {...}] }`
  - When: NavBar renders and fetch resolves
  - Then: link with text "Invitations (2)" and `href="/invitations"` is in DOM

- [ ] **TC-T2-2:** No invitations link when fetch returns empty list
  - Given: `useAuth` returns `{ isAuthenticated: true, loading: false }`
  - And: `fetch('/api/me/invitations')` resolves to `{ invitations: [] }`
  - When: NavBar renders and fetch resolves
  - Then: no element with text matching /Invitations/ is in DOM

- [ ] **TC-T2-3:** No invitations link when unauthenticated
  - Given: `useAuth` returns `{ isAuthenticated: false, loading: false }`
  - When: NavBar renders
  - Then: no element with text matching /Invitations/ is in DOM; fetch not called

- [ ] **TC-T2-4:** No invitations link when fetch throws
  - Given: `useAuth` returns `{ isAuthenticated: true, loading: false }`
  - And: `fetch('/api/me/invitations')` throws a network error
  - When: NavBar renders and fetch rejects
  - Then: NavBar renders without crashing; no invitations link shown

### Task 3 — `app/invitations/page.tsx`

File: `tests/unit/components/InvitationsPage.test.tsx`
Spec scenarios: all inbox page scenarios from `specs/invitations-inbox/spec.md`

- [ ] **TC-T3-1:** Renders invite rows with campaign name, invitedBy, relative time
  - Given: `GET /api/me/invitations` returns one invite: `{ campaignName: "Lost Mine", invitedBy: "dm_alice", invitedAt: <ISO date 2 days ago> }`
  - When: page renders and fetch resolves
  - Then: "Lost Mine" text in DOM; "dm_alice" text in DOM; "days ago" text in DOM

- [ ] **TC-T3-2:** Renders empty state when no invitations
  - Given: `GET /api/me/invitations` returns `{ invitations: [] }`
  - When: page renders and fetch resolves
  - Then: "No pending invitations" text in DOM; no Accept/Decline buttons

- [ ] **TC-T3-3:** Shows loading state while fetch is pending
  - Given: `GET /api/me/invitations` has not resolved
  - When: page renders
  - Then: loading indicator is in DOM

- [ ] **TC-T3-4:** Shows error banner when fetch fails
  - Given: `GET /api/me/invitations` returns a non-OK response
  - When: page renders and fetch resolves
  - Then: error banner with error text is in DOM; no invite rows

- [ ] **TC-T3-5:** Accept — removes invite from list and shows success toast
  - Given: inbox shows one invite for "Lost Mine of Phandelver"
  - And: `PATCH /api/campaigns/{id}/members/me` resolves OK
  - When: user clicks "Accept"
  - Then: invite row is removed from DOM
  - And: toast with text containing "Joined" and "Lost Mine of Phandelver" is in DOM

- [ ] **TC-T3-6:** Decline — removes invite from list and shows success toast
  - Given: inbox shows one invite for "Curse of Strahd"
  - And: `PATCH /api/campaigns/{id}/members/me` resolves OK with `action: "decline"`
  - When: user clicks "Decline"
  - Then: invite row is removed from DOM
  - And: toast with text containing "Declined" and "Curse of Strahd" is in DOM

- [ ] **TC-T3-7:** Accept failure — shows error banner, invite remains in list
  - Given: inbox shows one invite
  - And: `PATCH /api/campaigns/{id}/members/me` returns a non-OK response
  - When: user clicks "Accept"
  - Then: error banner is in DOM; invite row is still in DOM

- [ ] **TC-T3-8:** Decline failure — shows error banner, invite remains in list
  - Given: inbox shows one invite
  - And: `PATCH /api/campaigns/{id}/members/me` returns a non-OK response
  - When: user clicks "Decline"
  - Then: error banner is in DOM; invite row is still in DOM

## Traceability

| Test ID   | Task (tasks.md)     | Spec scenario                                         |
|-----------|---------------------|-------------------------------------------------------|
| TC-T1-1   | Task 1              | Toast: initial state                                  |
| TC-T1-2   | Task 1 / Task 4     | Toast renders on showToast call                       |
| TC-T1-3   | Task 1 / Task 4     | Toast renders error variant                           |
| TC-T1-4   | Task 1 / Task 4     | Toast auto-dismisses after 3 seconds                  |
| TC-T2-1   | Task 2 / Task 6     | Badge shows count when invitations exist              |
| TC-T2-2   | Task 2 / Task 6     | Badge is hidden when no invitations                   |
| TC-T2-3   | Task 2 / Task 6     | Badge is hidden when unauthenticated                  |
| TC-T2-4   | Task 2 / Task 6     | NavBar fetch failure does not break navigation        |
| TC-T3-1   | Task 3 / Task 5     | Inbox lists pending invitations                       |
| TC-T3-2   | Task 3 / Task 5     | Inbox shows empty state                               |
| TC-T3-3   | Task 3 / Task 5     | Inbox shows loading state                             |
| TC-T3-4   | Task 3 / Task 5     | Inbox fetch failure shows error state (NFAC)          |
| TC-T3-5   | Task 3 / Task 5     | Accept removes invite and shows toast                 |
| TC-T3-6   | Task 3 / Task 5     | Decline removes invite and shows toast                |
| TC-T3-7   | Task 3 / Task 5     | Accept failure shows error banner                     |
| TC-T3-8   | Task 3 / Task 5     | Decline failure shows error banner                    |
