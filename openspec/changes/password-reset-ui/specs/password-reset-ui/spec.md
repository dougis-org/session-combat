## ADDED Requirements

This document details changes to requirements and is additive to `openspec/changes/add-password-reset-ability/design.md`.

### Requirement: ADDED Forgot-password page

The system SHALL provide a page at `/forgot-password` where users can request a password reset link by entering their email address.

#### Scenario: Initial state renders email form

- **Given** a user navigates to `/forgot-password`
- **When** the page loads
- **Then** an email input field and a submit button are visible

#### Scenario: Successful submission shows confirmation message

- **Given** the user submits a valid email address
- **When** the API responds with 200
- **Then** the form is replaced with a confirmation message indicating a reset link may have been sent

#### Scenario: Invalid email format shows inline error

- **Given** the user submits a malformed email address
- **When** the API responds with 400
- **Then** an inline validation error is shown without replacing the form

#### Scenario: Rate limit exceeded shows appropriate message

- **Given** the user has exceeded the forgot-endpoint rate limit
- **When** the API responds with 429
- **Then** a "Too many requests. Please wait before trying again." message is shown

#### Scenario: Button disabled and loading indicator shown during submission

- **Given** the form is submitted
- **When** the API response is pending
- **Then** the submit button is disabled and a loading indicator is visible

#### Scenario: Server error shows generic error banner

- **Given** the API responds with a 5xx status
- **When** the response is processed
- **Then** a generic error banner is shown and the form remains available for retry

---

### Requirement: ADDED Reset-password page

The system SHALL provide a page at `/reset-password` where users can set a new password using a one-time token from a reset link.

#### Scenario: Missing token in URL redirects to forgot-password

- **Given** a user navigates to `/reset-password` without a `?token=` query parameter
- **When** the page mounts
- **Then** the user is redirected to `/forgot-password`

#### Scenario: Valid token in URL renders new-password form

- **Given** a user navigates to `/reset-password?token=<value>`
- **When** the page loads
- **Then** new-password and confirm-password fields and a submit button are visible

#### Scenario: Client-side mismatch shows error before submit

- **Given** the user has entered different values in the new-password and confirm-password fields
- **When** the form is submitted
- **Then** a "Passwords do not match" error is shown inline without calling the API

#### Scenario: Successful reset shows confirmation and login link

- **Given** the user submits a valid token and a strong, matching password
- **When** the API responds with 200
- **Then** the form is replaced with "Password reset successfully. You can now log in." and a link to `/login`

#### Scenario: Invalid or expired token shows user-friendly error with link

- **Given** the submitted token is invalid or expired
- **When** the API responds with 400
- **Then** "This link is invalid or has expired." is shown with a link to request a new reset

#### Scenario: Weak password shows inline validation details

- **Given** the submitted password does not meet strength requirements
- **When** the API responds with 400 including validation details
- **Then** the details from the API response are shown inline

#### Scenario: Rate limit exceeded shows appropriate message

- **Given** the caller has exceeded the reset-endpoint rate limit
- **When** the API responds with 429
- **Then** a "Too many requests." message is shown

#### Scenario: Button disabled during submission

- **Given** the form is submitted
- **When** the API response is pending
- **Then** the submit button is disabled

---

### Requirement: MODIFIED Login page — add forgot-password link

The system SHALL display a "Forgot password?" link on the login page that navigates to `/forgot-password`.

#### Scenario: Forgot password link is visible on login page

- **Given** a user is on the login page at `/login`
- **When** the page renders
- **Then** a "Forgot password?" link pointing to `/forgot-password` is visible below the login form

## REMOVED Requirements

None.

## Traceability

- Proposal (forgot page UX states) → D-U1 → all forgot-page scenarios
- Proposal (reset page token from URL) → D-U2 → missing-token redirect + valid-token scenarios
- Proposal (client-side mismatch) → D-U3 → mismatch scenario
- Proposal (success state) → D-U4 → successful-reset scenario
- Proposal (login page link) → D-U5 → forgot-password link scenario

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Form controls are accessible during loading

- **Given** the form is in a loading state
- **When** a screen reader inspects the submit button
- **Then** the button is marked as disabled and the loading state is communicated

### Requirement: Security

#### Scenario: Token not persisted beyond the API call

- **Given** the reset page reads `?token=` from the URL
- **When** the form is submitted
- **Then** the token is passed directly to the API call and not stored in localStorage or sessionStorage
