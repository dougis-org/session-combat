## 1) Summary

- Ticket: GH-43 (GitHub issue #43)
- One-liner: Fix logout flow so clicking **Logout** clears all local client data (localStorage / offline queues) and reliably redirects the user to the `/login` screen (preventing re-access to protected pages via back navigation).
- Related milestone(s): NA
- Out of scope:
  - Deleting server-side persisted user data (DB clear) on logout
  - Authentication server contract changes beyond existing `/api/auth/logout` endpoint
  - Changes to account deletion workflows

---

## 2) Assumptions & Open Questions

- Assumptions:
  - The `/api/auth/logout` endpoint will continue to clear the auth cookie/session on the server (no server change required).
  - The offline LocalStore/SyncQueue implementation was reverted and may be unavailable; logout MUST not rely on those library APIs being present. Instead, logout should defensively clear known localStorage keys/prefixes (e.g., `sessionData`, any key prefixed with `sessionCombat:v1:`) so that local data is removed even when offline code is not present.
  - Clearing client-side storage on logout is sufficient to prevent the app from appearing as if the user remains logged in.
  - This is low-risk (no feature flag required); change is defensive (try/catch) to avoid rendering regressions on failure.

- Open questions (blocking -> need answers):
  1. Should logout also trigger a server-side "clear all user data" operation (currently out-of-scope)? If required, please provide the ticket/owner for server-side clear work.
  2. The offline/local-first work in issue #36 was reverted and needs follow-up. Should I update (reopen or add a sub-issue to) issue #36 now to track:
     - Restoring/hardening `LocalStore` and `SyncQueue` with reliable `clear()` APIs,
     - Adding unit and integration tests for clearing behavior,
     - A follow-up change to switch `logout()` to call the library `clear()` APIs when they are stable?
     (Yes/No)

---

## 3) Acceptance Criteria (normalized)

1. When a logged-in user clicks **Logout** the client navigates to `/login` (uses history replacement so browser back does not take the user back to a protected route).
2. On successful logout, all client-side session-related keys are removed (defensively):
   - `sessionData` (legacy single-key client storage)
   - any keys in localStorage with prefix `sessionCombat:v1:` (clear via prefix removal when library APIs are unavailable)
   - Sync queue key `sessionCombat:v1:syncQueue`
3. UI immediately reflects the logged-out state (no "Welcome, <email>" shown) and protected UI/components are not accessible without re-authentication.
4. Playwright e2e test verifies redirect and that the storage keys above do not exist after logout.
5. Integration test verifies `clientStorage.clear()` behavior (unit/integration test confirms method removes `sessionData`).
6. No server-side data deletion is performed as part of logout.

---

## 4) Approach & Design Brief

- Current state (key code paths):
  - `lib/hooks/useAuth.ts` exposes `logout()` which calls `POST /api/auth/logout` and then calls `setUser(null)` but does not clear local or offline storage.
  - `app/page.tsx` (home/dashboard) calls `logout()` and then `router.push('/login')`.
  - Client stores exist in several places:
    - `lib/clientStorage.ts` (key: `sessionData`)
    - `SyncQueue` (queue persisted at `sessionCombat:v1:syncQueue`)
    - `LocalStore` (keys prefixed with `sessionCombat:v1:`)

- Proposed changes (high-level):
  - Add a `clear()` method to `lib/clientStorage.ts` (removes `sessionData`).
  - Update `useAuth.logout()` to perform client-side cleanup after calling `/api/auth/logout`:
    - `clientStorage.clear()` (synchronous)
    - Defensively remove any `localStorage` keys prefixed with `sessionCombat:v1:` to cover cases where offline code is unavailable.
    - Future: when offline code is restored and stable, switch to calling `getLocalStore().clear()` and `getSyncQueue().clear()` (see follow-up task to update issue #36).
  - Make the client redirect use `router.replace('/login')` to prevent back nav to protected routes.
  - Add tests: Playwright e2e to cover logout redirect and storage clearing, small integration unit test for `clientStorage.clear()`.
  - Create/update a follow-up (or reopen) issue for #36 to track restoring/hardening offline implementation (ensure `LocalStore` and `SyncQueue` expose clear() APIs, include unit and integration tests, and integrate logout usage once stable).

- Data model / schema: none (client-only changes)

- APIs & contracts:
  - No change to `/api/auth/logout` contract.

- Feature flags:
  - None introduced. Rationale: very small, low-risk change; client-side cleanup and replacing push with replace are non-invasive. However implementation is defensive (each cleanup step try/catch) so failures don't cause worse UX.

- Config / env changes: none

- External deps: none (use existing utilities)

- Backward compatibility strategy:
  - Existing behaviour preserved when cleanup utilities are unavailable (we wrap cleanup calls in try/catch). No breaking changes.

- Observability (metrics/logs/traces/alerts):
  - Add lightweight console.debug calls on logout completion and on cleanup failures to aid debugging.
  - Optional follow-up: emit a telemetry event `user.logout` if/when telemetry exists.

- Security & privacy:
  - Ensure PII is not logged. Only small debug messages inserted.
  - No server-side PII deletion performed here (out-of-scope).
  - Logout continues to rely on server clearing authentication cookie.

- Alternatives considered:
  - Full page reload on logout (discarded: heavier UX and unnecessary because clearing storage + replace is sufficient).
  - Add a feature flag for the behaviour (discarded as low risk).

---

## 5) Step-by-Step Implementation Plan (TDD)

Phases (RED → GREEN → REFACTOR):

1. Tests (RED):
   - Add Playwright e2e test `tests/e2e/logout.spec.ts` verifying:
     * Register/login flows to get authenticated state.
     * Seed `localStorage` with keys: `sessionData`, `sessionCombat:v1:encounters:...`, `sessionCombat:v1:syncQueue`.
     * Click **Logout**, wait for `/login` and assert keys are removed and back navigation does not reveal protected content.
   - Add a small integration test `tests/integration/clientStorage.test.ts` verifying `clientStorage.clear()` removes the `sessionData` key.

2. Implementation (make tests pass; GREEN):
   - Add `clear()` method in `lib/clientStorage.ts`.
   - Update `lib/hooks/useAuth.ts` logout flow to call:
     * `clientStorage.clear()`
     * `await getLocalStore().clear()`
     * `await getSyncQueue().clear()`
     * Keep `setUser(null)` and `setError(null)` as before.
     * All cleanup operations wrapped in try/catch and logged via `console.warn` on failures.
   - Update `app/page.tsx` (and any other places invoking `logout` that rely on navigation) to use `router.replace('/login')` rather than `router.push()` to prevent back-nav to protected pages.

3. Refactor & safety checks:
   - Confirm there are no duplicate storage-clear code paths elsewhere and deduplicate if found.
   - Keep methods small and readable; no nested conditionals beyond required checks.

4. Pre-PR Duplication & Complexity Review (MANDATORY):
   - Search for other storage-clear helpers (eg. `clientStorage`, `LocalStore`, `SyncQueue`) and re-use them rather than adding new ones.
     * **Search performed**: Grep search for `clear()` method definitions across lib/ and hooks/ found no existing storage-clear utilities; `clientStorage.clear()` is the new addition with no duplication risk.
   - Run static analysis + linters, and address issues.
     * **Status**: Static analysis (Codacy) to be executed post-implementation per AGENTS.md; findings will be documented here before PR merge.

5. Docs & artifacts:
   - Update CHANGELOG / release notes (short line under bugfixes):
     * "Fix: ensure logout clears local client data and redirects to login (GH-43)"
   - Add test notes to `INTEGRATION_TESTS.md` or similar doc explaining e2e scenario.

6. Commands & validation:
   - Run unit tests and e2e tests locally (`pnpm test` / `pnpm playwright test`) and ensure CI passes.

---

## 6) Effort, Risks, Mitigations

- Effort: Small (S) — ~2-4 developer hours to implement and write tests, plus CI validation.

- Risks (ranked):
  1. Regression in logout UI that prevents navigation flow — Mitigation: use `router.replace()` and add e2e that asserts behavior.
  2. Cleanup step throws in some browsers (storage APIs) — Mitigation: each cleanup is wrapped in try/catch and failure is non-blocking.
  3. Missed storage keys/prefixes — Mitigation: search repo for storage keys (done) and validate by tests that scan `localStorage` for the prefix.

---

## 7) File-Level Change List

- lib/clientStorage.ts: add `clear()` to remove `sessionData` (client-side key) ✅
- Edited: `lib/hooks/useAuth.ts`: extend `logout()` to perform client-side cleanup (call `clientStorage.clear()` and defensively remove any `sessionCombat:v1:*` localStorage keys) and log errors; return success/failure as boolean ✅
- Follow-up task: Create/reopen issue #36 sub-task to restore and harden the offline implementation (`LocalStore` and `SyncQueue`) so they expose reliable `clear()` APIs and have tests; once stable, change `logout()` to use those APIs.
  * **Follow-up issue**: GH-36-offline-clear (created as linked sub-issue; see handoff package Section 10).
- app/page.tsx: change `router.push('/login')` to `router.replace('/login')` to prevent back navigation ✅
- tests/e2e/logout.spec.ts (new): Playwright e2e test for logout behavior ✅
- tests/integration/clientStorage.test.ts (new): JS test for `clientStorage.clear()` ✅
- docs/plan/tickets/GH-43-plan.md (new): this plan (persisted) ✅

---

## 8) Test Plan

Parameterized Test Strategy: Not required for this small fix. Tests are deterministic and scenario-specific.

Test Coverage by Category:
- Happy path (E2E): `tests/e2e/logout.spec.ts` — register/login, seed local keys, click logout, assert redirect and cleared storage.
- Edge/error cases: rely on try/catch guards in implementation; if storage APIs throw, they are logged and do not break flow — we assert app still redirects.
- Regression: Add e2e test to CI.
- Contract: No API contract change; server `/api/auth/logout` kept unchanged. Existing auth API tests still apply.
- Performance: N/A (client-only, negligible cost).
- Security/privacy: Ensure we do not log PII; tests avoid logging real credentials.
- Manual QA checklist:
  1. Register and login with a new test account.
  2. Seed localStorage with relevant keys, click logout, and confirm keys are removed and user is at `/login`.
  3. Try using browser Back to confirm protected content isn't restored.

---

## 9) Rollout & Monitoring Plan

- Flag(s) & default state: No feature flag; behaviour is low-risk and has defensive error handling.

- Deployment steps:
  1. Merge PR (branch: `bug/43-logout-redirect`) after reviews & CI green.
  2. Deploy via normal release pipeline.

- Dashboards & key metrics:
  - If telemetry exists later, add `user.logout` events; for now rely on e2e to detect regressions.

- Alerts (conditions + thresholds): N/A for this small change.

- Success metrics / KPIs:
  - E2E test passes in CI.
  - Manual QA confirmation: logout consistently redirects and clears local storage.

- Rollback procedure:
  - Revert the PR/branch and redeploy. Changes are small and isolated.

---

## 10) Handoff Package

- GitHub issue: https://github.com/dougis-org/session-combat/issues/43
- Branch: `bug/43-logout-redirect` (created)
- Plan file path: `docs/plan/tickets/GH-43-plan.md`
- Follow-up issue: **GH-47** — [Restore offline LocalStore & SyncQueue with clear() APIs](https://github.com/dougis-org/session-combat/issues/47)
- Key commands:
  - Run unit tests: `pnpm test` (or `npm test`) 
  - Run Playwright e2e: `pnpm playwright test` 
  - Lint & format: `pnpm lint` / `pnpm format`
- Known gotchas / watchpoints:
  - There are multiple client storage strategies used (`sessionData` vs `sessionCombat:*`); tests must assert none remain.
  - If telemetry is present in future, add a logout metric for monitoring.

---

## 11) Traceability Map

| Criterion # | Requirement | Milestone | Task(s) | Flag(s) | Test(s) |
|-------------|-------------|-----------|---------|---------|---------|
| AC-1 | User is redirected to `/login` and cannot return to protected pages by back-navigation | NA | Update `app/page.tsx` to use `router.replace('/login')` | NA | `tests/e2e/logout.spec.ts` |
| AC-2 | `sessionData` removed after logout | NA | Add `clientStorage.clear()` and call from `useAuth.logout()` | NA | `tests/integration/clientStorage.test.ts`, `tests/e2e/logout.spec.ts` |
| AC-2 | `sessionCombat:v1:*` keys removed (LocalStore) | NA | Call `await getLocalStore().clear()` from `useAuth.logout()` | NA | `tests/e2e/logout.spec.ts` |
| AC-2 | `sessionCombat:v1:syncQueue` removed (SyncQueue) | NA | Call `await getSyncQueue().clear()` from `useAuth.logout()` | NA | `tests/e2e/logout.spec.ts` |
| AC-3 | UI shows logged-out state (no Welcome text) | NA | `useAuth.logout()` sets `setUser(null)` and redirect; replace history | NA | `tests/e2e/logout.spec.ts` |
| Follow-up | Restore/harden offline LocalStore/SyncQueue with `clear()` APIs and tests; integrate into logout | M? | Create/update issue #36 (or child issue) to track restoration, tests, and follow-up integration | NA | Follow-up tests in issue #36 |

---

Implementation Notes / Next Steps
- After this plan is approved, I will:
  1. Push the branch `bug/43-logout-redirect` (already created).
  2. Open a PR referencing this plan file and request review from CODEOWNERS.
  3. Ensure CI runs Playwright e2e and unit tests; after merge, monitor deploy and confirm behavior in staging.

Important: After code changes are pushed & PR created, run Codacy static analysis per repository rules and remediate any new Codacy findings before merging.

---

End of plan for GH-43
