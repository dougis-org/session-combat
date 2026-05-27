## Context

- Auth: JWT cookies, MongoDB, bcryptjs password hashing (`lib/auth.ts`).
- No email sending or rate limiting infrastructure exists yet.
- No token lifecycle exists yet.
- Parent design decisions (D1–D7) live in `openspec/changes/add-password-reset-ability/design.md`.

## Goals / Non-Goals

### Goals

- Implement the three library modules (rate-limit, email, reset-tokens) that the API endpoints (Part 2) and UI (Part 3) depend on.
- Add the DB index that makes token lookup O(1).

### Non-Goals

- API endpoints (Part 2 — `password-reset-api`).
- UI pages (Part 3 — `password-reset-ui`).
- Redis/MongoDB-backed rate limiting.

## Decisions

### D-I1: Rate limiter — in-memory Map + TTL

- **Chosen:** `Map<string, { count, windowStart }>` keyed by caller-supplied string (IP, normalized email, etc.). Window resets after `windowMs`. Throws `RateLimitError` (status 429) when over threshold.
- **Alternatives considered:** Redis-backed limiter.
- **Rationale:** Single-instance Fly.io deployment; Redis adds operational cost for negligible benefit at current scale.
- **Trade-offs:** State wiped on cold start (`auto_stop_machines = stop`). Documented in `lib/rate-limit.ts`. Acceptable at current scale.

### D-I2: Email sender — Mailtrap official SDK

- **Chosen:** `MailtrapClient` from `mailtrap` npm package. `sendPasswordResetEmail(to, resetUrl)` receives a fully-formed URL; does not read `APP_URL` itself.
- **Alternatives considered:** Nodemailer with SMTP, SendGrid SDK.
- **Rationale:** Mailtrap is the resolved provider (see parent design). Official SDK reduces custom SMTP config.
- **Trade-offs:** Vendor-specific SDK. Migration to another provider requires replacing `lib/email.ts` only.

### D-I3: Token generation — crypto.randomBytes(32)

- **Chosen:** 32-byte crypto-random hex string. Hash stored via SHA-256 (`crypto.createHash`). Raw token never persisted.
- **Alternatives considered:** UUID v4 (lower entropy).
- **Rationale:** 256-bit entropy per parent design D2. Node built-ins; no extra dependency.
- **Trade-offs:** None material.

### D-I4: storeResetToken invalidation strategy — deleteMany before insert

- **Chosen:** Delete all prior token documents for the `userId` before inserting a new one.
- **Alternatives considered:** Upsert on userId (would require compound unique index).
- **Rationale:** Keeps collection lean; no audit trail needed per parent design D3.
- **Trade-offs:** Brief window between delete and insert where no token exists for the user (acceptable — not a critical consistency window).

### D-I5: mailtrap placed in dependencies (not devDependencies)

- **Chosen:** `dependencies` in `package.json`.
- **Alternatives considered:** `devDependencies` (as originally noted in the issue).
- **Rationale:** `sendPasswordResetEmail` is called at runtime in production; the SDK must be present in the deployed bundle.
- **Trade-offs:** Slightly larger production bundle. Correct over the alternative.

## Proposal to Design Mapping

- Rate limiting needed for forgot/reset endpoints → D-I1 (in-memory Map).
- Email delivery for reset links → D-I2 (Mailtrap SDK).
- Token generation, hashing, lifecycle → D-I3, D-I4.
- DB index for O(1) token lookup → unique index on `tokenHash` in `initializeDatabase()`.

## Functional Requirements Mapping

- `checkRateLimit(key, limit, windowMs)` throws `RateLimitError` when over threshold → D-I1.
- `sendPasswordResetEmail(to, resetUrl)` sends via Mailtrap; throws if `MAILTRAP_TOKEN` missing → D-I2.
- `generateResetToken()` returns 64-char hex; `hashToken()` is deterministic and never equals input → D-I3.
- `storeResetToken` invalidates prior tokens for same user → D-I4.
- `validateResetToken` rejects expired, consumed, or unknown tokens → parent D3.
- `consumeResetToken` sets `consumedAt` atomically → parent D3.

## Non-Functional Requirements Mapping

- **Security:** Raw token never stored; SHA-256 hash only. `checkRateLimit` is the abuse surface for the forgot/reset endpoints.
- **Reliability:** `storeResetToken` deletes before insert — no duplicate-token scenario.
- **Operability:** `MAILTRAP_TOKEN` missing throws a clear configuration error at call time.

## Risks / Trade-offs

- In-memory rate limiter reset on cold start — documented in `lib/rate-limit.ts`. Acceptable at current scale.
- Mailtrap misconfiguration silently drops emails — `sendPasswordResetEmail` throws on missing token; fire-and-forget caller in Part 2 logs `.catch`.

## Rollback / Mitigation

- Rollback trigger: email delivery failures or rate-limit bypass discovered.
- Rollback steps: remove `lib/rate-limit.ts`, `lib/email.ts`, `lib/reset-tokens.ts`; revert `lib/db.ts` index addition.
- Data migration: drop `password_reset_tokens` collection.
- Verification after rollback: unit test suite passes; `initializeDatabase()` no longer creates the collection/index.

## Operational Blocking Policy

- If CI checks fail: fix, commit, push; do not merge with failing checks.
- If security checks fail: remediate before merge.
- If required reviews are blocked/stale: escalate to maintainer within 24 h.

## Open Questions

- None — all decisions resolved in parent design.
