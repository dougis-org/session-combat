---
name: tests
description: Tests and validation for the extract-dnd-skills-senses refactoring
---

# Tests: Extract D&D Beyond Skills, Senses, Saving Throws

## Overview

This is a structural refactoring task that extracts existing functions to new modules. **No new test code is required** — all behavior is identical to the original implementation. Validation focuses on:

1. Existing test suite passes (zero behavior changes)
2. Type correctness (TypeScript compilation)
3. No circular dependencies
4. Build and lint success

## Validation Checklist

### Build and Type Validation

- [ ] **TypeScript compilation** — `npx tsc --noEmit`
  - Must pass with zero errors
  - Verifies all imports resolve correctly
  - Catches circular dependency issues

- [ ] **Lint checks** — `npm run lint`
  - All files pass linting rules
  - No import order violations
  - No unused imports

- [ ] **Production build** — `npm run build`
  - Succeeds without warnings or errors
  - Generated output is valid

### Functional Validation

- [ ] **Unit test suite** — `npm test`
  - All existing tests pass
  - Zero failures
  - Zero skipped tests
  - Character import behavior is identical to pre-refactor

- [ ] **No behavior changes**
  - Spot-check: Run existing character import tests
  - Verify: `savingThrows`, `skills`, `senses` outputs match expected values
  - Validate: All 18 canonical D&D 5e skills are returned

### Code Structure Validation

- [ ] **No circular imports**
  - `lib/import/dndBeyond-skills-senses.ts` imports only from:
    - `lib/import/utils.ts`
    - `lib/import/dndBeyond-utils.ts`
    - `lib/characterReference.ts`
  - No imports from `lib/dndBeyondCharacterImport.ts`

- [ ] **Local interface usage**
  - `lib/import/dndBeyond-skills-senses.ts` defines its own `DndBeyondModifier` interface
  - Interface is not exported (kept private to module)

- [ ] **Export cleanliness**
  - `lib/dndBeyondCharacterImport.ts` still exports the same public API
  - No breaking changes to module contracts

- [ ] **Function signature consistency**
  - `collectModifierSubtypeSet` in `dndBeyond-utils.ts` matches original signature
  - All extracted functions have identical signatures

## Test Execution

Run all validation steps in order:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Tests
npm test

# 4. Build
npm run build
```

If any step fails, the refactoring is incomplete.

## Success Criteria

✓ All validation steps pass
✓ Zero test failures
✓ Zero type errors
✓ Character import pipeline produces identical output
✓ No circular dependencies detected

## Non-Testing Notes

This refactoring does not add new test cases because:
- Function logic is unchanged (moved, not modified)
- Existing tests fully exercise the extracted code
- The spec defines behavior via scenarios, not new test code
- The validation checklist ensures correctness via build/lint/test passes
