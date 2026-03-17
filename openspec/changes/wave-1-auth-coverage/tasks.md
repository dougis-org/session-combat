## 1. Setup & Baseline

**IMPORTANT:** All tests must complete within 10 minutes for parallel execution (--maxWorkers=5 to --maxWorkers=10). This timeout prevents infinite loops from test hangs; performance optimization is a later phase.

- [ ] 1.1 Checkout main branch, pull latest remote changes
- [ ] 1.2 Create feature branch: `git checkout -b feat/wave-1-auth-coverage`
- [ ] 1.3 Capture baseline coverage: Run `npm run test:unit -- --coverage` and `npm run test:integration -- --coverage`, save summary for comparison (note the 0% or near-0% for lib/auth.ts and /api/auth/*)
- [ ] 1.4 Verify test infrastructure: Confirm Jest + testcontainers are working by running `npm run test:integration` on existing suite
- [ ] 1.5 Create test file structure: Create `tests/unit/lib/auth.test.ts` and `tests/integration/api/auth/` directory

## 2. Unit Tests for lib/auth.ts

**IMPORTANT:** All unit tests MUST be parallel-safe (independent setup/teardown, no shared global state). Tests will be run with `jest --maxWorkers=5` in CI. Cover internal/private functions if widely used (centralized testing is a good practice). Test error codes, NEVER message strings. If code returns pass/fail boolean, accept it.

- [ ] 2.1 Write failing test: Token generation produces valid JWT with correct payload (parallel-safe, fresh data)
- [ ] 2.2 Write failing test: Token validation accepts valid, non-expired tokens
- [ ] 2.3 Write failing test: Token validation rejects expired tokens
- [ ] 2.4 Write failing test: Token validation rejects malformed/corrupted tokens
- [ ] 2.5 Write failing test: Token validation handles null/undefined inputs gracefully
- [ ] 2.6 Write failing test: Token generation handles special characters in username/email without encoding issues
- [ ] 2.7 Write failing test: Token payload contains expected user ID and issued/expiry timestamps
- [ ] 2.8 Verify all unit tests fail (expected; TDD approach)
- [ ] 2.9 Run `npm run test:unit` and confirm auth.test.ts tests are failing and no changes to lib/auth.ts have been made yet

## 3. Integration Tests for /api/auth/register

**IMPORTANT:** All integration tests MUST use test containers for MongoDB (NOT mocks). Each test MUST be parallel-safe with isolated database state (separate test DB per run). Tests will be run with `jest --maxWorkers=5` in CI. Generate fresh user data per test. Test error codes, NEVER message strings. Complete within 10 minutes total.

- [ ] 3.1 Write failing test: POST /api/auth/register with valid email/password creates user and returns 201 with token (test container, parallel-safe, fresh data)
- [ ] 3.2 Write failing test: POST /api/auth/register with duplicate email returns 409 conflict
- [ ] 3.3 Write failing test: POST /api/auth/register with invalid email format returns 400
- [ ] 3.4 Write failing test: POST /api/auth/register with weak password returns 400 with requirements info
- [ ] 3.5 Write failing test: POST /api/auth/register with missing email/password returns 400 with field list
- [ ] 3.6 Write failing test: Created user has hashed password, not plaintext
- [ ] 3.7 Verify all register tests fail (expected; TDD approach)
- [ ] 3.8 Run `npm run test:integration` and confirm auth register tests are failing

## 4. Integration Tests for /api/auth/login

- [ ] 4.1 Write failing test: POST /api/auth/login with correct credentials returns 200 and valid token
- [ ] 4.2 Write failing test: POST /api/auth/login with incorrect password returns 401
- [ ] 4.3 Write failing test: POST /api/auth/login with nonexistent user returns 401 (generic failure)
- [ ] 4.4 Write failing test: POST /api/auth/login with missing credentials returns 400
- [ ] 4.5 Write failing test: Token issued at login works for authenticated requests (verify with Authorization header)
- [ ] 4.6 Verify all login tests fail (expected; TDD approach)
- [ ] 4.7 Run `npm run test:integration` and confirm auth login tests are failing

## 5. Integration Tests for /api/auth/logout

- [ ] 5.1 Write failing test: POST /api/auth/logout with valid token clears session and invalidates token
- [ ] 5.2 Write failing test: POST /api/auth/logout without token returns 401
- [ ] 5.3 Write failing test: POST /api/auth/logout with invalid token returns 401
- [ ] 5.4 Verify all logout tests fail (expected; TDD approach)
- [ ] 5.5 Run `npm run test:integration` and confirm auth logout tests are failing

## 6. Quality & Test Review

- [ ] 6.1 Review unit tests for duplication, brittle fixtures, unnecessary mocks (check auth.test.ts for clarity)
- [ ] 6.2 Review integration tests for realistic MongoDB state management and cleanup between tests
- [ ] 6.3 Verify test names clearly describe the scenario being tested (use Given/When/Then style comments if needed)
- [ ] 6.4 Ensure no test interdependencies (each test should run independently)

## 7. Validation & Measurement

- [ ] 7.1 Run `npm run lint` and ensure all new test files pass eslint
- [ ] 7.2 Run `npm run build` and ensure build succeeds with new tests
- [ ] 7.3 Run `npm run test:unit -- --coverage --maxWorkers=5` and verify auth.test.ts tests pass and coverage increases for lib/auth.ts (max 10 minutes)
- [ ] 7.4 Run `npm run test:integration -- --coverage --maxWorkers=5` and verify all integration tests pass (test containers isolated, parallel-safe, max 10 minutes)
- [ ] 7.5 Capture final coverage: Run full coverage suite with parallel execution and save summary showing new line/branch coverage for lib/auth.ts and /api/auth/* modules
- [ ] 7.6 Calculate coverage delta: Compare baseline (step 1.3) to final (step 7.5). **TARGET: 80% net line coverage for auth module.** Record delta in Git commit message or issue comment
- [ ] 7.7 Verify Codacy will receive updated coverage: Check that lcov.info includes new auth test coverage
- [ ] 7.8 Verify parallel safety & timeout: Re-run tests with `jest --maxWorkers=10` to ensure no race conditions or shared state corruption, completing within 10 minutes

## 8. PR and Merge

- [ ] 8.1 Run full test suite: `npm run test:unit`, `npm run test:integration`, `npm run test:regression` all pass
- [ ] 8.2 Commit all test files with message referencing issue #72: `git add tests/unit/lib/auth.test.ts tests/integration/api/auth/` and `git commit -m "feat(#72): add Wave 1 auth coverage tests"`
- [ ] 8.3 Push branch: `git push origin feat/wave-1-auth-coverage`
- [ ] 8.4 Create PR with title "feat(#72): Add Wave 1 auth coverage (unit + integration tests)" and description summarizing:
  - Which modules are now tested (lib/auth.ts, /api/auth/*)
  - Test count (e.g., 15 unit, 18 integration)
  - Coverage delta (e.g., "auth module from 0% to 75%")
  - Reference to change spec at `openspec/changes/wave-1-auth-coverage/`
- [ ] 8.5 Address CI failures (if any): common issues are MongoDB connection, linting, or path mismatches
- [ ] 8.6 Address code review comments: ensure tests follow project style and testing patterns
- [ ] 8.7 Once all checks pass and PR approved, enable auto-merge or merge manually

## 9. Post-Merge

- [ ] 9.1 Switch back to main: `git checkout main && git pull origin main`
- [ ] 9.2 Run `npm run test:unit -- --coverage` locally to confirm coverage is included in main
- [ ] 9.3 Archive the change: `npm run opsx:archive-change -- --change "wave-1-auth-coverage"` (follow on-screen prompts to sync specs back to openspec/specs/)
- [ ] 9.4 Verify archive completed: Check that change is moved to `openspec/changes/archive/` and specs are synced to `openspec/specs/`
- [ ] 9.5 Prune merged branch: `git branch -d feat/wave-1-auth-coverage` and `git push origin --delete feat/wave-1-auth-coverage`
- [ ] 9.6 Comment on issue #72 with final coverage numbers and reference to merged PR
