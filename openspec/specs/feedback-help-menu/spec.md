## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-28-add-feedback-help-menu/design.md) document, not a replacement.

### Requirement: ADDED NavBar help button — auth-gated

The system SHALL render a `?` button on the right side of the NavBar if and only if the user is authenticated.

#### Scenario: Help button visible when authenticated

- **Given** a user is logged in and the NavBar is rendered
- **When** the NavBar mounts
- **Then** a `?` button is visible on the right side of the nav, adjacent to the Logout button

#### Scenario: Help button absent when unauthenticated

- **Given** a user is not logged in and the NavBar is rendered
- **When** the NavBar mounts
- **Then** no `?` button is present in the DOM

#### Scenario: Help button absent while auth is loading

- **Given** the auth state is still loading
- **When** the NavBar mounts
- **Then** no `?` button is rendered (same guard as Logout)

---

### Requirement: ADDED FeedbackModal opens on help button click

The system SHALL open a feedback modal when the authenticated user clicks the `?` button.

#### Scenario: Modal opens on click

- **Given** the user is authenticated and the `?` button is visible
- **When** the user clicks `?`
- **Then** the `FeedbackModal` opens, displaying the `FeedbackForm`

#### Scenario: Modal closes on cancel

- **Given** the `FeedbackModal` is open
- **When** the user clicks Cancel
- **Then** the modal closes and the NavBar is restored to its normal state

---

### Requirement: ADDED FeedbackForm — type toggle, title, description

The system SHALL provide a form with a type toggle (Bug Report / Feature Request), a title field, and a description field.

#### Scenario: Default type is Bug Report

- **Given** the `FeedbackModal` is opened
- **When** the form renders for the first time
- **Then** the Bug Report option is selected by default

#### Scenario: Toggle switches to Feature Request

- **Given** the FeedbackForm is displayed with Bug Report selected
- **When** the user clicks Feature Request
- **Then** the Feature Request option becomes selected and Bug Report is deselected

#### Scenario: Submit is disabled when title is empty

- **Given** the FeedbackForm is displayed
- **When** the title field is empty
- **Then** the Submit button is disabled

#### Scenario: Submit is enabled when title is non-empty

- **Given** the FeedbackForm is displayed
- **When** the user types a non-empty title
- **Then** the Submit button becomes enabled

#### Scenario: Description enforces character limit

- **Given** the FeedbackForm is displayed
- **When** the user types more than 2000 characters in the description field
- **Then** input beyond 2000 characters is rejected (field enforces maxLength)

---

### Requirement: ADDED POST /api/feedback — creates GitHub issue

The system SHALL create a GitHub issue via the GitHub REST API when a valid authenticated request is received.

#### Scenario: Successful bug report submission

- **Given** an authenticated user submits the form with type "bug", a title, and a description
- **When** `POST /api/feedback` is called
- **Then** a GitHub issue is created with label `bug`, title from the form, and a body containing the description and auto-attached context (username, email, page URL, user-agent)
- **And** the API returns HTTP 201

#### Scenario: Successful feature request submission

- **Given** an authenticated user submits the form with type "feature" and a title
- **When** `POST /api/feedback` is called
- **Then** a GitHub issue is created with label `enhancement`
- **And** the API returns HTTP 201

#### Scenario: Modal shows success state after submission

- **Given** `POST /api/feedback` returns 201
- **When** the submit response is received
- **Then** the modal displays a success message and the form is no longer editable

#### Scenario: Modal shows error state on GitHub API failure

- **Given** the GitHub API returns a non-2xx response
- **When** the submit response is received
- **Then** the API route returns HTTP 502 and the modal displays a user-visible error message

---

### Requirement: ADDED IP rate limiting — 12 submissions per hour

The system SHALL reject feedback submissions from an IP address that has exceeded 12 submissions in the current one-hour window.

#### Scenario: Submission accepted within rate limit

- **Given** an IP address has submitted fewer than 12 times in the current hour
- **When** `POST /api/feedback` is called
- **Then** the submission is processed normally

#### Scenario: Submission rejected at rate limit

- **Given** an IP address has submitted 12 times in the current hour
- **When** `POST /api/feedback` is called a 13th time
- **Then** the API returns HTTP 429 with a rate limit error message
- **And** no GitHub issue is created

#### Scenario: Rate limit window resets after one hour

- **Given** an IP address hit the rate limit in a previous one-hour window
- **When** one hour has elapsed and the TTL document has expired
- **Then** the next submission from that IP is accepted (count resets to 1)

---

### Requirement: ADDED Auto-context in GitHub issue body

The system SHALL append submitter context to every created GitHub issue body.

#### Scenario: Issue body includes username, email, page URL, user-agent

- **Given** an authenticated user submits feedback from page `/combat/abc123`
- **When** the GitHub issue is created
- **Then** the issue body contains:
  - `**Submitted by:** @username (email@example.com)`
  - `**Page:** https://…/combat/abc123`
  - `**User-Agent:** <request User-Agent header value>`
  - The user's description text

---

## MODIFIED Requirements

### Requirement: MODIFIED NavBar — authenticated nav element set

The NavBar SHALL include a `?` button (help/feedback trigger) as a new authenticated-only element, positioned on the right side before the Logout button.

#### Scenario: NavBar right side includes help button when authenticated

- **Given** the user is authenticated
- **When** the NavBar renders
- **Then** the right side contains `[?] [Logout]` in that order

---

## REMOVED Requirements

None. This change only adds new capabilities and modifies the NavBar element set.

---

## Traceability

- Proposal: auth-gated `?` button → Requirement: ADDED NavBar help button — auth-gated
- Proposal: FeedbackModal + FeedbackForm with toggle → Requirement: ADDED FeedbackModal opens; ADDED FeedbackForm
- Proposal: Server-side GitHub API call → Requirement: ADDED POST /api/feedback
- Proposal: IP rate limit 12/hr → Requirement: ADDED IP rate limiting
- Proposal: Auto-attach context → Requirement: ADDED Auto-context in GitHub issue body
- Design Decision 1 (standalone FeedbackForm) → Requirement: ADDED FeedbackModal; ADDED FeedbackForm
- Design Decision 2 (server-side API route) → Requirement: ADDED POST /api/feedback
- Design Decision 3 (MongoDB TTL rate limit) → Requirement: ADDED IP rate limiting
- Design Decision 4 (auto-context body) → Requirement: ADDED Auto-context in GitHub issue body
- Design Decision 5 (NavBar placement) → Requirement: MODIFIED NavBar; ADDED NavBar help button
- Design Decision 6 (label mapping) → Requirement: ADDED POST /api/feedback (bug/feature scenarios)
- Requirements → Tasks: all requirements map to tasks in `tasks.md`

---

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements above.

### Requirement: Security

See functional scenarios: "Help button absent when unauthenticated", "Submission rejected at rate limit".

#### Scenario: GitHub token not present in client bundle

- **Given** the Next.js production build is generated
- **When** the client-side JavaScript bundle is inspected
- **Then** the string `GITHUB_FEEDBACK_TOKEN` and its value do not appear in any client bundle file

#### Scenario: Unauthenticated POST rejected

- **Given** a request is made to `POST /api/feedback` without a valid session
- **When** the route handler executes
- **Then** the route returns HTTP 401 before any rate limit check or GitHub API call

### Requirement: Reliability

#### Scenario: GitHub API error does not cause unhandled exception

- **Given** the GitHub API returns a 500 error
- **When** `POST /api/feedback` processes the response
- **Then** the route catches the error, logs it server-side, and returns HTTP 502 with a user-readable message — no unhandled promise rejection occurs

### Requirement: Operability

#### Scenario: MongoDB rate limit collection has TTL index

- **Given** the `feedbackRateLimits` collection is initialized
- **When** the MongoDB index list for that collection is inspected
- **Then** a TTL index on `windowResetAt` with `expireAfterSeconds: 0` is present
