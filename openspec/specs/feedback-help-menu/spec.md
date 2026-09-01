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

### Requirement: POST /api/feedback — sends feedback email

The system SHALL send exactly one email via the Mailtrap live sending API when a valid authenticated `POST /api/feedback` request passes validation and the IP rate limit, and SHALL return HTTP 201 with body `{ "ok": true }`.

The email SHALL:

- be sent to the address configured in the `FEEDBACK_TO_EMAIL` environment variable;
- use the same sender as other transactional email — `MAILTRAP_FROM_EMAIL`, or `noreply@session-combat.app` when that variable is unset;
- set `reply_to` to the authenticated submitter's email address;
- use a subject of `[Bug] <title>` when `type` is `"bug"` and `[Feature] <title>` when `type` is `"feature"`, with the subject sanitized (control characters and newlines removed) and truncated to 200 characters;
- carry the submitter context and the description in the message body (see "Auto-context in feedback email").

#### Scenario: Successful bug report submission

- **Given** an authenticated user submits the form with type `"bug"`, a title, and a description
- **And** `FEEDBACK_TO_EMAIL` and `MAILTRAP_TOKEN` are configured
- **When** `POST /api/feedback` is called
- **Then** one email is sent to `FEEDBACK_TO_EMAIL` with subject `[Bug] <title>`, `reply_to` equal to the submitter's email, and a body containing the description and auto-context
- **And** no request is made to `api.github.com`
- **And** the API returns HTTP 201 with body `{ "ok": true }`

#### Scenario: Successful feature request submission

- **Given** an authenticated user submits the form with type `"feature"` and a title
- **When** `POST /api/feedback` is called
- **Then** one email is sent with subject `[Feature] <title>`
- **And** the API returns HTTP 201 with body `{ "ok": true }`

#### Scenario: Subject line is sanitized and truncated

- **Given** an authenticated user submits type `"bug"` with a title containing newline characters, Markdown control characters (`> @ # [ ] * _`), and more than 200 characters total
- **When** `POST /api/feedback` is called
- **Then** the email subject is `[Bug] ` followed by the title with newlines and control characters removed, truncated so the full subject is at most 200 characters

#### Scenario: Feedback unavailable when email is not configured

- **Given** either `FEEDBACK_TO_EMAIL` or `MAILTRAP_TOKEN` is not set
- **When** `POST /api/feedback` is called with an otherwise valid submission
- **Then** no email is sent
- **And** the route logs a server-side error
- **And** the API returns HTTP 503 with a user-readable "Feedback is not available." message

#### Scenario: Modal shows error state on send failure

- **Given** the Mailtrap send call rejects (network error, API error, or unverified sender)
- **When** `POST /api/feedback` processes the failure
- **Then** the route catches the error, logs it server-side, and returns HTTP 502 with a user-readable "Failed to send feedback. Please try again later." message — no unhandled exception occurs
- **And** the modal displays the returned error message with a retry affordance

#### Scenario: Modal shows success state after submission

- **Given** `POST /api/feedback` returns HTTP 201
- **When** the submit response is received
- **Then** the modal displays a success message confirming the feedback was sent
- **And** the success message does not mention GitHub or a created issue
- **And** the form is no longer editable

---

### Requirement: ADDED IP rate limiting — 12 submissions per hour

The system SHALL reject feedback submissions from an IP address that has exceeded 12 submissions in the current one-hour window, and SHALL NOT send a feedback email for a rejected submission.

#### Scenario: Submission accepted within rate limit

- **Given** an IP address has submitted fewer than 12 times in the current hour
- **When** `POST /api/feedback` is called
- **Then** the submission is processed normally and a feedback email is sent

#### Scenario: Submission rejected at rate limit

- **Given** an IP address has submitted 12 times in the current hour
- **When** `POST /api/feedback` is called a 13th time
- **Then** the API returns HTTP 429 with a rate limit error message
- **And** no feedback email is sent

#### Scenario: Rate limit window resets after one hour

- **Given** an IP address hit the rate limit in a previous one-hour window
- **When** one hour has elapsed and the TTL document has expired
- **Then** the next submission from that IP is accepted (count resets to 1)

---

### Requirement: Auto-context in feedback email

The system SHALL include submitter context in the body of every feedback email.

#### Scenario: Email body includes submitter, page URL, user-agent, description

- **Given** an authenticated user with GitHub username `username` and email `email@example.com` submits feedback from page `/combat/abc123` with a description
- **When** the feedback email is sent
- **Then** the email text body contains, before the description:
  - `**Submitted by:** @username (email@example.com)`
  - `**Page:** https://…/combat/abc123`
  - `**User-Agent:** <sanitized request User-Agent header value>`
- **And** the description text follows, separated by a `---` line

#### Scenario: Email body with no description is context-only

- **Given** an authenticated user submits feedback with a title but an empty description
- **When** the feedback email is sent
- **Then** the email body contains only the `Submitted by` / `Page` / `User-Agent` context block and no trailing separator or description

#### Scenario: Non-https, non-same-origin page URL is excluded

- **Given** a submission whose `pageUrl` is `//evil.example`, `http://evil.example`, or `javascript:alert(1)`
- **When** the feedback email is built
- **Then** the `**Page:**` line is empty (the untrusted URL is not included)

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

### Requirement: REMOVED ADDED POST /api/feedback — creates GitHub issue

Reason for removal: The feedback backend no longer creates a GitHub issue. Replaced by "POST /api/feedback — sends feedback email". The `GITHUB_FEEDBACK_TOKEN` dependency and the call to `https://api.github.com/repos/dougis-org/session-combat/issues` are removed; the API response no longer contains `issueUrl`.

### Requirement: REMOVED ADDED Auto-context in GitHub issue body

Reason for removal: There is no GitHub issue body. Replaced by "Auto-context in feedback email", which carries the same submitter/page/user-agent context in the email text body.

---

## Traceability

- Proposal: auth-gated `?` button → Requirement: ADDED NavBar help button — auth-gated
- Proposal: FeedbackModal + FeedbackForm with toggle → Requirement: ADDED FeedbackModal opens; ADDED FeedbackForm
- Proposal: Server-side email delivery → Requirement: POST /api/feedback — sends feedback email
- Proposal: IP rate limit 12/hr → Requirement: ADDED IP rate limiting
- Proposal: Auto-attach context → Requirement: Auto-context in feedback email
- Design Decision 5 (NavBar placement) → Requirement: MODIFIED NavBar; ADDED NavBar help button
- switch-feedback-to-email Decision 1 (sendFeedbackEmail) → Requirement: POST /api/feedback — sends feedback email
- switch-feedback-to-email Decision 3 (FEEDBACK_TO_EMAIL, missing → 503) → scenario "Feedback unavailable when email is not configured"
- switch-feedback-to-email Decision 4 (catch → 502/503) → Requirement: MODIFIED Reliability
- switch-feedback-to-email Decision 5 (response `{ ok: true }`, modal copy) → scenario "Modal shows success state after submission"
- Requirements → Tasks: all requirements map to tasks in the corresponding change's `tasks.md`

---

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements above.

### Requirement: Security

See functional scenarios: "Help button absent when unauthenticated", "Submission rejected at rate limit", "Feedback unavailable when email is not configured", "Subject line is sanitized and truncated", "Non-https, non-same-origin page URL is excluded".

#### Scenario: Mailtrap token not present in client bundle

- **Given** the Next.js production build is generated
- **When** the client-side JavaScript bundle is inspected
- **Then** the strings `MAILTRAP_TOKEN` and `FEEDBACK_TO_EMAIL` and their values do not appear in any client bundle file

#### Scenario: Unauthenticated POST rejected

- **Given** a request is made to `POST /api/feedback` without a valid session
- **When** the route handler executes
- **Then** the route returns HTTP 401 before any rate limit check or email send

#### Scenario: Untrusted submission text does not reach email headers

- **Given** a submission whose title and description contain newline and control characters
- **When** the feedback email is constructed
- **Then** the only header derived from user input is the subject, which is sanitized and length-clamped; all other user text appears only in the message body and `reply_to` is a validated email address

### Requirement: Performance

#### Scenario: One outbound email per accepted submission

- **Given** an accepted feedback submission
- **When** `POST /api/feedback` completes
- **Then** exactly one Mailtrap send call is made and the handler performs no other outbound network request

### Requirement: MODIFIED Reliability

The feedback route SHALL map every failure mode to a defined HTTP status and SHALL never raise an unhandled exception or promise rejection.

#### Scenario: Email send error does not cause unhandled exception

- **Given** the Mailtrap send call throws or rejects
- **When** `POST /api/feedback` processes the failure
- **Then** the route catches the error, logs it server-side, and returns HTTP 502 with a user-readable message — no unhandled promise rejection occurs

#### Scenario: Missing email configuration does not cause unhandled exception

- **Given** `MAILTRAP_TOKEN` is unset so the Mailtrap client cannot be constructed
- **When** `POST /api/feedback` is called
- **Then** the route returns HTTP 503 with a user-readable message — the client-construction error does not propagate as an unhandled exception

#### Scenario: Recovery after a transient send failure

- **Given** a submission that received HTTP 502 because the Mailtrap send failed transiently
- **When** the user retries from the modal and the send succeeds
- **Then** the retry returns HTTP 201 and one email is delivered

### Requirement: Operability

#### Scenario: MongoDB rate limit collection has TTL index

- **Given** the `feedbackRateLimits` collection is initialized
- **When** the MongoDB index list for that collection is inspected
- **Then** a TTL index on `windowResetAt` with `expireAfterSeconds: 0` is present

#### Scenario: Misconfiguration is diagnosable from server logs

- **Given** `FEEDBACK_TO_EMAIL` or `MAILTRAP_TOKEN` is unset in the deployed environment
- **When** a feedback submission is attempted
- **Then** the server logs an error naming the missing configuration
- **And** `.env.example` documents `FEEDBACK_TO_EMAIL` as required for the feedback form
