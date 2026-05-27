---
name: tests
description: Test plan for password-reset-infrastructure
---

# Tests

## Scope

Unit tests only. No HTTP layer, no DB container required for this change.
MongoDB interactions in `reset-tokens.ts` can use an in-memory mock or a
real test DB (follow existing pattern in `tests/unit/`).

## Planned test cases

### `lib/rate-limit.ts`
- [ ] Unit: requests under threshold are allowed.
- [ ] Unit: request at threshold is rejected with appropriate error/response.
- [ ] Unit: counter resets after TTL window expires.
- [ ] Unit: separate keys (different IPs) do not share counts.

### `lib/reset-tokens.ts`
- [ ] Unit: `generateResetToken()` returns a 64-character hex string.
- [ ] Unit: two successive calls return different values (randomness check).
- [ ] Unit: `hashToken(token)` is deterministic — same input, same output.
- [ ] Unit: `hashToken(token)` output does not equal input (not identity function).
- [ ] Unit: `validateResetToken()` throws for a token hash not found in the database (unknown token).
- [ ] Unit: `validateResetToken()` throws for a token whose `expiresAt` is in the past.
- [ ] Unit: `validateResetToken()` throws for a token with `consumedAt` set.
- [ ] Unit: `validateResetToken()` returns `userId` for a valid unexpired unconsumed token.
- [ ] Unit: `storeResetToken()` called twice for same `userId` — first token is invalidated.
- [ ] Unit: `consumeResetToken()` sets `consumedAt`; subsequent `validateResetToken()` throws.

### `lib/email.ts`
- [ ] Unit: `sendPasswordResetEmail()` calls Mailtrap SDK with correct `to`, `subject`, and reset URL.
- [ ] Unit: missing env var (`MAILTRAP_TOKEN`) causes a clear configuration error, not a silent failure.
