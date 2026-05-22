## GitHub Issues

- #169

## Why

- Problem statement: After the code extraction series (issues 150–159), the dndBeyond import test suite remains monolithic. `tests/unit/import/dndBeyondCharacterImport.test.ts` is 719 lines and 30 tests that span 6+ unrelated domains (URL parsing, identity validation, class normalization, ability scores, armor class, skills/senses, defenses). A change to any single module requires hunting through the entire file to find the relevant tests.
- Why now: All code extraction prerequisites (issues 150–159) are complete. All eight `dndBeyond-*.ts` modules exist in `lib/import/`. Fixture consolidation and test factory infrastructure are in place. There are no remaining blockers.
- Business/user impact: Slower development velocity — a one-domain bug fix requires reading a 700-line test file. Poor isolation means test failures don't point clearly to the broken module.

## Problem Space

- Current behavior: 30 tests live in a single file. 27 of them test a single domain's logic but exercise it through the top-level `normalizeDndBeyondCharacter()` orchestrator rather than the extracted module functions directly.
- Desired behavior: Each extracted module (`dndBeyond-identity.ts`, `dndBeyond-classes.ts`, `dndBeyond-ability-scores.ts`, `dndBeyond-armor-class.ts`, `dndBeyond-skills-senses.ts`, `dndBeyond-defenses.ts`) has its own test file testing its exported functions directly. The monolith retains only 3 multi-domain orchestration tests.
- Constraints: No behavior change. All existing tests must still pass. Test count must not decrease (defenses needs new tests written from scratch since no monolith tests cover it in isolation).
- Assumptions: The unit/integration distinction is: single-domain = unit (no external system), external system dependency (persistence/network) = integration. All tests in the monolith are pure in-memory — none are integration tests by this definition. The 3 tests kept in the monolith are multi-domain orchestration unit tests, not integration tests.
- Edge cases considered: `parseDndBeyondCharacterUrl` is re-exported from `lib/dndBeyondCharacterImport.ts` sourced from `dndBeyond-identity.ts` — the identity test file imports directly from the module. The `dndBeyond-armor-class.test.ts` already exists; 5 tests add to it rather than creating a new file. The `dndBeyond-abilities.test.ts` already exists; 1 test may already be covered and needs verification before migration. `dndBeyond-defenses.ts` has no monolith tests to migrate — new tests must be written from scratch for `normalizeImmunities`, `normalizeByModifierType`, and `normalizeLanguages`.

## Scope

### In Scope

- Create `tests/unit/import/dndBeyond-identity.test.ts` (6 tests migrated from monolith)
- Create `tests/unit/import/dndBeyond-classes.test.ts` (6 tests migrated from monolith)
- Create `tests/unit/import/dndBeyond-ability-scores.test.ts` (8 tests migrated from monolith)
- Extend `tests/unit/import/dndBeyond-armor-class.test.ts` (+5 tests migrated from monolith)
- Create `tests/unit/import/dndBeyond-skills-senses.test.ts` (1 test migrated from monolith)
- Create `tests/unit/import/dndBeyond-defenses.test.ts` (new tests from scratch)
- Check/extend `tests/unit/import/dndBeyond-abilities.test.ts` (1 test migrated if not already covered)
- Shrink `tests/unit/import/dndBeyondCharacterImport.test.ts` to 3 multi-domain orchestration tests
- Rewrite migrated tests to call module functions directly (not through `normalizeDndBeyondCharacter`)

### Out of Scope

- Renaming or restructuring `dndBeyondUtils.test.ts` (camelCase naming inconsistency — pre-existing, not worth breaking import paths)
- Modifying any source files in `lib/`
- Adding tests for error paths not currently covered (beyond defenses)
- Changing fixture structure in `tests/fixtures/`

## What Changes

- 7 test files created or extended in `tests/unit/import/`
- `dndBeyondCharacterImport.test.ts` reduced from 719 lines / 30 tests to ~100 lines / 3 tests
- Test names in the issue corrected: `dndBeyond-character.test.ts` → `dndBeyond-identity.test.ts`, `dndBeyond-skills.test.ts` → `dndBeyond-skills-senses.test.ts`
- No source code changes

## Risks

- Risk: A migrated test that called `normalizeDndBeyondCharacter()` may not map cleanly to a direct module function call (e.g., the function under test needs different inputs or has slightly different behavior when called in isolation).
  - Impact: Test must be rewritten, not just moved. Could surface a module API gap.
  - Mitigation: Read each module's exported function signatures before migrating. If a test can't be cleanly isolated, note it and keep it in the monolith.
- Risk: `dndBeyond-abilities.test.ts` already exists — the one candidate test (L464, "omits actions with empty sanitized descriptions") may duplicate existing coverage.
  - Impact: Minor — either a duplicate test or a gap discovered.
  - Mitigation: Read existing abilities test file before migrating; deduplicate if covered.
- Risk: Defenses module tests written from scratch may have incorrect assumptions about function behavior.
  - Impact: False-positive tests or missed edge cases.
  - Mitigation: Read `dndBeyond-defenses.ts` source fully before writing tests.

## Open Questions

No unresolved ambiguity exists. The unit/integration boundary has been explicitly defined by the project owner (single domain = unit; external system dependency = integration). All naming decisions have been resolved. All prerequisites are confirmed complete.

## Non-Goals

- Do not rename `dndBeyondUtils.test.ts` to match the kebab module naming convention
- Do not add integration tests (no external system dependency exists in this domain)
- Do not refactor the monolith's remaining 3 orchestration tests into a separate `dndBeyond-orchestration.test.ts` — they stay in `dndBeyondCharacterImport.test.ts`
- Do not expand test coverage beyond what currently exists in the monolith (except defenses)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
