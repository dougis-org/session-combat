## GitHub Issues

- #539

## Why

- Problem statement: DMs who have an active campaign sometimes land on the campaign-agnostic ad hoc combat page (`app/combat/page.tsx`) by mistake or default navigation, missing the campaign-scoped combat page.
- Why now: The campaign-aware combat linking feature is being built, and this is a component of that design (PR #534).
- Business/user impact: Gently nudges DMs to use the campaign-scoped combat flow, which offers filtered encounters, without forcing a redirect or disrupting the ad hoc experience.

## Problem Space

- Current behavior: The ad hoc combat page (`app/combat/page.tsx`) never shows any awareness of in-progress campaigns.
- Desired behavior: On the setup screen (`CombatSetupView`) of the ad hoc combat page, if the DM has at least one active campaign, show a dismissible banner. If there is one active campaign, link directly to it. If there are multiple, the link should open a modal for the DM to select which campaign's combat they want to start.
- Constraints: Must not break or alter the normal ad hoc combat flow. The banner must be dismissible for the current session.
- Assumptions: The user is a DM in the active campaigns.
- Edge cases considered:
  - Multiple active campaigns: Handled via a selection modal.
  - User already in active combat on the ad hoc page (`ActiveCombatView`): The banner should only be shown on the setup screen (`CombatSetupView`), not during active combat.
  - Dismissing the banner: Will use session storage to hide it for the duration of the session.

## Scope

### In Scope

- Adding a dismissible banner to the ad hoc combat setup screen (`CombatSetupView`).
- Fetching active campaigns for the current user.
- Linking to `/campaigns/[id]/combat` for a single active campaign.
- Creating a modal to select a campaign if multiple are active.
- Using `sessionStorage` for banner dismissal state.

### Out of Scope

- Changes to `ActiveCombatView`.
- Modifying how encounters are linked to campaigns.
- Any server-side changes to the campaigns API (using existing endpoints).

## What Changes

- `lib/components/CombatSetupView.tsx` will be updated to include the banner and fetch campaigns.
- A new modal component (or existing modal patterns) will be used for campaign selection.

## Risks

- Risk: API fetch for campaigns delays the rendering of the setup screen or causes layout shift.
  - Impact: Minor UI annoyance.
  - Mitigation: Render the banner asynchronously or reserve space/animate it smoothly in.

## Open Questions

- Question: Should the banner be hidden if the user's `sessionStorage` already has it dismissed?
  - Needed from: User
  - Blocker for apply: no

## Non-Goals

- Migrating ad hoc combat encounters into a campaign retroactively.
- Adding campaign encounters management (handled in another issue).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
