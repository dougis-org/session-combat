## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

## MODIFIED Requirements

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

### Requirement: MODIFIED Security

The feedback route SHALL handle all credentials server-side, and the Mailtrap and recipient configuration SHALL NOT be exposed to the client bundle.

See functional scenarios: "Feedback unavailable when email is not configured", "Subject line is sanitized and truncated", "Non-https, non-same-origin page URL is excluded".

#### Scenario: Mailtrap token not present in client bundle

- **Given** the Next.js production build is generated
- **When** the client-side JavaScript bundle is inspected
- **Then** the strings `MAILTRAP_TOKEN` and `FEEDBACK_TO_EMAIL` and their values do not appear in any client bundle file

#### Scenario: Unauthenticated POST rejected

- **Given** a request is made to `POST /api/feedback` without a valid session
- **When** the route handler executes
- **Then** the route returns HTTP 401 before any rate limit check or email send

## REMOVED Requirements

### Requirement: REMOVED ADDED POST /api/feedback — creates GitHub issue

Reason for removal: The feedback backend no longer creates a GitHub issue. Replaced by "POST /api/feedback — sends feedback email". The `GITHUB_FEEDBACK_TOKEN` dependency and the call to `https://api.github.com/repos/dougis-org/session-combat/issues` are removed; the API response no longer contains `issueUrl`.

### Requirement: REMOVED ADDED Auto-context in GitHub issue body

Reason for removal: There is no GitHub issue body. Replaced by "Auto-context in feedback email", which carries the same submitter/page/user-agent context in the email text body.

## Traceability

- Proposal element "Replace GitHub issue creation with a Mailtrap email" → Requirement: POST /api/feedback — sends feedback email; REMOVED: ADDED POST /api/feedback — creates GitHub issue
- Proposal element "Recipient from `FEEDBACK_TO_EMAIL` env var" → Requirement: POST /api/feedback — sends feedback email (scenario "Feedback unavailable when email is not configured")
- Proposal element "Same sender as password reset" → Requirement: POST /api/feedback — sends feedback email
- Proposal element "`reply_to` = submitter email" → Requirement: POST /api/feedback — sends feedback email (scenario "Successful bug report submission")
- Proposal element "Catch send failures (no unhandled 500)" → Requirement: MODIFIED Reliability
- Proposal element "Update success copy / spec wording" → Requirement: POST /api/feedback — sends feedback email (scenario "Modal shows success state after submission")
- Proposal element "Preserve validation, sanitization, URL restriction, rate limiting" → Requirement: Auto-context in feedback email; MODIFIED IP rate limiting; MODIFIED Security
- Design Decision 1 (sendFeedbackEmail) → Requirement: POST /api/feedback — sends feedback email
- Design Decision 2 (text body + subject) → Requirement: Auto-context in feedback email; scenario "Subject line is sanitized and truncated"
- Design Decision 3 (FEEDBACK_TO_EMAIL, missing → 503) → scenario "Feedback unavailable when email is not configured"
- Design Decision 4 (catch → 502/503) → Requirement: MODIFIED Reliability
- Design Decision 5 (response `{ ok: true }`, modal copy) → scenario "Modal shows success state after submission"
- Requirements → Tasks: all requirements map to tasks in `tasks.md`

## Non-Functional Acceptance Criteria

> NFAC scenarios here do not duplicate the functional scenarios above.

### Requirement: Performance

#### Scenario: One outbound email per accepted submission

- **Given** an accepted feedback submission
- **When** `POST /api/feedback` completes
- **Then** exactly one Mailtrap send call is made and the handler performs no other outbound network request

### Requirement: Security

See functional scenarios: "Unauthenticated POST rejected", "Mailtrap token not present in client bundle", "Non-https, non-same-origin page URL is excluded".

#### Scenario: Untrusted submission text does not reach email headers

- **Given** a submission whose title and description contain newline and control characters
- **When** the feedback email is constructed
- **Then** the only header derived from user input is the subject, which is sanitized and length-clamped; all other user text appears only in the message body and `reply_to` is a validated email address

### Requirement: Reliability

#### Scenario: Recovery after a transient send failure

- **Given** a submission that received HTTP 502 because the Mailtrap send failed transiently
- **When** the user retries from the modal and the send succeeds
- **Then** the retry returns HTTP 201 and one email is delivered

### Requirement: Operability

#### Scenario: Misconfiguration is diagnosable from server logs

- **Given** `FEEDBACK_TO_EMAIL` or `MAILTRAP_TOKEN` is unset in the deployed environment
- **When** a feedback submission is attempted
- **Then** the server logs an error naming the missing configuration
- **And** `.env.example` documents `FEEDBACK_TO_EMAIL` as required for the feedback form
