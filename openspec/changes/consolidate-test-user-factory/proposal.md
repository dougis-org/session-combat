## GitHub Issues

- #222

## Why

- Problem statement: Integration test user and email generation is split across two files with overlapping responsibilities and a name collision (`createTestUser` exists in both `auth.test.helpers.ts` and `helpers/users.ts` with different signatures). `helpers/users.ts` also contains its own email generation (`uniqueEmail`) that duplicates the collision-safe logic already in `auth.test.helpers.ts`.
- Why now: Issue #222 (promote auth test helpers to a shared factory) is ~90% complete. The remaining gap is precisely this consolidation — establishing a clear, single-responsibility layer so future tests always have one place to look.
- Business/user impact: Eliminates silent collision risk in parallel test runs, removes the name confusion between the two `createTestUser` functions, and gives every test author a clear mental model: data comes from `auth.test.helpers.ts`, registration comes from `helpers/users.ts`.

## Problem Space

- Current behavior:
  - `auth.test.helpers.ts` exports `createTestEmail` (collision-safe) and a sync `createTestUser(prefix, password) → {email, password}` (data only, no HTTP).
  - `helpers/users.ts` exports `uniqueEmail` (worker/pid/counter-based, different strategy) and an async `createTestUser(baseUrl, prefix) → Promise<{email, password, cookie, userId}>` (does HTTP registration). The function name clashes with the one in `auth.test.helpers.ts`.
  - `login.test.ts` uses `createTestEmail + registerUser` from `auth.test.helpers.ts` for setup — but it's testing login, not registration. These setup calls should use the factory.
  - `register.test.ts` has raw `Date.now()`-only special-email strings on lines 93-96 (missing random component, collision risk).
  - All other integration test files already import `createTestUser` from `helpers/users.ts`.
- Desired behavior:
  - One canonical email generator: `createTestEmail` in `auth.test.helpers.ts`.
  - One canonical credential object factory: `createTestUser` in `auth.test.helpers.ts`.
  - One canonical HTTP registration helper: `registerTestUser` in `helpers/users.ts` (renamed from `createTestUser`), which delegates data generation to `createTestUser` from `auth.test.helpers.ts`.
  - No `uniqueEmail` export from `helpers/users.ts`.
  - `login.test.ts` setup calls use `registerTestUser`.
  - `register.test.ts` special-email test uses `createTestEmail` instead of raw `Date.now()`.
- Constraints: `registerUser` in `auth.test.helpers.ts` must stay — it is the test subject in `register.test.ts` (the tests exercise registration edge cases directly). It is not a setup helper.
- Assumptions: All files currently importing `createTestUser` from `helpers/users.ts` only use the async network version. Verified: `api.integration.test.ts`, `parties.test.ts`, `sessions.test.ts`, `campaign-global-api`, `campaigns`, `characters/*`, `content`, `import/characterImport`, `monsters`, `permissions`.
- Edge cases considered: `register.test.ts` line 111-113 calls the sync `createTestUser` from `auth.test.helpers.ts` to build credential objects for a parallel-safety test, then passes them to `registerUser` manually — this usage stays unchanged.

## Scope

### In Scope

- Rename `createTestUser` → `registerTestUser` in `helpers/users.ts`
- Remove `uniqueEmail` from `helpers/users.ts`; replace its internal use with `createTestUser` imported from `auth.test.helpers.ts`
- Update all call sites that import `createTestUser` from `helpers/users.ts` to use `registerTestUser`
- Migrate `login.test.ts` setup calls from `createTestEmail + registerUser` to `registerTestUser`
- Fix `register.test.ts` special-email strings to use `createTestEmail` instead of raw `Date.now()`

### Out of Scope

- Changing `auth.test.helpers.ts` `createTestUser` (sync data factory) — it stays as-is, it is the canonical source
- Changing `registerUser` in `auth.test.helpers.ts` — it is a test subject primitive, not a setup helper
- Moving auth-specific utilities (`WEAK_PASSWORDS`, `INVALID_EMAILS`, `loginUser`, assertion helpers) out of `auth.test.helpers.ts`
- Any changes to production code

## What Changes

- `tests/integration/helpers/users.ts`: remove `uniqueEmail`, rename `createTestUser` → `registerTestUser`, import and use `createTestUser` from `auth.test.helpers.ts` for data generation
- `tests/integration/api/auth/login.test.ts`: replace 3 setup calls (`createTestEmail` + `registerUser`) with `registerTestUser` from `helpers/users.ts`; remove `createTestEmail` and `registerUser` from imports
- `tests/integration/api/auth/register.test.ts`: fix special-email strings (lines 93-96) to use `createTestEmail`; update `createTestUser` import to reflect it now comes only from `auth.test.helpers.ts`
- 12 other integration test files: rename `createTestUser` → `registerTestUser` at import and call sites (mechanical rename only)

## Risks

- Risk: Import cycle — `helpers/users.ts` importing from `auth.test.helpers.ts`
  - Impact: Build/test failure if a circular dependency is introduced
  - Mitigation: `auth.test.helpers.ts` does not import from `helpers/users.ts`, so the dependency is one-directional. Verify after change.

- Risk: `register.test.ts` parallel-safety test (line 111) currently imports the sync `createTestUser` from `auth.test.helpers.ts` — if that import is accidentally removed or renamed, the test breaks silently
  - Impact: False-passing parallel test
  - Mitigation: The sync `createTestUser` in `auth.test.helpers.ts` is not being renamed. Import remains valid.

- Risk: Mechanical rename misses a call site
  - Impact: TypeScript compile error (different signatures — easy to catch)
  - Mitigation: grep-verify zero remaining `createTestUser` imports from `helpers/users.ts` after migration

## Open Questions

No unresolved ambiguity. All decisions were confirmed during exploration:
- `auth.test.helpers.ts` `createTestUser` stays named as-is (canonical data factory)
- `helpers/users.ts` async function renamed to `registerTestUser`
- `registerUser` in `auth.test.helpers.ts` stays as-is (test subject primitive)

## Non-Goals

- Creating a new shared test utilities package or barrel file
- Adding cleanup/teardown logic to `registerTestUser`
- Changing test assertion patterns or restructuring test suites

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
