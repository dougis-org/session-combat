## GitHub Issues

- dougis-org/session-combat#207 (this change)
- Unblocks: dougis-org/session-combat#208 (add-password-reset-ability)

## Why

- Password reset requires the ability to invalidate active sessions after a credential change.
- Current JWT auth has no server-side revocation: a compromised or changed password does not
  expire outstanding tokens for up to 7 days.
- Adding `tokenVersion` to the User document and JWT payload closes this gap and is a prerequisite
  for `add-password-reset-ability`.

## Problem Space

- **Current behavior:** JWTs are stateless and valid until expiry (7 days). No mechanism exists
  to invalidate a session after a password change or security event.
- **Desired behavior:** any security-sensitive operation (password reset, future: forced logout,
  account suspension) can atomically invalidate all outstanding sessions by incrementing
  `tokenVersion` on the User document.
- **Constraints:** solution must not require a distributed session store; must be compatible with
  existing `withAuth` / `withAuthAndParams` wrappers; must add only one DB read per authenticated
  request.

## Scope

### In Scope

- Add `tokenVersion: number` to `User` interface and `AuthPayload` interface.
- Update `generateToken()` to include `tokenVersion` in the JWT payload.
- Make `withAuth` and `withAuthAndParams` wrappers perform an async DB lookup to verify
  `tokenVersion` matches the user document before granting access.
- Migrate all direct `requireAuth` / `verifyAuth` callers to use the wrappers.
- Update login route to read `tokenVersion` from the user doc when issuing a token.
- Update register route to write `tokenVersion: 0` on user creation.

### Out of Scope

- The password reset flow itself (tracked in `add-password-reset-ability`).
- Forced logout or admin-driven session revocation UI.
- Distributed/Redis-backed session store.

## What Changes

- `lib/types.ts` — `User` and `AuthPayload` gain `tokenVersion: number`.
- `lib/auth.ts` — `generateToken()` includes `tokenVersion`.
- `lib/middleware.ts` — `withAuth` / `withAuthAndParams` do async DB `tokenVersion` check;
  `requireAuth` / `verifyAuth` are deprecated in favour of the wrappers.
- `app/api/auth/login/route.ts` — passes `tokenVersion` to `generateToken()`.
- `app/api/auth/register/route.ts` — writes `tokenVersion: 0`, passes to `generateToken()`.
- All ~35 direct `requireAuth` / `verifyAuth` call sites migrated to wrappers.

## Risks

- Adding a DB read per authenticated request increases latency slightly; acceptable given
  MongoDB is already queried per request in most handlers.
- Wide diff across many route files increases merge conflict risk; mitigated by landing this
  before any parallel feature branches touch the same routes.

## Non-Goals

- Changing JWT expiry duration.
- Adding refresh token infrastructure.
