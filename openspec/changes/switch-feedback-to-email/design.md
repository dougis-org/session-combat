## Context

- Relevant architecture:
  - Next.js App Router API route `app/api/feedback/route.ts`, wrapped in
    `withAuth` (`lib/middleware`). It parses/validates the JSON body, resolves
    the caller via `getUserById` (`lib/permissions`), applies an IP rate limit
    (`checkAndIncrementRateLimit` in `lib/db/feedbackRateLimit.ts`, 12/hour, TTL
    Mongo collection), and currently POSTs to the GitHub issues REST API.
  - `lib/email.ts` owns the Mailtrap integration: a lazily-constructed singleton
    `MailtrapClient` via `getClient()` (throws if `MAILTRAP_TOKEN` unset), and
    `sendPasswordResetEmail(to, resetUrl)` which calls `client.send({ from, to,
    category, subject, html, text })` with sender `MAILTRAP_FROM_EMAIL` or the
    `noreply@session-combat.app` fallback.
  - Frontend: `lib/components/NavBar.tsx` renders the auth-gated `?` button that
    opens `lib/components/FeedbackModal.tsx`, which renders `FeedbackForm` and
    `fetch('/api/feedback', { method: 'POST', ... })`. The modal branches on
    `response.status === 201` for the success state.
- Dependencies:
  - `mailtrap@^4.10.0` (already installed, already used for password reset).
  - Mailtrap **live** sending API (`client.send`) — not the sandbox testing API.
  - Env: `MAILTRAP_TOKEN`, `MAILTRAP_FROM_EMAIL` (existing), `FEEDBACK_TO_EMAIL`
    (new).
- Interfaces/contracts touched:
  - `POST /api/feedback` response body: `{ issueUrl: string }` → `{ ok: true }`
    (status stays `201`).
  - `lib/email.ts` public surface: add `sendFeedbackEmail(...)`.
  - `openspec/specs/feedback-help-menu/spec.md`: GitHub-issue requirements
    become email requirements.

## Goals / Non-Goals

### Goals

- A valid authenticated feedback submission results in one email to
  `FEEDBACK_TO_EMAIL` containing the type, title, description, and auto-context.
- The maintainer can reply to that email and reach the submitting user
  (`reply_to` = submitter email).
- No secret or privileged call is exposed to the browser.
- Missing configuration and send failures produce clear, bounded HTTP responses
  (`503` / `502`), never an unhandled `500`.
- Existing validation, sanitization, page-URL restriction, and rate limiting are
  preserved unchanged.

### Non-Goals

- Dual-writing to GitHub, or keeping issue creation as a fallback.
- Email templating/queue/retry infrastructure; a confirmation email to the
  submitter; localization.
- Changing the form UI, auth gating, or rate-limit policy.
- Operationally removing `GITHUB_FEEDBACK_TOKEN` from deploy config (code just
  stops reading it).

## Decisions

### Decision 1: New `sendFeedbackEmail` in `lib/email.ts`, mirroring `sendPasswordResetEmail`

- Chosen: Add
  `sendFeedbackEmail({ to, replyTo, subject, text }: FeedbackEmailInput): Promise<void>`.
  It calls `getClient().send({ from: { email: fromEmail, name: "Session Combat" },
  to: [{ email: to }], reply_to: { email: replyTo }, category: "feedback",
  subject, text })`. `fromEmail` resolution (env or `noreply@session-combat.app`
  fallback + the existing `console.warn`) is factored into a small shared helper
  so both email functions use identical sender logic.
- Alternatives considered:
  - Build the Mailtrap call inline in the route — rejected: puts transport
    details in the request handler, diverges from the password-reset pattern,
    harder to unit-test.
  - A generic `sendEmail(options)` — rejected as over-abstraction for two
    call sites; a named function per email type matches the current file.
- Rationale: Keeps all Mailtrap usage in one module, consistent with the
  established pattern; the route stays about validation + orchestration.
- Trade-offs: Slight duplication of the `from`/`name` shape across two functions,
  reduced by the shared sender helper.

### Decision 2: Route sends text-only email; body reuses the existing context builder

- Chosen: Rename `buildIssueBody` → `buildFeedbackBody` (same implementation:
  `**Submitted by:** / **Page:** / **User-Agent:**` block, then `---`, then the
  trimmed description when present). Send as the `text` field only (no `html`).
  Subject = `` `[Bug] ${title}` `` or `` `[Feature] ${title}` ``, passed through
  `sanitizeIssueText(subject, 200)` to strip control chars / newlines and clamp
  length.
- Alternatives considered:
  - HTML email — rejected: the body is plain context + free text; Markdown-ish
    `**bold**` is acceptable as plain text and avoids an HTML-injection surface.
  - Structured JSON payload email — rejected: harder for a human to read in an
    inbox.
- Rationale: Minimal change, preserves the exact context content the maintainer
  already expects, minimizes injection surface.
- Trade-offs: `**Submitted by:**` renders literally rather than bold in a plain
  inbox — acceptable.

### Decision 3: Recipient from `FEEDBACK_TO_EMAIL`; missing → `503`

- Chosen: `const to = process.env.FEEDBACK_TO_EMAIL;` If falsy: `console.error`
  and return `503 { error: 'Feedback is not available.' }` — the same
  status/message the route returns today for a missing `GITHUB_FEEDBACK_TOKEN`,
  so the modal's existing error handling is unaffected. Add `# FEEDBACK_TO_EMAIL=`
  to `.env.example` with a comment that it is required for the feedback form.
- Alternatives considered:
  - Hard-code `dnd@dougis.com` — rejected by the requester; keeps a real address
    out of source and lets non-prod point elsewhere.
  - Fall back to a default address — rejected: silently emailing a default is
    worse than a clear `503`.
- Rationale: Env-var config, fail-loud, no behavioral regression in the client.
- Trade-offs: One more env var to set at deploy; documented in `.env.example`
  and the proposal Open Questions.

### Decision 4: Catch all send/config failures → bounded HTTP status

- Chosen: Wrap the send path in `try/catch`:
  - `getClient()` throwing (missing `MAILTRAP_TOKEN`) is caught → `503
    { error: 'Feedback is not available.' }`, `console.error` the cause.
  - `client.send(...)` rejecting (network, Mailtrap API error, unverified
    sender) → `502 { error: 'Failed to send feedback. Please try again later.' }`,
    `console.error` the cause. This mirrors today's GitHub-non-2xx → `502` path.
- Alternatives considered: Let exceptions bubble to a framework `500` — rejected:
  loses the user-facing retry affordance and the Verity "no silent/opaque
  failure" expectation.
- Rationale: Predictable contract for the modal; distinguishes "not configured"
  (`503`) from "transient failure" (`502`).
- Trade-offs: Must classify the missing-`MAILTRAP_TOKEN` case explicitly (check
  `process.env.MAILTRAP_TOKEN` before calling, or catch and inspect) — chosen:
  check `process.env.MAILTRAP_TOKEN` up front alongside `FEEDBACK_TO_EMAIL` for a
  clean `503`, and still keep the `try/catch` around `send` for `502`.

### Decision 5: API response `{ ok: true }`; modal drops GitHub wording

- Chosen: Route returns `NextResponse.json({ ok: true }, { status: 201 })`.
  `FeedbackModal.tsx` keeps its `response.status === 201` branch; success copy
  changes from "Your report has been submitted and a GitHub issue has been
  created." to "Your feedback has been sent. Thank you!" No component consumes
  `issueUrl` today beyond that sentence, so nothing else changes.
- Alternatives considered: Keep returning `{ issueUrl }` as `null` — rejected:
  dead field in the contract.
- Rationale: Contract reflects reality; smallest client diff.
- Trade-offs: Any external caller of `/api/feedback` expecting `issueUrl` breaks
  — none known; endpoint is internal and auth-gated.

## Proposal to Design Mapping

- Proposal element: Replace GitHub issue creation with a Mailtrap email
  - Design decision: Decisions 1, 2
  - Validation approach: Route unit test asserts `sendFeedbackEmail` called with
    expected `to`/`replyTo`/`subject`/`text` and no `fetch` to GitHub; `201
    { ok: true }` returned.
- Proposal element: Recipient from `FEEDBACK_TO_EMAIL` env var
  - Design decision: Decision 3
  - Validation approach: Unit tests for env set (email sent to that address) and
    env unset (`503`, no send). `.env.example` updated.
- Proposal element: Same sender as password reset
  - Design decision: Decision 1 (shared `from` helper)
  - Validation approach: `lib/email.ts` unit test asserts `from.email` equals
    `MAILTRAP_FROM_EMAIL` when set and the `noreply@session-combat.app` fallback
    (with warn) when not.
- Proposal element: `reply_to` = submitter email
  - Design decision: Decision 1
  - Validation approach: Route unit test asserts `replyTo` passed through to
    `client.send` as `reply_to`.
- Proposal element: Catch send failures (no unhandled 500)
  - Design decision: Decision 4
  - Validation approach: Unit tests where `client.send` rejects → `502`; where
    `MAILTRAP_TOKEN` unset → `503`.
- Proposal element: Live Mailtrap API
  - Design decision: Decision 1 (`client.send`, not the testing/sandbox API)
  - Validation approach: Code review + `lib/email.ts` test asserts `client.send`
    is the invoked method.
- Proposal element: Preserve validation, sanitization, URL restriction, rate
  limiting
  - Design decision: Route keeps all pre-send logic; only the sink changes;
    `buildIssueBody` renamed but unchanged
  - Validation approach: Existing route tests for `400`/`429`/URL-clamping kept
    and re-pointed at the email mock.
- Proposal element: Update success copy / spec wording
  - Design decision: Decision 5 + spec deltas
  - Validation approach: `FeedbackModal.test.tsx` asserts new copy, no "GitHub";
    `openspec validate` passes.

## Functional Requirements Mapping

- Requirement: Valid submission sends exactly one email with type, title,
  description, and auto-context to `FEEDBACK_TO_EMAIL`.
  - Design element: Route orchestration + `sendFeedbackEmail` (Decisions 1–3)
  - Acceptance criteria reference: `specs/feedback-help-menu/spec.md` —
    "POST /api/feedback — sends feedback email", scenarios "Successful bug report
    submission" / "Successful feature request submission".
  - Testability notes: Mock `sendFeedbackEmail`; assert call args and single
    invocation; assert `201 { ok: true }`.
- Requirement: Email `reply_to` is the authenticated submitter's email.
  - Design element: Decision 1
  - Acceptance criteria reference: spec scenario "Reply-to is the submitter".
  - Testability notes: Route test with a known `auth.email`.
- Requirement: Subject encodes type + title, sanitized and length-clamped.
  - Design element: Decision 2
  - Acceptance criteria reference: spec scenario "Subject line format".
  - Testability notes: Route test with a title containing newlines/`>@#` and
    >200 chars; assert cleaned, prefixed, truncated subject.
- Requirement: Body carries submitter, page URL, user-agent, and description.
  - Design element: `buildFeedbackBody` (Decision 2)
  - Acceptance criteria reference: spec "Auto-context in feedback email".
  - Testability notes: Route test asserts each line present; empty-description
    case asserts context-only body.
- Requirement: Missing `FEEDBACK_TO_EMAIL` or `MAILTRAP_TOKEN` → `503`, no send.
  - Design element: Decisions 3, 4
  - Acceptance criteria reference: spec scenario "Feedback unavailable when email
    is not configured".
  - Testability notes: Unit tests with env vars deleted.
- Requirement: Mailtrap send failure → `502` with retry message, no crash.
  - Design element: Decision 4
  - Acceptance criteria reference: spec scenario "Modal shows error state on send
    failure".
  - Testability notes: `sendFeedbackEmail` mock rejects; assert `502` + body.
- Requirement: Rate-limited request → `429`, no email sent.
  - Design element: Unchanged rate-limit gate precedes the send
  - Acceptance criteria reference: spec "IP rate limiting" (updated wording: "no
    feedback email is sent").
  - Testability notes: Existing test re-pointed to assert `sendFeedbackEmail` not
    called.
- Requirement: Modal shows a generic success message with no GitHub wording.
  - Design element: Decision 5
  - Acceptance criteria reference: spec scenario "Modal shows success state after
    submission".
  - Testability notes: `FeedbackModal.test.tsx` renders success branch, asserts
    text and absence of "GitHub".

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: No privileged credential or external call reaches the browser;
    untrusted submission text cannot inject email headers.
  - Design element: Server-only route (unchanged); user text confined to
    sanitized subject and `text` body; `reply_to` is a validated email string;
    page-URL restriction retained.
  - Acceptance criteria reference: spec scenarios for URL clamping + subject
    sanitization; Verity decisions "Create GitHub issues server-side…",
    "Sanitize header-derived text…", "Restrict feedback issue context URLs…"
    (now read as "feedback context URLs").
  - Testability notes: Route tests for `//evil.com` / `http://` / `javascript:`
    page URLs → excluded; user-agent with control chars → stripped.
- Requirement category: reliability
  - Requirement: All failure modes map to a defined HTTP status; no unhandled
    `500`.
  - Design element: Decision 4 try/catch + up-front env checks.
  - Acceptance criteria reference: spec error scenarios.
  - Testability notes: Tests force each failure path.
- Requirement category: operability
  - Requirement: Misconfiguration is diagnosable from server logs; required env
    documented.
  - Design element: `console.error` on `503`/`502` with cause; `.env.example`
    entry.
  - Acceptance criteria reference: N/A (log assertions optional in tests).
  - Testability notes: Optionally spy on `console.error`.
- Requirement category: performance
  - Requirement: One synchronous outbound email per request; volume bounded.
  - Design element: Existing 12/hour/IP rate limit unchanged.
  - Acceptance criteria reference: spec "IP rate limiting".
  - Testability notes: Covered by existing rate-limit tests.

## Risks / Trade-offs

- Risk/trade-off: `MAILTRAP_FROM_EMAIL` domain not verified for live sending.
  - Impact: All submissions fail `502`.
  - Mitigation: Reuse the exact sender password-reset uses (already live);
    post-deploy smoke test a real submission; Open Question flagged.
- Risk/trade-off: `FEEDBACK_TO_EMAIL` not set at cutover.
  - Impact: `503` — same user outcome as today's broken state, clearer message.
  - Mitigation: Set env var in the same rollout; `.env.example` + proposal Open
    Questions.
- Risk/trade-off: Plain-text body shows `**` markers literally.
  - Impact: Minor cosmetic.
  - Mitigation: Accepted; can switch to a formatted body later if desired.
- Risk/trade-off: Losing the GitHub issue audit trail / labels.
  - Impact: Feedback no longer auto-tracked in the issue tracker.
  - Mitigation: Explicit product decision in #650; maintainer triages from inbox
    and can open issues manually.

## Rollback / Mitigation

- Rollback trigger: Feedback emails not arriving, or a spike of `502`/`503` from
  `/api/feedback` after deploy, that cannot be resolved by fixing env config.
- Rollback steps: Revert the merge commit for this change (single PR on branch
  `switch-feedback-to-email`); redeploy. This restores the GitHub-issue path;
  ensure `GITHUB_FEEDBACK_TOKEN` is still present in deploy secrets (it is not
  removed by this change).
- Data migration considerations: None. No schema changes; the rate-limit
  collection and its TTL index are untouched.
- Verification after rollback: Submit a test feedback item; confirm a GitHub
  issue is created and the modal shows the (old) success state.

## Operational Blocking Policy

- If CI checks fail: Treat as blocking. Fix forward on the branch — do not merge
  with red `ci-gate` or Codacy. `main` is a squash-only ruleset requiring
  `ci-gate` + Codacy; auto-merge via `--squash`, 0 approvals.
- If security checks fail: Blocking. The change adds no new external call from
  the client and no new secret surface; if a scanner flags the Mailtrap token
  usage, confirm it is server-only (`lib/email.ts` is never imported by client
  components) and address the specific finding rather than waiving.
- If required reviews are blocked/stale: Re-request; if unavailable beyond the
  escalation timeout, the maintainer (issue author `@dougis`) decides.
- Escalation path and timeout: Ping `@dougis` on the PR; if no response within
  1 business day and CI is green, maintainer may self-merge per the repo's
  0-approval ruleset.

## Open Questions

- Is `MAILTRAP_FROM_EMAIL`'s domain verified for Mailtrap **live** sending in
  production? (Not a blocker for apply; blocker for a successful deploy.)
- Confirm `FEEDBACK_TO_EMAIL=dnd@dougis.com` will be added to Fly secrets during
  rollout. (Not a blocker for apply.)
