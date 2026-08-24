## Context

The "Sync from D&D Beyond" button currently only appears on the Character View screen. Users want it on the Character Editor screen as well. The sync logic and button are implemented in `app/characters/[id]/page.tsx` but hidden behind a `!isEditing` check.

## Goals / Non-Goals

**Goals:**
- Make the "Sync from D&D Beyond" button available while editing a character.
- Reuse existing sync logic and modal without duplicating code.

**Non-Goals:**
- Modifying the underlying sync logic or D&D Beyond integration itself.

## Decisions

- **Decision 1: Lift the sync button out of the `!isEditing` check.**
  - **Rationale:** The `app/characters/[id]/page.tsx` component already houses the `CharacterEditor`, the sync modal, and the sync state. Moving the button outside the `!isEditing` condition allows it to render in the header actions area even when `isEditing` is true, reusing all existing logic without passing additional props into `CharacterEditor`.

## Risks / Trade-offs

- Risk: The sync overwrites all unsaved changes in the editor.
  - Mitigation: The sync modal already displays a prominent warning ("Warning: Full Replacement"). We can ensure it still shows when triggered from the edit screen.
