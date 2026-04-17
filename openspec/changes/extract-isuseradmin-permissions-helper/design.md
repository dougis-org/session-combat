## Context

- Relevant architecture: Next.js API routes with JWT auth (`lib/middleware.ts`), MongoDB via `lib/db.ts`. Auth/authz deliberately separated: `requireAuth` verifies identity (returns 401), `isUserAdmin` checks role (returns boolean). Routes compose both.
- Dependencies: `lib/db.ts` (`getDatabase`), `mongodb` (`ObjectId`), `@testcontainers/mongodb` (integration tests).
- Interfaces/contracts touched: `app/api/monsters/global/route.ts` (POST, GET-seed), `app/api/monsters/global/[id]/route.ts` (PUT, DELETE). No external API contract changes — same HTTP status codes for successful admin/non-admin paths.

## Goals / Non-Goals

### Goals

- Single canonical `isUserAdmin` in `lib/permissions.ts`
- Null sentinel return on DB error → callers surface 500
- Real MongoDB integration test
- No behavior change for successful admin/non-admin checks

### Non-Goals

- RequireAdmin UI component (tracked in #143)
- Permission matrix or user tier system
- Changes to authentication layer

## Decisions

### Decision 1: Return type `Promise<boolean | null>`

- Chosen: `null` sentinel for DB errors; `true`/`false` for resolved admin status.
- Alternatives considered: (a) throw on error — caller must try/catch at every call site; (b) return `false` always — silent 403 masks DB failures.
- Rationale: Null sentinel is type-safe (TypeScript enforces handling), avoids hidden control flow from throws, and keeps caller logic flat (`if (admin === null)` → 500).
- Trade-offs: Callers must check three states instead of two. Acceptable given only two call sites, both updated together.

### Decision 2: `lib/permissions.ts` as new home

- Chosen: New dedicated file for authorization logic.
- Alternatives considered: (a) `lib/auth.ts` — wrong layer, handles JWT/password; (b) `lib/middleware.ts` — HTTP request layer, wrong abstraction level.
- Rationale: Authorization is a distinct concern. Dedicated file positions cleanly for future role/tier expansion without touching auth or middleware.
- Trade-offs: New file vs. slightly larger existing files. Net positive — clear conceptual boundary.

### Decision 3: Integration test seeds via direct MongoDB write

- Chosen: After user registration via API, directly update `users` collection to set `isAdmin: true`.
- Alternatives considered: Expose admin-grant API endpoint (out of scope, security risk), mock DB (defeats purpose).
- Rationale: Follows existing pattern in `auth.test.helpers.ts`. Testcontainer lifecycle already established.
- Trade-offs: Test couples to DB schema field name `isAdmin`. Acceptable — schema is stable and the field is the very thing under test.

## Proposal to Design Mapping

- Proposal element: Extract `isUserAdmin` to `lib/permissions.ts`
  - Design decision: Decision 2 (new dedicated file)
  - Validation approach: TypeScript import resolves; existing callers updated
- Proposal element: Surface DB errors as null → 500
  - Design decision: Decision 1 (null sentinel)
  - Validation approach: Integration test with DB failure simulation OR type-checking enforces null handling
- Proposal element: Real MongoDB integration test
  - Design decision: Decision 3 (direct collection write for seeding)
  - Validation approach: `permissions.test.ts` passes in Docker CI environment

## Functional Requirements Mapping

- Requirement: `isUserAdmin` returns `true` for admin user
  - Design element: `lib/permissions.ts` → DB lookup → `user.isAdmin === true`
  - Acceptance criteria reference: specs/permissions/spec.md
  - Testability notes: Integration test seeds admin user, asserts return value

- Requirement: `isUserAdmin` returns `false` for non-admin user
  - Design element: `user.isAdmin !== true` or user not found
  - Acceptance criteria reference: specs/permissions/spec.md
  - Testability notes: Integration test uses registered user without isAdmin flag

- Requirement: `isUserAdmin` returns `null` on DB error
  - Design element: catch block returns `null` instead of `false`
  - Acceptance criteria reference: specs/permissions/spec.md
  - Testability notes: Unit test with mocked `getDatabase` that throws

- Requirement: Routes return 500 on null from `isUserAdmin`
  - Design element: Call sites in both route files check `admin === null`
  - Acceptance criteria reference: specs/routes/spec.md
  - Testability notes: Integration test or manual verification of route response

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: DB errors must not silently return wrong HTTP status
  - Design element: Null sentinel + 500 at call sites
  - Acceptance criteria reference: specs/permissions/spec.md
  - Testability notes: Error path must be covered by test

- Requirement category: security
  - Requirement: No change to admin check logic — same DB field, same truthiness test
  - Design element: Extracted function is character-for-character equivalent to current implementation (minus error swallowing)
  - Acceptance criteria reference: specs/permissions/spec.md
  - Testability notes: Code review; existing route behavior tests unchanged

## Risks / Trade-offs

- Risk/trade-off: Null check missed at a call site
  - Impact: DB error returns 403 (existing behavior, not regression)
  - Mitigation: TypeScript `boolean | null` return type forces explicit handling at both call sites

- Risk/trade-off: Testcontainer startup time in CI
  - Impact: Slower integration test suite
  - Mitigation: Reuse existing container lifecycle from `monsters.integration.test.ts`

## Rollback / Mitigation

- Rollback trigger: Integration test failures in CI; route regression in staging
- Rollback steps: Revert `lib/permissions.ts` creation and route edits; restore local `isUserAdmin` definitions in both route files
- Data migration considerations: None — no schema changes
- Verification after rollback: Existing monster route tests pass; admin operations behave as before

## Operational Blocking Policy

- If CI checks fail: Do not merge. Investigate test failure root cause — do not bypass or skip integration tests.
- If security checks fail: Do not merge. Authorization logic changes require clean security scan.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to maintainer after 48h.
- Escalation path and timeout: Maintainer (dougis) has final call. No auto-merge.

## Open Questions

No unresolved questions. All design decisions finalized during exploration for #134.
