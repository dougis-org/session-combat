## GitHub Issues

- #134

## Why

- Problem statement: `isUserAdmin` is defined verbatim in two production files (`app/api/monsters/global/route.ts` and `app/api/monsters/global/[id]/route.ts`). Bodies are character-for-character identical. Duplication creates drift risk and no canonical home for authorization logic.
- Why now: Blocker #141 (test suite cleanup) is closed. Integration test infrastructure is honest. Safe to add real authorization test.
- Business/user impact: Silent DB error swallowing means a MongoDB failure silently masquerades as a 403 — admin ops fail with wrong status code and no server-side signal. Fix surfaces these as 500.

## Problem Space

- Current behavior: Both route files define `isUserAdmin` locally. On DB error, function catches, logs, returns `false` — caller returns 403 instead of 500.
- Desired behavior: Single `lib/permissions.ts` export. DB errors surface as `null` return → callers return 500. No behavior change for successful admin/non-admin checks.
- Constraints: Must not change existing auth/authz separation. `requireAuth` (middleware) handles identity; `isUserAdmin` (permissions) handles role. Routes compose both independently.
- Assumptions: No other callers of `isUserAdmin` exist (confirmed — only these two route files).
- Edge cases considered: DB error during admin check → null sentinel → 500 (not silent 403). User not found → `false` (not admin). ObjectId parse error on malformed userId → null sentinel → 500.

## Scope

### In Scope

- New `lib/permissions.ts` with exported `isUserAdmin(userId): Promise<boolean | null>`
- Remove local `isUserAdmin` from `app/api/monsters/global/route.ts`
- Remove local `isUserAdmin` from `app/api/monsters/global/[id]/route.ts`
- Update both route files to import from `lib/permissions` and handle null → 500
- New `tests/integration/permissions.test.ts` using real MongoDB via testcontainer

### Out of Scope

- `RequireAdmin` page-level component (tracked in #143)
- `getUserTier` or `hasPermission` future extensions (noted as future shape only)
- Any changes to `lib/middleware.ts` or `requireAuth`
- Frontend changes

## What Changes

- `lib/permissions.ts` — NEW: exports `isUserAdmin`
- `app/api/monsters/global/route.ts` — EDIT: remove local fn, import from lib/permissions, handle null
- `app/api/monsters/global/[id]/route.ts` — EDIT: same
- `tests/integration/permissions.test.ts` — NEW: real MongoDB integration test

## Risks

- Risk: Null sentinel changes call-site logic — missed null check returns 403 instead of 500 on DB error.
  - Impact: Wrong status code; existing behavior (silent 403) rather than regression.
  - Mitigation: Both call sites updated in same PR. TypeScript forces handling of `boolean | null` return type.

- Risk: Integration test flakiness from testcontainer startup.
  - Impact: CI noise.
  - Mitigation: Pattern already established in `monsters.integration.test.ts` — reuse same container lifecycle.

## Open Questions

No unresolved ambiguity. All decisions finalized during exploration session for #134:
- Extract location: `lib/permissions.ts` ✓
- Error surfacing: null sentinel → 500 ✓
- Test approach: real MongoDB via testcontainer ✓
- `RequireAdmin` component: deferred to #143 ✓

## Non-Goals

- Changing authentication logic (`lib/middleware.ts`, `requireAuth`)
- Adding user tier or permission matrix system
- Frontend redirect behavior for non-admin users (deferred to #143)
- Changing error messages returned to clients

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
