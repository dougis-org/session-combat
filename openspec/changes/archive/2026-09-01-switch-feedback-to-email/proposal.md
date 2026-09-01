## GitHub Issues

- #650

## Why

- Problem statement: The in-app feedback form (NavBar `?` button → `FeedbackModal` →
  `POST /api/feedback`) is not delivering feedback. The route depends on
  `GITHUB_FEEDBACK_TOKEN` to create a GitHub issue; when that token is absent or
  invalid in the deployed environment the route returns `503`/`502` and the user
  sees an error. The maintainer wants feedback to arrive as an email instead of a
  GitHub issue.
- Why now: The form is a dead end in production today — submitted bug reports and
  feature requests are lost. Issue #650 asks for the switch explicitly.
- Business/user impact: Restores a working feedback channel for authenticated
  users; removes a fragile dependency on a fine-grained GitHub PAT that expires
  and needs rotation.

## Problem Space

- Current behavior: `POST /api/feedback` validates the payload, enforces an IP
  rate limit, then requires `GITHUB_FEEDBACK_TOKEN` and calls
  `https://api.github.com/repos/dougis-org/session-combat/issues`. On success it
  returns `201 { issueUrl }`; the modal shows "a GitHub issue has been created".
- Desired behavior: On a valid submission the route sends an email via the
  Mailtrap live sending API to the address in `FEEDBACK_TO_EMAIL`, from the
  existing `MAILTRAP_FROM_EMAIL` sender, with `reply_to` set to the submitting
  user's email. The email subject encodes the type and title; the body carries
  the description plus the auto-attached context (submitter, page URL,
  user-agent). The route returns `201` on success. The modal shows a generic
  "your feedback has been sent" confirmation.
- Constraints:
  - Reuse the existing Mailtrap client in `lib/email.ts` (`getClient()`), the
    same pattern as `sendPasswordResetEmail`, and the same `MAILTRAP_FROM_EMAIL`
    / `noreply@session-combat.app` fallback sender.
  - Uses the Mailtrap **live** sending API (`client.send`), not the sandbox /
    testing inbox API.
  - Keep server-side handling (token never reaches the client), header-text
    sanitization, and page-URL restriction (same-origin relative or `https://`
    only) — these are existing Verity decisions and still apply to an email body.
  - Keep the existing IP rate limiting (`checkAndIncrementRateLimit`, 12/hour,
    TTL-backed Mongo collection).
  - Recipient address comes from an environment variable, not a hard-coded
    literal.
- Assumptions:
  - `MAILTRAP_FROM_EMAIL` is configured and its domain is verified for live
    sending in production (password reset already relies on this).
  - `dnd@dougis.com` (per #650) is the value that will be set for
    `FEEDBACK_TO_EMAIL` in the deployed environment; the code does not hard-code
    it.
  - `auth.email` is always populated for an authenticated request.
- Edge cases considered:
  - `FEEDBACK_TO_EMAIL` unset → route returns `503` "Feedback is not available."
    (mirrors today's missing-token behavior) and logs a server error.
  - `MAILTRAP_TOKEN` unset → `getClient()` throws; route must catch and return
    `503`.
  - Mailtrap `client.send` rejects (network / API error / unverified sender) →
    route catches and returns `502` with a user-visible retry message; no
    unhandled `500`.
  - Submitter has no GitHub username on file → `submittedBy` falls back to the
    email only (unchanged logic).
  - Description empty → email body is the context block only (unchanged logic).
  - Rate-limited request → `429`, no email sent.
  - Malformed / non-object JSON body → `400` before any field access (unchanged).

## Scope

### In Scope

- Replace the GitHub issue-creation call in `app/api/feedback/route.ts` with an
  email send.
- Add `sendFeedbackEmail(...)` to `lib/email.ts` using the live Mailtrap send API.
- Read recipient from `process.env.FEEDBACK_TO_EMAIL`; add it to `.env.example`.
- Update the success copy in `lib/components/FeedbackModal.tsx` (remove the
  GitHub-issue wording).
- Update the API response contract (`201` with a non-`issueUrl` body) and any
  client code that reads `issueUrl`.
- Update `openspec/specs/feedback-help-menu/spec.md` requirements/scenarios that
  describe GitHub-issue behavior.
- Update unit tests: `tests/unit/app/api/feedback/route.test.ts`,
  `tests/unit/lib/email.test.ts`, `tests/unit/components/FeedbackModal.test.tsx`.

### Out of Scope

- Any change to the NavBar `?` button, its auth gating, or `FeedbackForm` fields.
- Changing the rate-limit policy, storage, or window.
- Retiring the `GITHUB_FEEDBACK_TOKEN` secret from CI/deploy config (can be
  removed operationally later; code will simply stop reading it).
- Adding email templating infrastructure, queuing, or retries beyond a single
  synchronous send.
- Sending a confirmation email to the submitter.
- Localization of the email body.

## What Changes

- `lib/email.ts`: new `sendFeedbackEmail` export; live `client.send` with
  `category: "feedback"`, `reply_to`, subject and text body built from the
  submission.
- `app/api/feedback/route.ts`: drop `GITHUB_FEEDBACK_TOKEN` + `fetch(github)`;
  require `FEEDBACK_TO_EMAIL`; build subject `[Bug] <title>` / `[Feature]
  <title>`; reuse the existing context-block builder for the body; wrap the send
  in try/catch → `502`; return `201 { ok: true }`.
- `lib/components/FeedbackModal.tsx`: success message no longer mentions GitHub;
  stop consuming `issueUrl`.
- `.env.example`: add `# FEEDBACK_TO_EMAIL=` and note it is required for the
  feedback form.
- `openspec/specs/feedback-help-menu/spec.md`: rename/replace the "creates GitHub
  issue" requirement and the "Auto-context in GitHub issue body" requirement with
  email equivalents; update the rate-limit scenario that asserts "no GitHub issue
  is created".
- Tests updated to mock `sendFeedbackEmail` / Mailtrap instead of `global.fetch`
  to GitHub.

## Risks

- Risk: `MAILTRAP_FROM_EMAIL` domain not verified for live sending in prod.
  - Impact: Every feedback submission fails with `502`; feedback still lost.
  - Mitigation: Reuse the exact sender password-reset already uses; call out in
    Open Questions; deploy step should verify a test send.
- Risk: `FEEDBACK_TO_EMAIL` not set in the deployed environment at cutover.
  - Impact: Route returns `503`; regression vs. today only in message, not in
    outcome (feedback already broken).
  - Mitigation: Set the env var in the same PR/deploy; `.env.example` documents
    it; route logs a clear server error.
- Risk: Untrusted submission text (title, description, user-agent, page URL)
  injected into the email.
  - Impact: Header injection or misleading content in the maintainer's inbox.
  - Mitigation: Keep existing `sanitizeIssueText` on user-agent and description;
    keep page-URL restriction; put user text only in the body/`reply_to`
    (validated email), never raw into headers beyond the sanitized subject;
    clamp subject length.
- Risk: Mailtrap live API rate/quota limits under a submission spike.
  - Impact: `502`s for legitimate users.
  - Mitigation: Existing 12/hour/IP rate limit bounds volume; failures are
    surfaced with a retry affordance.

## Open Questions

- Question: Is `MAILTRAP_FROM_EMAIL`'s domain verified for Mailtrap **live**
  sending in production (not just sandbox)?
  - Needed from: requester (maintainer)
  - Blocker for apply: no (implementation proceeds; deploy verification covers it)
- Question: Confirm the deployed `FEEDBACK_TO_EMAIL` value is `dnd@dougis.com`
  and that this env var will be added to the Fly secrets as part of rollout.
  - Needed from: requester (maintainer)
  - Blocker for apply: no (code reads the env var regardless)

No other unresolved ambiguity — the exploration session resolved the recipient
mechanism (env var), sender (unchanged), error handling (catch → `502`), and API
mode (live).

## Non-Goals

- Building a general transactional-email framework.
- Preserving a machine-readable link (`issueUrl`) in the API response.
- Keeping GitHub issue creation as a fallback or dual-write.
- Changing who can submit feedback or how the form looks.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
