## Context

- **Relevant architecture:** Jest unit test suite uses `ts-jest` with `jsdom` environment. `jest.setup.ts` is loaded via `setupFilesAfterEnv` and is the single bootstrap point for all test-global side effects. ESLint config is flat-config (`eslint.config.mjs`), extending `eslint-config-next/core-web-vitals`.
- **Dependencies:** `@testing-library/jest-dom ^6.9.1`, `@types/jest ^29.5.14`, `jest ^29.7.0`, `ts-jest ^29.4.6`.
- **Interfaces/contracts touched:** `jest.setup.ts` (runtime setup), `eslint.config.mjs` (lint gate), `docs/TESTING.md` (new), `CONTRIBUTING.md` (reference addition).

## Goals / Non-Goals

### Goals

- Zero `npm run typecheck` errors from test files
- Single, documented jest import convention across the entire test suite
- ESLint gate that blocks regression at PR time
- Clear developer documentation in `docs/TESTING.md`

### Non-Goals

- Changing test logic or assertions
- Switching test runners
- Fixing the integration test teardown `--forceExit` warning

## Decisions

### Decision 1: Add both jest-dom augmentations to jest.setup.ts

- **Chosen:** Add `import '@testing-library/jest-dom/jest-globals'` alongside the existing `import '@testing-library/jest-dom'` in `jest.setup.ts`.
- **Alternatives considered:** (a) Only keep `jest-globals` variant and remove the global one. (b) Add augmentation imports per failing file.
- **Rationale:** Both augmentations coexist cleanly. Keeping the global augmentation preserves backwards compatibility with any test that relies on global `jest.Matchers`. The `/jest-globals` addition is a safety net even after removing `@jest/globals` imports from test files — it future-proofs the setup against any future accidental `@jest/globals` usage.
- **Trade-offs:** Two imports instead of one, but the comment explains why, eliminating confusion.

### Decision 2: Remove all @jest/globals imports from test files (not just the 5 failing ones)

- **Chosen:** Grep the entire `tests/` tree for `from '@jest/globals'` and strip those import lines from every file found.
- **Alternatives considered:** Only fix the 5 files with type errors.
- **Rationale:** Standardizing the full codebase prevents a two-pattern codebase where some files use globals and others don't. Consistency is enforced by the ESLint gate going forward.
- **Trade-offs:** Slightly wider diff, but all affected files are test files with no behavior change.

### Decision 3: ESLint no-restricted-imports rule in flat config

- **Chosen:** Add a new config object in `eslint.config.mjs` targeting `tests/**` glob with `no-restricted-imports` banning `@jest/globals`.
- **Alternatives considered:** (a) Custom ESLint plugin. (b) TypeScript path alias that shadows `@jest/globals`. (c) Pre-commit hook only.
- **Rationale:** `no-restricted-imports` is a built-in ESLint rule — zero new dependencies. Flat config supports per-glob overrides natively. This runs in CI via `npm run lint`.
- **Trade-offs:** A legitimate type-only import from `@jest/globals` (e.g., for a type helper) would need an inline disable comment. Documented in `docs/TESTING.md`.

### Decision 4: docs/TESTING.md as the canonical reference

- **Chosen:** New file at `docs/TESTING.md` covering: jest setup architecture, the two-augmentation pattern, the "no @jest/globals imports" rule, the ESLint gate, and the escape hatch.
- **Alternatives considered:** Inline comment in `jest.setup.ts` only. Entry in `CLAUDE.md` only.
- **Rationale:** `docs/TESTING.md` is discoverable by human contributors via `CONTRIBUTING.md`. The `jest.setup.ts` comment is for developers reading the setup file directly. Both are needed; they serve different discovery paths.
- **Trade-offs:** One more doc to keep current. Mitigated by the ESLint gate making the rule self-enforcing.

## Proposal to Design Mapping

- Proposal element: Fix `jest.setup.ts`
  - Design decision: Decision 1
  - Validation approach: `npm run typecheck` emits zero errors after the change

- Proposal element: Remove `@jest/globals` imports from test files
  - Design decision: Decision 2
  - Validation approach: `npm run test:unit` passes; `npm run typecheck` clean; lint clean

- Proposal element: ESLint gate
  - Design decision: Decision 3
  - Validation approach: Add a canary `import { expect } from '@jest/globals'` to a test file; `npm run lint` must flag it

- Proposal element: `docs/TESTING.md`
  - Design decision: Decision 4
  - Validation approach: File exists; `CONTRIBUTING.md` links to it; content covers all documented items

## Functional Requirements Mapping

- Requirement: `npm run typecheck` exits 0
  - Design element: Decision 1 + Decision 2
  - Acceptance criteria reference: specs/typecheck-clean.md
  - Testability notes: Run `npm run typecheck`; count TS2339 errors — must be 0

- Requirement: `npm run test:unit` continues to pass
  - Design element: Decision 2 (behavior-neutral strip of import lines)
  - Acceptance criteria reference: specs/tests-pass.md
  - Testability notes: Run `npm run test:unit`; all 1776 tests must pass

- Requirement: ESLint blocks `@jest/globals` imports in test files
  - Design element: Decision 3
  - Acceptance criteria reference: specs/eslint-gate.md
  - Testability notes: Inject a `@jest/globals` import into a test file; `npm run lint` must error

- Requirement: `docs/TESTING.md` documents the pattern
  - Design element: Decision 4
  - Acceptance criteria reference: specs/documentation.md
  - Testability notes: Manual review; `CONTRIBUTING.md` must contain a link to `docs/TESTING.md`

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: No new runtime dependencies introduced
  - Design element: `no-restricted-imports` is built-in; `@testing-library/jest-dom/jest-globals` is already in the installed package
  - Testability notes: `package.json` must not change (no new entries)

- Requirement category: operability
  - Requirement: ESLint gate runs in CI without additional setup
  - Design element: Decision 3 — uses existing `npm run lint` script
  - Testability notes: `npm run lint` exits non-zero when the rule is triggered

## Risks / Trade-offs

- Risk/trade-off: A test file imports a type from `@jest/globals` (e.g., `Mock`, `SpyInstance`) that isn't a global.
  - Impact: Removing the import breaks the type reference.
  - Mitigation: Grep for type-only usage during the audit; convert to `type` import if needed and add a targeted ESLint disable comment.

- Risk/trade-off: `eslint.config.mjs` glob pattern doesn't match all test directories.
  - Impact: New test files in an unmatched path could use `@jest/globals` undetected.
  - Mitigation: Use `"tests/**"` which covers both `tests/unit/**` and `tests/integration/**`.

## Rollback / Mitigation

- Rollback trigger: `npm run test:unit` or `npm run typecheck` fails after changes.
- Rollback steps: `git revert` the offending commit; re-run both checks to confirm clean.
- Data migration considerations: None — test-only changes, no DB or runtime state affected.
- Verification after rollback: `npm run typecheck && npm run test:unit && npm run lint` all exit 0.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the root cause in the branch; do not force-push to bypass.
- If security checks fail: Not applicable to this change (no production code touched).
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (@dougis) is final decision-maker; 48-hour timeout before escalation.

## Open Questions

No open questions. All design decisions are fully specified.
