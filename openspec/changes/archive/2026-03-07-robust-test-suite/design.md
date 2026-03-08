## Context

The project has three test layers:
1. **Unit/integration (Jest)**: `tests/integration/` — API-level tests using testcontainers + a spawned Next.js process
2. **E2E regression (Playwright)**: `tests/e2e/` — full browser tests against a running dev server

Current pain points discovered through code analysis:

- `global.setup.ts` starts a MongoDB testcontainer and overwrites `MONGODB_URI`, but in CI a MongoDB Docker service already runs at `localhost:27017`. The result is that `MONGODB_URI` points to the testcontainer URL while the already-built Next.js app (started by `webServer`) still talks to `localhost:27017` — two different databases.
- `waitForLoadState("networkidle")` is used as a catch-all "settle" wait in helpers. Any background XHR poll or websocket prevents networkidle from ever resolving; the `.catch(() => {})` swallows the timeout silently, producing a test that continues in an unknown state.
- Integration tests in `api.integration.test.ts` and `monsters.integration.test.ts` each independently spin up a MongoDB container + Next.js process. This doubles startup cost (~2 min each) and creates port-finding races.
- Protected endpoints are called without authentication and `401` is accepted as a passing response, making the tests vacuous for the happy path.
- `regression.spec.ts` and `registration.spec.ts` heavily overlap — both test registration form behaviour with no shared utility.
- Brittle selectors: `locator("text=Password Strength: Weak")`, `toHaveClass(/text-green-400/)` couple tests to exact copy and implementation-specific CSS classes.

## Goals / Non-Goals

**Goals:**
- Tests that fail only when the application is actually broken (zero false positives from environment mismatch or timing)
- Explicit, readable wait strategies with clear failure messages when something goes wrong
- Integration tests that exercise authenticated flows end-to-end
- A single consolidated E2E spec file (or clearly separated files with no overlap)
- Stable selectors via `data-testid` attributes for key interactive elements

**Non-Goals:**
- Achieving 100% code coverage
- Adding new feature tests beyond what already existed
- Switching test frameworks or replacing Jest/Playwright
- Changing the application's authentication mechanism
- Fixing slow test suite startup (containerised tests will still take ~2 min; that is acceptable)

## Decisions

### Decision 1: Remove Playwright global MongoDB container; rely on environment-provided DB

**Chosen**: Simplify `global.setup.ts` to be a no-op (or remove it entirely). The Playwright `webServer` command (`npm run dev`) already picks up `MONGODB_URI`/`MONGODB_DB` from the environment. In CI those vars are provided by the job-level `env:` block pointing to the Docker service. Locally, developers run the dev server manually with their own DB, same as they always have.

**Alternative considered**: Keep the testcontainer but write its URI to a temp file and read it back in the webServer startup script. Rejected: too complex and the CI Docker service is already the right pattern.

**Why now**: The environment mismatch is the root cause of "tests that register a user but then can't find them later" failures in CI.

### Decision 2: Replace `networkidle` with explicit element waits

**Chosen**: Remove all `waitForLoadState("networkidle")` calls. Replace with:
- After navigation: `await expect(page.locator('[data-testid="..."]')).toBeVisible()`
- After form submit: wait for URL change OR a success element to appear
- After login: wait for a known authenticated-state element (e.g., logout button or dashboard heading)

**Alternative considered**: Use `waitForLoadState("domcontentloaded")` as a lighter alternative. Rejected: still doesn't guarantee the React component tree has hydrated.

**Why**: `networkidle` fails whenever any background request is in-flight (e.g., auth polling). Element-based waits express intent and fail with actionable messages.

### Decision 3: Add `data-testid` attributes to critical UI elements

**Chosen**: Add `data-testid` to: login/register forms, logout button, dashboard heading, character list/form, party list/form, encounter list/form, combat screen, initiative order list, combatants list, and health bars. Use these in tests instead of text matchers or CSS class checks.

**Alternative considered**: Use `aria-*` attributes exclusively. Preferred for accessibility but `data-testid` is acceptable for elements that may not map cleanly to a role (e.g., combat-screen container).

### Decision 4: Per-test DB cleanup in Playwright via `beforeEach`

**Chosen**: Call `clearTestCollections()` in a global `beforeEach` hook (in a `global.setup.ts` fixture file or in each spec's `beforeEach`). Existing `clearTestCollections()` in `helpers/db.ts` already implements the logic; it just isn't wired up.

**Alternative considered**: Unique email per test (already done) + no cleanup. Rejected: parallel tests can still conflict on characters/parties/encounters that aren't user-scoped; and DB growth across long runs degrades performance.

**Risk**: `clearTestCollections` requires `MONGODB_URI` to be reachable from the test process. This is true when env vars are set correctly (see Decision 1).

### Decision 5: Shared server bootstrap for integration tests

**Chosen**: Extract `startTestServer()` / `stopTestServer()` into `tests/integration/helpers/server.ts`. Each test suite imports it and calls it in `beforeAll`/`afterAll`. The server helper starts one MongoDB container and one Next.js process per test file, but the setup code is written once.

**Alternative considered**: Use a single Jest global setup (like Playwright's) that starts one server for all integration test files. Rejected: Jest's `--runInBand` would be required and integration tests would lose parallelism.

### Decision 6: Authenticate in integration tests via the register→cookie flow

**Chosen**: Integration tests call `POST /api/auth/register` then use the response `Set-Cookie` header to authenticate subsequent requests, rather than accepting `401` as OK.

**Alternative considered**: Add a test-only bypass endpoint that returns a session token. Rejected: modifies production code for test purposes.

## Risks / Trade-offs

- **Risk**: `clearTestCollections` in `beforeEach` adds ~50–100 ms per test. → Mitigation: acceptable for E2E; only called once per test not once per assertion.
- **Risk**: `data-testid` attributes increase HTML payload size and must be maintained as the UI changes. → Mitigation: small absolute size, well worth the selector stability.
- **Risk**: Removing global setup MongoDB container breaks local dev setups where developers don't run MongoDB. → Mitigation: document that local E2E tests require `MONGODB_URI` to be set (same as running the app locally). Add a clear error in the test runner if `MONGODB_URI` is missing.
- **Risk**: Merging `regression.spec.ts` and `registration.spec.ts` could introduce merge conflicts if both files are actively edited on branches. → Mitigation: do the merge as a single atomic PR.

## Migration Plan

1. Add `data-testid` attributes to application source (can be done incrementally per spec file)
2. Fix `global.setup.ts` (remove container bootstrap)
3. Wire `clearTestCollections` into E2E `beforeEach`
4. Refactor `helpers/actions.ts` (remove networkidle, add explicit waits)
5. Merge/deduplicate `regression.spec.ts` and `registration.spec.ts`
6. Extract shared integration test server bootstrap
7. Add proper auth to integration tests
8. Run full test suite locally and in CI before merging

No rollback strategy required — all changes are to test code only. The application is not modified except for `data-testid` attributes (additive, no functional change).

## Open Questions

- Should the merged spec file keep the name `regression.spec.ts` or be split into domain-focused files (`auth.spec.ts`, `combat.spec.ts`)? Suggest domain-focused for clarity, but either works.
- Should `monsters-copy.test.ts` be deleted (appears to be an accidental copy)? Yes, pending confirmation it has no unique tests.
