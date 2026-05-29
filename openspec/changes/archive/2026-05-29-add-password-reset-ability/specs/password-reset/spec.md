# password-reset Specification

This document details additive requirements for secure password reset.

## ADDED Requirements

### Requirement: ADDED forgot-password endpoint returns generic response

The system SHALL expose a forgot-password endpoint that returns the same
success response for both known and unknown emails.

#### Scenario: Known email request

- **Given** a registered user email
- **When** `POST /api/auth/password/forgot` is called
- **Then** response is 200 with generic success message

#### Scenario: Unknown email request

- **Given** an email not in the system
- **When** `POST /api/auth/password/forgot` is called
- **Then** response is 200 with the same generic success message

---

### Requirement: ADDED reset tokens are hashed, expiring, and one-time

The system SHALL issue reset tokens that are cryptographically random, stored as
hashes, expire after 15 minutes, and can only be consumed once.

#### Scenario: Valid token can reset password once

- **Given** a valid unexpired reset token
- **When** `POST /api/auth/password/reset` is called with a strong password
- **Then** password is updated and token is marked consumed

#### Scenario: Reused token is rejected

- **Given** a token previously consumed
- **When** `POST /api/auth/password/reset` is called again with same token
- **Then** request is rejected as invalid token

#### Scenario: Expired token is rejected

- **Given** a token older than TTL
- **When** `POST /api/auth/password/reset` is called
- **Then** request is rejected as invalid token

---

### Requirement: ADDED reset endpoints are protected from abuse

The system SHALL apply rate limits to forgot/reset endpoints by IP and account
identifier to reduce abuse risk.

#### Scenario: Excess forgot requests are throttled

- **Given** repeated forgot requests above threshold
- **When** client continues requests
- **Then** endpoint returns throttle response

#### Scenario: Excess reset attempts are throttled

- **Given** repeated reset attempts above threshold
- **When** client continues requests
- **Then** endpoint returns throttle response

---

### Requirement: ADDED successful reset invalidates active sessions

The system SHALL invalidate existing sessions/tokens for the account after a
successful password reset.

#### Scenario: Existing session revoked after reset

- **Given** user has an active authenticated session
- **When** password reset succeeds
- **Then** subsequent authenticated request with old session is rejected
