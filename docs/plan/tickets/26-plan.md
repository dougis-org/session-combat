### 1) Summary

- Ticket: #26  
- One-liner: Enable registration submission for weak/short/invalid passwords (client UI currently prevents submission), ensure client + server validation surface clear errors and E2E tests pass.  
- Related milestone(s): NA  
- Out of scope: changing password policy (strength requirements), altering server-side password rules, fixing unrelated registration page title test (#25)

---

### 2) Assumptions & Open Questions

- Assumptions:
  - Server-side password validation (enforced by `validatePassword` in `lib/auth.ts`) is authoritative and must remain; the UI should allow submission and display validation errors rather than blocking clicks.
  - Existing Playwright E2E test suite (tests/e2e/registration.spec.ts) should validate this behavior after the fix (no test changes required).
  - No DB or migration changes required.
- Open questions (blocking -> need answers):
  1. Do we want additional immediate client-side complexity checks (showing specific requirements) as part of this ticket, or is enabling submit + showing server/client-side errors sufficient? (If yes, I will add inline requirement hints.)
  2. Is there any UX guideline that insists some validation must block submission (e.g., for accessibility) — otherwise I’ll enable submit for all non-loading states.

---

### 3) Acceptance Criteria (normalized)

1. The registration submit button can be clicked even when the entered password is weak (e.g., 'weak'). ✅  
2. Submitting with a weak password results in a visible validation error on the registration form (client-side error area or server error text) matching `/password|requirement|weak/i`. ✅  
3. Successful registration continues to redirect to a protected page (existing behavior preserved). ✅  
4. Existing Playwright E2E tests in `tests/e2e/registration.spec.ts` pass locally and in CI after the change. ✅  
5. Unit or integration test(s) are added to assert the behavior (submit button enabled for weak password + error displayed after submission). ✅

---

### 4) Approach & Design Brief

- Current state:
  - `app/register/page.tsx`: submit button is disabled when `password.length < 8` (line: `disabled={loading || password.length < 8}`).
  - Server-side validation exists in `app/api/auth/register/route.ts` using `validatePassword()` from `lib/auth.ts` which enforces complexity and length.
  - Playwright E2E test `tests/e2e/registration.spec.ts` expects registration attempt with weak password to show an error (currently blocked by disabled button).
- Proposed changes (high-level):
  - Update `app/register/page.tsx` to only disable submit while `loading` (remove `password.length < 8` from disabled prop).
  - Keep/strengthen client-side validation in `handleSubmit` so that submission with an invalid password displays clear error messages (it already checks length; add checks for missing uppercase/lowercase/digit to mirror server-side errors for improved UX).
  - Add a small unit/integration test to ensure submit is enabled for weak password and that submitting shows an error message after submission.
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
     - Change submit button `disabled` prop from `disabled={loading || password.length < 8}` → `disabled={loading}`.
     - In `handleSubmit`, expand client-side checks to validate uppercase/lowercase/digit and set user-facing messages (use same text as server or a generic message + server details for parity).
     - Display server `details` if present (e.g., render `error` and list `details` returned by API).
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
  - Change: `disabled={loading || password.length < 8}` → `disabled={loading}`
  - Add: Additional client-side checks in `handleSubmit` to validate uppercase/lowercase/number and present messages consistently.
  - Add: Show server `details` array (if present) in the error area.
- Potential (NEW) Unit test:
  - New: `tests/unit/register.page.test.tsx` — asserts button `disabled` prop only depends on `loading` and that after clicking with weak password an error message is shown.
- Adjust Playwright E2E (if needed):
  - `tests/e2e/registration.spec.ts` — (verify no update needed; if flaky, add `await expect(page.locator('button[type="submit"]')).toBeEnabled()` before click).
- Docs:
  - Update `docs/improvements.md` (small note referencing #26) or `CHANGELOG.md` if present.
- No server changes required.

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
  - No feature flag; change is small bugfix.
- Monitoring:
  - Watch CI e2e jobs for stability.
  - Monitor recent deploys for increased registration errors (SLO: registration success rate).
- Alerts:
  - If registration 5xx rate increases >2% over baseline in 30 minutes, rollback changes.
- Rollback procedure:
  - Revert PR commit and re-deploy (Git revert + PR).
  - Re-run E2E tests to confirm restored state.

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