### 1) Summary

- Ticket: #26  
- One-liner: Enforce password complexity by disabling submit until the password meets requirements (length, uppercase, lowercase, number); surface inline validation errors and ensure server validation and tests pass.  
- Related milestone(s): NA  
- Out of scope: changing password policy (strength requirements), altering server-side password rules, fixing unrelated registration page title test (#25)

---

### 2) Assumptions & Open Questions

- Assumptions:
  - Server-side password validation (enforced by `validatePassword` in `lib/auth.ts`) is authoritative and must remain.
  - UI policy: the registration form **must block** submission until the password meets complexity requirements (length, uppercase, lowercase, number). The submit button should be disabled when requirements are not satisfied and inline requirement hints should be visible and updated live.
  - Existing Playwright E2E test suite (`tests/e2e/registration.spec.ts`) will be updated to assert disabled state where applicable.
  - No DB or migration changes required.
- Open questions (blocking -> need answers):
  1. None (UI enforcement policy provided by product).

---

### 3) Acceptance Criteria (normalized)

1. The registration submit button is **disabled** until the entered password satisfies complexity requirements (length ≥ 8, contains uppercase, lowercase, and a number). ✅  
2. Inline validation messages reflect which requirements are missing and update live as the user types; when the form is submitted with invalid data the error area shows the server or client-provided messages matching `/password|requirement|weak/i`. ✅  
3. Successful registration continues to redirect to a protected page (existing behavior preserved). ✅  
4. Existing Playwright E2E tests in `tests/e2e/registration.spec.ts` are updated to assert the disabled state and still pass in CI after the change. ✅  
5. Unit and integration tests are added (including parameterized password vector tests) to assert validator behavior, UI disabled/enabled state, server error rendering, and double-submit prevention. ✅

---

### 4) Approach & Design Brief

- Current state:
  - `app/register/page.tsx`: submit button is disabled when `password.length < 8` (line: `disabled={loading || password.length < 8}`).
  - Server-side validation exists in `app/api/auth/register/route.ts` using `validatePassword()` from `lib/auth.ts` which enforces complexity and length.
  - Playwright E2E test `tests/e2e/registration.spec.ts` expects registration attempt with weak password to show an error (currently blocked by disabled button).
- Proposed changes (high-level):
  - Extract a small, pure, bundle-safe password validator into `lib/validation/password.ts` that returns `{ valid: boolean, errors: string[] }`. This will be used by both client (UI) and server-side validation logic to avoid duplication and bundle bloat.
  - Update `app/register/page.tsx` to **disable submit** when the validator reports invalid; add live inline requirement hints that update as the user types.
  - Add comprehensive parameterized tests for the validator (unit), UI behavior (unit/integration), and E2E flows. Include tests for server 500 and network failure behaviors, and double-submit prevention (disable button while loading).
  - Display server `details` array if present for explanatory messaging on errors returned from the server. Keep server-side validation as the source of truth for final acceptance.
  - Add test data file `tests/unit/data/password-cases.json` for parameterized cases (weak, missing uppercase, missing lowercase, missing digit, unicode, long input).
- Data model / schema: none.
- APIs & contracts:
  - No API contract change. Server returns 400 with details when password invalid: `{ error: 'Password does not meet requirements', details: [...] }`.
  - Client should display `data.error` or structured `details`.
- Feature flags: none required (change is low risk and a bugfix).
- Config: none.
- External deps: none.
- Backward compatibility: change is UI-only (no breaking API change).
- Observability: no new metrics required. Add a debug log in register route on invalid submission is optional (existing server console.error is sufficient).
- Security & privacy: no new PII exposure. Input validation remains on server; client improvements are UX-only.
- Alternatives considered:
  - Keep button disabled but change tests — rejected (tests are spec of intended UX).
  - Add a feature flag to control strict client-side blocking — rejected (overkill).

---

### 5) Step-by-Step Implementation Plan (TDD)

RED → GREEN → REFACTOR

1. Prep & branch
   - Ensure clean workspace, sync main:
     - `git checkout main && git pull --ff-only`
   - Branch: `bug/26-enable-submit-weak-password` (create if missing)
   - Confirm: "Planning issue #26 on branch bug/26-enable-submit-weak-password"
2. Tests (Add tests first)
   - Add Playwright or Jest integration test(s) to explicitly assert submit button is enabled for a weak password and that submitting shows an error.
     - File: (NEW) `tests/e2e/register-weak-password.spec.ts` OR extend existing `tests/e2e/registration.spec.ts` with an assert that the submit button is enabled before click.
     - For unit test (optional): `tests/unit/register.page.test.tsx` using React Testing Library to assert disabled state depends only on `loading`.
3. Implement change (minimal)
   - Edit `app/register/page.tsx`:
     - Use `lib/validation/password.ts` validator to control `submit` button `disabled` prop (disabled when `!validator.valid || loading`). Add live inline requirement hints.
     - In `handleSubmit`, rely on validator pre-checks and, on server response errors, render server `details` if present.
     - Ensure the button is disabled when `loading` to prevent double-submits.
   - Add new shared validator:
     - New: `lib/validation/password.ts` - pure function `validatePasswordForClient(password: string): { valid: boolean; errors: string[] }` and unit tests to verify vectors from `tests/unit/data/password-cases.json`.
   - Tests to write first (RED):
     - Unit: validator parameterized tests using `tests/unit/data/password-cases.json`.
     - Unit: `register.page` tests asserting disabled/enabled state and inline hints.
     - Integration/E2E: update `tests/e2e/registration.spec.ts` to assert disabled state for invalid passwords and full success flow for valid passwords.
     - Integration/E2E: tests for server 500 handling and double-submit behaviour (button disabled while loading).
   - Refactor: If needed, update server to import shared validator or wrap existing `lib/auth.validatePassword` to reuse logic while avoiding bringing server-only dependencies into client bundle.
4. Run tests (fail expected before implementation — confirm RED)
   - `npm run test:integration` (Jest integration) and Playwright e2e run for the registration test.
5. Implement code changes (make tests pass)
   - Verify behavior locally by running Playwright e2e `tests/e2e/registration.spec.ts`.
6. Refactor
   - Ensure no duplication; keep messages consistent (use constants if appropriate).
   - Keep changes small and focused.
7. Pre-PR checks (MANDATORY)
   - Static analysis & lint: `npm run lint` / `npm run format`
   - Unit tests: `npm test` (or `npm run test:integration`)
   - E2E tests: run Playwright suite for registration tests
   - Codacy / Snyk: run checks if available in CI (adhere to repo policy)
8. Commit & push
   - Commit message: `fix(registration): enable submit for weak passwords and show validation errors (#26)`
9. Open PR referencing the issue, include plan file (see Step 4)
10. Post-merge
    - Ensure CI e2e job passes; monitor for regressions.

Pre-PR Duplication & Complexity Review:
- Search for duplicated password UI logic (none expected) and keep server-side logic authoritative.

Docs & artifacts:
- Add short changelog entry in `docs/improvements.md` referencing issue #26.
- Update `tests/README` if new tests added.

---

### 6) Effort, Risks, Mitigations

- Effort: S (Small, ~1–2 dev-hours including tests & CI runs)
- Risks:
  1. Risk: Changing enabled state may allow more invalid submissions to hit server → benign (server validation exists). Mitigation: keep server-side validation and surface server-provided `details` to user immediately.
  2. Risk: E2E flakiness due to timing. Mitigation: use explicit `await page.waitForSelector()` or `await page.waitForTimeout()` only where necessary; ensure tests assert presence of error, not exact text.
  3. Risk: Accessibility/regression in mobile/tab focus. Mitigation: run quick a11y smoke (manual check) and ensure button still uses standard semantics.
- Fallback: If UX concerns arise, revert commit and present enhancement plan with feature flag.

---

### 7) File-Level Change List

- Modify: `app/register/page.tsx`
  - Change button `disabled` logic to `disabled={loading || !validator.valid}` using shared validator from `lib/validation/password.ts`.
  - Add live inline requirement hints updated as the user types.
  - Ensure button is disabled while `loading` to prevent double-submits.
  - In `handleSubmit`, rely on validator pre-checks and display server `details` if returned.
- New shared validator & tests:
  - New: `lib/validation/password.ts` — pure `validatePasswordForClient(password: string): { valid: boolean; errors: string[] }` and map server validation rules.
  - New unit tests: `tests/unit/validation/password.test.ts` parameterized using `tests/unit/data/password-cases.json`.
- Unit tests for UI:
  - New: `tests/unit/register.page.test.tsx` — asserts button disabled/enabled state, inline hint rendering, double-submit prevention.
- E2E tests:
  - Update: `tests/e2e/registration.spec.ts` to assert disabled state for invalid passwords and success flow for valid passwords.
  - Add: server-500 and network-error test cases to confirm user-facing error appearance.
- Docs:
  - Update `docs/improvements.md` (small note referencing #26) and add an entry to changelog if present.
- Server changes:
  - Optionally adapt server to reuse shared validator or wrap `lib/auth.validatePassword`, ensure no server-only deps are imported into client bundles.

---

### 8) Test Plan

Parameterized Test Strategy:
- Use existing Playwright E2E test: `tests/e2e/registration.spec.ts` (already includes weak-password test).
- Add unit test (Jest + React Testing Library) to assert:
  - Submit button enabled when `password = 'weak'` and `loading=false`.
  - After submit with weak password, `formError` visible contains 'Password' (assert regex `/password|requirement|weak/i`).
- Edge/error cases:
  - Test missing uppercase, missing digit, missing lowercase (client shows server details or a generic message) — parameterized in unit tests as small table-driven cases.
- Regression:
  - Run full E2E suite locally & in CI after change.
- Security/privacy:
  - No PII logging changes; ensure errors do not leak sensitive info (server already returns safe messages).
- Manual QA checklist:
  - Enter weak password, click submit, confirm visible error.
  - Enter valid password, click submit, confirm redirect.
  - Confirm no networking errors during submission.

---

### 9) Rollout & Monitoring Plan

- Rollout:
  - Merge PR to `main` after CI green.
  - No feature flag for this low-risk UX fix (justify if product requires a flag).
- Monitoring:
  - Instrument metrics: `auth_register_requests_total`, `auth_register_success_total`, `auth_register_failure_total{status}`, and `auth_register_latency_ms`.
  - Dashboards: add a panel showing success rate and failure breakdown by status code for `/api/auth/register`.
- Alerts:
  - Alert when `rate(auth_register_failure_total{status=~"5.."}[5m]) / rate(auth_register_requests_total[5m]) > 0.02` sustained for 30m; notify `#ci-alerts` (or configured channel).
- Rollback procedure:
  - Revert PR commit and re-deploy (Git revert + PR).
  - Re-run E2E tests to confirm restored state.
- Note: Add a log entry when server returns validation errors but **do not** log PII (mask emails/passwords if needed).

---

### 10) Handoff Package

- GitHub issue: https://github.com/dougis-org/session-combat/issues/26  
- Branch name: `bug/26-enable-submit-weak-password`  
- Plan file path to commit: `docs/plan/tickets/26-plan.md` (this file)  
- Key commands:
  - Tests: `npm run test:integration` & Playwright runner used in CI
  - Lint: `npm run lint`
  - Format: `npm run format`
- Known gotchas / watchpoints:
  - Playwright clicking disabled buttons times out — confirm submit is enabled before click.
  - If server messages differ from expected error text, show `details` array to users (improves test stability).

---

### 11) Traceability Map

| Criterion # | Requirement (AC) | Milestone | Task(s) | Flag(s) | Test(s) |
|---:|---|---|---|---|---|
| 1 | Enable submit for weak password | NA | Edit `app/register/page.tsx` change disabled logic | none | Playwright E2E: `should reject registration with weak password` |
| 2 | Show validation error after submit | NA | Add client validation + display API `details` | none | Unit: register page tests; Playwright E2E |
| 3 | Preserve successful redirect | NA | Confirm router.push('/') on success remains | none | Playwright E2E: `should successfully register a new user` |
| 4 | All E2E tests pass | NA | Run `tests/e2e` and fix flakiness if any | none | Playwright suite (registration.spec.ts) |
| 5 | Tests added to prevent regression | NA | Add unit/integration tests under `tests/` | none | New unit test + existing Playwright tests |

---

(If you want, I can create a PR with this plan file and the minimal code change in a follow-up. Confirm if you'd like me to implement the UI change and tests now.)