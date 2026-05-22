# Tasks

## Prerequisites (must be created and resolved first)

- [ ] Create GitHub issue: transactional email provider integration for auth notifications
- [ ] Create GitHub issue: reusable API rate-limiting middleware/store for auth-sensitive endpoints
- [ ] Confirm prerequisite issues are implemented or accepted for parallel delivery

## Design completion

- [x] Define secure forgot-password and reset-password flow
- [x] Define token storage and lifecycle model
- [x] Define abuse protections and privacy constraints
- [x] Define requirement/spec deltas and validation expectations

## Implementation plan (deferred intentionally)

- [ ] Add `POST /api/auth/password/forgot` endpoint
- [ ] Add `POST /api/auth/password/reset` endpoint
- [ ] Add password reset token storage helpers and TTL/index management
- [ ] Add reset request and reset submit UI pages
- [ ] Add unit + integration tests for token lifecycle, privacy responses, and session invalidation
- [ ] Validate with lint/unit/integration/typecheck

## Stop condition for this issue execution

- [x] Do not implement beyond design phase until prerequisite issues are created and acknowledged
