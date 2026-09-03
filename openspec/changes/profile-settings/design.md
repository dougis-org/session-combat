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

### Decision 3: `dice.surface` valid values (resolves Open Question)

- Chosen: `dice.surface` is `string | null`, where `null` means "default surface" and the
  UI offers a fixed set of options — `wood`, `metal`, `stone`, `felt`. The stored type
  stays `string | null` for forward compatibility.
- Status of first implementation: shipped as an unconstrained `string | null` — the schema
  validator (`KEY_VALIDATORS["dice.surface"]`) accepts any string, and the fixed list lives
  only in the `<select>` on `app/profile/page.tsx`.
- Follow-up (tracked in tasks.md): tighten `KEY_VALIDATORS["dice.surface"]` to an enum
  (`SURFACE_VALUES`) shared between the schema and the page so an out-of-range value is
  rejected by `validatePreferencePatch` and repaired by `resolvePreferences`, instead of
  being silently persisted.
- Rationale: an enum keeps the persisted value meaningful for the eventual dice-engine
  consumer (Decision 4) and matches how `dice.color` is already validated.

### Decision 4: `dice.color` and `dice.surface` are persistence-only for now

- Chosen: this change wires `dice.color` and `dice.surface` through the schema, the
  preferences API, and the `/profile` UI, but nothing in the dice engine reads them yet.
- Rationale: keeps this change scoped to "give users a place to set preferences"; the
  dice-appearance integration (applying colour/surface at DiceBox construction) is separate
  work with its own testing surface.
- Follow-up (tracked in tasks.md): a separate change consumes `preferences.dice.color` /
  `preferences.dice.surface` in the dice-rendering path.

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

- Risk/trade-off: `dice.color` free-text input could silently discard invalid entries.
  - Detail: `isValidPreferenceValue('dice.color', …)` requires a strict `#rgb` / `#rrggbb`
    hex; a partial or malformed entry would otherwise be dropped with only a `console.warn`.
  - Resolved (FU-3, shipped in this branch): the field holds a local draft, only pushes a
    valid short hex (or empty → `null`) to `setPreference`, and renders `aria-invalid` plus
    a `role="alert"` helper while the entry is malformed.
  - Possible future refinement: a native `<input type="color">` / swatch picker would remove
    the free-text failure mode entirely.

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

- ~~What are the valid values for `dice.surface`?~~ Resolved — see Decision 3.
  `null` (default) plus `wood` / `metal` / `stone` / `felt`; enum enforcement in the schema
  is a tracked follow-up.
