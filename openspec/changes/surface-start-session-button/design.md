## Context

- Relevant architecture: The React frontend uses an SSE stream hook (`useCampaignStream`) to receive real-time updates for various campaign events, including session start/end. The `<SessionControl>` component currently lives in `CampaignLayout` and relies on state passed as props.
- Dependencies: `useCampaignStream` hook, `CampaignContext`.
- Interfaces/contracts touched: `<SessionControl>` props will change to accept just `campaignId` (and optionally an initial `activeSessionId` from context to avoid loading flicker), as it will manage its own sync state internally via the SSE stream.

## Goals / Non-Goals

### Goals

- Allow `<SessionControl>` to be rendered anywhere in the campaign view (specifically in the `SessionsContent` page).
- Ensure all instances of `<SessionControl>` for the same campaign remain perfectly synced via SSE.
- Avoid introducing heavy global React context state management for just one piece of state.

### Non-Goals

- Refactoring the entire `useCampaignContext` to be real-time.
- Changing the backend session management endpoints.

## Decisions

### Decision 1: Self-Synchronizing SessionControl

- Chosen: Update `<SessionControl>` to internally use `useCampaignStream` to listen to `'session'` events and update its own `activeSessionId` state. It will accept an `initialSessionId` prop to prevent initial layout shift.
- Alternatives considered: 
  - Option 1: Lift `activeSessionId` into a global `CampaignContext` that all children can read/write.
  - Option 2: Render a simple non-synced "Start Session" button in the Session Journal page that just fires an API request and forces a page reload.
- Rationale: A self-synchronizing component is highly portable, encapsulates the real-time logic neatly, and avoids the boilerplate of modifying the existing `CampaignContext`.
- Trade-offs: Multiple `<SessionControl>` instances on the screen will result in multiple `useCampaignStream` hook calls. However, our SSE hook is lightweight and the browser can handle multiple connections to the same endpoint efficiently.

### Decision 2: Display Logic in Session Journal

- Chosen: Render `<SessionControl>` at the top of the `SessionsContent` view, but only conditionally when there is no active session (`activeSessionId === null`).
- Alternatives considered: Render it unconditionally.
- Rationale: The issue states "If there is no active session, the edit session screen should show the start session button". Showing it unconditionally might clutter the view since it's already in the top nav bar, but showing it when no session is active directly addresses the DM's immediate need to start one.
- Trade-offs: DMs won't be able to *end* the session from the main content area, they'll have to use the global top nav. This matches the requested scope.

## Proposal to Design Mapping

- Proposal element: Refactoring `<SessionControl>` to autonomously manage its own sync state
  - Design decision: Decision 1: Self-Synchronizing SessionControl
  - Validation approach: Unit test `<SessionControl>` with a mocked SSE stream emitting a session event to verify state updates.
- Proposal element: Displaying `<SessionControl>` in the `SessionsContent` page
  - Design decision: Decision 2: Display Logic in Session Journal
  - Validation approach: Integration test or visual verification that the button appears when no session is active and disappears when one is started.

## Functional Requirements Mapping

- Requirement: The Session Journal page must show a "Start Session" button if there is no active session.
  - Design element: Decision 2: Conditionally rendering `<SessionControl>`.
  - Acceptance criteria reference: (Will be in specs)
  - Testability notes: Verify via integration tests that the button is rendered when the mocked campaign context has `activeSessionId: null`.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Minimal overhead from multiple SSE connections.
  - Design element: Decision 1: `<SessionControl>` using `useCampaignStream`.
  - Acceptance criteria reference: (Will be in specs)
  - Testability notes: We accept the minor overhead of 2 SSE connections per client instead of 1.

## Risks / Trade-offs

- Risk/trade-off: Multiple SSE connections from a single client.
  - Impact: Low impact at current scale. Browsers typically limit SSE connections to 6 per domain (HTTP/1.1) but HTTP/2 multiplexing mitigates this entirely.
  - Mitigation: If connection limits are hit, we will refactor `useCampaignStream` into a global context provider.

## Rollback / Mitigation

- Rollback trigger: Production errors relating to `SessionControl` or SSE connection limits blocking user experience.
- Rollback steps: Revert the PR. The previous `<SessionControl>` relying on layout props will be restored.
- Data migration considerations: None, this is purely frontend state management.
- Verification after rollback: Verify the "Start Session" button in the global nav functions correctly.

## Operational Blocking Policy

- If CI checks fail: Iterate on tests to fix the failure. Do not bypass CI.
- If security checks fail: Remediate the identified issue.
- If required reviews are blocked/stale: N/A, open source workflow.
- Escalation path and timeout: N/A

## Open Questions

- None.
