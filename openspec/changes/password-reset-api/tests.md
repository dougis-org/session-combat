---
name: tests
description: Test plan for password-reset-api
---

# Tests

## Scope

Integration tests against a real test database (follow pattern in
`tests/integration/auth.test.helpers.ts`). Both endpoints tested end-to-end.

## Planned test cases

### `POST /api/auth/password/forgot`
- [ ] Integration: unknown email returns 200 with generic message (no token created).
- [ ] Integration: known email returns 200 with same generic message; token row exists in DB.
- [ ] Integration: invalid email format returns 400.
- [ ] Integration: missing email body returns 400.
- [ ] Integration: rate limit — N+1 request returns 429.

### `POST /api/auth/password/reset`
- [ ] Integration: valid token + strong password → 200; `passwordHash` updated in DB.
- [ ] Integration: valid token + strong password → token `consumedAt` set in DB.
- [ ] Integration: valid token + strong password → `tokenVersion` incremented in DB.
- [ ] Integration: old JWT rejected with 401 after successful reset.
- [ ] Integration: login with new password succeeds after reset.
- [ ] Integration: login with old password fails after reset.
- [ ] Integration: expired token → 400 with safe error message.
- [ ] Integration: consumed token (second use) → 400 with safe error message.
- [ ] Integration: invalid/random token → 400 with safe error message.
- [ ] Integration: weak password → 400 with `details` array.
- [ ] Integration: missing token → 400.
- [ ] Integration: missing password → 400.
- [ ] Integration: rate limit — N+1 reset attempt returns 429.
