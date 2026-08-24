## GitHub Issues

- #538

## Why

- Problem statement: When a DM starts combat from within a campaign context, the encounter picker currently fetches and displays every single encounter in their library, forcing them to sift through irrelevant encounters from other campaigns.
- Why now: The backend foundation (Campaign-Encounter Link API, Issue #536) has just been merged, making it possible to filter encounters by campaign.
- Business/user impact: Greatly improves DM workflow and UX by scoping encounters to the relevant campaign context, reducing cognitive load during session prep and play.

## Problem Space

- Current behavior: `useCombat({ campaignId })` unconditionally fetches `/api/encounters` and `CombatSetupView` displays a dropdown of all encounters.
- Desired behavior: `useCombat` fetches `/api/campaigns/${campaignId}/encounters` when `campaignId` is provided. If no encounters are linked to the campaign, `CombatSetupView` displays an empty state with a link to manage campaign encounters instead of an empty dropdown.
- Constraints: The global ad-hoc combat page (`/combat`) must continue to work without a campaign and fetch all encounters. "Quick Entry" (ad-hoc combatants) must remain fully functional regardless of linked encounters.
- Assumptions: The API `/api/campaigns/[id]/encounters` is fully functional and returns the correct payload format.
- Edge cases considered: A campaign with zero linked encounters must render an intuitive empty state rather than a confusing blank dropdown.

## Scope

### In Scope

- Modifying `lib/hooks/useCombat.ts` to conditionally fetch the correct API based on the presence of `campaignId`.
- Modifying `lib/components/CombatSetupView.tsx` to handle the empty state when in a campaign context and the encounter list is empty.
- Updating tests for `useCombat` and `CombatSetupView` to cover these new states.

### Out of Scope

- Implementing the Campaign Encounters management screen (tracked in #537).
- Modifying the ad-hoc combat page banner (tracked in #539).
- Modifying the ActiveCombatView or in-combat mechanics.

## What Changes

- `useCombat`: API fetch logic.
- `CombatSetupView`: UI rendering logic for the "From Library" panel.
- Relevant test files.

## Risks

- Risk: The API might return a different shape for `/api/campaigns/[id]/encounters` than `/api/encounters`.
  - Impact: UI breaks when attempting to parse encounters.
  - Mitigation: Verify the API response matches the `Encounter[]` type.
- Risk: Ad-hoc combat is inadvertently broken by changes to `useCombat`.
  - Impact: Users cannot start combat from the global `/combat` page.
  - Mitigation: Ensure `useCombat` correctly falls back to `/api/encounters` when `campaignId` is undefined, and write tests for both paths.

## Open Questions

- Question: Does the link to the campaign's Encounters management screen need a specific icon or styling?
  - Needed from: Design
  - Blocker for apply: no

## Non-Goals

- Refactoring the entire `useCombat` hook.
- Building the UI to link/unlink encounters.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
