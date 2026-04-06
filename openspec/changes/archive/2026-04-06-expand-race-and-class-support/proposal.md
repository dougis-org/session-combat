## GitHub Issues

- dougis-org/session-combat#122

## Why

- Problem statement: The character import feature from DnD Beyond fails to support common official races (like "Mountain Dwarf") and classes (like "Artificer"), leading to "is not supported and was omitted" warnings.
- Why now: Mountain Dwarf and Artificer are core to many player characters, and the recent 2024 D&D species/species changes mean we need broader, more flexible matching logic.
- Business/user impact: Users can successfully import their characters without losing essential identity data.

## Problem Space

- Current behavior: `normalizeRace` only allows an exact match against a small list of base races. If the import says "Mountain Dwarf", it is rejected entirely.
- Desired behavior: The importer should recognize both base races and subraces. Subraces should be supported either directly or by mapping them to their parent race.
- Constraints: Must not break existing character data or validation.
- Assumptions: A character labeled "Mountain Dwarf" should be imported as "Mountain Dwarf" (or "Dwarf" if we decide to collapse them, but issue 122 implies supporting the full variation).
- Edge cases considered: Case sensitivity, leading/trailing whitespace, and partial matches (e.g., "Variant Human").

## Scope

### In Scope

- Expanding the `DnDRace` type and `VALID_RACES` array to include common subraces and non-SRD races (Aasimar, etc.).
- Expanding the `DnDClass` type and `VALID_CLASSES` array to include "Artificer" and "Blood Hunter".
- Enhancing `normalizeRace` in `lib/dndBeyondCharacterImport.ts` to handle case-insensitive matches and substring fallback for base races.
- Comprehensive unit and integration test updates.

### Out of Scope

- Implementing actual racial traits or mechanics (e.g., "Dwarven Armor Training").
- Importing subclasses (this is a separate capability).

## What Changes

- `lib/types.ts`: Updated `DnDRace`, `VALID_RACES`, `DnDClass`, and `VALID_CLASSES`.
- `lib/dndBeyondCharacterImport.ts`: Improved `normalizeRace` logic.
- `tests/unit/import/dndBeyondCharacterImport.test.ts`: New test cases for expanded support.
- `tests/fixtures/dndBeyondCharacter.ts`: New fixtures for testing.

## Capabilities

### Modified Capabilities

- `dnd-beyond-character-import`: Update normalization logic to accept a broader range of race and class identities.

## Risks

- Risk: Namespace pollution in `DnDRace` if we add too many variations.
  - Impact: Harder to manage if we ever want to implement specific mechanics for each.
  - Mitigation: Use substring matching for common subraces to map them to base races if they are not explicitly listed.
- Risk: Inconsistent naming between 2014 and 2024 rules.
  - Impact: Confusion for users if a species is imported under an old or new name.
  - Mitigation: Support both where possible and prioritize the name provided by the source.

## Open Questions

- Question: Should we import "Mountain Dwarf" as exactly "Mountain Dwarf" or collapse it to "Dwarf"?
  - Needed from: Requester (dougis)
  - Blocker for apply: no (can start with explicit support)
- Question: Are there any other specific "Species" from the 2024 rules that we should proactively add besides Aasimar and Goliath?
  - Needed from: Requester
  - Blocker for apply: no

## Non-Goals

- Refactoring the entire import system.
- Adding support for 2024 Backgrounds or Origin Feats.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
