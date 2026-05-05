## GitHub Issues

- #154
- Part of series: #150–159

## Why

- **Problem statement**: `lib/dndBeyondCharacterImport.ts` has actions and traits normalization logic mixed with other normalizers. This makes it hard to isolate, test, and reuse when adding support for new providers (Open5E, etc.).

- **Why now**: The refactor series (issues 150–159) is systematically extracting normalizers into focused modules. Issue 154 completes the abilities/actions domain extraction, clearing the path for additional providers to plug in their own adapters.

- **Business/user impact**: Multi-provider support is blocked until this normalization is extracted. Enables future integrations with less duplicate code and clearer architecture.

## Problem Space

- **Current behavior**: Five tightly coupled functions in `dndBeyondCharacterImport.ts`:
  - `normalizeAbilities()` — orchestrator
  - `normalizeActionEntry()` — entry-to-ability mapper
  - `pushAbilityByActivation()` — categorizes by DnD Beyond activation IDs
  - `mapNarrativeEntries()` — converts field records to abilities
  - `sanitizeHtmlSnippet()` — HTML cleaner
  
  Plus constants: `ACTIONS_BY_ACTIVATION_TYPE`, `TRAIT_TITLE_MAP`, `NOTE_TITLE_MAP`.

- **Desired behavior**: Provider-agnostic logic in generic utils (`sanitizeHtmlSnippet`, `mapNarrativeEntries`), DnD Beyond-specific adapter in `dndBeyond-abilities.ts`. Each provider can then implement its own adapter following the same pattern.

- **Constraints**:
  - Issue 173 (generic helpers extraction) must be complete first — `titleize()` is a dependency.
  - Existing tests for these functions must continue to pass.
  - DnD Beyond-specific knowledge (activation type IDs, field name maps) must not leak into generic utilities.

- **Assumptions**:
  - Multi-provider architecture is the intended design (confirmed by user).
  - Future providers will have different activation type schemes, field names, etc.
  - One warning per import batch is tolerated; two or more warnings should fail the batch.

- **Edge cases considered**:
  - Empty or null input objects (actions, traits, notes) — gracefully handled as empty arrays.
  - HTML in action descriptions — sanitized without warning (expected behavior).
  - Malformed action entries (missing name, snippet, or description) — collected as warnings; batch fails if >1 warning.
  - Empty narrative fields (null or empty string) — silent graceful degradation.

## Scope

### In Scope

- Extract `sanitizeHtmlSnippet()` from `dndBeyondCharacterImport.ts` → `lib/import/utils.ts` (generic).
- Extract `mapNarrativeEntries()` from `dndBeyondCharacterImport.ts` → `lib/import/utils.ts` (generic).
- Create new `lib/import/dndBeyond-abilities.ts` with:
  - `normalizeAbilities()` — orchestrator with 1-warning threshold.
  - `normalizeActionEntry()` — DnD Beyond type mapper.
  - `pushAbilityByActivation()` — DnD Beyond activation categorizer.
  - `ACTIONS_BY_ACTIVATION_TYPE`, `TRAIT_TITLE_MAP`, `NOTE_TITLE_MAP` — provider-specific constants.
- Update `dndBeyondCharacterImport.ts` to import and call `normalizeAbilities()` from new module.
- Update `lib/import/utils.ts` exports to include new generic functions.
- All existing tests continue to pass.

### Out of Scope

- Changes to other normalizers (skills, senses, defenses, ability scores) — those are separate issues.
- Moving `lib/dndBeyondCharacterImport.ts` into `lib/import/` — scoped to abilities extraction only.
- Changes to `lib/server/dndBeyondCharacterImport.ts` (server-side API).
- Open5E or other provider adapters — those come after this foundation is solid.
- Test file reorganization — tests stay in their current locations.

## What Changes

1. **`lib/import/utils.ts`**:
   - Add `sanitizeHtmlSnippet(snippet: string): string` — strips HTML tags and normalizes whitespace.
   - Add `mapNarrativeEntries(entries, titleMap): CreatureAbility[]` — converts record of strings to ability array with titles.

2. **`lib/import/dndBeyond-abilities.ts`** (new file):
   - Export `ACTIONS_BY_ACTIVATION_TYPE`, `TRAIT_TITLE_MAP`, `NOTE_TITLE_MAP` — DnD Beyond field/ID mappings.
   - Export `normalizeAbilities(actions, traits, notes): { traits, actions, bonusActions, reactions }` — orchestrator that processes all three input types and returns categorized abilities.
   - Export `normalizeActionEntry(entry): CreatureAbility | null` — converts DnD Beyond action entry to normalized ability.
   - Export `pushAbilityByActivation(categorizedAbilities, entry, ability): void` — categorizes ability by activation type.

3. **`lib/dndBeyondCharacterImport.ts`**:
   - Remove five extracted functions and three constants.
   - Import `normalizeAbilities` from `./import/dndBeyond-abilities`.
   - Update call site in `normalizeDndBeyondCharacter()` to use imported function.

4. **`lib/import/dndBeyond-utils.ts`**:
   - No changes required; `DndBeyondImportError` already available for use in new module.

## Risks

- **Risk**: Tests fail due to import path changes.
  - **Impact**: Refactor halts; existing functionality broken.
  - **Mitigation**: Run full test suite after refactor; verify all dndBeyond import tests still pass.

- **Risk**: New generic functions are used with DnD Beyond-specific assumptions baked in.
  - **Impact**: Open5E adapter implementation discovers incompatibilities; refactoring required.
  - **Mitigation**: Code review focusing on provider-agnostic logic; avoid using DnD Beyond type names in generic utils. Test `mapNarrativeEntries()` and `sanitizeHtmlSnippet()` with diverse input to verify they're truly generic.

- **Risk**: Warning threshold (1 per batch) is too strict or too loose for real-world data.
  - **Impact**: Either too many false positives or undetected data quality issues.
  - **Mitigation**: Start with 1-warning threshold; monitor logs in first week of production; adjust if needed.

## Open Questions

- None. Design, scope, and constraints are fully specified.

## Non-Goals

- Performance optimization of normalization logic.
- Expanding ability/action coverage beyond what D&D 5e defines.
- Supporting non-D&D game systems.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
