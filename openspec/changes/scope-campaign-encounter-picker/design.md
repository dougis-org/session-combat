## Context

- Relevant architecture: `useCombat` hook for client-side state and data fetching, `CombatSetupView` for presentation.
- Dependencies: Requires the backend API `/api/campaigns/[id]/encounters` to be functional.
- Interfaces/contracts touched: `lib/hooks/useCombat.ts`, `lib/components/CombatSetupView.tsx`.

## Goals / Non-Goals

### Goals

- Fetch only campaign-linked encounters when starting combat from a campaign.
- Provide a clear, actionable empty state when a campaign has zero linked encounters.
- Keep ad-hoc combat and "Quick Entry" fully functional.

### Non-Goals

- Refactoring the entire `useCombat` hook or migrating it to server components.
- Building the UI for managing (linking/unlinking) encounters (handled in #537).

## Decisions

### Decision 1: Conditional Data Fetching in `useCombat`

- Chosen: Modify the data loading `useEffect` in `useCombat` to construct the fetch URL dynamically: `/api/campaigns/${campaignId}/encounters` if `campaignId` is provided, otherwise `/api/encounters`.
- Alternatives considered: Passing encounters as a prop to `CombatSetupView` from its parent server component.
- Rationale: `useCombat` currently encapsulates all data fetching (encounters, characters, monsters). Keeping this logic localized within the hook maintains consistency with the existing pattern.
- Trade-offs: The component still relies on client-side fetching, which has a slight delay on initial load compared to server-side data passing.

### Decision 2: Empty State UI in `CombatSetupView`

- Chosen: When `combat.campaignId` is present and `encounters.length === 0`, replace the "From Library" `<select>` with a clear message and a `Link` pointing to `/campaigns/${combat.campaignId}/encounters`.
- Alternatives considered: Leaving the dropdown empty but disabled, or hiding the "From Library" section entirely.
- Rationale: A disabled dropdown is a dead end. Providing a direct link guides the DM to the exact screen they need to fix the issue.
- Trade-offs: Requires passing `campaignId` back out from the `useCombat` hook or relying on it being available in the component context. We will update `UseCombatReturn` to expose `campaignId`.

## Proposal to Design Mapping

- Proposal element: Fetch `/api/campaigns/${campaignId}/encounters` when `campaignId` is present.
  - Design decision: Decision 1: Conditional Data Fetching in `useCombat`.
  - Validation approach: Unit test `useCombat` to verify it calls the correct URL based on arguments.
- Proposal element: Display an empty state with a link when zero encounters are linked.
  - Design decision: Decision 2: Empty State UI in `CombatSetupView`.
  - Validation approach: Component test rendering `CombatSetupView` with empty encounters and a campaignId.

## Functional Requirements Mapping

- Requirement: Campaign combat setup only shows linked encounters.
  - Design element: Decision 1.
  - Acceptance criteria reference: specs/combat-setup/spec.md (to be created).
  - Testability notes: Mock `fetch` in `useCombat.test.ts` to assert the URL.
- Requirement: Zero linked encounters shows an empty state with a management link.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs/combat-setup/spec.md.
  - Testability notes: Render `CombatSetupView` in a test with `campaignId = '123'` and `encounters = []`, assert link presence.
- Requirement: Ad-hoc combat shows all encounters.
  - Design element: Decision 1.
  - Acceptance criteria reference: specs/combat-setup/spec.md.
  - Testability notes: Mock `fetch` in `useCombat.test.ts` without `campaignId` and assert it calls `/api/encounters`.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: The fallback for missing encounters must not crash the app.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs/combat-setup/spec.md.
  - Testability notes: Render with undefined/null encounters array.

## Risks / Trade-offs

- Risk/trade-off: Modifying the `useCombat` return type to include `campaignId` touches many files.
  - Impact: Low. `campaignId` is just a string pass-through.
  - Mitigation: The hook already receives `campaignId` in its options, just need to return it so the View knows the context.

## Rollback / Mitigation

- Rollback trigger: The new API endpoint fails consistently in production, or the UI crashes when rendering the empty state.
- Rollback steps: Revert the commits for this change, restoring unconditional fetch.
- Data migration considerations: N/A, this is a purely read-only UI change.
- Verification after rollback: Open the combat setup view and verify encounters load from the global list.

## Operational Blocking Policy

- If CI checks fail: Developer must fix the unit/integration tests before merge.
- If security checks fail: Blocked until reviewed by security (though no new attack vectors are introduced here).
- If required reviews are blocked/stale: Ping codeowners after 24 hours.
- Escalation path and timeout: N/A.

## Open Questions

- None at this time.
