## GitHub Issues

- #665

## Why

- Problem statement: Users currently have no interface to edit their preferences. There's a robust preference system backend, but no UI to modify settings.
- Why now: As we add more settings (like dice animations, color, and surface), users need a way to manage them.
- Business/user impact: Improves user experience by allowing customization of their interface and tooling.

## Problem Space

- Current behavior: Preferences are set to defaults or modified programmatically/legacy without user control. The user menu only has a "Logout" option.
- Desired behavior: A new "Profile & Settings" option in the user menu leading to a dedicated page (`/profile`) where users can view and edit their preferences.
- Constraints: The preferences schema in `schema.ts` dictates the exact structure of preferences.
- Assumptions: A simple flat layout is sufficient for now, rather than a complex multi-tab interface.
- Edge cases considered: Handling invalid values (handled by schema), logging out during save, syncing across tabs (already handled by `usePreferences`).

## Scope

### In Scope

- Adding a "Profile & Settings" link in `UserMenu.tsx` (above Logout).
- Creating a new protected route (`app/profile/page.tsx`).
- Displaying controls for all preferences in `schema.ts`, which includes:
  - `dice.sendToChat`
  - `dice.disableAnimation`
  - `dice.color`
  - `dice.surface` (Needs to be added to `schema.ts`)
  - `chat.pinned`
  - Note: `chat.size` is implicitly set by UI dragging, so no manual input is needed.

### Out of Scope

- Multi-tab sidebar navigation.
- Modifying account credentials (email/password) on this page.

## What Changes

- `lib/components/UserMenu.tsx`: Add profile option.
- `app/profile/page.tsx`: New page for preferences.
- `lib/preferences/schema.ts`: Ensure `color` and `surface` are present in the `dice` preferences domain.

## Risks

- Risk: Unhandled preference values crashing the app.
  - Impact: Low (schema handles validation and defaults).
  - Mitigation: Use `isValidPreferenceValue` and `setPreference` correctly.

## Open Questions

- Question: Does `dice.surface` need to be a string or a boolean, and what are the valid options?
  - Needed from: Product / Designer (User)
  - Blocker for apply: yes

## Non-Goals

- Complete overhaul of the settings structure.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
