## Context

- Relevant architecture: `lib/dndBeyondCharacterImport.ts` (normalization logic) and `lib/types.ts` (domain model and validation lists).
- Dependencies: DnD Beyond Character JSON structure (specifically the `race.fullName` and `classes[].definition.name` fields).
- Interfaces/contracts touched: `Character` interface (the `race` and `classes` fields), `DnDRace` and `DnDClass` types.

## Goals / Non-Goals

### Goals

- Successfully import characters with the "Mountain Dwarf" race and "Artificer" class from DnD Beyond.
- Establish a more resilient `normalizeRace` function that handles subraces and naming variations (case, whitespace).
- Support a broader range of official D&D races and classes to reduce import warnings.

### Non-Goals

- Implementing racial traits, class features, or any mechanical logic beyond basic identity.
- Redesigning the character storage schema or UI.
- Supporting homebrew or non-official content.

## Decisions

### Decision 1: Expand Whitelists in `lib/types.ts`

- Chosen: Manually expand the `DnDRace`, `VALID_RACES`, `DnDClass`, and `VALID_CLASSES` lists to include a comprehensive set of official content (including common subraces like Mountain Dwarf).
- Alternatives considered: Dynamic race/class discovery or completely removing validation.
- Rationale: The application relies on these whitelists for data consistency and UI safety. Manual expansion ensures we only support what we intend to.
- Trade-offs: Requires periodic manual updates as new books are released.

### Decision 2: Multi-Stage Normalization for Races

- Chosen: Update `normalizeRace` to use a tiered matching strategy:
  1. Exact match (case-sensitive) against `VALID_RACES`.
  2. Case-insensitive, trimmed match against `VALID_RACES`.
  3. Substring match against a list of "Base Races" (e.g., if input contains "Dwarf", map to "Dwarf" if not explicitly supported).
- Alternatives considered: A flat mapping dictionary for all subraces (too high maintenance).
- Rationale: Substring matching handles variations like "Dwarf (Mountain)", "Mountain Dwarf", and "Dwarf, Mountain" gracefully without needing individual entries for every possible string.
- Trade-offs: Slight risk of over-matching, mitigated by checking exact/case-insensitive matches first.

## Proposal to Design Mapping

- Proposal element: Expand `DnDRace` and `VALID_RACES`
  - Design decision: Decision 1
  - Validation approach: Unit tests with explicit strings ("Aasimar", "Goliath").
- Proposal element: Expand `DnDClass` and `VALID_CLASSES`
  - Design decision: Decision 1
  - Validation approach: Unit tests with "Artificer".
- Proposal element: Enhance `normalizeRace` with substring matching
  - Design decision: Decision 2
  - Validation approach: Unit tests with varied subrace strings ("Hill Dwarf", "Wood Elf").

## Functional Requirements Mapping

- Requirement: Support "Mountain Dwarf" import
  - Design element: Decision 1 (add to whitelist) and Decision 2 (matching logic).
  - Acceptance criteria reference: `dnd-beyond-character-import` spec.
  - Testability notes: Use `mountainDwarfCharacterResponse` fixture.
- Requirement: Support "Artificer" import
  - Design element: Decision 1 (add to whitelist).
  - Acceptance criteria reference: `dnd-beyond-character-import` spec.
  - Testability notes: Use `aasimarArtificerCharacterResponse` fixture.

## Non-Functional Requirements Mapping

- Requirement category: Reliability
  - Requirement: Importer should handle varied formatting of race names (e.g., capitalization, extra spaces).
  - Design element: Decision 2 (normalization steps).
  - Acceptance criteria reference: `dnd-beyond-character-import` spec.
  - Testability notes: Test with "  mountain dwarf  ", "DWARF", "MountainDwarf".

## Risks / Trade-offs

- Risk/trade-off: Whitelist Bloat.
  - Impact: The `VALID_RACES` list could become very long.
  - Mitigation: Group common subraces under their base race via Decision 2 if they don't need distinct entries, but for now, we will add common ones explicitly as requested.

## Rollback / Mitigation

- Rollback trigger: Significant regressions in character import or validation errors for existing characters.
- Rollback steps: Revert `lib/types.ts` and `lib/dndBeyondCharacterImport.ts` to their previous versions.
- Data migration considerations: None; existing data remains valid.
- Verification after rollback: Run full unit test suite.

## Operational Blocking Policy

- If CI checks fail: Fix normalization logic or update tests to match new valid lists.
- If security checks fail: Verify that no unsanitized strings from DnD Beyond are being used in a dangerous way (though this change only affects internal mapping).
- If required reviews are blocked/stale: Reach out to `dougis` on GitHub.

## Open Questions

- Should we explicitly support all 2024 Species names (e.g., "Species" instead of "Race")? (Decision: Stick to "Race" for now to match existing UI/schema).
