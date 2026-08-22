## GitHub Issues

## Why

- Problem statement: The character listing screen currently shows the full stat block for each character, which becomes overwhelming and hard to navigate when a user has multiple characters. Additionally, there is no dedicated view to see a single character in detail.
- Why now: To improve user experience as users start managing larger numbers of characters.
- Business/user impact: A more scannable character list makes it easier for users to find the character they want. A dedicated detail view provides a cleaner space to focus on a single character.

## Problem Space

- Current behavior: The `/characters` page iterates over all characters and renders a full `CreatureStatBlock` for each, along with basic info and action buttons.
- Desired behavior: The `/characters` page should render a compact summary (Name, Class, HP, AC) by default, with an option to expand and see the full inline stat block. It should also include a link to view a dedicated character detail page (`/characters/[id]`). The detail page should allow editing the character.
- Constraints: The existing `CreatureStatBlock` component should be reused. The `CharacterEditor` should be extracted to be shared between the list view and the detail view.
- Assumptions: Users want to edit characters from both the summary list view and the detailed view.
- Edge cases considered: Handling invalid character IDs on the detail page, managing state when switching between edit and view modes.

## Scope

### In Scope

- Extracting `CharacterEditor` into a reusable component.
- Creating a new `CharacterCard` component with expandable state.
- Modifying `app/characters/page.tsx` to use the new `CharacterCard`.
- Creating a new route `app/characters/[id]/page.tsx` for the dedicated detail view.
- Supporting character editing from both the listing page and the detail page.
- Changing the detail view button text to "View Character".

### Out of Scope

- Changes to how character data is stored or fetched from the backend, beyond fetching a single character by ID.
- Adding new fields to the character model.
- Revamping the visual design of the `CreatureStatBlock` itself.

## What Changes

- `app/characters/page.tsx`: Replaced inline rendering with `CharacterCard`, removed inline `CharacterEditor`.
- `lib/components/CharacterEditor.tsx`: New component extracted from `app/characters/page.tsx`.
- `lib/components/CharacterCard.tsx`: New component for the character list item.
- `app/characters/[id]/page.tsx`: New detail page route.

## Risks

- Risk: Extracting `CharacterEditor` breaks existing functionality.
  - Impact: Users cannot edit or create characters.
  - Mitigation: Thorough manual testing of the edit flow in both the listing and detail views after extraction.
- Risk: The detail page fails to fetch or display data for existing characters.
  - Impact: Users cannot view their characters.
  - Mitigation: Ensure `/api/characters/[id]` GET is correctly utilized and tested.

## Open Questions

None - the user has approved the plan and confirmed that editing should be allowed in both places and the button should say "View Character".

## Non-Goals

- A complete redesign of the characters page layout beyond adding the summary view.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
