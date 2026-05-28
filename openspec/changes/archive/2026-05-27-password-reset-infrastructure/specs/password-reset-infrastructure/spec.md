## ADDED Requirements

This document details changes to requirements and is additive to `openspec/changes/add-password-reset-ability/design.md`.

### Requirement: ADDED Rate limiting infrastructure

The system SHALL reject callers that exceed a configured request threshold within a time window, returning a 429-class error.

#### Scenario: Requests under threshold are allowed

- **Given** a rate-limit key has made fewer calls than the configured limit within the window
- **When** `checkRateLimit(key, limit, windowMs)` is called
- **Then** the function returns without throwing

#### Scenario: Request at or over threshold is rejected

- **Given** a rate-limit key has reached the configured call limit within the current window
- **When** `checkRateLimit(key, limit, windowMs)` is called
- **Then** a `RateLimitError` is thrown with `status === 429`

#### Scenario: Window expiry resets counter

- **Given** a key has reached the limit within a window
- **When** the window duration has elapsed and `checkRateLimit` is called again
- **Then** the call succeeds (counter reset)

#### Scenario: Distinct keys do not share counts

- **Given** two different rate-limit keys
- **When** one key reaches its limit
- **Then** calls with the other key are not affected

---

### Requirement: ADDED Email delivery infrastructure

The system SHALL send a password reset email containing the reset URL to the specified recipient.

#### Scenario: Successful email send

- **Given** `MAILTRAP_TOKEN` is set in the environment
- **When** `sendPasswordResetEmail(to, resetUrl)` is called
- **Then** the Mailtrap SDK `send` method is invoked with the recipient's address, a password-related subject, and the reset URL in both html and text bodies

#### Scenario: Missing API token raises a configuration error

- **Given** `MAILTRAP_TOKEN` is not set
- **When** `sendPasswordResetEmail` is called
- **Then** an error referencing `MAILTRAP_TOKEN` is thrown before any send attempt

---

### Requirement: ADDED Reset token lifecycle

The system SHALL generate, store, validate, and consume one-time password reset tokens.

#### Scenario: Token generation produces unique, high-entropy values

- **Given** `generateResetToken()` is called twice in succession
- **When** both results are compared
- **Then** they are different 64-character hex strings

#### Scenario: Token hashing is deterministic

- **Given** the same raw token string
- **When** `hashToken` is called twice
- **Then** both calls return the same output, and the output does not equal the input

#### Scenario: Storing a second token for the same user invalidates the first

- **Given** `storeResetToken(userId, hashA)` has been called
- **When** `storeResetToken(userId, hashB)` is called
- **Then** prior token documents for the same `userId` are deleted before the new token is inserted

#### Scenario: Expired token is rejected

- **Given** a token document exists with `expiresAt` in the past
- **When** `validateResetToken(rawToken)` is called
- **Then** an error indicating the token has expired is thrown

#### Scenario: Consumed token is rejected

- **Given** a token document exists with `consumedAt` set
- **When** `validateResetToken(rawToken)` is called
- **Then** an error indicating the token has already been used is thrown

#### Scenario: Unknown token is rejected

- **Given** no token document matching the hash exists in the DB
- **When** `validateResetToken(rawToken)` is called
- **Then** an error indicating the token is invalid is thrown

#### Scenario: Valid token returns userId

- **Given** a token document exists with `expiresAt` in the future and no `consumedAt`
- **When** `validateResetToken(rawToken)` is called
- **Then** the associated `userId` string is returned

#### Scenario: Token consumption sets consumedAt

- **Given** a token document identified by `tokenHash`
- **When** `consumeResetToken(tokenHash)` is called
- **Then** `updateOne` is called with `{ $set: { consumedAt: <Date> } }` on the matching document

---

### Requirement: ADDED DB index for token lookup

The system SHALL maintain a unique index on `password_reset_tokens.tokenHash` to support O(1) token lookup.

#### Scenario: Index created on DB initialization

- **Given** `initializeDatabase()` is called
- **When** the function completes
- **Then** a unique index on `{ tokenHash: 1 }` exists on the `password_reset_tokens` collection

## MODIFIED Requirements

None — this change is additive only.

## REMOVED Requirements

None.

## Traceability

- Proposal (rate limiting) → D-I1 → `checkRateLimit` tests
- Proposal (email delivery) → D-I2 → `sendPasswordResetEmail` tests
- Proposal (token lifecycle) → D-I3, D-I4 → `generateResetToken`, `hashToken`, `storeResetToken`, `validateResetToken`, `consumeResetToken` tests
- Proposal (DB index) → `initializeDatabase()` change

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Raw token never stored

- **Given** `storeResetToken(userId, tokenHash)` is called
- **When** the DB write completes
- **Then** the stored document contains only the SHA-256 hash, not the raw token

### Requirement: Reliability

#### Scenario: storeResetToken is idempotent per user

- **Given** `storeResetToken` has been called for a user
- **When** it is called again for the same user
- **Then** only one active token document exists for that user
