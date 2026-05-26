# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/parallel-test-isolation` then immediately `git push -u origin feat/parallel-test-isolation`

## Execution

### 1. Implement `tests/shared/port.ts`

- [x] Create `tests/shared/port.ts`
- [x] Implement `getDirectoryBasePort()`: djb2 hash of `process.cwd()`, mapped to `20000 + (hash % 30000)`
- [x] Verify: call from two different cwd values (via a quick node one-liner) and confirm ports differ and are in range

### 2. Update `playwright.config.ts`

- [x] Set `process.env.PORT` to `getDirectoryBasePort()` when not already set, so webServer child inherits the correct port
- [x] Import `getDirectoryBasePort` from `tests/shared/port.ts`
- [x] Verify: `npx ts-node -e "import('./playwright.config.ts')"` or just confirm TypeScript compiles

### 3. Implement `tests/integration/helpers/users.ts`

- [x] Create `tests/integration/helpers/users.ts`
- [x] Implement module-level counter and `uniqueEmail(prefix?: string): string` using `JEST_WORKER_ID ?? '0'` + counter
- [x] Implement `createTestUser(baseUrl: string, prefix?: string): Promise<{ email: string; password: string; cookie: string; userId: string }>` — registers via `POST /api/auth/register`, extracts cookie and userId from response
- [x] Verify: TypeScript compiles (`npm run build` or `tsc --noEmit`)

### 4. Implement `tests/integration/global.setup.ts`

- [x] Create `tests/integration/global.setup.ts`
- [x] Start `MongoDBContainer("mongo:8").withExposedPorts(27017)` and store ref in `global.__MONGO_CONTAINER__`
- [x] Connect to MongoDB and drop the test database entirely
- [x] Call `getDirectoryPort()` (async, with port-free probing) for the port; emit `console.log(\`[port-select] cwd=${process.cwd()} port=${port}\`)`
- [x] Spawn Next.js via `spawn("npx", ["next", "start"], { env: { ...process.env, PORT, HOSTNAME: "0.0.0.0", MONGODB_URI, MONGODB_DB: "session-combat-test" } })`; store PID in `global.__NEXT_PROCESS__`
- [x] Wait for server ready on `/api/health`
- [x] Set `process.env.TEST_BASE_URL = \`http://localhost:${port}\`` and `process.env.MONGODB_URI = mongoUri`

### 5. Implement `tests/integration/global.teardown.ts`

- [x] Create `tests/integration/global.teardown.ts`
- [x] Stop the Next.js process from `global.__NEXT_PROCESS__` (SIGTERM to process group)
- [x] Reconnect to MongoDB and drop the test database
- [x] Stop `global.__MONGO_CONTAINER__`

### 6. Update `jest.integration.config.js`

- [x] Add `globalSetup: "./tests/integration/global.setup.ts"`
- [x] Add `globalTeardown: "./tests/integration/global.teardown.ts"`
- [x] Keep `maxWorkers: 1`

### 7. Deprecate/remove server helpers

- [x] In `tests/integration/helpers/server.ts`, remove `startTestServer`, `setupTestServer`, and `registerAndGetCookie`
- [x] Remove the `findAvailablePort` import (no longer needed in this file)
- [x] Keep `makeAuthedHeaders` and `waitForServer` if still used internally; otherwise remove
- [x] Keep the `TestServer` interface only if referenced externally; otherwise remove

### 8. Migrate integration test files to shared server + `createTestUser`

For each file below, replace `startTestServer()` / `setupTestServer()` / `registerAndGetCookie` with:
- Read `baseUrl` from `process.env.TEST_BASE_URL` in `beforeAll` (throw a clear error if absent)
- Call `createTestUser(baseUrl, '<descriptive-prefix>')` for each user needed

Files to migrate (excluding `dedupeEngine.integration.test.ts`):
- [x] `tests/integration/api.integration.test.ts`
- [x] `tests/integration/campaigns.integration.test.ts`
- [x] `tests/integration/campaign-global-api.integration.test.ts`
- [x] `tests/integration/characters/characterType.integration.test.ts`
- [x] `tests/integration/characters/gender.integration.test.ts`
- [x] `tests/integration/characters/softDelete.integration.test.ts`
- [x] `tests/integration/content.integration.test.ts`
- [x] `tests/integration/import/characterImport.integration.test.ts`
- [x] `tests/integration/monsters.integration.test.ts`
- [x] `tests/integration/permissions.test.ts`
- [x] `tests/integration/api/auth/login.test.ts`
- [x] `tests/integration/api/auth/logout.test.ts`
- [x] `tests/integration/api/auth/register.test.ts`
- [x] `tests/integration/api/parties.test.ts`
- [x] `tests/integration/api/sessions.test.ts`
- [x] `tests/integration/offline/logout-clears-storage.test.ts`
- [x] `tests/integration/sessions/sessionLogs.test.tsx`
- [x] `tests/integration/prompts/promptBuilder.test.tsx`

### 9. Document `dedupeEngine` exclusion

- [x] Add a comment block at the top of `tests/integration/import/dedupeEngine.integration.test.ts` explaining it manages its own MongoDB container, does not use the shared server, and must not be migrated (reference issue #224)

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npm run typecheck` — no new type errors
- [ ] `npm run test:integration` — all integration tests pass with shared server
- [ ] Verify `[port-select]` line appears exactly once in integration test output
- [ ] `npm run test:e2e` or `npx playwright test` — e2e suite passes with derived port
- [ ] Run integration suite from two different shell sessions simultaneously (different directories if possible) — no EADDRINUSE errors
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npx playwright test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [ ] Commit all changes to `feat/parallel-test-isolation` and push to remote
- [ ] Open PR from `feat/parallel-test-isolation` to `main`. PR body must include `Closes #220`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, validate locally, push, wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, validate locally, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:
- Implementer: agent
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/parallel-test-isolation/` to `openspec/changes/archive/YYYY-MM-DD-parallel-test-isolation/` **in a single commit** (stage both copy and deletion together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-parallel-test-isolation/` exists and `openspec/changes/parallel-test-isolation/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-parallel-test-isolation` then `git push -u origin doc/archive-YYYY-MM-DD-parallel-test-isolation`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-parallel-test-isolation` to `main` with title `docs: archive parallel-test-isolation (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/parallel-test-isolation doc/archive-YYYY-MM-DD-parallel-test-isolation`
