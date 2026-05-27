## Context

- Infrastructure modules (`lib/rate-limit.ts`, `lib/email.ts`, `lib/reset-tokens.ts`) available from Part 1 (#265).
- Existing auth: JWT cookies via `lib/auth.ts`; `withAuth` middleware; `tokenVersion` on User (from #207).
- Parent design decisions (D1–D7) in `openspec/changes/add-password-reset-ability/design.md`.

## Goals / Non-Goals

### Goals

- Implement the two reset endpoints that form the security-critical core of the password reset flow.
- Ensure no user enumeration, timing oracle, or token-reuse vulnerability.

### Non-Goals

- UI pages (Part 3 — `password-reset-ui`).
- Changes to infrastructure libs (Part 1 — `password-reset-infrastructure`).
- Retry logic for email delivery.

## Decisions

### D-A1: Forgot endpoint response timing — fire-and-forget email send

- **Chosen:** Return 200 immediately after `findOne({ email })`. If user found, `generateAndSendResetEmail()` runs without `await` with `.catch(err => console.error(...))`.
- **Alternatives considered:** Await email send before responding; add artificial delay.
- **Rationale:** Both known and unknown email paths execute the same indexed `findOne` and return at the same code point — no timing oracle (parent D7).
- **Trade-offs:** Email send failure is silent to the caller. Logged via `.catch`.

### D-A2: Reset endpoint — atomic password + tokenVersion + consumeResetToken

- **Chosen:** Single `updateOne` that sets `passwordHash`, increments `tokenVersion`, and sets `updatedAt`. Then `consumeResetToken(tokenHash)` in a second call.
- **Alternatives considered:** Transaction wrapping both writes.
- **Rationale:** MongoDB transactions add complexity; the risk window between the two operations is narrow and non-exploitable (consumed token check happens first in `validateResetToken`).
- **Trade-offs:** Tiny non-atomic gap between password update and token consume. Acceptable per parent design D3.

### D-A3: Rate limiting keys

- **Chosen:** Forgot endpoint: `ip:${ip}` and `email:${normalizedEmail}`. Reset endpoint: `ip:${ip}` only.
- **Rationale:** Forgot is the high-abuse surface (email enumeration, spam). Reset tokens are already one-time-use and short-lived.
- **Trade-offs:** Reset endpoint could still be brute-forced for token format — mitigated by 256-bit token entropy (D-I3).

### D-A4: Input validation — reuse existing validators

- **Chosen:** Reuse `validateEmail` from `lib/auth.ts` for forgot; `validatePassword` for reset.
- **Rationale:** Consistency with existing auth endpoints; single source of validation logic.
- **Trade-offs:** None.

### D-A5: Route location — Next.js App Router

- **Chosen:** `app/api/auth/password/forgot/route.ts` and `app/api/auth/password/reset/route.ts`.
- **Rationale:** Follows existing API route conventions in the project.
- **Trade-offs:** None.

## Proposal to Design Mapping

- Anti-enumeration (D4 + D7) → D-A1 (fire-and-forget, same response for known/unknown).
- Atomic reset with session invalidation (D5 + D6) → D-A2.
- Abuse protection → D-A3 (rate limit keys).
- Input validation → D-A4.

## Functional Requirements Mapping

- Forgot: identical 200 for known and unknown email → D-A1.
- Forgot: 400 on invalid email format → D-A4.
- Forgot: 429 on rate limit exceeded → D-A3.
- Reset: 400 on expired/consumed/unknown token → `validateResetToken` from Part 1.
- Reset: 400 on weak password → D-A4.
- Reset: 200 + password updated + sessions invalidated → D-A2.

## Non-Functional Requirements Mapping

- **Security:** No timing oracle (D-A1); one-time tokens; tokenVersion invalidates sessions.
- **Reliability:** Atomic password+tokenVersion update prevents partial state.
- **Operability:** Email failures logged; rate limit exceeded returns 429 with clear message.

## Risks / Trade-offs

- Non-atomic gap between password update and token consume (D-A2) — narrow, acceptable.
- Silent email failure — logged, does not affect 200 response (by design, D7).

## Rollback / Mitigation

- Rollback trigger: security finding in endpoint logic.
- Rollback steps: remove `app/api/auth/password/forgot/route.ts` and `app/api/auth/password/reset/route.ts`.
- Data migration: none; tokens in DB are harmless without the endpoints.
- Verification after rollback: integration tests for endpoints return 404.

## Operational Blocking Policy

- If CI checks fail: fix, commit, push; do not merge with failing checks.
- If security checks fail: remediate before merge.
- If required reviews are blocked/stale: escalate to maintainer within 24 h.

## Open Questions

- None — all decisions resolved in parent design or above.
