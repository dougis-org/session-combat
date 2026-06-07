## Context

- Relevant architecture: Next.js App Router, client components with `useState`/`useEffect`, `ProtectedRoute` wrapper, `useAuth()` for session, Tailwind CSS with semantic token conventions, `lib/components/ui.tsx` for shared primitives.
- Dependencies: `GET /api/me/invitations` (returns `{ invitations: [{ id, campaignId, campaignName, invitedBy, invitedAt }] }`), `PATCH /api/campaigns/[id]/members/me` with `{ action: "accept" | "decline" }`. Both are stable and tested.
- Interfaces/contracts touched: `lib/components/NavBar.tsx` (modified), new `lib/components/Toast.tsx`, new `app/invitations/page.tsx`.

## Goals / Non-Goals

### Goals

- Player can see pending invitation count in the NavBar at all times when authenticated
- Player can navigate to `/invitations` and accept or decline each invite
- Success feedback via toast on respond
- Campaign appears in `/campaigns` after accepting

### Non-Goals

- Real-time badge updates (polling, websockets)
- Migrating combat toast to new component (tracked in #389)
- Pagination
- Bulk operations

## Decisions

### Decision 1: Standalone `lib/components/Toast.tsx` (not added to `ui.tsx`)

- Chosen: New dedicated file `lib/components/Toast.tsx` exporting `useToast()` hook and `<Toast>` renderer.
- Alternatives considered: Adding `useToast` + `Toast` inline in `ui.tsx` alongside `ErrorBanner`.
- Rationale: User preference — toast is clearly its own piece of work, not a generic form primitive. Keeping it separate makes it easy to find, import, and migrate combat view later (#389).
- Trade-offs: One more file, but cleaner separation.

### Decision 2: NavBar fetches invitations on mount (no shared context)

- Chosen: `NavBar` calls `GET /api/me/invitations` inside a `useEffect` when `isAuthenticated && !loading`. Count is local state.
- Alternatives considered: Global context/provider shared between NavBar and the invitations page so they stay in sync; polling at an interval.
- Rationale: The app has no global state manager. A shared context would be new infrastructure for a single badge count. Since NavBar re-mounts on every page navigation in Next.js App Router (it's in the root layout), the count refreshes naturally on navigation — including after accept/decline on the invitations page.
- Trade-offs: Badge count is slightly stale within a single page visit (e.g., if an invite arrives while the user is on another page). Acceptable for this use case.

### Decision 3: Optimistic removal on respond, re-fetch count

- Chosen: On successful accept/decline, immediately remove the invite from the local list (optimistic). After each respond, the invitations page re-fetches `GET /api/me/invitations` to reconcile. NavBar updates on next navigation.
- Alternatives considered: Full page reload after respond; no optimistic update (wait for re-fetch).
- Rationale: Optimistic removal feels snappy. Re-fetch after respond ensures count accuracy if multiple tabs are open or if the server returns unexpected state.
- Trade-offs: Brief moment where the badge in the NavBar shows a stale count (higher than actual) until the user navigates. Acceptable.

### Decision 4: `invitedAt` displayed as relative time

- Chosen: Display `invitedAt` as a human-readable relative string (e.g., "2 days ago") using `Date` arithmetic, no external library.
- Alternatives considered: Absolute date string; using `date-fns`.
- Rationale: Relative time is more meaningful in an inbox. The project has no `date-fns` dependency; a small inline helper keeps it self-contained.
- Trade-offs: Relative formatting will be simple (days/hours/minutes), not as nuanced as a full library.

### Decision 5: Empty state and badge visibility

- Chosen: Badge link is hidden entirely when count is 0 (not rendered, not zero-count visible). Invitations page shows a centred "No pending invitations" message.
- Alternatives considered: Always show "Invitations" link, show "(0)" badge.
- Rationale: A zero badge is noise. NavBar is already link-dense; only show the link when it matters.
- Trade-offs: Users won't discover `/invitations` by browsing the nav unless they have pending invites. Acceptable — the page is only useful when there are invitations.

## Proposal to Design Mapping

- Proposal element: Standalone `Toast` component
  - Design decision: Decision 1
  - Validation approach: Unit test that `showToast` renders the toast and it disappears after timeout

- Proposal element: NavBar count pill
  - Design decision: Decision 2
  - Validation approach: Unit test NavBar with mocked fetch returning invitations; assert link + count rendered

- Proposal element: Accept/decline with optimistic removal
  - Design decision: Decision 3
  - Validation approach: Unit test that list item disappears after responding; mock API returns success

- Proposal element: `invitedAt` display
  - Design decision: Decision 4
  - Validation approach: Unit test relative time helper with fixed dates

- Proposal element: Hidden badge when 0 invitations
  - Design decision: Decision 5
  - Validation approach: Unit test NavBar with empty invitations response; assert link not rendered

## Functional Requirements Mapping

- Requirement: Player sees pending invite count in NavBar
  - Design element: NavBar `useEffect` + count state (Decision 2)
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — NavBar badge
  - Testability notes: Mock `fetch` in NavBar test; assert count pill text and href

- Requirement: Player navigates to `/invitations` from badge
  - Design element: `<Link href="/invitations">` in NavBar (Decision 5)
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — NavBar badge
  - Testability notes: Assert `href="/invitations"` on the rendered link

- Requirement: Player sees invite list with campaign name, inviter, date
  - Design element: `app/invitations/page.tsx` renders `invitations` array
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — Inbox page
  - Testability notes: Mock `GET /api/me/invitations`; assert campaign name, invitedBy, relative date rendered

- Requirement: Player can accept an invite
  - Design element: Accept button → `PATCH /api/campaigns/[id]/members/me` `{ action: "accept" }`
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — Accept flow
  - Testability notes: Mock PATCH success; assert invite removed from list, success toast shown

- Requirement: Player can decline an invite
  - Design element: Decline button → `PATCH /api/campaigns/[id]/members/me` `{ action: "decline" }`
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — Decline flow
  - Testability notes: Mock PATCH success; assert invite removed from list, success toast shown

- Requirement: Success toast shown after respond
  - Design element: `useToast()` in `app/invitations/page.tsx` (Decision 1)
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — Toast feedback
  - Testability notes: Assert toast text rendered after mock PATCH success

- Requirement: Error shown if respond fails
  - Design element: `ErrorBanner` on PATCH failure
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — Error handling
  - Testability notes: Mock PATCH failure; assert `ErrorBanner` renders error text

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: NavBar invitation fetch must not block rendering
  - Design element: `useEffect` runs after mount (Decision 2); badge renders after async resolves
  - Acceptance criteria reference: N/A (structural)
  - Testability notes: Verify component renders without badge during loading, badge appears after fetch

- Requirement category: reliability
  - Requirement: NavBar invitation fetch failure must not break the nav
  - Design element: Fetch error is caught and silently swallowed; badge simply doesn't render
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — NavBar error resilience
  - Testability notes: Mock fetch to throw; assert NavBar renders without badge and without crashing

- Requirement category: security
  - Requirement: `/invitations` page and badge only accessible when authenticated
  - Design element: `ProtectedRoute` on page; NavBar guard on `isAuthenticated && !loading`
  - Acceptance criteria reference: specs/invitations-inbox/spec.md — Auth guard
  - Testability notes: NavBar test with `isAuthenticated = false`; assert badge not rendered

## Risks / Trade-offs

- Risk/trade-off: NavBar badge stale after accepting on invitations page
  - Impact: User sees stale count in badge until they navigate away and back
  - Mitigation: Acceptable UX given App Router's per-navigation NavBar remount. Can add shared context in future if needed.

- Risk/trade-off: Extra network request on every page load from NavBar
  - Impact: Minor; `GET /api/me/invitations` is a lightweight indexed query
  - Mitigation: Request only fires when `isAuthenticated && !loading`; unauthenticated users incur no cost

## Rollback / Mitigation

- Rollback trigger: Toast component causes regressions in existing pages; NavBar fetch breaks navigation.
- Rollback steps: Revert `lib/components/NavBar.tsx` to pre-change version; delete `app/invitations/page.tsx` and `lib/components/Toast.tsx`. No database schema changes; no migration needed.
- Data migration considerations: None — this is purely UI over existing APIs.
- Verification after rollback: Run `npm test`; manually verify NavBar and campaigns page render correctly.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or type errors before proceeding.
- If security checks fail: Do not merge. Investigate and resolve before proceeding.
- If required reviews are blocked/stale: Re-request review after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: Tag `@dougis` on the PR if blocked for more than 48 hours.

## Open Questions

No open questions. All design decisions resolved during exploration session.
