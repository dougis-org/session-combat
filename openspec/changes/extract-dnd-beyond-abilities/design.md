## Context

- **Relevant architecture**: Multi-provider import system. Provider adapters (dndBeyond-abilities.ts) convert provider-specific types to common D&D 5e types. Generic utilities (lib/import/utils.ts) provide reusable helpers. This pattern scales to Open5E, Statblock5e, etc.
  
- **Dependencies**: Issue 173 (generic helpers extraction) must be complete. `titleize()` from `lib/import/utils.ts` is imported by new module.

- **Interfaces/contracts touched**:
  - `DndBeyondActionEntry` (input, from DnD Beyond API schema)
  - `CreatureAbility` (output, internal type)
  - `ValidationError` (from lib/validation/monsterUpload.ts)
  - `DndBeyondImportError` (from lib/import/dndBeyond-utils.ts)

## Goals / Non-Goals

### Goals

1. Extract abilities normalization from monolithic `dndBeyondCharacterImport.ts` into focused `dndBeyond-abilities.ts`.
2. Move generic, reusable logic (`sanitizeHtmlSnippet`, `mapNarrativeEntries`) to `lib/import/utils.ts`.
3. Establish clear provider adapter pattern: DnD Beyond-specific type mappings stay in dndBeyond-abilities.ts; generic D&D logic goes to utils.
4. Enable future providers (Open5E, etc.) to implement their own adapters without duplicating generic logic.
5. All existing tests continue to pass; no breaking changes to public API.

### Non-Goals

- Optimize performance of normalization.
- Modify test file structure or move tests.
- Changes to server-side import (`lib/server/dndBeyondCharacterImport.ts`).
- Open5E adapter implementation (future work).

## Decisions

### Decision 1: Extract Generic Helpers to lib/import/utils.ts

- **Chosen**: Move `sanitizeHtmlSnippet()` and `mapNarrativeEntries()` to generic utils.
  
- **Alternatives considered**:
  - Keep all functions in dndBeyond-abilities.ts — simpler file organization but reduces reusability.
  - Create a separate abilities-normalizer.ts with generic logic — over-engineered for current scope.

- **Rationale**: These functions are truly generic D&D logic (HTML cleaning, record-to-ability mapping with title maps). Future providers will need them. Moving now prevents duplication.

- **Trade-offs**: Slightly longer import chains in dndBeyond-abilities.ts, but cleaner multi-provider story.

### Decision 2: Provider-Specific Constants Stay in dndBeyond-Abilities

- **Chosen**: `ACTIONS_BY_ACTIVATION_TYPE`, `TRAIT_TITLE_MAP`, `NOTE_TITLE_MAP` remain in `dndBeyond-abilities.ts`.
  
- **Alternatives considered**:
  - Move to dndBeyond-utils.ts — less cohesive; these constants are used only by normalizeAbilities.
  - Make them configurable/data-driven — premature optimization; keep simple until Open5E needs variation.

- **Rationale**: These constants define how DnD Beyond's API maps to D&D 5e concepts. A different provider (Open5E) would have its own mappings. Keeping them in the provider adapter makes this clear.

- **Trade-offs**: If many constants accumulate, dndBeyond-abilities.ts could get large; refactor if needed.

### Decision 3: normalizeAbilities() Returns Shape with Error Threshold

- **Chosen**: `normalizeAbilities()` throws `DndBeyondImportError` if warnings.length > 1; otherwise returns data successfully.
  
- **Alternatives considered**:
  - Return `{ data, warnings }` and let caller decide on threshold — defers validation, harder to enforce consistency.
  - Silent graceful degradation (current behavior) — doesn't surface data quality issues; blocks future debugging.
  - Return Result<T, E> type — verbose; simpler to throw for this use case.

- **Rationale**: One warning per import is tolerable (e.g., one action entry missing description). Two or more warnings signal data quality issues that should block the batch. Throwing makes the failure explicit; caller doesn't have to check warnings array.

- **Trade-offs**: Callers can't inspect warnings if they want to; mitigated by logging warnings before throwing.

### Decision 4: normalizeActionEntry() Remains Internal, Returns Null on Invalid

- **Chosen**: `normalizeActionEntry()` is not exported; remains a helper. Returns `CreatureAbility | null` for internal filtering.
  
- **Alternatives considered**:
  - Export and let caller decide on validation — complicates caller logic; each provider would reimplement.
  - Return Result type — unnecessary complexity for internal function.

- **Rationale**: This function converts DnD Beyond schema to common schema. It's part of the provider adapter's internal machinery, not a public interface. Callers use `normalizeAbilities()`, which handles validation.

- **Trade-offs**: Can't test this function in isolation without accessing internals; mitigated by testing through `normalizeAbilities()`.

### Decision 5: Separate Module Over Inline Extraction

- **Chosen**: Create new `lib/import/dndBeyond-abilities.ts` instead of inlining into dndBeyondCharacterImport.ts.
  
- **Alternatives considered**:
  - Keep functions inline in main file — no new file, but violates SRP; main file stays 1000+ lines.
  - Merge with dndBeyond-utils.ts — utils becomes a kitchen sink; harder to find functions.

- **Rationale**: Focused module is easier to navigate, test, and replace. Aligns with pattern used for skills (dndBeyond-skills-senses.ts) and defenses (dndBeyond-defenses.ts).

- **Trade-offs**: One more file to maintain; worth it for clarity and separation of concerns.

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation |
|---|---|---|
| Extract generic helpers | Decision 1: Move to utils.ts | Verify `sanitizeHtmlSnippet` and `mapNarrativeEntries` have no DnD Beyond types |
| Provider-specific constants stay DnD Beyond | Decision 2: Keep in dndBeyond-abilities.ts | Check ACTIONS_BY_ACTIVATION_TYPE uses only DnD Beyond activation IDs |
| One-warning threshold | Decision 3: Throw on warnings.length > 1 | Unit test normalizeAbilities with 1, 2+ warnings |
| Multi-provider support enabled | Decision 5: New module dndBeyond-abilities.ts | Code review: can Open5E adapter follow the same pattern? |
| No breaking changes | All decisions | All existing tests pass; dndBeyondCharacterImport.ts imports new module, same output |

## Functional Requirements Mapping

| Requirement | Design Element | Acceptance Criteria | Testability |
|---|---|---|---|
| Extract abilities normalization | New dndBeyond-abilities.ts with 5 functions | All functions exist, exported, callable | Unit test each function |
| Move generic logic to utils | sanitizeHtmlSnippet, mapNarrativeEntries in lib/import/utils.ts | Both exported from utils; no DnD Beyond types | Grep: no DndBeyondModifier, DndBeyondActionEntry in utils.ts |
| Normalize actions/traits/notes separately | normalizeAbilities returns { traits, actions, bonusActions, reactions } | Each category is an array; correct count of abilities | Unit test: 3 action types categorized correctly |
| Support 1-warning threshold | Throw DndBeyondImportError if warnings.length > 1 | normalizeAbilities throws on 2+ warnings, succeeds on 0–1 | Unit test: both threshold cases |
| Keep existing tests passing | No changes to test file locations | All tests in tests/unit/import/*.test.ts still pass | Run full test suite |
| Provider-agnostic utilities | `mapNarrativeEntries()` works with any title map | Function signature: (record, titleMap) → CreatureAbility[] | Unit test with different title maps |

## Non-Functional Requirements Mapping

| Category | Requirement | Design Element | Acceptance Criteria | Testability |
|---|---|---|---|---|
| Maintainability | Code clarity: each function has single responsibility | Separate dndBeyond-abilities.ts; no God functions | Code review: max ~40 lines per function |
| Testability | Functions are unit-testable without mocks | No side effects; inputs/outputs clear | All functions have unit tests |
| Extensibility | Future providers can use same pattern | Generic utils are provider-agnostic | Design review: can Open5E adapter reuse utils? |
| Reliability | Errors are logged, not silently dropped | Warning collection + threshold before throwing | Error logs include field names, counts |
| Performance | No performance regression | All functions use same algorithms as before | Benchmark: same speed as original |

## Risks / Trade-offs

| Risk / Trade-off | Impact | Mitigation |
|---|---|---|
| Import path changes break existing code | Compilation fails; imports break | Update all references in dndBeyondCharacterImport.ts; run build |
| Generic functions used with DnD Beyond assumptions | Open5E adapter incompatibility later | Code review: validate genericness; test with mock data outside DnD Beyond schema |
| Threshold of 1 warning is too strict | Legitimate data passes but triggers failure | Monitor production logs first week; adjust if false positives exceed N% |
| File organization feels unnatural | Developer confusion; slower onboarding | Document pattern in CONTRIBUTING.md; link from dndBeyond-abilities.ts |

## Rollback / Mitigation

- **Rollback trigger**: Any critical test failure post-apply, or warnings cause frequent false positives in production.

- **Rollback steps**:
  1. Revert commits that created/modified dndBeyond-abilities.ts, dndBeyond-utils.ts, lib/import/utils.ts, dndBeyondCharacterImport.ts.
  2. Re-run tests to verify no regressions.
  3. Deploy reverted version.

- **Data migration considerations**: None. This is a pure code refactor; no data schema changes.

- **Verification after rollback**: Run full test suite; import sample DnD Beyond character; verify abilities appear correctly.

## Operational Blocking Policy

- **If CI checks fail**: Do not merge. Fix test failures before retry. If intermittent, investigate flakiness.

- **If security checks fail**: Do not merge. Address security findings; re-run scan. Escalate if unclear.

- **If required reviews are blocked/stale**: Do not merge until approval. 24h timeout for initial review; then escalate to team lead.

- **Escalation path**: Code review → team lead → engineering manager if blocked >48h.

## Open Questions

- None. All design decisions are finalized based on exploration phase.
