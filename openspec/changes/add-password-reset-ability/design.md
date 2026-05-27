## Context

- Existing auth uses JWT cookies, MongoDB, and password hashing via `bcryptjs`.
- No current recovery flow exists.
- Password policy validation already exists and should be reused for reset.

## Goals / Non-Goals

### Goals

- Provide a secure password reset design with minimal information leakage.
- Ensure tokens are one-time use, short-lived, and non-recoverable if DB is leaked.
- Keep implementation aligned with existing auth patterns.

### Non-Goals

- Implementing the flow in this change.
- Adding new auth factors.

## Decisions

### D1: Two-endpoint reset flow

- `POST /api/auth/password/forgot` accepts email and always returns a generic success message.
- `POST /api/auth/password/reset` accepts `{ token, password }` and updates password if token is valid.

### D2: Token generation and storage

- Generate a cryptographically strong random token (32+ bytes).
- Store only a SHA-256 hash of token in `password_reset_tokens` collection.
- Store `{ userId, tokenHash, expiresAt, consumedAt?, createdAt }`.
- Never store raw token in DB or logs.

### D3: Token lifecycle and validity

- Token TTL: 15 minutes.
- New forgot request **deletes** all prior token documents for the same user before inserting the new one (no audit trail; keeps the collection lean).
- Reset consumes token atomically (`consumedAt` set in same update path as password change).
- Expired/consumed/unknown tokens return generic invalid-token error.

### D4: Abuse protection and privacy

- Forgot endpoint always returns 200 with same response body regardless of email existence.
- Rate limit by IP and by normalized email on forgot/reset endpoints.
- Add short cooldown between forgot requests per account.
- Emit security logs/metrics without PII-rich payloads.

### D5: Password update semantics

- Reuse existing password strength validator.
- Hash new password with existing bcrypt settings.
- Invalidate all prior auth sessions/tokens for user after successful reset via `tokenVersion` increment (Option A).

### D6: Session invalidation via tokenVersion

- Add `tokenVersion: number` field to User document (default `0`).
- Include `tokenVersion` in JWT payload at issue time.
- Auth middleware rejects any JWT whose `tokenVersion` does not match the current value in the DB.
- On successful password reset, atomically increment `tokenVersion` alongside the password hash update.
- Cost: one extra DB read per authenticated request. Accepted trade-off for correct revocation semantics.

## Functional Requirements Mapping

- Forgot password request with valid email format returns generic success.
- Unknown email also returns generic success.
- Valid reset token + strong password updates password and consumes token.
- Invalid/expired/consumed token fails reset with safe error.
- Reset success revokes current sessions.

## Non-Functional Requirements Mapping

- **Security:** no user enumeration, one-time tokens, short expiry, hashed token storage.
- **Reliability:** atomic consume-and-reset operation prevents token reuse race.
- **Operability:** reset events are observable via structured logs/metrics.

## Risks / Trade-offs

- Session invalidation requires consistent token/session strategy across auth checks.
- Rate limiting in-memory only may be insufficient for horizontal scaling.

## Rollback / Mitigation

- Feature-flag password reset routes/pages.
- If incident occurs, disable reset endpoints and purge outstanding reset tokens.

### D7: Forgot-endpoint timing safety (anti-enumeration)

- The forgot endpoint performs `findOne({ email })` before deciding whether to send an email.
- The 200 response is returned **immediately after the DB lookup** — before any email work begins.
- If the user exists, `generateAndSendResetEmail()` is fired without `await` (fire-and-forget), with `.catch(err => console.error(...))` for silent failure logging.
- Both branches (known / unknown email) return the response at the same code point, after the same single indexed `findOne`. No timing oracle.
- Response message: `"If an account with that email exists, a password reset link has been sent."`
- Works correctly on Fly.io: long-lived Node.js process means the background Promise continues in the event loop after response is returned; the machine will not auto-stop mid-request.

## Resolved Decisions

- **Email provider:** Mailtrap.io (official Node.js SDK: `mailtrap`). Use the Email Sending API for production delivery.
- **Rate limiter backing store:** In-memory (`Map` + TTL). Acceptable for current single-instance deployment. Document as a known limitation in `lib/rate-limit.ts`. Note: `auto_stop_machines = 'stop'` in `fly.toml` means rate-limit state is wiped on cold start — risk window is narrow at current scale.
- **DB index for reset tokens:** Unique index on `tokenHash` only, added in `lib/db.ts` `initializeDatabase()`. No TTL index — expiry enforced in application logic via `expiresAt` checks.
- **Forgot-endpoint timing:** Async fire-and-forget email send after immediate response (D7). Eliminates timing oracle between known and unknown email paths.
