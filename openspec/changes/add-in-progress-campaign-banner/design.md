## Context

- Relevant architecture: `CombatSetupView` currently handles ad hoc combat setup. It's a React Client Component. We need to fetch campaigns to detect active ones without disrupting the main setup flow.
- Dependencies: `/api/campaigns` endpoint for fetching campaigns, `sessionStorage` for temporary client-side state.
- Interfaces/contracts touched: `CombatSetupView` rendering.

## Goals / Non-Goals

### Goals

- Show a banner if a user has at least one active campaign when landing on the ad hoc combat setup screen.
- Persist banner dismissal for the current browser session.
- Handle multiple active campaigns by letting the user choose which one to navigate to.

### Non-Goals

- Refactoring `CombatSetupView`'s existing ad hoc logic.
- Adding server-side state for the banner's dismissal status.

## Decisions

### Decision 1: ActiveCampaignBanner Component

- Chosen: Create a distinct `<ActiveCampaignBanner />` client component to fetch campaigns, manage its own `dismissed` state via `sessionStorage`, and render the banner at the top of `CombatSetupView`.
- Alternatives considered: Adding the fetch logic directly into `CombatSetupView` or `useCombat`.
- Rationale: A distinct component encapsulates the fetching and state logic, preventing `CombatSetupView` from bloating and keeping the ad hoc logic fully separated from campaign-awareness logic.
- Trade-offs: An extra network request is fired on the setup screen, but it is asynchronous and does not block rendering.

### Decision 2: Session Storage for Dismissal

- Chosen: Store a boolean flag `dismissed-campaign-banner` in `sessionStorage`.
- Alternatives considered: `localStorage`, Database user preferences, React Context.
- Rationale: The requirement is for the banner dismissal to last only for the session. `sessionStorage` perfectly matches this lifecycle and requires zero server changes.
- Trade-offs: If a user closes the tab and reopens it, the banner reappears. This is acceptable for a "session-local" requirement.

### Decision 3: Multiple Campaigns Selection Modal

- Chosen: If `activeCampaigns.length > 1`, clicking the banner opens a lightweight modal (managed within the banner component) listing the active campaigns with links to their respective `/campaigns/[id]/combat` pages.
- Alternatives considered: Picking the most recent one automatically, or showing all links inline in the banner.
- Rationale: A modal handles unbounded active campaigns cleanly without expanding the banner itself.
- Trade-offs: Slightly more complex UI code than just linking to the first one.

## Proposal to Design Mapping

- Proposal element: Adding a dismissible banner to the setup screen.
  - Design decision: Create `<ActiveCampaignBanner />` component.
  - Validation approach: Unit/Integration tests or manual E2E check to verify rendering.
- Proposal element: Dismissible for the current session.
  - Design decision: `sessionStorage.setItem('dismissed-campaign-banner', 'true')`.
  - Validation approach: Check that banner doesn't reappear on soft reload, but does on new tab.
- Proposal element: Modal for multiple active campaigns.
  - Design decision: Internal modal state within `<ActiveCampaignBanner />`.
  - Validation approach: Mock multiple campaigns and verify modal opens on click.

## Functional Requirements Mapping

- Requirement: Show banner when active campaign exists.
  - Design element: `<ActiveCampaignBanner />` fetch and filter `status === 'active'`.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Mock `/api/campaigns` response.
- Requirement: Modal for multiple active campaigns.
  - Design element: Modal list in `<ActiveCampaignBanner />`.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Verify modal presence and correct links.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Do not block ad hoc setup rendering.
  - Design element: Asynchronous `useEffect` fetch in the banner component.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Verify `CombatSetupView` renders immediately while campaigns fetch.

## Risks / Trade-offs

- Risk/trade-off: Fetch failure or slow API response.
  - Impact: Banner appears late or not at all.
  - Mitigation: Fail silently if the fetch errors. Do not show error banners; the ad hoc flow should just proceed normally.

## Rollback / Mitigation

- Rollback trigger: Banner causes layout shift breaking ad hoc UI, or infinite fetch loop.
- Rollback steps: Revert the PR that includes the banner component in `CombatSetupView`.
- Data migration considerations: None (client-side state only).
- Verification after rollback: Verify ad hoc combat page renders normally.

## Operational Blocking Policy

- If CI checks fail: Fix the tests/build before merging.
- If security checks fail: Same.
- If required reviews are blocked/stale: Escalate to DM/repo owner.
- Escalation path and timeout: N/A for this minor feature.

## Open Questions

- None.
