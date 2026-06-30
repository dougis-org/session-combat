## Context

- Relevant architecture: Next.js App Router with API routes; `'use client'` NavBar component; MongoDB via existing `lib/db/` connection pattern; NextAuth (or equivalent) session for auth; Tailwind for styling
- Dependencies: `GITHUB_FEEDBACK_TOKEN` env var (GitHub PAT, `issues:write` scope); MongoDB `feedbackRateLimits` collection; existing `useAuth` hook
- Interfaces/contracts touched:
  - `lib/components/NavBar.tsx` — adds `?` trigger button
  - New: `lib/components/FeedbackForm.tsx`, `lib/components/FeedbackModal.tsx`
  - New: `app/api/feedback/route.ts`
  - New: `lib/db/feedbackRateLimit.ts`

## Goals / Non-Goals

### Goals

- Add a `?` button to the NavBar (auth-gated, right-aligned) that opens a feedback modal
- `FeedbackForm` is a self-contained, reusable component usable outside the modal
- Server-side GitHub issue creation with no token exposure to the client
- IP-based rate limiting (12/hr) via MongoDB TTL collection
- Auto-attach context (username, email, page URL, user-agent) to every issue

### Non-Goals

- `/help` page (form component is ready for it; page itself is not built here)
- Unauthenticated submission path
- Admin tooling for submitted feedback

## Decisions

### Decision 1: FeedbackForm as standalone component, not modal-internal

- Chosen: `FeedbackForm` is its own component in `lib/components/FeedbackForm.tsx`, accepting props (`onSubmit`, `onCancel`, `defaultType`). `FeedbackModal` imports and wraps it.
- Alternatives considered: Inline the form JSX inside `FeedbackModal`
- Rationale: The proposal explicitly requires future reuse on a `/help` page. Inlining would force extraction later.
- Trade-offs: One extra file; negligible cost.

### Decision 2: Server-side GitHub API call via Next.js API route

- Chosen: `POST /api/feedback` reads `GITHUB_FEEDBACK_TOKEN` from `process.env` and calls the GitHub REST API server-side.
- Alternatives considered: (a) client-side GitHub API call, (b) third-party service (Zapier/email relay)
- Rationale: Token must never reach the client. Direct API call is simpler than a relay service and removes third-party dependency.
- Trade-offs: API route must handle GitHub error responses and surface them to the UI.

### Decision 3: MongoDB TTL collection for rate limiting

- Chosen: `feedbackRateLimits` collection; documents keyed by IP with `count` and `windowResetAt`; TTL index on `windowResetAt` for auto-cleanup. Upsert increments count; reject if count > 12.
- Alternatives considered: In-memory Map (fails multi-instance), Redis (extra dependency)
- Rationale: MongoDB is the only DB in the stack. TTL index removes expired windows automatically, so no cron cleanup needed.
- Trade-offs: MongoDB round-trip on every feedback submission (acceptable — low-frequency action).

### Decision 4: Auto-context appended to GitHub issue body

- Chosen: The API route appends a context block to the user's description:
  ```
  **Submitted by:** @username (email)
  **Page:** <page URL from request body>
  **User-Agent:** <from request headers>
  ```
  Page URL is sent by the client in the request body (not inferred server-side, to support SPAs).
- Alternatives considered: Infer page from Referer header (unreliable)
- Rationale: Client passes `window.location.href`; server has user session for email/username.
- Trade-offs: Client must send page URL; minimal trust issue since it's decorative metadata.

### Decision 5: `?` button placement and auth-gating

- Chosen: Right side of NavBar, rendered only when `isAuthenticated && !loading`. Positioned before or adjacent to Logout using `ml-auto` layout.
- Alternatives considered: Dropdown "Help" menu label
- Rationale: `?` is universally understood; a dropdown adds complexity for only two items. Items can be added later.
- Trade-offs: Less discoverable than labelled "Help" — acceptable for an MVP with two actions.

### Decision 6: GitHub label mapping from form type toggle

- Chosen: `bug` → GitHub label `bug`; `feature` → GitHub label `enhancement`. Labels applied at issue creation via GitHub API `labels` field.
- Alternatives considered: No labels (harder to triage), custom labels
- Rationale: `bug` and `enhancement` are GitHub's default labels; no setup required.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: `?` button in NavBar, auth-gated
  - Design decision: Decision 5
  - Validation approach: E2E — button absent when logged out, present when logged in
- Proposal element: In-app modal with FeedbackForm
  - Design decision: Decision 1
  - Validation approach: Unit test FeedbackForm props/state; E2E opens modal and submits
- Proposal element: Server-side GitHub issue creation
  - Design decision: Decision 2
  - Validation approach: Unit test API route with mocked GitHub API; integration test issue creation
- Proposal element: IP rate limiting 12/hr
  - Design decision: Decision 3
  - Validation approach: Unit test rate limit logic (mock MongoDB); integration test 429 after limit
- Proposal element: Auto-attach context to issues
  - Design decision: Decision 4
  - Validation approach: Unit test issue body builder function; verify output format

## Functional Requirements Mapping

- Requirement: `?` button only visible to authenticated users
  - Design element: NavBar conditional render on `isAuthenticated && !loading`
  - Acceptance criteria reference: specs/feedback-help-menu/spec.md
  - Testability notes: RTL unit test; E2E with logged-out/in states

- Requirement: Form has type toggle (Bug / Feature), title, description fields
  - Design element: `FeedbackForm` component props and controlled state
  - Acceptance criteria reference: specs/feedback-help-menu/spec.md
  - Testability notes: RTL unit test toggle state, field binding, submit handler call

- Requirement: Submit creates GitHub issue with correct label
  - Design element: `POST /api/feedback` → GitHub REST API `POST /repos/.../issues`
  - Acceptance criteria reference: specs/feedback-help-menu/spec.md
  - Testability notes: Mock `fetch`/GitHub API in unit test; assert label and body

- Requirement: Rate limit 12/hr per IP
  - Design element: `lib/db/feedbackRateLimit.ts` upsert + count check
  - Acceptance criteria reference: specs/feedback-help-menu/spec.md
  - Testability notes: Unit test with mock MongoDB; assert 429 on 13th request

- Requirement: Auto-populate context in issue body
  - Design element: API route builds issue body from session + request body + headers
  - Acceptance criteria reference: specs/feedback-help-menu/spec.md
  - Testability notes: Unit test issue body builder with known inputs; assert output

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: GitHub PAT never exposed to client
  - Design element: Token read only in `app/api/feedback/route.ts` server-side
  - Acceptance criteria reference: Code review — token must not appear in any `'use client'` module
  - Testability notes: Static check; grep for `GITHUB_FEEDBACK_TOKEN` in client bundles

- Requirement category: reliability
  - Requirement: GitHub API failure surfaces to user, not silently swallowed
  - Design element: API route returns 502 with error message on GitHub API failure; modal shows error state
  - Acceptance criteria reference: specs/feedback-help-menu/spec.md
  - Testability notes: Unit test with mocked GitHub API returning 500; assert modal shows error

- Requirement category: operability
  - Requirement: MongoDB rate limit collection self-cleans
  - Design element: TTL index on `windowResetAt` field in `feedbackRateLimits`
  - Acceptance criteria reference: Index created on first API route load; no cron needed
  - Testability notes: Integration test — verify TTL index exists after route initialization

## Risks / Trade-offs

- Risk/trade-off: MongoDB TTL index not created before first request
  - Impact: Rate limiting skipped on cold start
  - Mitigation: Create index in `lib/db/feedbackRateLimit.ts` module init (runs on first import); use `createIndex` with `background: true`

- Risk/trade-off: GitHub PAT expiry
  - Impact: All feedback submissions fail silently (or with error) until token is rotated
  - Mitigation: API route returns 502 with user-visible error; operator notified via logs

- Risk/trade-off: `FeedbackForm` page URL from client is user-controllable
  - Impact: Low — URL is decorative metadata in the issue body, not used for security decisions
  - Mitigation: No mitigation needed; accept the trade-off

## Rollback / Mitigation

- Rollback trigger: GitHub API errors > 5% of submissions, or security issue found with token handling
- Rollback steps:
  1. Remove `?` button from NavBar (one-line change)
  2. Delete or disable `app/api/feedback/route.ts`
  3. `FeedbackForm` and `FeedbackModal` can remain (unused, no harm)
  4. Drop `GITHUB_FEEDBACK_TOKEN` env var from deployment config
- Data migration considerations: `feedbackRateLimits` collection can be dropped; no schema migration
- Verification after rollback: NavBar no longer shows `?`; `POST /api/feedback` returns 404

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check. No bypasses via `--no-verify` or force-push.
- If security checks fail: Treat as a blocker. Token exposure or injection issues must be resolved before merge.
- If required reviews are blocked/stale: Ping reviewer after 24hr. Escalate to repo owner after 48hr.
- Escalation path and timeout: If blocked > 72hr with no resolution, re-scope or defer to next sprint.

## Open Questions

No open questions. All design decisions were resolved during exploration prior to proposal.
