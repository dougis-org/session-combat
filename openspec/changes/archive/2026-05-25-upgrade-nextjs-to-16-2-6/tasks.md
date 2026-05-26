# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b chore/upgrade-nextjs-16.2.6` then immediately `git push -u origin chore/upgrade-nextjs-16.2.6`

## Execution

### T1 — Bump Next.js Version in package.json

- [x] Open `package.json` and locate the `"next"` dependency in the `"dependencies"` object
- [x] Change `"next": "^16.2.2"` to `"next": "^16.2.6"`
- [x] Verify the change was made correctly

### T2 — Bump ESLint Config Version in package.json

- [x] In `package.json`, locate the `"eslint-config-next"` dependency in the `"devDependencies"` object
- [x] Change `"eslint-config-next": "^16.2.2"` to `"eslint-config-next": "^16.2.6"`
- [x] Verify the change was made correctly

### T3 — Update package-lock.json

- [x] Run `npm install` to resolve and update `package-lock.json`
- [x] Verify no errors appear in the output
- [x] Confirm `package-lock.json` was modified (check file timestamp and diff)

### T4 — Validate npm audit

- [x] Run `npm audit --omit=dev` to check for remaining vulnerabilities
- [x] Verify the output shows zero high/moderate severity Next.js vulnerabilities
- [x] Note: PostCSS 8.4.31 XSS vulnerability may persist (known limitation, out of scope)

### T5 — Run Type Checking

- [x] Run `npx tsc --noEmit` to verify TypeScript compilation
- [x] Confirm no type errors appear

### T6 — Run Linting

- [x] Run `npm run lint` to check code style and quality
- [x] Verify no new errors are introduced

### T7 — Run Unit Tests

- [x] Run `npm run test:unit` to execute all 116 unit tests
- [x] Confirm output shows "116 passed" or "PASS" with no failures
- [x] Verify coverage reports are generated

### T8 — Run Integration Tests

- [x] Run `npm run test:integration` to execute all 23 integration tests with MongoDB/PostgreSQL containers
- [x] Confirm all tests pass (exit code 0)
- [x] Verify no container startup or connectivity errors

### T9 — Run E2E Tests

- [x] Run `npx playwright test tests/e2e/` to execute all 11 E2E tests
- [x] Confirm output shows "11 passed" or similar (exit code 0)
- [x] Verify no timeout or connection errors

### T10 — Run Build

- [x] Run `npm run build` to build the Next.js application
- [x] Confirm build completes without errors (exit code 0)
- [x] Verify `.next/` directory is created with expected structure

## Pre-Commit Code Review

- [x] **Before committing**, run the `openspec-review-code` skill to review the package.json and package-lock.json changes
- [x] Address any findings (unlikely for dependency updates, but verify)
- [x] Document any issues found and fixed

## Validation

- [x] **Type checks:** `npx tsc --noEmit` passes ✓
- [x] **Linting:** `npm run lint` shows no new errors ✓
- [x] **Unit tests:** `npm run test:unit` passes (116 tests) ✓
- [x] **Integration tests:** `npm run test:integration` passes (23 tests) ✓
- [x] **E2E tests:** `npx playwright test tests/e2e/` passes (11 tests) ✓
- [x] **Build:** `npm run build` succeeds ✓
- [x] **Security audit:** `npm audit --omit=dev` shows zero Next.js CVEs ✓
- [x] All execution tasks T1–T10 marked complete ✓
- [x] All remote push validation steps pass ✓

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **E2E tests** — `npx playwright test tests/e2e/`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [x] Commit all changes: `git add package.json package-lock.json && git commit -m "chore: upgrade next and eslint-config-next from 16.2.2 to 16.2.6 (issue #213)"`
- [x] Push to remote: `git push origin chore/upgrade-nextjs-16.2.6`
- [x] Open PR from `chore/upgrade-nextjs-16.2.6` to `main`. **PR body MUST include `Closes #213`**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Wait 180 seconds for CI to start
- [x] **Monitor PR comments** — poll autonomously; address each comment, commit fixes, validate locally, push; wait 180 seconds; repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll `gh pr checks <PR-URL> --json isRequired,state`; if required check fails, fix and rerun; wait 180 seconds; repeat until all required checks pass
- [x] **Poll for merge** — run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

**Ownership metadata:**

- Implementer: assigned developer
- Reviewer(s): repo owner (@dougis)
- Required approvals: 1

**Blocking resolution flow:**

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main` (check `git log --oneline -1` shows the upgrade commit)
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (dependency bump, pure technical change)
- [ ] No spec deltas to sync (no capability changes)
- [ ] Archive the change: `git checkout -b doc/archive-$(date +%Y-%m-%d)-upgrade-nextjs && mkdir -p openspec/changes/archive/$(date +%Y-%m-%d)-upgrade-nextjs-to-16-2-6 && cp -r openspec/changes/upgrade-nextjs-to-16-2-6/* openspec/changes/archive/$(date +%Y-%m-%d)-upgrade-nextjs-to-16-2-6/ && rm -rf openspec/changes/upgrade-nextjs-to-16-2-6 && git add openspec/changes/archive/ openspec/changes/ && git commit -m "docs: archive upgrade-nextjs-to-16.2.6 ($(date +%Y-%m-%d))"`
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-upgrade-nextjs-to-16-2-6/` exists and `openspec/changes/upgrade-nextjs-to-16-2-6/` is gone
- [ ] Push the archive commit: `git push origin doc/archive-$(date +%Y-%m-%d)-upgrade-nextjs`
- [ ] Open PR from `doc/archive-*` to `main` with title `docs: archive upgrade-nextjs-to-16.2.6 (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop as implementation PR)
- [ ] Prune merged branches: `git fetch --prune && git branch -d chore/upgrade-nextjs-16.2.6 doc/archive-$(date +%Y-%m-%d)-upgrade-nextjs`
