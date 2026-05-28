## GitHub Issue

- dougis-org/session-combat#266 (this change — Part 2 of 3)
- Parent: dougis-org/session-combat#208 (full password reset feature)
- Prerequisite: dougis-org/session-combat#265 (password-reset-infrastructure)

## Why

With the rate limiter, email sender, and token store in place, the two
password reset API endpoints can be implemented. These are the security-critical
pieces of the flow — correct handling of the forgot/reset contract determines
whether the feature is safe to ship.

## Problem Space

- `POST /api/auth/password/forgot` must return an identical response for known
  and unknown emails, with no timing oracle (D7 — async fire-and-forget send).
- `POST /api/auth/password/reset` must atomically consume the token and
  increment `tokenVersion` so existing sessions are immediately invalidated.

## Scope

### In Scope

- `app/api/auth/password/forgot/route.ts`
- `app/api/auth/password/reset/route.ts`
- Integration tests for both endpoints (full reset flow, edge cases, rate limits).

### Out of Scope

- UI pages (Part 3 — #267).
- Changes to the infrastructure libs (Part 1 — #265).

## Key Design Decisions (from add-password-reset-ability design.md)

**D4 + D7 — Forgot endpoint anti-enumeration:**
```
1. Validate email format → 400
2. Rate limit (IP + email) → 429
3. findOne({ email })            ← same indexed cost known/unknown
4. Return 200 immediately        ← response sent before any email work
5. If user found: fire-and-forget sendPasswordResetEmail()
```
Response message: "If an account with that email exists, a password reset link has been sent."

**D3 + D5 + D6 — Reset endpoint:**
```
1. Validate inputs → 400
2. Rate limit (IP) → 429
3. validateResetToken(token) → 400 on invalid/expired/consumed
4. validatePassword(password) → 400 on weak password
5. Atomically: update passwordHash + increment tokenVersion + consumeResetToken
6. Return 200
```

## Risks

- Non-atomic update between password and tokenVersion could leave a window where
  old sessions still work. Must use a single `updateOne` that sets both fields.
- Silent email failure (Mailtrap down) should log but not affect the 200 response.

## Non-Goals

- Retry logic for email delivery failures.
- Audit log beyond console error logging.

## Change Control

Design reference: `openspec/changes/add-password-reset-ability/design.md` (D1–D7).
