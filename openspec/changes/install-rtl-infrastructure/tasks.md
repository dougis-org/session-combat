# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/install-rtl-infrastructure` then immediately `git push -u origin feat/install-rtl-infrastructure`

## Execution

### Task 1 — Install RTL packages

- [x] Run: `npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [x] Verify: `npm ls @testing-library/react @testing-library/jest-dom @testing-library/user-event` exits 0 and lists all three packages
- [x] Verify: all three appear in `devDependencies` in `package.json`

### Task 2 — Add jest-dom import to jest.setup.ts

- [x] Add `import '@testing-library/jest-dom';` as the first line of `jest.setup.ts`
- [x] Verify: `npx tsc --noEmit` passes (types resolve correctly)

### Task 3 — Switch global Jest environment to jsdom

- [x] In `jest.config.js`, change `testEnvironment: "node"` to `testEnvironment: "jsdom"`
- [x] Run: `npm test` — all previously-passing tests must still pass
- [x] Confirm: `jest.integration.config.js` still has `testEnvironment: "node"` (no change needed)

### Task 4 — Write RTL smoke test for CombatStatsRow

- [x] Create `tests/unit/CombatStatsRow.rtl.test.tsx` with the following structure:
  - `@jest-environment jsdom` docblock (redundant after #264 but explicit for now)
  - Import `render`, `screen` from `@testing-library/react`
  - Import `CombatStatsRow` from `@/lib/components/CombatStatsRow`
  - Three tests mirroring the existing manual tests:
    1. Renders AC and HP values — assert with `screen.getByText` / `toBeInTheDocument`
    2. Renders `acNote` when provided
    3. Does not render `acNote` when omitted — assert with `screen.queryByText` returning null
- [x] Run: `npm test -- --testPathPattern=CombatStatsRow.rtl` — test must pass

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] Run unit tests: `npm test` — all tests pass, zero new failures
- [x] Run type check: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — succeeds
- [x] Confirm smoke test file exists: `tests/unit/CombatStatsRow.rtl.test.tsx`
- [x] Confirm no integration tests broken: `npm run test:integration` (if available) or verify `jest.integration.config.js` unchanged
- [x] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration` (or equivalent); all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [ ] Commit all changes to `feat/install-rtl-infrastructure` and push to remote
- [ ] Open PR from `feat/install-rtl-infrastructure` to `main`. PR body **MUST** include `Closes #254`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address, commit, validate locally, push, wait 180s, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, validate locally, push, wait 180s, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated CI + agentic reviewer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`: `git log --oneline -5`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required for this infrastructure change
- [ ] Sync approved spec deltas: copy `openspec/changes/install-rtl-infrastructure/specs/rtl-setup.md` to `openspec/specs/rtl-setup.md`
- [ ] Archive the change: move `openspec/changes/install-rtl-infrastructure/` to `openspec/changes/archive/YYYY-MM-DD-install-rtl-infrastructure/` — stage both the new location and deletion of the old location in **a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-install-rtl-infrastructure/` exists and `openspec/changes/install-rtl-infrastructure/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-install-rtl-infrastructure` then `git push -u origin doc/archive-YYYY-MM-DD-install-rtl-infrastructure`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-install-rtl-infrastructure` to `main` with title `docs: archive install-rtl-infrastructure (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/install-rtl-infrastructure doc/archive-YYYY-MM-DD-install-rtl-infrastructure`
