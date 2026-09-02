## Context

- Relevant architecture: Next.js App Router (`app/`), React Context (`usePreferences`), Radix UI (`DropdownMenu`).
- Dependencies: `lib/preferences/schema.ts`, `lib/components/UserMenu.tsx`, `lib/components/ui.tsx`.
- Interfaces/contracts touched: `PreferenceValues` interface in `schema.ts`.

## Goals / Non-Goals

### Goals

- Create a UI to edit user preferences.
- Add "Profile & Settings" to `UserMenu.tsx`.
- Support `dice.color` and `dice.surface` settings.

### Non-Goals

- Sidebar navigation or multi-page settings architecture.
- Replacing the existing `usePreferences` syncing mechanism.

## Decisions

### Decision 1: Create a single /profile route

- Chosen: Flat page at `app/profile/page.tsx` using `<ProtectedRoute>`.
- Alternatives considered: A modal dialog or a complex sidebar layout.
- Rationale: Simplest iteration for the current set of preferences.
- Trade-offs: May need refactoring into tabs later if preferences grow significantly.

### Decision 2: Enhance schema.ts for dice options

- Chosen: Add `surface` to `dice` preferences in `schema.ts` (e.g., as `string | null`).
- Alternatives considered: Keep it separate.
- Rationale: All dice preferences should be under the `dice` domain for consistency.
- Trade-offs: Requires a migration or default fallback for existing users (handled cleanly by `resolvePreferences`).

## Proposal to Design Mapping

- Proposal element: Add "Profile & Settings" link
  - Design decision: Add DropdownMenuItem in UserMenu.tsx routing to `/profile`
  - Validation approach: E2E/Unit test verifying link presence and route
- Proposal element: Include `color` and `surface` dice settings
  - Design decision: Enhance schema.ts and render standard inputs on the profile page
  - Validation approach: Unit test for schema validation; integration test for saving new fields

## Functional Requirements Mapping

- Requirement: Users can view and edit their preferences.
  - Design element: `/profile` page with form controls bound to `usePreferences()`.
  - Acceptance criteria reference: Spec 1
  - Testability notes: Component tests for `ProfilePage` and `usePreferences` context integration.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Form should handle transient network errors during sync.
  - Design element: `usePreferences` already handles debounce and retry logic. UI should reflect current local state.
  - Acceptance criteria reference: Spec 1
  - Testability notes: No new code needed, just verify standard form bindings.

## Risks / Trade-offs

- Risk/trade-off: Schema changes might invalidate stored defaults.
  - Impact: Low, `resolvePreferences` handles fallback.
  - Mitigation: Ensure `DEFAULT_PREFERENCES` is updated correctly for new fields.

## Rollback / Mitigation

- Rollback trigger: User settings break on load.
- Rollback steps: Revert the PR and tell users to clear local storage if necessary.
- Data migration considerations: `sparseKnownValues` handles sparse updates safely.
- Verification after rollback: Verify app loads with default preferences.

## Operational Blocking Policy

- If CI checks fail: Fix before merge.
- If security checks fail: Block merge.
- If required reviews are blocked/stale: Ping codeowners.
- Escalation path and timeout: N/A

## Open Questions

- What are the valid values for `dice.surface`? (Assuming string for now).
