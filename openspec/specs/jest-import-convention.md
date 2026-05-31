## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED — jest-dom type augmentation covers all test files

The system SHALL provide complete `@testing-library/jest-dom` matcher types regardless of whether a test file uses globally-injected `expect` or an explicitly imported one.

#### Scenario: Typecheck passes with no jest-dom matcher errors

- **Given** `jest.setup.ts` imports both `@testing-library/jest-dom` and `@testing-library/jest-dom/jest-globals`
- **When** `npm run typecheck` is executed
- **Then** it exits 0 with zero TS2339 errors related to `toBeInTheDocument`, `toBeDisabled`, or `toHaveAttribute`

#### Scenario: Previously failing file now typechecks cleanly

- **Given** `tests/unit/components/NavBar.test.tsx` has had its `@jest/globals` import removed
- **When** `npm run typecheck` is executed
- **Then** no errors are emitted for that file

---

### Requirement: ADDED — ESLint gate blocks @jest/globals imports in test files

The system SHALL prevent `import ... from '@jest/globals'` in any file under `tests/`.

#### Scenario: ESLint flags a @jest/globals import in a test file

- **Given** a test file under `tests/` contains `import { expect } from '@jest/globals'`
- **When** `npm run lint` is executed
- **Then** ESLint exits non-zero and reports a `no-restricted-imports` violation for that file

#### Scenario: ESLint allows @jest/globals imports outside tests/

- **Given** a non-test file (e.g., a helper in `lib/`) contains `import { expect } from '@jest/globals'`
- **When** `npm run lint` is executed
- **Then** no `no-restricted-imports` violation is reported for that file

#### Scenario: ESLint passes when no @jest/globals imports exist

- **Given** no file under `tests/` imports from `@jest/globals`
- **When** `npm run lint` is executed
- **Then** ESLint exits 0 (no lint errors from this rule)

---

### Requirement: ADDED — docs/TESTING.md documents the jest import convention

The system SHALL maintain a `docs/TESTING.md` file that fully documents the jest setup pattern so contributors can understand and follow the convention without reading source code.

#### Scenario: New contributor reads TESTING.md and understands the pattern

- **Given** `docs/TESTING.md` exists and covers: jest.setup.ts purpose, the two-augmentation imports, the no-@jest/globals-imports rule, and the ESLint escape hatch
- **When** a developer reads the file
- **Then** they have sufficient information to write a new test file without introducing a lint or typecheck regression

#### Scenario: CONTRIBUTING.md links to TESTING.md

- **Given** `CONTRIBUTING.md` exists
- **When** a contributor reads the Testing section
- **Then** they find a reference (link or mention) to `docs/TESTING.md`

## MODIFIED Requirements

### Requirement: MODIFIED — jest.setup.ts is the sole source of testing-library type augmentation

The system SHALL augment both the global jest namespace and the `@jest/globals` module from `jest.setup.ts`, making it the single, authoritative bootstrap for all jest-dom types.

#### Scenario: jest.setup.ts contains both augmentation imports

- **Given** the file `jest.setup.ts`
- **When** it is read
- **Then** it contains both `import '@testing-library/jest-dom'` and `import '@testing-library/jest-dom/jest-globals'`, and a comment explaining why both are present

## REMOVED Requirements

### Requirement: REMOVED — per-file @jest/globals imports in test files

Per-file `import { jest, describe, it, test, expect } from '@jest/globals'` imports are removed from all test files.

Reason for removal: Jest injects these as globals at runtime; explicit imports bypass the type augmentation applied by `jest.setup.ts`, causing typecheck failures. The ESLint gate makes this a permanent constraint.

## Traceability

- Proposal: "Add `@testing-library/jest-dom/jest-globals` to `jest.setup.ts`" → Requirement: MODIFIED jest.setup.ts
- Proposal: "Remove `@jest/globals` imports from test files" → Requirement: REMOVED per-file imports
- Proposal: "Add ESLint gate" → Requirement: ADDED ESLint gate
- Proposal: "Create `docs/TESTING.md`" → Requirement: ADDED docs/TESTING.md
- Design Decision 1 → Requirement: MODIFIED jest.setup.ts
- Design Decision 2 → Requirement: REMOVED per-file imports
- Design Decision 3 → Requirement: ADDED ESLint gate
- Design Decision 4 → Requirement: ADDED docs/TESTING.md
- All requirements → Task: ../changes/archive/2026-05-30-fix-jest-globals-type-augmentation/tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Operability — no new runtime dependencies

#### Scenario: package.json unchanged

- **Given** the implementation is complete
- **When** `git diff package.json` is examined
- **Then** no new entries appear in `dependencies` or `devDependencies`

### Requirement: Reliability — unit test suite continues to pass

#### Scenario: All unit tests pass after import stripping

- **Given** all `@jest/globals` imports have been removed from the 5 affected test files
- **When** `npm run test:unit` is executed
- **Then** it exits 0 with all previously-passing tests still passing (≥ 1776 tests)
