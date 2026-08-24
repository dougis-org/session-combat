## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-23-fix-password-reset-emails/design.md) document, not a replacement.

### Requirement: ADDED Missing Configuration Logging

The system SHALL log a warning when `MAILTRAP_TOKEN` is missing, but MUST NOT fail the request.

#### Scenario: Mailtrap config missing

- **Given** a valid user requests a password reset
- **And** the `MAILTRAP_TOKEN` environment variable is not set
- **When** the server processes the request
- **Then** the server MUST log a warning message about the missing token
- **And** the server MUST return a 200 OK generic message

## MODIFIED Requirements

### Requirement: MODIFIED Guaranteed Execution of Background Email Promise

The system SHALL await the token generation and email sending promises before completing the HTTP request.

#### Scenario: Valid password reset request

- **Given** an existing user email address
- **When** the user submits the forgot password form
- **Then** the system MUST successfully insert the reset token in the DB
- **And** the system MUST successfully send the email to the Mailtrap API
- **And** the API MUST return a 200 OK only *after* these background tasks complete

### Requirement: MODIFIED Anti-Enumeration Dummy Delay

The system SHALL perform a dummy hash and delay operation for non-existent users to match the response time of existing users.

#### Scenario: Non-existent user request

- **Given** a non-existent email address is provided
- **When** the user submits the forgot password form
- **Then** the API MUST perform a dummy hashing operation
- **And** the API MUST return a 200 OK response with a timing indistinguishable from a successful request

### Requirement: MODIFIED Case-Insensitive Email Lookup

The system SHALL lookup user emails case-insensitively during password reset requests.

#### Scenario: Mismatched casing

- **Given** a user is registered with `TestUser@example.com`
- **When** they request a password reset for `testuser@example.com`
- **Then** the system MUST find the user and send the password reset email

## REMOVED Requirements

N/A

## Traceability

- Proposal element -> Requirement:
  - Fix early termination of background email promise -> MODIFIED Guaranteed Execution of Background Email Promise
  - Update email lookup to be case-insensitive -> MODIFIED Case-Insensitive Email Lookup
  - Add clearer logging when Mailtrap fails -> ADDED Missing Configuration Logging
- Design decision -> Requirement:
  - Decision 1 (Await Email and Dummy Delay) -> MODIFIED Guaranteed Execution of Background Email Promise, MODIFIED Anti-Enumeration Dummy Delay
  - Decision 2 (Case-Insensitive Query) -> MODIFIED Case-Insensitive Email Lookup
  - Decision 3 (Explicit Mailtrap Check) -> ADDED Missing Configuration Logging
- Requirement -> Task(s): TBD in `tasks.md`

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Response Latency Budget

- **Given** the forgot password route is being called
- **When** the server processes the request (including the dummy delay or real email send)
- **Then** the 95th percentile latency MUST remain under 1500ms to avoid Heroku/Vercel timeout limits

### Requirement: Security

#### Scenario: Anti-enumeration

See functional scenario: Non-existent user request (Anti-Enumeration Dummy Delay)

### Requirement: Reliability

#### Scenario: Mailtrap Service Down

- **Given** Mailtrap is returning 5xx errors
- **When** a valid user requests a password reset
- **Then** the system MUST catch the error and log it
- **And** the system MUST still return a 200 OK to the user (preventing 500 error leakage)
