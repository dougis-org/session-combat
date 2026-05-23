# Tasks

## Design completion

- [x] Define secure forgot-password and reset-password flow
- [x] Define token storage and lifecycle model
- [x] Define abuse protections and privacy constraints
- [x] Define requirement/spec deltas and validation expectations
- [x] Resolve email provider: Mailtrap.io (`mailtrap` npm SDK)
- [x] Resolve rate limiter backing store: in-memory Map + TTL (single instance)
- [x] Resolve session invalidation strategy: tokenVersion on User (D6)

## Implementation — foundation (D6 pre-work)

These must land before the reset endpoints.

- [ ] Add `tokenVersion: number` to `User` and `AuthPayload` types in `lib/types.ts`
- [ ] Update `generateToken()` in `lib/auth.ts` to include `tokenVersion` in JWT payload
- [ ] Migrate all direct `requireAuth` / `verifyAuth` callers to `withAuth` / `withAuthAndParams` wrappers; add async DB `tokenVersion` check inside wrappers
- [ ] Update login route (`app/api/auth/login/route.ts`) to read `tokenVersion` from user doc and pass to `generateToken()`
- [ ] Update register route (`app/api/auth/register/route.ts`) to write `tokenVersion: 0` on create and pass to `generateToken()`

## Implementation — reset flow

- [ ] Add in-memory rate limiter module (`lib/rate-limit.ts`)
- [ ] Add Mailtrap email sender module (`lib/email.ts`)
- [ ] Add reset token storage helpers (`lib/reset-tokens.ts`): generate, hash, store, validate, consume
- [ ] Add `POST /api/auth/password/forgot` endpoint
- [ ] Add `POST /api/auth/password/reset` endpoint
- [ ] Add forgot-password UI page (`app/forgot-password/page.tsx`)
- [ ] Add reset-password UI page (`app/reset-password/page.tsx`)

## Implementation — tests and validation

- [ ] Add unit tests: token lifecycle (TTL expiry, consumed token, hash-only storage)
- [ ] Add unit tests: forgot endpoint returns identical body for known vs unknown email
- [ ] Add integration tests: full reset flow, session invalidation, rate limiting
- [ ] Validate with lint / unit / integration / typecheck
