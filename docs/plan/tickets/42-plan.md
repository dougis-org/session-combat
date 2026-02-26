### 1) Summary

- Ticket: ISSUE-42 / GitHub #42
- Planning branch: `feature/42-playwright-regression-tests` (created)
- One-liner: Build a full Playwright regression test suite that validates key user flows (register, create character, create party, import monster, create encounter, open combat) in parallel and add CI integration so regressions are detected on PR/main merges.
- Related milestone(s): NA (suggest M1: E2E Test Coverage)
- Out of scope:
  - Full end-to-end test coverage for all UI features (only critical flows listed above)
  - Performance testing of the UI beyond parallel execution speed
  - Production runtime changes except test-only helpers behind flags

---

### 2) Assumptions & Open Questions

- Assumptions:
  1. Playwright is available in the lockfile (found @playwright/test ^1.51.1) and can be added to devDependencies pinning that version (retrieved from package-lock.json, 2026-01-18).
  2. CI environment will allow running Playwright (installing browsers or using the Playwright GitHub action).
  3. Existing DB used by CI integration-tests job is isolated (currently MONGODB_DB: session-combat-test); we'll use a separate DB name for e2e runs (e.g., session-combat-e2e).
  4. Test flows can operate using UI-only flows and unique test user emails to avoid cross-test conflicts.
  5. We will not add production API endpoints solely for test control; DB resets/cleanup will be done from test helpers connecting to MongoDB directly in the test runtime (only used by tests).

- Open questions (non-blocking / remaining):
  1. ~~Account/email domain constraints for automated registration~~ **RESOLVED:** Confirmed 4 concurrent registration requests are acceptable. Use UUID-based emails (e.g., `uuid@dougis.com`).
  2. Confirm whether adding `@playwright/test` to devDependencies requires org approval for dependency additions.

Note: Q1 (concurrent registration rate limit) **RESOLVED — confirmed 4 parallel reqs OK**. Q2 (CI parallelism) resolved — use Playwright workers (default 4) for regression runs. Codacy scanning will be managed by CI pipeline per existing org practices.

---

### 3) Acceptance Criteria (normalized)

1. A Playwright regression suite exists at `tests/e2e/regression.spec.ts` (and helpers/fixtures) that exercises: user registration, login, create character, create party, import monster (using `samples/monster-upload-example.json`), create an encounter, and open the combat screen.
2. Tests are data-driven (test cases derived from JSON/provider files) and can run in parallel without flakiness on local and CI.
3. A new npm script(s) added to `package.json`: `test:e2e` (runs Playwright suite) and `test:regression` (configurable workers for parallel runs).
4. The `Integration Tests` GitHub Actions workflow (`.github/workflows/integration-tests.yml`) is updated to run the Playwright regression suite (install browsers, set stable env vars including MONGODB_DB) and artifacts are uploaded on failure.
5. Test flow uses unique / generated email addresses (UUID@dougis.com or similar) and passwords; registration must succeed and subsequent flows (create character/party/import/create encounter/open combat) succeed and assert UI expectations for each step.
6. Tests are sufficiently deterministic: DB state is reset between independent scenarios (via test helper) or tests use unique data to avoid collisions; flakiness rate must be <2% over repeated runs before merge.
7. Test results are visible via Playwright HTML report artifacts in CI and the run is executed by `npm run regression` (or equivalent) in the integration-tests job.

---

### 4) Approach & Design Brief

- Current state (key code paths):
  - Existing Playwright config: `playwright.config.ts` (fullyParallel: true, workers=1 on CI by default)
  - Existing Playwright tests: `tests/e2e/registration.spec.ts` (registration/login flows)
  - CI integration job: `.github/workflows/integration-tests.yml` runs `npm run test:integration` (Jest integration tests)
  - Sample import data: `samples/monster-upload-example.json`

- Proposed changes (high-level):
  - Add a new Playwright test file `tests/e2e/regression.spec.ts` containing data-driven, parallel tests that implement the flows requested.
  - Add test helpers `tests/e2e/helpers/db.ts` to connect to `MONGODB_URI` and clean required collections (only used in test runtime when MONGODB_DB is set to test DB).
  - Add test fixtures under `tests/e2e/fixtures/*` with JSON-based inputs (users, monsters) for parameterized tests.
  - Add scripts to `package.json`: `test:e2e` -> `playwright test`, `test:regression` -> `playwright test --workers=${REGRESSION_WORKERS:-4} --reporter=html`.
  - Update `.github/workflows/integration-tests.yml` to install Playwright browsers and run `npm run test:regression` (after build) with MONGODB_DB set to `session-combat-e2e` and upload HTML report as artifact on failure.

- Data model / schema (migrations/backfill/versioning):
  - No DB schema changes planned. Tests will use existing APIs and storage model. If test finds need for schema changes later, plan to add migration scripts and backfill separately.

- APIs & contracts (new/changed endpoints + examples):
  - No production API changes planned. Tests will use the direct DB test helper `tests/e2e/helpers/db.ts` to perform cleanup; no test-only API endpoint will be added.

- Feature flags:
  - No feature flags are required for DB cleanup (direct DB test helper chosen).

- Config:
  - New env var: `REGRESSION_WORKERS` default 4 (Playwright worker override)
  - CI env: set `MONGODB_DB=session-combat-e2e` for the Playwright steps

- External deps & justification:
  - `@playwright/test@^1.51.1` (pin to version found in package-lock.json on 2026-01-18) — test runner.
  - GitHub action `actions/setup-node` already present; also add `microsoft/playwright-github-action` to speed browser installation in CI.

- Backward compatibility strategy:
  - Tests are non-invasive: only test code and CI changes by default. Any small production helper (test-only API) will be guarded and OFF by default.

- Observability (metrics/logs/traces/alerts):
  - CI artifacts: Playwright HTML report uploaded on failure; include `test-results/playwright` and `playwright-report/index.html` as artifacts.
  - Add a short dashboard (manual step) to display failure rate per test over time (suggest Jira/PR follow-up with ops to wire into alerts if failing regularly).

- Security & privacy:
  - Use synthetic email addresses (UUID@dougis.com) and generated passwords; do not use real PII.
  - If adding test-only API, ensure it is disabled in non-test envs and access controlled by feature flag and server environment checks.

- Alternatives considered:
  - Use a test-only API to reset DB (easier but requires production code change). Rejected by default in favor of direct DB helpers used only in test runtime.
  - Run Playwright as separate matrix jobs per flow to parallelize on the CI runner level. Chosen approach: prefer Playwright workers for simplicity and speed; revisit if CI capacity allows matrix parallelism.

---

### 5) Step-by-Step Implementation Plan (TDD)

Phases: RED → GREEN → REFACTOR

**STATUS UPDATE (2026-01-24):**
- ✅ **PREP COMPLETE**: Branch `feature/42-playwright-regression-tests` created and pushed.
- ✅ **DEPENDENCIES FIXED**: Installed `@types/uuid` dev dependency; app now compiles successfully.
- ✅ **CONFIG FIXED**: Fixed `playwright.config.ts` syntax error (line 23 corruption) and added REGRESSION_WORKERS env var support.
- ⏳ **NEXT**: Begin RED phase — implement failing tests and fixtures.

**STATUS UPDATE (2026-02-25): COMPLETE**
- ✅ All phases implemented and merged via 5 focused PRs (#57–#61) split from `feature/42-playwright-regression-tests`:
  - PR #57 (`test/infra-and-helpers`): Playwright config, `package.json` scripts (`test:e2e`, `test:regression`), helper files, `REGRESSION_WORKERS` support
  - PR #58 (`feat/monster-import-and-app-fixes`): Monster import page, auth hook, app fixes
  - PR #59 (`fix/integration-test-cleanup`): Integration test updates
  - PR #60 (`test/e2e-regression-suite`): 38 regression tests (`regression.spec.ts`, `registration.spec.ts`, `logout.spec.ts`)
  - PR #61 (`feat/ci-cd-quality-and-docs`): CI workflow, Codacy config, this documentation

1. Prep: Branching
   - ✅ Create branch `feature/42-playwright-regression-tests` (done; subsequently split into PRs #57–#61).

2. RED - Tests first (add failing tests)
   - Add `tests/e2e/fixtures/users.json` with schema:
     ```json
     [
       { "email": "<UUID>@dougis.com", "password": "SecurePass123!", "variant": "happy_path" },
       { "email": "<UUID>@dougis.com", "password": "SecurePass456!", "variant": "happy_path" },
       { "email": "<UUID>@dougis.com", "password": "SecurePass789!", "variant": "happy_path" },
       { "email": "invalid-email", "password": "SecurePass123!", "variant": "error_invalid_email" },
       { "email": "<UUID>@dougis.com", "password": "weak", "variant": "error_weak_password" }
     ]
     ```
     Tests will inject UUID at runtime to ensure uniqueness. Min 3 happy-path variants, 2 error-case variants.
   - Add `tests/e2e/fixtures/characters.json` with schema:
     ```json
     [
       { "name": "Aragorn", "class": "Fighter", "race": "Human" },
       { "name": "Legolas", "class": "Ranger", "race": "Elf" }
     ]
     ```
   - Add `tests/e2e/fixtures/parties.json` with schema:
     ```json
     [
       { "name": "Fellowship", "memberCount": 4 },
       { "name": "Quest Group", "memberCount": 2 }
     ]
     ```
   - Add `tests/e2e/fixtures/import-monster-variants.json` referencing `samples/monster-upload-example.json` (valid case) plus error variants (invalid JSON, oversized payload).
   - Add `tests/e2e/helpers/db.ts` (test helper to clear collections using MONGODB_URI and MONGODB_DB environment vars).
   - Add `tests/e2e/helpers/actions.ts` extracting reusable utilities from existing code:
     * `generateUniqueEmail()` — wraps UUID generator (new utility)
     * `fillRegistrationForm(page, email, password)` — extracted/adapted from `tests/e2e/registration.spec.ts` lines 18–22
     * `createCharacter(page, char)` — new domain-specific helper for character creation flow
     * `createParty(page, party)` — new domain-specific helper for party creation flow
     * `importMonster(page, filePath)` — new domain-specific helper for file upload flow
     * `openCombat(page, encounterId)` — new helper to navigate and assert combat UI elements
   - Add `tests/e2e/regression.spec.ts`; implement scenarios (each as a separate `test.describe.parallel` block to maximize parallelism):
     * register & login
     * create character
     * create party
     * import monster (file upload / import flow)
     * create an encounter
     * load combat screen and assert elements present (combatants list, initiative, health bars)
   - Tests should use Playwright fixtures and parameterized data via `test.each()` with JSON providers from `tests/e2e/fixtures/*.json`.
   - Ensure tests call helper DB reset before each scenario (or use unique users) to make them deterministic and independent.
   - Add unit/integration tests where appropriate (e.g., API contract for import) to ensure server-side behavior for import is stable. Reuse `tests/integration/helpers/monsterTestData.ts` (cited from `tests/integration/monsterUpload.test.ts` line 23) for monster fixture creation.

3. GREEN - Implement minimal product changes required to make tests pass
   - Iterate: run Playwright locally (`npx playwright test tests/e2e/regression.spec.ts`) -> fix failing selectors/flows.
   - Add small adaptions to client or API (if necessary) and link each change to a focused commit (e.g., selectors, missing accessibility text used in tests). Keep changes minimal and behind feature flags only if they change runtime behavior.

4. REFACTOR & HARDEN
   - Stabilize tests: add retries if needed (Playwright retry strategy), fix timing issues (avoid fixed waits; use `waitForURL`/locator waits), add global fixtures for login/session reuse when possible.
   - Utility function extraction already completed in Step 2 (RED phase). Verify in `tests/e2e/helpers/actions.ts`:
     * No duplication with existing `tests/e2e/registration.spec.ts` implementations
     * Reuse existing patterns: e.g., email generation (`Date.now()` pattern) adapted to UUID for uniqueness
     * Search results: confirmed no existing `*Action*.ts` or `*Helper*.ts` in `tests/e2e/` directory; new helpers are justified as domain-specific for regression suite.

5. CI Integration & Scripts
   - Update `package.json`: add devDependency `@playwright/test@^1.51.1` and scripts:
     * `test:e2e`: `npx playwright test`
     * `test:regression`: `npx playwright test --workers=${REGRESSION_WORKERS:-4} --reporter=html`
   - Update `playwright.config.ts` to respect REGRESSION_WORKERS env var:
     ```typescript
     workers: process.env.REGRESSION_WORKERS 
       ? parseInt(process.env.REGRESSION_WORKERS, 10) 
       : (process.env.CI ? 1 : undefined),
     ```
   - Update `.github/workflows/integration-tests.yml`:
     * After `Build application`, add: install Playwright dependencies: `npx playwright install --with-deps` (or use `microsoft/playwright-github-action@v1`), and run `npm run test:regression` with env `MONGODB_DB=session-combat-e2e`.
     * Upload Playwright HTML report to artifacts on all runs (not just failure) for visibility: `playwright-report/` and `test-results/`.
     * Codacy/security scanning will be managed by existing CI pipeline; no additional tool invocation needed in this PR.

6. Pre-PR Duplication & Complexity Review (MANDATORY)
   - Search repository for similar utilities and tests (pattern names: `*TestData*`, `*TestHelpers*`, `*Action*`). 
     * **Result:** Identified and reused `tests/integration/helpers/monsterTestData.ts` (creators for monster fixtures).
     * **Result:** Extracted `fillRegistrationForm()` and email generation pattern from `tests/e2e/registration.spec.ts`.
     * **Result:** No existing `*Action*.ts` or `*Helper*.ts` in `tests/e2e/`; new `tests/e2e/helpers/actions.ts` is justified.
   - Keep helper functions small, test fixtures parameterized in JSON files under `tests/e2e/fixtures/`.
   - Run linters and formatters:
     * `npm run lint` and fix issues
     * `npx playwright format` if used (or project standard formatters)
   - Codacy/security scanning will be managed by CI pipeline (no manual Codacy CLI invocation required for this PR; org CI handles it per current practices).

7. Docs & artifact updates
   - Update `docs/INTEGRATION_TESTS.md` and `QUICK_REFERENCE.md` to show how to run Playwright tests locally and interpret reports.
   - Add GitHub Actions step to upload artifacts and advise on how to open Playwright report from artifacts.

---

### 6) Effort, Risks, Mitigations

- Effort: Medium (M) — adding a suite of robust, data-driven Playwright tests and CI integration is non-trivial but scoped to a small number of flows.

- Risks & Mitigations:
  1. Flaky tests due to timing/async flows → Mitigation: Use Playwright waits and fixtures, parameterized retry strategy, and run stability verification in CI with retries disabled to quantify flake rate.
  2. DB contamination across tests → Mitigation: Use per-test unique data (UUID emails) and/or test helper to clear collections before scenario; isolate CI DB name `session-combat-e2e`.
  3. CI runtime (longer job) → Mitigation: Run tests in parallel workers; consider matrix or separate job if runtime remains high.
  4. Dependabot/security for Playwright → Mitigation: Pin version (use ^1.51.1 per lockfile) and run Codacy/Trivy scan after dependency addition.
  5. Permission/rate-limit issues with parallel registration → Mitigation: Coordinate with backend team to confirm endpoint tolerates concurrent requests; add exponential backoff/retries in tests.

---

### 7) File-Level Change List

- (New) `docs/plan/tickets/42-plan.md` — this plan
- (New) `tests/e2e/regression.spec.ts` — data-driven, parallel Playwright tests (flows: register, create character, create party, import monster, create encounter, open combat)
- (New) `tests/e2e/helpers/db.ts` — MongoDB test helper for clearing collections used only when `MONGODB_DB` present
- (New) `tests/e2e/helpers/actions.ts` — reusable UI actions (generateUniqueEmail, fillRegistrationForm, createCharacter, createParty, importMonster, openCombat)
- (New) `tests/e2e/fixtures/users.json` — test user templates (5 variants: 3 happy-path, 2 error-cases; UUID injected at runtime)
- (New) `tests/e2e/fixtures/characters.json` — character creation input (2 variants: Fighter/Human, Ranger/Elf)
- (New) `tests/e2e/fixtures/parties.json` — party creation input (2 variants: 4 members, 2 members)
- (New) `tests/e2e/fixtures/import-monster-variants.json` — monster import input (valid & error cases: invalid JSON, oversized file)
- ✅ (Update) `package.json` — add `@playwright/test@^1.51.1` to devDependencies, add `test:e2e` and `test:regression` scripts (merged via PR #57)
- ✅ (Update) `.github/workflows/integration-tests.yml` — add Playwright browsers install and `npm run test:regression` step; upload Playwright reports as artifacts on all runs (merged via PR #61)
- ✅ (Update) `playwright.config.ts` — add REGRESSION_WORKERS env var override for worker configuration during regression runs (merged via PR #57)
- ✅ (Update) `docs/E2E_REGRESSION_TESTS.md` — add Playwright run instructions, fixture formats, edge-case reference, and artifact locations (merged via PR #61)

---

### 8) Test Plan

Parameterized Test Strategy (see Section 5):
- Use JSON fixtures in `tests/e2e/fixtures/` and provider functions in `tests/e2e/helpers/` for parameterized scenarios.
- Use unique email addresses via UUID generator in test runtime (injected into fixture templates).
- Use `tests/e2e/helpers/db.ts` to clear collections between run groups to ensure determinism.

**Edge-Case Coverage Matrix:**

| Flow | Edge Case | Test Assertion | Fixture/Helper | Status |
|---|---|---|---|---|
| **Registration** | Valid registration (happy path) | User redirected to protected page; JWT set in cookies | `users.json` variant happy_path | ✅ Planned (3 variants) |
| **Registration** | Duplicate email (already registered) | Error message shown; stay on /register | Run 2 registrations with same email; verify 2nd fails | ✅ Planned (Step 5: unique emails, but simulate duplicate via direct API call) |
| **Registration** | Weak password | Submit button disabled; password requirements shown | `users.json` variant error_weak_password | ✅ Planned (reuse existing test logic) |
| **Registration** | Invalid email format | Form validation error; stay on /register | `users.json` variant error_invalid_email | ✅ Planned |
| **Registration** | Concurrent parallel registrations (4 simultaneous) | All succeed without race condition; 4 unique users created | `generateUniqueEmail()` × 4 in parallel | ✅ Planned (concurrent workers confirmed safe) |
| **Create Character** | Valid character creation | Character appears in list; can be viewed | `characters.json` variants | ✅ Planned |
| **Create Character** | Empty/null name | Form validation error or API error | Character form without name filled | ✅ Planned (edge case) |
| **Create Party** | Valid party creation (2+ members) | Party created; members listed | `parties.json` variants (2, 4 members) | ✅ Planned |
| **Create Party** | Empty party (0 members, if allowed) | Verify endpoint behavior (allow or reject); assert accordingly | Test with `memberCount: 0` | ⚠️ Clarify: Is empty party allowed? TBD per API contract |
| **Import Monster** | Valid JSON file | Monster imported; appears in monster list | `samples/monster-upload-example.json` | ✅ Planned |
| **Import Monster** | Duplicate monster (same name/type) | Verify deduplication logic (allow override, reject, or flag); assert outcome | Use `duplicate-monster.test.ts` pattern (reuse: `tests/integration/duplicate-monster.test.ts` exists) | ✅ Planned (reuse existing integration test) |
| **Import Monster** | Invalid JSON (malformed) | Error message shown; import fails gracefully | `import-monster-variants.json` error variant | ✅ Planned |
| **Import Monster** | Oversized file (>10MB or limit) | Upload rejected with size error | `import-monster-variants.json` oversized variant | ✅ Planned |
| **Encounter** | Create encounter with combatants | Encounter created; combatants listed | Use characters/monsters created in prior steps | ✅ Planned |
| **Encounter** | Empty encounter (0 combatants, if allowed) | Verify endpoint behavior; assert accordingly | TBD per API contract | ⚠️ Clarify: Is empty encounter allowed? |
| **Combat** | Open combat with initialized initiative | Initiative order displayed; health bars shown | Open encounter created in prior step | ✅ Planned |
| **Combat** | Open combat with uninitialized encounter | Verify initialization flow (auto-init or error); assert outcome | Encounter without initiative rolls | ⚠️ Planned (verify initialization UX) |

Test Coverage by Category:
- Happy paths: `tests/e2e/regression.spec.ts` (parameterized: 3 user variants, 2 character variants, 2 party variants). Sources: `tests/e2e/fixtures/*.json`.
- Edge/error cases: as per matrix above; reuse existing `registration.spec.ts` tests and add failure cases for import error flows (invalid JSON, oversized file, duplicate monster).
- Regression: full flow runs in parallel across workers — run via `npm run test:regression` in CI.
- Contract: Add a few Jest integration tests under `tests/integration/` to validate server-side import contract and API responses used by e2e flows. Reuse `tests/integration/helpers/monsterTestData.ts` and `tests/integration/duplicate-monster.test.ts` for fixtures and patterns.
- Performance: Not a focus for this ticket; ensure Playwright test run time is within acceptable limits by tuning workers (default 4) and parallelism.
- Security/privacy: Tests use synthetic data (UUID-based emails, generated passwords); ensure no PII is stored in shared logs or artifacts.
- Manual QA checklist:
  1. Run `npm run dev`, then `npx playwright test --headed` and verify flows succeed.
  2. Run `npm run test:regression --silent` locally and check Playwright HTML report in `playwright-report/`.
  3. Confirm GitHub Actions run reproduces tests and artifact upload works.
  4. Verify edge-case matrix scenarios execute without timeout or flakiness (run 5× to confirm < 2% failure rate).

---

### 9) Rollout & Monitoring Plan

- Flag(s) & default state: none required (DB cleanup via test helper).

- Deployment steps:
  1. Merge branch `feature/42-playwright-regression-tests` into `main` via PR that references this plan file.
  2. CI will run integration-tests job which now includes `npm run test:regression`.

- Dashboards & metrics:
  - Capture test failure count per step; upload artifacts on failure. Maintain a simple dashboard (manual process) monitoring failing tests over last N runs.

- Alerts:
  - Alert (Slack/email) if `integration-tests` job fails for two consecutive runs (setup external to this ticket).

- Success metrics / KPIs:
  - All ACs satisfied; test flakiness < 2%; CI time for regression run under target (e.g., < 15 minutes ideally).

- Rollback procedure:
  - Revert PR if tests are flaky or cause CI regressions (standard revert PR flow). Disable Playwright step in CI if unstable.

---

### 10) Handoff Package

- Jira link: (GitHub Issue) https://github.com/dougis-org/session-combat/issues/42
- Branch & PR: `feature/42-playwright-regression-tests` / PR name: "feat(tests): add Playwright regression suite (ISSUE-42)"
- Plan file path: `docs/plan/tickets/42-plan.md`
- Key commands:
  - Local dev server: `npm run dev`
  - Run Playwright tests: `npm run test:e2e` OR `npx playwright test`
  - Run regression locally (parallel): `npm run test:regression`
  - View Playwright report: `npx playwright show-report` or open `playwright-report/index.html` after run
- Known gotchas / watchpoints:
  - Ensure CI installs Playwright browser dependencies (use `npx playwright install --with-deps` or Playwright action)
  - DB isolation: use `MONGODB_DB=session-combat-e2e` to avoid contamination of other test jobs

---

### 11) Traceability Map

| Criterion # | Requirement | Milestone | Task(s) | Flag(s) | Test(s) |
|---|---|---:|---|---|---|
| 1 | Build Playwright regression suite including flows | M1 | Add `tests/e2e/regression.spec.ts`, fixtures (`users.json`, `characters.json`, `parties.json`, `import-monster-variants.json`), helpers (`db.ts`, `actions.ts`) | none | Playwright E2E (regression.spec) — 6 flow scenarios |
| 2 | Data-driven & parallel tests | M1 | Add fixtures `tests/e2e/fixtures/*` (JSON parameterized), config `playwright.config.ts` worker override, `tests/e2e/helpers/actions.ts` | none | Playwright E2E + parameterized provider fixtures (5+ user variants, 2+ character/party/import variants) |
| 3 | npm scripts to run e2e | M1 | Update `package.json` scripts `test:e2e`, `test:regression`; `playwright.config.ts` REGRESSION_WORKERS override | none | npm run test:regression (parallelized via workers env var) |
| 4 | CI runs Playwright regression and uploads artifacts | M1 | Modify `.github/workflows/integration-tests.yml` to install browsers, run regression, upload reports (all runs) | none | Integration job adds Playwright step; HTML report artifact |
| 5 | Unique test accounts used | M1 | UUID-based email generation in `tests/e2e/helpers/actions.ts` + fixtures | none | Playwright E2E parameterized tests with injected UUIDs |
| 6 | DB deterministic between tests | M1 | Add `tests/e2e/helpers/db.ts` for collection reset (chosen); isolated DB name `session-combat-e2e` in CI | none | Playwright E2E + helper resets + CI env isolation |

---

End of plan. Decisions recorded: DB cleanup approach — test helper selected; CI parallelism — Playwright workers (default 4). Plan is finalized and will be committed to `feature/42-playwright-regression-tests` branch.