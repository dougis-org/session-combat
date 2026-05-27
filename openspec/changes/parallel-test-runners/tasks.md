# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/parallel-test-runners` then immediately `git push -u origin feat/parallel-test-runners`

## Execution

### Task 1 — Update jest.integration.config.js

File: `jest.integration.config.js`

- [x] Replace the `maxWorkers: 1` line with an `INTEGRATION_WORKERS` env-var reader:
  ```js
  maxWorkers: (() => {
    const value = process.env.INTEGRATION_WORKERS;
    if (!value) return undefined; // Jest default: ~50% CPUs
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      console.warn(`Invalid INTEGRATION_WORKERS="${value}"; falling back to default`);
      return undefined;
    }
    return parsed;
  })(),
  ```
- [x] Remove or replace the comment `// Run tests sequentially to avoid port conflicts` with an explanation that port conflicts are resolved by #220 and parallelism is now safe
- [x] Verify: `INTEGRATION_WORKERS=4 npm run test:integration` — confirm multiple workers in output
- [x] Verify: `INTEGRATION_WORKERS=banana npm run test:integration` — confirm warning in stderr, tests still run
- [x] Verify: `npm run test:integration` (no env var) — confirm tests run with default workers

### Task 2 — Update playwright.config.ts

File: `playwright.config.ts`

- [x] In the `workers` IIFE, change `return 1` (the no-env-var fallback) to `return undefined`:
  ```ts
  workers: (() => {
    const value = process.env.REGRESSION_WORKERS;
    if (!value) return undefined; // Playwright default: half CPUs, bounded by spec file count
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      console.warn(`Invalid REGRESSION_WORKERS="${value}"; falling back to default`);
      return undefined;
    }
    return parsed;
  })(),
  ```
- [ ] Verify: `npm run test:regression` (no env var set) — Playwright logs should show >1 worker on a multi-core machine

### Task 3 — Update CI workflow

File: `.github/workflows/build-test.yml`

- [x] In the `integration-tests` job, add to its `env:` block:
  ```yaml
  INTEGRATION_WORKERS: '4'
  ```
- [x] In the `regression-tests` job, change `REGRESSION_WORKERS: '2'` → `REGRESSION_WORKERS: '4'`
- [x] Verify: both values appear correctly in the updated YAML

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npm run test:unit` — all pass
- [x] `INTEGRATION_WORKERS=4 npm run test:integration` — all pass with multiple workers
- [ ] `npm run test:regression` — all pass (Playwright uses smart default locally)
- [x] `npm run build` — succeeds
- [x] `npm run typecheck` — no errors
- [x] `npm run lint` — no errors
- [ ] All completed tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:ci`; all tests must pass
- **Regression / E2E tests** — `npm run test:regression`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [ ] Commit all changes to `feat/parallel-test-runners` and push to remote
- [ ] Open PR from `feat/parallel-test-runners` to `main`. PR body must include:
  - `Closes #233`
  - Summary of what changed and why (reference to issue #220 resolving the original blocker)
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address, commit, validate locally, push; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll with `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, validate, push; wait 180 seconds; repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: assigned agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main` (`git log --oneline -5`)
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] No documentation updates required (config-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` if applicable
- [ ] Archive the change: move `openspec/changes/parallel-test-runners/` to `openspec/changes/archive/YYYY-MM-DD-parallel-test-runners/` — stage both the new location and deletion of the old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-parallel-test-runners/` exists and `openspec/changes/parallel-test-runners/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-parallel-test-runners` then `git push -u origin doc/archive-YYYY-MM-DD-parallel-test-runners`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive parallel-test-runners (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/parallel-test-runners doc/archive-YYYY-MM-DD-parallel-test-runners`
