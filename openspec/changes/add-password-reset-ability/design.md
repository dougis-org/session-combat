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
- New forgot request invalidates prior active tokens for same user.
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
- Invalidate all prior auth sessions/tokens for user after successful reset.

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

## Open Questions

- Final provider choice and sender identity for reset emails.
- Preferred rate limiter backing store (memory vs Redis-like store).
