## Context

- Existing auth: JWT cookies, MongoDB, `bcryptjs` password hashing.
- `withAuth` / `withAuthAndParams` wrappers exist in `lib/middleware.ts` but do not verify
  token freshness against the DB — they only validate JWT signature.
- ~35 route handlers call `requireAuth` / `verifyAuth` directly (bypassing the wrappers).

## Goals / Non-Goals

### Goals

- Enable atomic session invalidation by incrementing a version counter on the User document.
- Enforce the check consistently across all authenticated routes via the existing wrappers.

### Non-Goals

- Implementing the password reset flow.
- Changing JWT TTL or adding refresh tokens.

## Decisions

### D1: tokenVersion field on User

- Add `tokenVersion: number` (default `0`) to the `User` MongoDB document.
- Include `tokenVersion` in the JWT payload at token issuance time.
- On security events (password reset, etc.), increment `tokenVersion` atomically with the
  credential change — this invalidates all previously issued tokens in one operation.

### D2: Verification location — inside withAuth wrappers

- `withAuth` and `withAuthAndParams` are already async. Add a DB lookup inside them:
  fetch user by `userId`, compare `user.tokenVersion === payload.tokenVersion`.
- If mismatch or user not found → 401.
- This is the single enforcement point — no scattered checks in individual handlers.

### D3: Migrate direct callers to wrappers

- `requireAuth` / `verifyAuth` remain in `lib/middleware.ts` for backward compatibility
  during the migration but are marked `@deprecated`.
- All ~35 direct callers are converted to use `withAuth` / `withAuthAndParams`.
- Once migration is complete, deprecated functions can be removed in a follow-up.

### D4: Login and register route updates

- Login: after fetching the user doc, read `tokenVersion` and pass to `generateToken()`.
- Register: write `tokenVersion: 0` on user creation, pass to `generateToken()`.
- No other token issuance paths exist currently.

## Non-Functional Requirements

- **Performance:** one extra `findOne` per authenticated request. Acceptable — MongoDB is
  already queried in most handlers, and the users collection is small.
- **Correctness:** the DB check must happen before the handler runs — enforced by the wrapper.
- **Safety:** mismatch returns 401 with no distinguishing error message.

## Risks / Trade-offs

- Wide mechanical diff; low semantic risk. Run full lint + typecheck + integration tests
  to catch any missed call sites.
