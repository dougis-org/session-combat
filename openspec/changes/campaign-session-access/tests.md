---
name: tests
description: Tests for the campaign-session-access change
---

# Tests

## Overview

This document outlines the tests for the `campaign-session-access` change. All work follows strict TDD: write a failing test first, then implement the minimum code to pass it, then refactor.

Test files live under `tests/unit/` (and `tests/integration/` if applicable). All tests use Jest + React Testing Library.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation, write a test capturing the requirement. Run and confirm it fails.
2. **Write code to pass the test** — implement the minimum code to make it pass.
3. **Refactor** — improve code quality while keeping tests green.

---

## Test Cases

### Task 1 — Session section always renders (`app/campaigns/page.tsx`)

Test file: `tests/unit/components/CampaignsContent.test.tsx` (create or extend)

- [x] **TC-1.1** — Session section renders empty state when campaign has no sessions
  - Spec: `specs/campaign-dashboard-sessions/spec.md` → "Empty state CTA shown when no sessions exist"
  - Setup: Render `CampaignsContent` with one active campaign; mock `sessionsByCampaign` as `{ [campaignId]: null }`
  - Assert: Text "No sessions logged yet." is visible; link "Log First Session" points to `/campaigns/${campaignId}/sessions`
  - Assert: Session card content (session number, date) is NOT present

- [x] **TC-1.2** — Session section renders last session when sessions exist
  - Spec: `specs/campaign-dashboard-sessions/spec.md` → "Last session shown when sessions exist"
  - Setup: Mock `sessionsByCampaign` with `{ [campaignId]: { sessionNumber: 5, title: "The Amber Temple", datePlayed: "2026-06-20", milestone: false } }`
  - Assert: Text "Session #5" visible; "The Amber Temple" visible; "View all sessions →" link to `/campaigns/${campaignId}/sessions` present
  - Assert: "Log First Session" CTA is NOT present

- [x] **TC-1.3** — Milestone badge renders on milestone sessions
  - Spec: `specs/campaign-dashboard-sessions/spec.md` → "Milestone badge shown on milestone sessions"
  - Setup: Mock `sessionsByCampaign` with `{ [campaignId]: { sessionNumber: 3, milestone: true, newLevel: 5, datePlayed: "2026-06-01" } }`
  - Assert: "Milestone" badge is visible in the session section

- [x] **TC-1.4** — Session fetch failure degrades to empty state
  - Spec: `specs/campaign-dashboard-sessions/spec.md` → "Session fetch failure degrades gracefully"
  - Setup: Mock the sessions fetch to return an error; `sessionsByCampaign` remains `{}`
  - Assert: Empty state CTA renders (same as TC-1.1); no error thrown to the test boundary

---

### Task 2 — "Session Log" button in Active Campaigns action row (`app/campaigns/page.tsx`)

Test file: `tests/unit/components/CampaignsContent.test.tsx` (same file as Task 1)

- [x] **TC-2.1** — "Session Log" button present when campaign has sessions
  - Spec: `specs/campaign-dashboard-sessions/spec.md` → "Session Log button present with sessions"
  - Setup: Render with one active campaign; mock sessions present
  - Assert: A link/button with text "Session Log" is visible in the action row, href = `/campaigns/${campaignId}/sessions`

- [x] **TC-2.2** — "Session Log" button present when campaign has NO sessions
  - Spec: `specs/campaign-dashboard-sessions/spec.md` → "Session Log button present with no sessions"
  - Setup: Render with one active campaign; mock `sessionsByCampaign` as `{ [campaignId]: null }`
  - Assert: A link/button with text "Session Log" is still visible in the action row, href = `/campaigns/${campaignId}/sessions`

---

### Task 3 — Campaign name header and tab bar in layout (`app/campaigns/[id]/layout.tsx`)

Test file: `tests/unit/components/CampaignLayout.test.tsx` (create)

- [x] **TC-3.1** — All four tabs render
  - Spec: `specs/campaign-subnav/spec.md` → "All four tabs render on Members page"
  - Setup: Render the layout component; mock fetch returning `{ name: "Curse of Strahd", activeSessionId: null }`; set `usePathname` to `/campaigns/abc123`
  - Assert: Tabs "Members", "Sessions", "Prompts", "Library" all visible

- [x] **TC-3.2** — Members tab active on exact Members path
  - Spec: `specs/campaign-subnav/spec.md` → "Members tab is active on Members page"
  - Setup: `usePathname` → `/campaigns/abc123`
  - Assert: Members tab has active styling class; Sessions/Prompts/Library do not

- [x] **TC-3.3** — Sessions tab active on Sessions path
  - Spec: `specs/campaign-subnav/spec.md` → "Sessions tab is active on Sessions page"
  - Setup: `usePathname` → `/campaigns/abc123/sessions`
  - Assert: Sessions tab has active styling class; others do not

- [x] **TC-3.4** — Prompts tab active on Prompts path
  - Spec: `specs/campaign-subnav/spec.md` → "Prompts tab is active on Prompts page"
  - Setup: `usePathname` → `/campaigns/abc123/prompts`
  - Assert: Prompts tab has active styling class; others do not

- [x] **TC-3.5** — Library tab active on Library path
  - Spec: `specs/campaign-subnav/spec.md` → "Library tab is active on Library page"
  - Setup: `usePathname` → `/campaigns/abc123/library`
  - Assert: Library tab has active styling class; others do not

- [x] **TC-3.6** — Sessions tab active on nested sessions sub-route
  - Spec: `specs/campaign-subnav/spec.md` → "Sessions tab active on nested session routes"
  - Setup: `usePathname` → `/campaigns/abc123/sessions/some-session-id`
  - Assert: Sessions tab has active styling class

- [x] **TC-3.7** — Campaign name visible in header when fetch succeeds
  - Spec: `specs/campaign-subnav/spec.md` → "Campaign name shown in header"
  - Setup: Mock fetch returning `{ name: "Curse of Strahd" }`
  - Assert: Text "Curse of Strahd" visible in the rendered layout header

- [x] **TC-3.8** — Tab bar renders when fetch fails (graceful degradation)
  - Spec: `specs/campaign-subnav/spec.md` → "Header degrades gracefully on fetch failure"
  - Setup: Mock fetch to reject/throw
  - Assert: All four tabs still render; no error boundary triggered; name area empty/absent

- [x] **TC-3.9** — Children render below tab bar
  - Spec: `specs/campaign-subnav/spec.md` → "Sub-page content still renders below tab bar"
  - Setup: Render layout with a mock child `<div data-testid="child-content" />`
  - Assert: `data-testid="child-content"` is present in the DOM alongside the tab bar

- [x] **TC-3.10** — Single fetch call (no extra network requests)
  - Spec: `specs/campaign-subnav/spec.md` → "Single fetch for both name and activeSessionId"
  - Setup: Spy on `fetch`; render layout
  - Assert: `fetch` called exactly once with `/api/campaigns/abc123`
