# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b chore/jest-env-boilerplate-cleanup` then immediately `git push -u origin chore/jest-env-boilerplate-cleanup`

## Execution

- [x] **Enumerate docblock files:** Run `grep -rl "@jest-environment jsdom" tests/unit/ jest.setup.ts` to get the current definitive list of files (includes `tests/unit/helpers/reactRoot.ts`); integration test files under `tests/integration/` that carry jsdom overrides are NOT in scope
- [x] **Remove `@jest-environment jsdom` docblocks:** For each file in the list, remove the full `/** @jest-environment jsdom */` block (including `/**` and `*/` delimiters and any surrounding blank lines introduced by the block)
- [x] **Enumerate IS_REACT_ACT_ENVIRONMENT files:** Run `grep -rl "IS_REACT_ACT_ENVIRONMENT" tests/` to get the current list (excludes `jest.setup.ts` which must keep its line)
- [x] **Remove per-file IS_REACT_ACT_ENVIRONMENT assignments:** For each file in the list, remove the `(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;` line
- [x] **Verify jest.setup.ts unchanged:** Confirm `jest.setup.ts` still contains `IS_REACT_ACT_ENVIRONMENT = true` on line 7
- [x] **Verify jest.config.js unchanged:** Confirm `jest.config.js` still contains `testEnvironment: "jsdom"`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run `grep -r "@jest-environment jsdom" tests/unit/` — must return no matches (integration test overrides are intentionally kept)
- [x] Run `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/` — must return no matches
- [x] Run `npm run test:unit && npm run test:integration` — all tests must pass with zero regressions
- [x] Run type checks: `npx tsc --noEmit`
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration` (if exists); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `chore/jest-env-boilerplate-cleanup` and push to remote
- [x] Open PR from `chore/jest-env-boilerplate-cleanup` to `main`. PR body must include `Closes #264`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; address, commit fixes, follow remote push validation, push; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, follow remote push validation, push; wait 180 seconds then repeat until all required checks pass
- [x] **Poll for merge** — run `gh pr view <PR-URL> --json state` after each iteration; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: doug
- Reviewer(s): agentic reviewer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Documentation updates completed (syncing spec deltas into `openspec/specs/test-environment-setup/spec.md`)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/jest-env-boilerplate-cleanup/` to `openspec/changes/archive/2026-06-05-jest-env-boilerplate-cleanup/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/2026-06-05-jest-env-boilerplate-cleanup/` exists and `openspec/changes/jest-env-boilerplate-cleanup/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-05-jest-env-boilerplate-cleanup` then `git push -u origin doc/archive-2026-06-05-jest-env-boilerplate-cleanup`
- [x] Open a PR from `doc/archive-2026-06-05-jest-env-boilerplate-cleanup` to `main` with title `docs: archive jest-env-boilerplate-cleanup (2026-06-05)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until it merges
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d chore/jest-env-boilerplate-cleanup doc/archive-2026-06-05-jest-env-boilerplate-cleanup`
