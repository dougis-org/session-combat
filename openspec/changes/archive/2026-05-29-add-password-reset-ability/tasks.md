# Tasks

## Prerequisites

- [x] `session-invalidation-foundation` change merged (tokenVersion auth, withAuth migration)

## Design completion

- [x] Define secure forgot-password and reset-password flow
- [x] Define token storage and lifecycle model
- [x] Define abuse protections and privacy constraints
- [x] Define requirement/spec deltas and validation expectations
- [x] Resolve email provider: Mailtrap.io (`mailtrap` npm SDK)
- [x] Resolve rate limiter backing store: in-memory Map + TTL (single instance)
- [x] Resolve session invalidation strategy: tokenVersion on User (D6, tracked in session-invalidation-foundation)

## Implementation

- [x] Add in-memory rate limiter module (`lib/rate-limit.ts`)
- [x] Add Mailtrap email sender module (`lib/email.ts`)
- [x] Add reset token storage helpers (`lib/reset-tokens.ts`): generate, hash, store, validate, consume
- [x] Add `POST /api/auth/password/forgot` endpoint
- [x] Add `POST /api/auth/password/reset` endpoint (increments tokenVersion on success)
- [x] Add forgot-password UI page (`app/forgot-password/page.tsx`)
- [x] Add reset-password UI page (`app/reset-password/page.tsx`)

## Tests and validation

- [x] Unit tests: token lifecycle (TTL expiry, consumed token, hash-only storage)
- [x] Unit tests: forgot endpoint returns identical body for known vs unknown email
- [x] Integration tests: full reset flow, session invalidation, rate limiting
- [x] Validate with lint / unit / integration / typecheck
