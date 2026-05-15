## Implementation Task List

**Change**: Extract Armor Class Normalization (Generic + Provider-Specific Split)

**Implementation approach**: Test-Driven Development (TDD)
- Define tests before implementation
- Red → Green → Refactor cycle
- Comprehensive edge case coverage

---

## Preparation

### Task P-1: Set Up Branch & Environment

**Description**: Create feature branch and verify environment is ready for implementation

**Subtasks**:
- [ ] Create feature branch: `git checkout -b extract-armor-class-155`
- [ ] Verify Node.js/npm versions match project requirements
- [ ] Run `npm install` (fresh dependencies)
- [ ] Verify TypeScript compilation: `npx tsc --noEmit`
- [ ] Verify test environment: `npm run test:unit -- --listTests` (confirms jest is working)

**Owner**: Implementer  
**Blocker for**: All execution tasks

---

### Task P-2: Review Existing Tests

**Description**: Understand current test structure and any existing AC tests

**Subtasks**:
- [x] Locate existing character import tests: `tests/unit/import/`
- [x] Check if any tests reference `normalizeArmorClass`, `getArmorBonuses`, `getUnarmoredAcBonus`, `getArmorDexterityContribution`
- [x] Document findings: which functions are tested, which are not
- [x] Create test coverage baseline (run coverage report, note current %)

**Owner**: Implementer  
**Blocker for**: T-1 (TDD: understand what to test)

---

## Execution (TDD Workflow)

### Task T-1: Define Generic Armor Class Tests

**Description**: Write tests for `lib/import/armor-class.ts` BEFORE implementing the module

**Test file**: `tests/unit/import/armor-class.test.ts`

**Test cases** (using Spec: armor-class-generic.md):

- [x] Test: `capDexterityByArmorType(3, 2)` returns 2 (capped by max)
- [x] Test: `capDexterityByArmorType(3, null)` returns 3 (no cap)
- [x] Test: `capDexterityByArmorType(1, 2)` returns 1 (below limit)
- [x] Test: `capDexterityByArmorType(-1, 2)` returns -1 (negative penalties uncapped)
- [x] Test: `capDexterityByArmorType(5, 0)` returns 0 (heavy armor)
- [x] Test: `capDexterityByArmorType(3, undefined)` returns 3 (undefined max)
- [x] Test: Edge case with Infinity, negative numbers
- [x] Test: Type verification (function signature correct)

**Subtasks**:
- [x] Create test file skeleton with describe blocks
- [x] Write all test cases using Given/When/Then structure
- [x] Ensure tests are isolated (no dependencies on module implementation)
- [x] Verify tests fail (RED phase) before implementation

**Owner**: Implementer  
**Verification**: All tests fail before implementation  
**Blocker for**: T-2

---

### Task T-2: Implement Generic Armor Class Module

**Description**: Implement `lib/import/armor-class.ts` to pass tests from T-1

**Implementation**:
- [x] Create file: `lib/import/armor-class.ts`
- [x] Implement `capDexterityByArmorType(dexterityModifier: number, maxDexterityModifier?: number | null): number`
  - [x] Handle null/undefined max modifier (return dex unchanged)
  - [x] Handle numeric max modifier (return min(dex, max))
  - [x] Handle edge cases (0, negative numbers)
- [x] Export function: `export { capDexterityByArmorType }`
- [x] Add JSDoc comment clarifying generic usage and parameter meanings
- [x] Run tests: verify all from T-1 now pass (GREEN phase)
- [x] Refactor if needed (code clarity, simplification) — REFACTOR phase

**Code style**:
- [x] No console.log or debug code
- [x] No provider-specific types or imports
- [x] Zero external dependencies (only TypeScript types)

**Owner**: Implementer  
**Blocker for**: T-3

---

### Task T-3: Define DnD Beyond Armor Class Tests

**Description**: Write tests for `lib/import/dndBeyond-armor-class.ts` BEFORE implementing

**Test file**: `tests/unit/import/dndBeyond-armor-class.test.ts`

**Test cases** (using Spec: dndBeyond-armor-class-extraction.md):

#### normalizeArmorClass()
- [x] Test: Character with leather armor (AC 11, medium, max dex +2, dex mod +3, no bonuses) → 14
- [x] Test: Character with plate armor (AC 18, heavy, max dex 0, dex mod +3) → 18
- [x] Test: Character unarmored (no inventory, dex mod +2) → 12
- [x] Test: Character with armor + AC bonus modifier → bonus added correctly
- [x] Test: Unarmored with unarmored AC bonus modifier → bonus included

#### getArmorBonuses()
- [x] Test: Mixed modifiers, filters only armor-class → sums correctly
- [x] Test: Empty modifier list → 0
- [x] Test: Modifiers with null values → treated as 0

#### getUnarmoredAcBonus()
- [x] Test: Single bonus modifier → returns value
- [x] Test: Single set modifier → returns value
- [x] Test: Multiple set modifiers → returns max
- [x] Test: Set + bonus combined → returns set + bonus
- [x] Test: Empty list → 0

#### Constant renaming
- [x] Test: `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER` exists
- [x] Test: `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[2] === 2` (medium)
- [x] Test: `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[3] === 0` (heavy)

**Subtasks**:
- [x] Create test file with describe blocks for each function
- [x] Write mock `DndBeyondInventoryEntry`, `DndBeyondModifier` objects
- [x] Write all test cases using Given/When/Then
- [x] Verify tests fail before implementation (RED phase)

**Owner**: Implementer  
**Verification**: All tests fail before implementation  
**Blocker for**: T-4

---

### Task T-4: Implement DnD Beyond Armor Class Module

**Description**: Implement `lib/import/dndBeyond-armor-class.ts` to pass tests from T-3

**Implementation**:
- [x] Create file: `lib/import/dndBeyond-armor-class.ts`
- [x] Import: `capDexterityByArmorType` from `./armor-class`
- [x] Import: `getAbilityModifier` from `./utils`, `getModifierNumericValue` from `./dndBeyond-utils`
- [x] Define constant: `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER` (mapped from old constant)
- [x] Implement `normalizeArmorClass()`:
  - [x] Extracts dexterity modifier from ability scores
  - [x] Calls `getArmorBonuses()` to get bonus sum
  - [x] Checks for equipped armor in inventory
  - [x] If no armor: uses unarmored formula (10 + dex + unarmored bonus + bonuses)
  - [x] If armored: uses armor AC + dex contribution + bonuses
  - [x] Calls `capDexterityByArmorType()` via private helper
- [x] Implement `getArmorBonuses()`: filters subType==="armor-class", sums numeric values
- [x] Implement `getUnarmoredAcBonus()`: handles set/bonus logic
- [x] Private helper `getArmorDexterityContribution()`: maps armor type ID → max dex, calls generic function
- [x] Run tests: verify all from T-3 now pass (GREEN phase)
- [x] Refactor if needed (naming, clarity)

**Code style**:
- [x] No console.log or debug code
- [x] Only DnD Beyond-specific logic and types in this module
- [x] Comments explaining DnD Beyond-specific mappings (e.g., armorTypeId=3 → heavy armor)

**Owner**: Implementer  
**Blocker for**: T-5

---

### Task T-5: Update Main Import File

**Description**: Remove extracted functions from `lib/dndBeyondCharacterImport.ts` and import replacements

**Subtasks**:
- [x] Add import at top: `import { normalizeArmorClass } from "./import/dndBeyond-armor-class"`
- [x] Remove function `normalizeArmorClass()`
- [x] Remove function `getArmorBonuses()`
- [x] Remove function `getUnarmoredAcBonus()`
- [x] Remove function `getArmorDexterityContribution()`
- [x] Remove constant `ARMOR_TYPE_MAX_DEX_MODIFIER`
- [x] Verify call site (line ~257) still reads: `ac: normalizeArmorClass(data.inventory, abilityScores, modifiers)`
- [x] TypeScript check: `npm run typecheck` passes
- [x] Run existing tests: `npm run test -- tests/unit/` passes (verify no regressions)

**Owner**: Implementer  
**Blocker for**: T-6

---

## Validation

### Task V-1: Run Complete Test Suite

**Description**: Verify all tests pass (existing + new)

**Subtasks**:
- [x] Run unit tests: `npm run test:unit -- tests/unit/import/`
- [x] Verify armor-class.test.ts all pass (100%)
- [x] Verify dndBeyond-armor-class.test.ts all pass (100%)
- [x] Verify existing dndBeyond character import tests still pass (regression check)
- [x] Run full test suite: `npm run test:unit` (catch any unexpected failures)
- [x] Generate coverage report: `npm run test:unit -- --coverage`
- [x] Verify coverage for new modules ≥ 80%

**Owner**: Implementer  
**Verification**: All tests pass, coverage ≥ 80%  
**Blocker for**: V-2

---

### Task V-2: Test Coverage for Rules Fixes

**Description**: Verify AC calculation rules are correct (D&D 5e compliance + code review fixes)

**Note**: This extraction included intentional rules fixes (not a pure refactor):
1. Heavy armor now correctly ignores ALL dex modifiers (positive, negative, zero)
2. Shields are excluded from base armor selection (handled via modifiers instead)

**Approach**: 
- Add unit tests for both rules fixes
- Verify negative DEX with heavy armor returns 0 (not negative)
- Verify shield exclusion when inventory has mixed items

**Subtasks**:
- [x] Add test: negative DEX with max 0 (heavy armor) should return 0
- [x] Add test: shield (armorTypeId 4) excluded from base armor selection
- [x] Add test: mixed inventory (shield + armor) uses correct base AC
- [x] Verify all existing tests still pass (no regressions)
- [x] Document rules fixes in docstrings and comments

**Owner**: Implementer  
**Verification**: All tests pass, rules fixes documented and tested  
**Blocker for**: V-3

---

### Task V-3: TypeScript & Linting

**Description**: Verify code quality and type safety

**Subtasks**:
- [x] Run TypeScript compiler: `npm run typecheck` (no errors)
- [x] Run ESLint: `npm run lint` (no violations)
- [x] Verify no unused imports (ESLint import/no-unused-modules)
- [x] Verify no circular imports (ESLint import/no-cycle)
- [x] Manual check: no provider-specific types in generic module
- [x] Manual check: no hardcoded values or magic numbers without comments

**Owner**: Implementer  
**Verification**: TypeScript passes, ESLint passes, manual review passes  
**Blocker for**: PR-1

---

## PR and Merge

### Task PR-1: Create Pull Request

**Description**: Create PR with clean commit history

**Subtasks**:
- [x] Ensure all commits are atomic and well-documented
- [x] Commit 1: Create generic armor-class.ts + tests
- [x] Commit 2: Create dndBeyond-armor-class.ts + tests
- [x] Commit 3: Update dndBeyondCharacterImport.ts with imports
- [x] Commit 4: Add property-based equivalence test
- [x] Create PR with title: `feat(import): Extract armor class normalization (issue #155)`
- [x] PR description includes:
  - [x] Link to issue #155
  - [x] Summary of changes (2-3 sentences)
  - [x] What changed (files added/modified/removed)
  - [x] Test coverage summary (% new, old tests still pass)
  - [x] Architecture decision (generic + provider-specific split)

**Owner**: Implementer  
**Blocker for**: PR-2

---

### Task PR-2: Address Review Feedback

**Description**: Respond to and incorporate code review feedback

**Subtasks**:
- [x] Assign reviewer (someone familiar with import architecture)
- [x] Wait for review comments
- [x] Verify architectural feedback (no provider-specific types in generic module)
- [x] Verify test coverage feedback (all functions tested, edge cases covered)
- [x] Respond to comments with explanations or fixes
- [x] Update PR with clarifications or code changes
- [ ] Resolve all review conversations (mark as resolved)
- [x] Ensure all CI checks pass (tests, lint, type check)

**Owner**: Implementer  
**Approval required**: 1 reviewer  
**Blocker for**: PR-3

---

### Task PR-3: Merge to Main

**Description**: Merge PR after approval and CI clearance

**Subtasks**:
- [ ] Verify all CI checks pass (no failures)
- [ ] Verify all review comments resolved
- [ ] Verify PR is approved by reviewer
- [ ] No merge conflicts
- [ ] Merge to main branch (squash commit or normal merge, per project standard)
- [ ] Delete feature branch: `git branch -d extract-armor-class-155`

**Owner**: Implementer or reviewer with merge rights  
**Blocker for**: Post-Merge

---

## Post-Merge

### Task Post-1: Verify Deployment

**Description**: Confirm changes are deployed and working in CI/prod

**Subtasks**:
- [ ] Verify CI pipeline completed successfully after merge
- [ ] If applicable, verify deployment to staging/prod completed
- [ ] Monitor logs for any armor class calculation issues
- [ ] Spot-check: import a few test characters, verify AC unchanged

**Owner**: Implementer or on-call team  
**Timeline**: Within 1 hour of merge

---

### Task Post-2: Update Documentation & Memory

**Description**: Capture learnings and update project memory

**Subtasks**:
- [x] Update `.wolf/cerebrum.md` with architectural pattern (generic + provider-specific split)
- [x] Update `.wolf/memory.md` with session summary
- [x] Add entry to `.wolf/anatomy.md` for new files:
  - [x] `lib/import/armor-class.ts` — Generic D&D armor class utilities
  - [x] `lib/import/dndBeyond-armor-class.ts` — DnD Beyond armor class adapter
  - [x] `tests/unit/import/armor-class.test.ts` — Generic armor class tests
  - [x] `tests/unit/import/dndBeyond-armor-class.test.ts` — DnD Beyond-specific tests
- [x] Document the generic + provider-specific pattern for future issues (156+)

**Owner**: Implementer  
**Timeline**: Within 1 day of merge

---

## Blocking Resolution Flow

### If Tests Fail (V-1)

1. **Identify**: Which tests failed? (Unit tests, integration, property-based?)
2. **Root cause**: Run test with `--verbose` flag to see detailed output
3. **Fix**:
   - If implementation bug: fix code in dndBeyond-armor-class.ts or armor-class.ts
   - If test issue: fix test setup (mocks, assertions)
4. **Re-run**: Verify all tests pass
5. **Continue**: Proceed to V-2

### If CI Checks Fail (V-3)

1. **Identify**: TypeScript error? ESLint violation? Import cycle?
2. **Fix**:
   - TypeScript: Review error message, adjust type annotations or implementation
   - ESLint: Run `npm run lint -- --fix` to auto-fix simple issues
   - Imports: Verify generic module has zero provider-specific imports
3. **Re-run**: `npm run typecheck && npm run lint`
4. **Continue**: Proceed to PR-1

### If Code Review Raises Concerns (PR-2)

1. **Architecture feedback**: If reviewer questions generic/provider split
   - Justify decision based on design.md and specs
   - Show how this enables future provider adapters
   - Offer to add comments clarifying the split

2. **Test coverage feedback**: If reviewer asks for more tests
   - Add specific test cases reviewer mentions
   - Run coverage report to show coverage increase
   - Document edge cases

3. **Unresolvable disagreement**: Escalate to project lead
   - Schedule sync to discuss architectural direction
   - Document decision in `.wolf/cerebrum.md` for future sessions

### If Merge Fails (PR-3)

1. **Revert immediately**: `git revert <commit-sha>`
2. **Investigate**:
   - Was there a merge conflict incorrectly resolved?
   - Did a concurrent change break our extraction?
   - Did CI reveal a real issue?
3. **Fix** in new PR addressing the root cause
4. **Re-merge**: Try again with fix

### If Post-Merge Issues Arise (Post-1)

1. **Behavior differs from pre-extraction**: 
   - Immediately revert
   - Run property-based test to identify exact case that differs
   - Fix implementation or test
   - Re-merge with fix

2. **No issues**: Celebrate! Continue to Post-2 documentation

---

## Ownership & Approvals

| Role | Task(s) | Approval Required |
|------|---------|------------------|
| Implementer | P-1, P-2, T-1 through T-5, V-1 through V-3, PR-1, PR-2, Post-1, Post-2 | Code review approval before merge |
| Reviewer | PR-2 (feedback) | 1 approval to unblock PR-3 |
| Merge authority | PR-3 | Implementer or reviewer with write access |

---

## Success Criteria

After all tasks complete:

✅ Generic `lib/import/armor-class.ts` exists with comprehensive tests  
✅ Provider adapter `lib/import/dndBeyond-armor-class.ts` exists with comprehensive tests  
✅ Main import file updated with imports, functions removed  
✅ All tests pass (new + existing, ≥ 80% coverage)  
✅ AC calculation identical pre/post extraction (property-based test passes)  
✅ TypeScript & ESLint pass  
✅ PR approved and merged  
✅ Deployment successful  
✅ Documentation updated with new architectural pattern  

**Estimated time**: 2-3 hours implementation + 1 hour review = 3-4 hours total
