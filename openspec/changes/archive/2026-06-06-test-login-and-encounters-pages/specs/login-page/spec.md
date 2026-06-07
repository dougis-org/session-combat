## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED LoginPage unit test coverage

The system SHALL have unit tests for `LoginPage` covering rendering, client-side validation, submission behavior, error display, and authenticated redirect.

#### Scenario: Renders form fields and submit button

- **Given** the `LoginPage` component is rendered with `isAuthenticated: false`
- **When** the component mounts
- **Then** an email input, a password input, and a submit button are present in the DOM

#### Scenario: Blocks submission and shows error when email is empty

- **Given** the `LoginPage` is rendered
- **When** the form is submitted with no email entered
- **Then** `login` is not called and an "Email is required" error message is displayed

#### Scenario: Blocks submission and shows error when password is empty

- **Given** an email has been typed but no password
- **When** the form is submitted
- **Then** `login` is not called and a "Password is required" error message is displayed

#### Scenario: Blocks submission and shows error when email format is invalid

- **Given** an email like "notanemail" is typed
- **When** the form is submitted
- **Then** `login` is not called and a "valid email address" error message is displayed

#### Scenario: Calls login with credentials on valid submit

- **Given** a valid email and password are entered
- **When** the form is submitted
- **Then** `login` is called exactly once with the entered email and password

#### Scenario: Redirects to /campaigns on successful login

- **Given** `login` returns `true`
- **When** the form is submitted
- **Then** `router.replace('/campaigns')` is called

#### Scenario: Shows error message on failed login

- **Given** `login` returns `false` and `error` is set on `useAuth`
- **When** the form is submitted
- **Then** the error string from `useAuth` is displayed in the DOM

#### Scenario: Redirects immediately when already authenticated

- **Given** `isAuthenticated` is `true` on `useAuth`
- **When** the component mounts
- **Then** `router.replace('/campaigns')` is called without user interaction

## MODIFIED Requirements

_(None — LoginPage source is not changed by this issue.)_

## REMOVED Requirements

_(None.)_

## Traceability

- Proposal element (LoginPage coverage) → Requirement: ADDED LoginPage unit test coverage
- Design decision 2 (RTL + jest.mock pattern) → All scenarios
- Design decision 3 (MonsterEditor exclusion) → Not applicable to this spec
- Requirement → Task: `tests/unit/components/LoginPage.test.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No real network calls

- **Given** the test suite runs without network access
- **When** any `LoginPage` test executes
- **Then** no real HTTP requests are made; all auth calls go through the mocked `useAuth` hook
