## ADDED Requirements

This document details changes to requirements and is additive to `openspec/changes/add-password-reset-ability/design.md`.

### Requirement: ADDED POST /api/auth/password/forgot endpoint

The system SHALL accept a forgot-password request, return an identical response for known and unknown email addresses, and fire off a reset email asynchronously when the email is registered.

#### Scenario: Known email returns generic 200

- **Given** an email address that matches a registered user
- **When** `POST /api/auth/password/forgot` is called with that email
- **Then** the response is 200 with the generic message "If an account with that email exists, a password reset link has been sent."

#### Scenario: Unknown email returns the same generic 200

- **Given** an email address that does not match any registered user
- **When** `POST /api/auth/password/forgot` is called with that email
- **Then** the response is 200 with the same generic message (no user enumeration)

#### Scenario: Invalid email format returns 400

- **Given** a malformed email address
- **When** `POST /api/auth/password/forgot` is called
- **Then** the response is 400 with a validation error

#### Scenario: Rate limit exceeded returns 429

- **Given** the caller has exceeded the forgot-endpoint rate limit for their IP or email
- **When** `POST /api/auth/password/forgot` is called
- **Then** the response is 429

#### Scenario: Known email triggers async token generation and email send

- **Given** a registered user's email address
- **When** `POST /api/auth/password/forgot` is called and a 200 is returned
- **Then** a reset token document is present in `password_reset_tokens` for that user's `userId`

---

### Requirement: ADDED POST /api/auth/password/reset endpoint

The system SHALL accept a reset-password request, validate the token and new password, atomically update the password and invalidate all existing sessions, then consume the token.

#### Scenario: Valid token and strong password returns 200

- **Given** a valid unexpired unconsumed reset token and a password meeting strength requirements
- **When** `POST /api/auth/password/reset` is called with `{ token, password }`
- **Then** the response is 200 and the user's password is updated in the DB

#### Scenario: Successful reset invalidates existing sessions

- **Given** a user has an active JWT session
- **When** `POST /api/auth/password/reset` succeeds for that user
- **Then** subsequent requests using the old JWT are rejected with 401

#### Scenario: Old password no longer works after reset

- **Given** a successful password reset
- **When** the user attempts to log in with the old password
- **Then** login fails; the new password succeeds

#### Scenario: Expired token returns 400

- **Given** a reset token whose `expiresAt` is in the past
- **When** `POST /api/auth/password/reset` is called
- **Then** the response is 400 with a safe error message (no token details leaked)

#### Scenario: Consumed token returns 400 (prevents replay)

- **Given** a reset token that has already been used (`consumedAt` set)
- **When** `POST /api/auth/password/reset` is called with the same token
- **Then** the response is 400

#### Scenario: Invalid or malformed token returns 400

- **Given** a token string that does not match any document in the DB
- **When** `POST /api/auth/password/reset` is called
- **Then** the response is 400

#### Scenario: Weak password returns 400

- **Given** a valid reset token but a password that fails strength validation
- **When** `POST /api/auth/password/reset` is called
- **Then** the response is 400 with validation details from `validatePassword`

#### Scenario: Rate limit exceeded returns 429

- **Given** the caller has exceeded the reset-endpoint rate limit for their IP
- **When** `POST /api/auth/password/reset` is called
- **Then** the response is 429

## MODIFIED Requirements

None — this change is additive only.

## REMOVED Requirements

None.

## Traceability

- Anti-enumeration (D4 + D7) → same-response scenarios for known/unknown email
- Atomic reset (D5 + D6) → session invalidation + old-password-fails scenarios
- Rate limiting (D4) → 429 scenarios
- Input validation (D-A4) → 400 scenarios

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: No timing oracle on forgot endpoint

- **Given** known and unknown email requests
- **When** both are processed
- **Then** both responses are returned at the same logical code point (after a single indexed DB lookup), with email send happening asynchronously after the response

### Requirement: Reliability

#### Scenario: Email send failure does not affect 200 response

- **Given** the Mailtrap service is unavailable
- **When** `POST /api/auth/password/forgot` is called with a known email
- **Then** the response is still 200; the error is logged server-side
