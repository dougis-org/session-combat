## GitHub Issues

- (no issue — discovered during #208 verification)

## Why

- **Problem statement:** Five component test files produce TypeScript errors (`Property 'toBeInTheDocument' does not exist`) because they import `expect` from `@jest/globals` while `@testing-library/jest-dom` only augments the global `jest` namespace. The two augmentation targets are distinct; mixing them causes type-check failures even though tests pass at runtime.
- **Why now:** The errors were introduced by the RTL migration (commit `10a30f6`) and block a clean `npm run typecheck`. They will compound if left unaddressed — any new test file written in the same style will silently inherit broken types.
- **Business/user impact:** `typecheck` is a required CI gate. Persistent errors erode confidence in the gate and risk developers ignoring or bypassing it.

## Problem Space

- **Current behavior:** `npm run typecheck` emits 29 TS2339 errors across 5 test files. All errors are matcher properties (`toBeInTheDocument`, `toBeDisabled`, `toHaveAttribute`) that `@testing-library/jest-dom` adds to `jest.Matchers` (global namespace) but not to `@jest/globals`'s `Matchers`.
- **Desired behavior:** Zero typecheck errors. A single, documented import pattern for jest globals in test files. An ESLint gate preventing regression.
- **Constraints:** Cannot change `jest.config.js` test runner behavior — tests must keep passing. No new runtime dependencies.
- **Assumptions:** All test files in `tests/` should use Jest globals injected by the runner, not explicit `@jest/globals` imports.
- **Edge cases considered:** Some files also import `jest` (for `jest.mock`, `jest.fn`) — stripping `@jest/globals` must preserve the `jest` global, which Jest injects automatically.

## Scope

### In Scope

- Fix `jest.setup.ts` to import both jest-dom augmentations
- Remove all `import { ... } from '@jest/globals'` from test files
- Add ESLint `no-restricted-imports` rule for `@jest/globals` in test file globs
- Create `docs/TESTING.md` documenting the jest setup pattern
- Add reference to `docs/TESTING.md` from `CONTRIBUTING.md`
- Add explanatory comment to `jest.setup.ts`

### Out of Scope

- Changing any test assertions or test logic
- Migrating to Vitest or any other test runner
- Fixing the pre-existing integration test teardown leak (`--forceExit` warning)
- Adding new tests

## What Changes

- `jest.setup.ts` — add `import '@testing-library/jest-dom/jest-globals'` and a comment explaining both augmentations
- `tests/unit/components/AlignmentSelect.test.tsx` — remove `@jest/globals` import
- `tests/unit/components/CreatureStatBlock.test.tsx` — remove `@jest/globals` import
- `tests/unit/components/NavBar.test.tsx` — remove `@jest/globals` import
- `tests/unit/components/TargetActionModal.test.tsx` — remove `@jest/globals` import
- `tests/unit/components/ui.test.tsx` — remove `@jest/globals` import
- `.eslintrc.json` (or equivalent) — add `no-restricted-imports` rule targeting `@jest/globals` in test files
- `docs/TESTING.md` — new file documenting the jest import convention
- `CONTRIBUTING.md` — add reference to `docs/TESTING.md`

## Risks

- Risk: Removing `@jest/globals` imports breaks a file that relied on the explicit import for type narrowing beyond just `expect`.
  - Impact: Compile error or runtime test failure in that file.
  - Mitigation: Run `npm run test:unit` and `npm run typecheck` after each file change; verify green before moving to next.

- Risk: ESLint rule pattern doesn't match all test file paths (e.g., integration tests).
  - Impact: Regression goes undetected in integration test files.
  - Mitigation: Use glob patterns covering both `tests/unit/**` and `tests/integration/**`.

- Risk: Future `@jest/globals` import needed legitimately (e.g., type-only import for a custom helper).
  - Impact: ESLint blocks valid code.
  - Mitigation: Document the `// eslint-disable-next-line` escape hatch in `docs/TESTING.md`; rule targets runtime imports, not type-only if needed.

## Open Questions

No unresolved ambiguity. Scope, fix, and documentation targets are fully defined by prior exploration.

## Non-Goals

- Enforcing any specific `describe`/`it`/`test` naming convention
- Migrating away from `ts-jest` to `babel-jest` or `@swc/jest` for unit tests
- Addressing the `@types/jest` vs `jest` types divergence at a framework level

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
