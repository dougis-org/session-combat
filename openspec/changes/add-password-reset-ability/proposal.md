## GitHub Issues

- dougis-org/session-combat#208 (this change)
- Prerequisite: dougis-org/session-combat#207 (session-invalidation-foundation)
- Related: dougis-org/session-combat#197

## Why

- Users who forget their password currently have no recovery path.
- This blocks account access and increases support burden.
- A secure reset flow reduces account lockout while preserving account security.

## Problem Space

- **Current behavior:** users can register/login/logout, but cannot reset forgotten passwords.
- **Desired behavior:** users can request a reset link, receive a short-lived one-time token, and set a new password securely.
- **Constraints:** no user enumeration leaks; reset tokens must be one-time and expire quickly; all reset operations must be auditable and rate-limited.
- **Edge cases:** expired token, reused token, invalid token format, unknown email, repeated reset attempts, concurrent reset requests.

## Scope

### In Scope

- Design secure forgot-password and reset-password API behavior.
- Design storage model for reset tokens (hashed token, expiry, consumed timestamp).
- Define UI flow for request-reset and set-new-password pages.
- Define validation, error handling, and abuse protections (rate limits, generic responses).
- Define test plan and implementation tasks.

### Out of Scope

- Actual endpoint/page implementation in this change.
- SMS-based or multi-channel password recovery.
- Full account lockout/captcha system beyond reset-specific controls.

## What Changes

- Add a new OpenSpec change with proposal/design/tasks/spec/test planning artifacts.
- Specify prerequisites that must be implemented first (email delivery and rate limiting foundation).

## Risks

- Misconfigured email delivery could prevent users from receiving reset links.
- Weak token handling could allow account takeover.
- Inadequate rate limiting could enable abuse or denial-of-service.

## Open Questions

- Which email provider/service should be used for production delivery?
- Where should rate-limit state live for multi-instance deployments?

## Non-Goals

- Social login recovery.
- Admin-driven manual password reset workflow.

## Change Control

If requirements change, update `proposal.md`, `design.md`, `specs/**/*.md`,
and `tasks.md` before implementation begins.
