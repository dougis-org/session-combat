# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/jest-globals-type-augmentation` then immediately `git push -u origin fix/jest-globals-type-augmentation`

## Execution

### Task 1 — Patch jest.setup.ts

- [x] Open `jest.setup.ts`
- [x] Add `import '@testing-library/jest-dom/jest-globals'` directly after the existing `import '@testing-library/jest-dom'` line
- [x] Add a comment above both imports explaining why both augmentations are needed:
  ```
  // Augment global jest namespace (used by tests that rely on Jest's auto-injected globals)
  // Augment @jest/globals module (safety net; ESLint gate prevents its use, but types must resolve if present)
  ```
- [x] Verify: `npm run typecheck` exits 0 with zero TS2339 errors

### Task 2 — Remove @jest/globals imports from all test files

- [x] Find every test file importing from `@jest/globals`:
  ```
  grep -rl "from '@jest/globals'" tests/
  ```
  Expected: `AlignmentSelect.test.tsx`, `CreatureStatBlock.test.tsx`, `NavBar.test.tsx`, `TargetActionModal.test.tsx`, `ui.test.tsx` (and any others found)
- [x] For each file, remove the `import { ... } from '@jest/globals'` line. The globals (`jest`, `describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`) are injected by Jest at runtime.
- [x] Verify no file under `tests/` still imports from `@jest/globals`:
  ```
  grep -r "from '@jest/globals'" tests/
  ```
  Expected: no output
- [x] Verify: `npm run test:unit` exits 0 with ≥ 1776 tests passing

### Task 3 — Add ESLint no-restricted-imports rule

- [x] Open `eslint.config.mjs`
- [x] Add a new config object after the existing `ignores` block targeting `tests/**`:
  ```js
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@jest/globals",
          message: "Do not import from @jest/globals. Jest injects globals at runtime. See docs/TESTING.md."
        }]
      }]
    }
  }
  ```
- [x] Verify the gate works: temporarily add `import { expect } from '@jest/globals'` to any file in `tests/`; run `npm run lint`; confirm error; revert the temporary change
- [x] Verify: `npm run lint` exits 0 on the clean codebase

### Task 4 — Create docs/TESTING.md

- [x] Create `docs/TESTING.md` with the following sections:
  - **Overview** — purpose of the file
  - **Jest Setup Architecture** — explains `jest.setup.ts` role, `setupFilesAfterEnv`, and how the two augmentation imports work and why both are present
  - **Import Convention** — rule: never import from `@jest/globals` in test files; use Jest-injected globals only
  - **ESLint Gate** — explains the `no-restricted-imports` rule, where it lives (`eslint.config.mjs`), and how it enforces the convention in CI
  - **Escape Hatch** — documents `// eslint-disable-next-line no-restricted-imports` for the rare case of a type-only import, with guidance on when this is appropriate
  - **Running Tests** — quick reference for `npm run test:unit`, `npm run test:integration`, `npm run typecheck`, `npm run lint`
- [x] Verify the file covers all items from `specs/jest-import-convention.md` acceptance criteria

### Task 5 — Reference docs/TESTING.md from CONTRIBUTING.md

- [x] Open `CONTRIBUTING.md`
- [x] Find the testing section (or add one if absent)
- [x] Add a line referencing `docs/TESTING.md`:
  > For jest setup conventions and the import pattern all test files must follow, see [docs/TESTING.md](docs/TESTING.md).
- [x] Verify the link renders correctly in a markdown preview

### Task 6 — Final full validation pass

- [x] `npm run typecheck` — exits 0, zero TS2339 errors
- [x] `npm run test:unit` — exits 0, ≥ 1776 tests pass
- [x] `npm run lint` — exits 0
- [x] `npm run build` — exits 0

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report before committing.

## Validation

- [x] `npm run typecheck` exits 0 — zero TS2339 errors
- [x] `npm run test:unit` exits 0 — all tests pass
- [x] `npm run lint` exits 0 — no lint errors including the new rule
- [x] `npm run build` exits 0
- [x] Canary test: inject `import { expect } from '@jest/globals'` into a test file → `npm run lint` must error → revert

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:ci` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `fix/jest-globals-type-augmentation` and push to remote
- [x] Open PR from `fix/jest-globals-type-augmentation` to `main`. PR body must state: "Closes #(none — internal quality fix)"
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in Remote push validation then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any required CI check fails, diagnose and fix, commit, follow Remote push validation, push, wait 180 seconds, repeat
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: claude-code
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update `docs/TESTING.md` if any further doc corrections were made during review
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/fix-jest-globals-type-augmentation/` to `openspec/changes/archive/2026-05-30-fix-jest-globals-type-augmentation/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/2026-05-30-fix-jest-globals-type-augmentation/` exists and `openspec/changes/fix-jest-globals-type-augmentation/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-05-30-fix-jest-globals-type-augmentation` then push
- [x] Open a PR from the doc branch to `main` with title `docs: archive fix-jest-globals-type-augmentation (2026-05-30)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR
- [ ] Monitor the doc PR until it merges
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d fix/jest-globals-type-augmentation doc/archive-2026-05-30-fix-jest-globals-type-augmentation`
