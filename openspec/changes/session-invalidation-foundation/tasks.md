# Tasks

## Implementation

- [ ] Add `tokenVersion: number` to `User` and `AuthPayload` interfaces in `lib/types.ts`
- [ ] Update `generateToken()` in `lib/auth.ts` to accept and include `tokenVersion` in payload
- [ ] Add async `tokenVersion` DB check inside `withAuth` and `withAuthAndParams` in `lib/middleware.ts`
- [ ] Mark `requireAuth` and `verifyAuth` as `@deprecated` in `lib/middleware.ts`
- [ ] Update login route (`app/api/auth/login/route.ts`) to read `tokenVersion` from user doc
- [ ] Update register route (`app/api/auth/register/route.ts`) to write `tokenVersion: 0` and pass to `generateToken()`
- [ ] Migrate all ~35 direct `requireAuth` / `verifyAuth` callers to `withAuth` / `withAuthAndParams`

## Validation

- [ ] Lint passes
- [ ] TypeScript typecheck passes
- [ ] Unit tests pass
- [ ] Integration tests pass (all auth-protected routes still work)
- [ ] Manual smoke test: reset tokenVersion in DB, verify old JWT is rejected
