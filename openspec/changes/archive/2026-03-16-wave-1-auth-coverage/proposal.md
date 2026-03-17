## Why

Issue #72 identified test coverage at ~15%, with large untested runtime-critical surfaces. Authentication is the highest-priority module because it gates access to all other features and is currently near 0% coverage. Wave 1 focuses on this gate: `lib/auth.ts` and `/api/auth/*` route handlers. Raising coverage here unblocks validation of dependent features in later waves and establishes the TDD pattern and measurement baseline for subsequent work.

## What Changes

- **Add unit tests** for `lib/auth.ts` covering:
  - Token validation (valid, expired, malformed, missing)
  - Error conditions (invalid credentials, user not found, unexpected errors)
  - Edge cases (special characters, Unicode, null/undefined inputs)
  
- **Add integration tests** for auth API routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`) covering:
  - Success paths (registration, login, authenticated requests, logout)
  - Error conditions (duplicate emails, invalid inputs, wrong passwords)
  - Session state (logged-in state persists, logout clears session)
  - Database interactions (users created, tokens issued, tokens validated)

- **Document baseline coverage** before/after for `lib/auth.ts` and `app/api/auth/*` modules and record the delta as Wave 1 success metric.

## Capabilities

### New Capabilities
- `auth-coverage-tests`: Comprehensive unit and integration test coverage for authentication module (`lib/auth.ts`) and auth API routes (`/api/auth/*`), with measurable coverage delta and documented baseline.

### Modified Capabilities
- `ci-build-test`: Pipeline continues to upload unit and integration coverage to Codacy (no changes required; existing infrastructure sufficient).

## Impact

- **Code affected**: `lib/auth.ts`, `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`
- **Test files** (new): `tests/unit/lib/auth.test.ts`, `tests/integration/api/auth/*.test.ts`
- **Codacy reporting**: Coverage-final.json and lcov.info will include new auth module coverage
- **Measurement**: Coverage baseline captured in issue #72 or wave-1-closure document

## Risks

- Auth tests may expose bugs in current implementation, requiring fixes before test passes (TDD approach mitigates this by writing tests first)
- Integration tests depend on MongoDB being available; must use test containers or CI service
- Comprehensive auth testing could be larger than a single "wave 1" if significant edge cases emerge; scope may need adjustment mid-implementation

## Non-Goals

- Refactoring auth module for testability (unless tests reveal unmaintainable seams)
- Changing auth logic or user-facing behavior
- Load/performance testing for auth routes
- Coverage for dependent modules (characters, parties, etc.) — those are Wave 2+

## Open Questions (RESOLVED)

- **Security testing deferred:** Password hashing verification, rate-limiting, and brute-force scenarios → deferred to a later security-hardening phase. Wave 1 focuses on happy-path and error-code coverage.
- **Target coverage threshold:** 80% net coverage across unit + integration tests combined (line coverage).
- **Test container usage:** Integration tests SHALL use test containers; no mocking of MongoDB. Wave 1 uses existing jest-testcontainers infrastructure.
- **Parallel-safe tests:** All unit and integration tests must be parallel-safe (no shared state, independent setup/teardown). Parallel execution timeout: 10 minutes max (to prevent infinite loops; performance optimization deferred).
- **Unit test scope:** Tests SHALL cover internal and private functions if widely used; centralized testing of internal behavior is a good practice for maintainability.
- **Test data generation:** Tests SHALL generate fresh user data for each test run (no shared state). Seeded/catalog data (Monsters, characters, etc) may be read-only reference data.
- **Error testing approach:** Tests SHALL align with actual implementation returns (e.g., test numeric error codes as returned). NEVER test message strings (too brittle). NEVER create test failures if current implementation returns pass/fail boolean — accept current behavior as contract.

## Change Control

**Scope Boundary:** This proposal defines Wave 1 scope strictly to authentication module and routes. If additional auth-adjacent modules (session storage, JWT refresh logic, etc.) are discovered to be necessary, proposal/design/specs must be updated and re-approved before implementation continues.
