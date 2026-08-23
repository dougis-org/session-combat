## GitHub Issues

- #530

## Why

- Problem statement: When characters are imported from D&D Beyond or other sources, the source URL is not preserved in the character data. There is also no way to easily update a character from its source without replacing it via the import flow manually.
- Why now: Users are leveling up and updating their characters in external tools (like D&D Beyond) and need a streamlined way to sync those changes into Session Combat without losing their internal database identity.
- Business/user impact: Greatly improves user experience for mid-campaign level-ups and stats updates, ensuring Session Combat stays in sync with external character sheets with minimal friction.

## Problem Space

- Current behavior: `POST /api/characters/import` fetches data from D&D Beyond and saves it to the database, but discards the original source URL. Overwriting requires hitting the import endpoint with `overwrite: true`.
- Desired behavior: Characters imported from external sources should store an `externalSync` block containing the provider and URL. The frontend should display a "Sync from D&D Beyond" button that issues a full-replace sync, after displaying a warning to the user.
- Constraints: The system will have multiple external providers in the future (e.g. Open5e). The internal `id` must be preserved during updates so relationships (party, encounters) do not break.
- Assumptions: A "Full Replace" strategy is acceptable for now. The backend will overwrite the entire character document from the external source, meaning current HP and local edits will be lost during a sync.
- Edge cases considered:
  - Users accidentally wiping out custom HP/inventory mid-session (mitigated by a warning modal).
  - Syncing a character that was deleted in the external source (the import fetch will fail, leaving the current data intact).

## Scope

### In Scope

- Adding `externalSync` to the `Character` type.
- Updating the import API to populate `externalSync`.
- Updating or adding an API endpoint to perform a sync using the stored `externalSync.url`.
- Adding a sync button and warning modal to the Character view UI.

### Out of Scope

- "Smart Merge" of character stats (e.g., preserving current HP or conditions while updating max HP).
- Automatic background syncing.
- Support for other external sources like Pathbuilder (D&D Beyond is the focus, but the schema should be generic).

## What Changes

- `lib/types.ts`: Update `Character` interface.
- `app/api/characters/import/route.ts`: Save `externalSync` data.
- API Route: Add `POST /api/characters/[id]/sync` (or adapt import) to fetch and replace using the stored URL.
- UI: Add sync action and warning modal.

## Risks

- Risk: Users lose important mid-session state (like damage taken) because they didn't read the warning modal.
  - Impact: High frustration for the player.
  - Mitigation: Make the warning modal explicit and require confirmation ("This will overwrite all local edits, including current HP").

## Open Questions

- None.

## Non-Goals

- Merging individual fields selectively.
- Syncing from Session Combat *back* to D&D Beyond.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
