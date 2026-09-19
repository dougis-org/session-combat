# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** performed via `git fetch origin main` from the primary checkout before creating the worktree.
- [x] **Step 2 — Create and publish working branch:** dedicated worktree created at `.worktrees/jest-30-upgrade` off `origin/main`, branch `jest-30-upgrade` pushed to remote (`git push -u origin jest-30-upgrade`).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — not present in this session's skill list; user confirmed substituting the available `pr-reviewer` skill for tasks 3/31 instead of halting.

## Execution

- [x] **Issue lifecycle: mark in-progress** — ran `gh issue edit 639 --add-label "in-progress"` (repo: `dougis-org/session-combat`). Project #7 "Session Combat" item found and Status moved to "In progress" via `gh project item-edit`.
- [x] Confirm working directory is `.worktrees/jest-30-upgrade` (never the primary checkout) before making any edits.
- [x] Bump `jest` 29.7.0 → 30.x, `jest-environment-jsdom` 29 → 30, `@types/jest` 29 → 30, `@testing-library/jest-dom` 6.9.1 → 7.x in `package.json`.
- [x] Remove `@swc/jest` from `package.json` devDependencies.
- [x] Rename `--testPathPattern` to `--testPathPatterns` in the `test:unit` script in `package.json`.
- [x] Run `npm install` and inspect for peer-dependency warnings/errors involving `ts-jest` and `jest@30`. — clean install, no peer conflicts.
- [x] **If** `ts-jest@^29.4.12` conflicts with `jest@30`'s peer range (per Design Decision 2), bump `ts-jest` to the minimum version that resolves the conflict; otherwise leave it unchanged. — `ts-jest@^29.4.12` already declares `jest: ^29.0.0 || ^30.0.0`; left unchanged.
- [x] Run `npm run test:unit`; if failures trace to the `jest-environment-jsdom` version bump, fix them at the test-file level only (never in `app/` or `lib/`). If a fix would require application code changes, stop and flag for scope re-approval per Change Control rather than expanding scope. — 314/314 suites, 3995/3995 tests passed, no fixes needed.
- [x] Run `npm run test:integration`; apply the same test-file-only fix policy as above. — 39/40 suites passed (1 pre-existing skip), 359/363 tests passed (4 pre-existing skips), no fixes needed. Required a prior `npm run build` (missing `.next` dir), unrelated to the Jest bump.
- [x] **If** either test run surfaces a Jest 30 config-key rename/removal (per Design Decision 3), update only the specific key in `jest.config.js` and/or `jest.integration.config.js` needed to restore compatibility — do not proactively rewrite either config beyond what's required. — no config-key issues surfaced; configs untouched.
- [x] Confirm `git diff --stat` against `origin/main` shows changes limited to `package.json`, `package-lock.json`, and (only if required) `jest.config.js` / `jest.integration.config.js` — no files under `app/` or `lib/`. — confirmed (plus openspec change docs).
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — n/a for this change (dependency/config bump only, no new logic).
- [x] Confirm acceptance criteria in `specs/test-infrastructure/spec.md` are covered: dependency baseline installs cleanly, `@swc/jest` removed, unit/integration suites pass, `test:unit` uses `--testPathPatterns`, coverage output unchanged, no application code touched. — all confirmed via `npm ls`, test runs, and diff scope.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit && npm run test:integration`
- [x] Run E2E tests — not applicable; this change does not touch application code or behavior that E2E suites exercise differently, but run `npm run test:ci` if available/relevant per CI parity.
- [x] Run type checks: `npm run typecheck` — clean.
- [x] Run build: `npm run build` (confirm the Next.js build is unaffected by devDependency-only changes) — succeeded.
- [x] Run lint: `npm run lint` — 0 errors, 3 pre-existing warnings unrelated to this change.
- [x] Confirm `coverage/lcov.info` is produced by both `npm run test:unit` and `npm run test:integration -- --coverage` (per NFAC: Reliability) — confirmed, 359.2K.
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Determine whether the current change is docs-only via `git diff --name-only origin/main`. This change modifies `package.json`/`package-lock.json` (and possibly Jest config files), so it is **not** docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — run the project's E2E/regression suite; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `jest-30-upgrade` to `main`. PR body **must** include `Closes #639`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 639 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column matching "In Review" via `gh project item-edit` (same discovery pattern as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`). Per project ruleset, `main` is squash-only — use `--squash` on the auto-merge command: `gh pr merge <PR-URL> --auto --squash`.
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (or `CLOSED`, in which case exit and notify the user):
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, validate, push, wait 180s
  3. **CI check failures** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks (unit, integration, lint, build, ci-gate, Codacy), commit, validate, push, wait 180s; restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing this change (assigned to doug@dougis.com per issue authorship)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated); human reviewer per repo branch-protection requirement
- Required approvals: per `main`'s squash-only ruleset — `ci-gate` and Codacy required checks must pass; 0 human approvals required (per repo ruleset), but any human review comment must still be addressed before merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved
- Test failure traceable only to an application-code fix (out of scope per proposal) → stop, do not implement in `app/`/`lib/`, report to user for scope re-approval

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — none expected (test-tooling only; no README/CLAUDE.md references to specific Jest versions found)
- [ ] Sync approved spec delta into `openspec/specs/test-infrastructure/spec.md`. Update relative links (`../../design.md` → `../../changes/archive/YYYY-MM-DD-jest-30-upgrade/design.md`, same for `tasks.md`).
- [ ] Archive the change: move `openspec/changes/jest-30-upgrade/` to `openspec/changes/archive/YYYY-MM-DD-jest-30-upgrade/`, staging both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-jest-30-upgrade/` exists and `openspec/changes/jest-30-upgrade/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-jest-30-upgrade` then `git push -u origin doc/archive-YYYY-MM-DD-jest-30-upgrade`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-jest-30-upgrade` to `main` titled `docs: archive jest-30-upgrade (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **Immediately** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (per `main`'s squash-only ruleset; NEVER `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D jest-30-upgrade doc/archive-YYYY-MM-DD-jest-30-upgrade`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/jest-30-upgrade` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D jest-30-upgrade doc/archive-YYYY-MM-DD-jest-30-upgrade`
