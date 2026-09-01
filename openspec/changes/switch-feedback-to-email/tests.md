---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `switch-feedback-to-email` change. All work follows strict TDD (fail → pass → refactor). Each case names the file it lives in, the `tasks.md` task it verifies, and the acceptance scenario in `openspec/changes/switch-feedback-to-email/specs/feedback-help-menu/spec.md` it covers.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it and confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping the test green.

Run unit tests with `npm run test:unit`. Mock `mailtrap` (or `@/lib/email`) — no real network calls.

## Test Cases

### T1 — `lib/email.ts` shared sender helper (`tests/unit/lib/email.test.ts`)

- [ ] **T1.1** — `MAILTRAP_FROM_EMAIL` set → `client.send` receives `from.email` equal to that value; no warning logged. _(Task T1; scenario: "POST /api/feedback — sends feedback email" sender clause)_
- [ ] **T1.2** — `MAILTRAP_FROM_EMAIL` unset → `from.email` is `noreply@session-combat.app` and `console.warn` is called once. _(Task T1; same scenario)_
- [ ] **T1.3** — `sendPasswordResetEmail` still sends with the same `from` shape after the refactor (regression). _(Task T1)_

### T2 — `sendFeedbackEmail` (`tests/unit/lib/email.test.ts`)

- [ ] **T2.1** — Given `{ to, replyTo, subject, text }`, `client.send` is called exactly once with `to: [{ email: to }]`, `reply_to: { email: replyTo }`, `category: "feedback"`, `subject`, `text`, and the resolved `from`. _(Task T2; scenario: "Successful bug report submission")_
- [ ] **T2.2** — The invoked method is the live `client.send` (not a sandbox/testing API). _(Task T2; design Decision 1)_
- [ ] **T2.3** — When `client.send` rejects, `sendFeedbackEmail` rejects with that error (no swallow). _(Task T2; scenario: "Modal shows error state on send failure")_
- [ ] **T2.4** — When `MAILTRAP_TOKEN` is unset, calling `sendFeedbackEmail` throws the `getClient()` "MAILTRAP_TOKEN … not set" error. _(Task T2; scenario: "Feedback unavailable when email is not configured")_

### T3 — `buildFeedbackBody` (`tests/unit/app/api/feedback/route.test.ts` or a helper test)

- [ ] **T3.1** — With a description, body contains `**Submitted by:** @username (email@example.com)`, `**Page:** <url>`, `**User-Agent:** <ua>`, then `---`, then the description. _(Task T3; scenario: "Email body includes submitter, page URL, user-agent, description")_
- [ ] **T3.2** — With an empty description, body is the context block only — no trailing `---` and no description. _(Task T3; scenario: "Email body with no description is context-only")_
- [ ] **T3.3** — Rename regression: no symbol named `buildIssueBody` remains; `buildFeedbackBody` produces byte-identical output to the previous `buildIssueBody` for the same inputs. _(Task T3)_

### T4 — `POST /api/feedback` route (`tests/unit/app/api/feedback/route.test.ts`, `@/lib/email` mocked)

- [ ] **T4.1** — Valid `type: "bug"` submission with `FEEDBACK_TO_EMAIL` + `MAILTRAP_TOKEN` set → responds `201` with body `{ ok: true }`; `sendFeedbackEmail` called once; `global.fetch` never called with an `api.github.com` URL. _(Task T4; scenario: "Successful bug report submission")_
- [ ] **T4.2** — `type: "bug"` → subject is `[Bug] <title>`; `type: "feature"` → subject is `[Feature] <title>`. _(Task T4; scenarios: "Successful bug report submission", "Successful feature request submission")_
- [ ] **T4.3** — Title with `\n`, `> @ # [ ] * _`, and length > 200 → subject is `[Bug] ` + cleaned title, total length ≤ 200. _(Task T4; scenario: "Subject line is sanitized and truncated")_
- [ ] **T4.4** — `replyTo` passed to `sendFeedbackEmail` equals `auth.email`. _(Task T4; scenario: "Successful bug report submission")_
- [ ] **T4.5** — `FEEDBACK_TO_EMAIL` unset → `503` `{ error: "Feedback is not available." }`; `sendFeedbackEmail` not called; `console.error` called naming the var. _(Task T4; scenario: "Feedback unavailable when email is not configured")_
- [ ] **T4.6** — `MAILTRAP_TOKEN` unset → `503`; `sendFeedbackEmail` not called (guarded up front). _(Task T4; scenarios: "Feedback unavailable when email is not configured", "Missing email configuration does not cause unhandled exception")_
- [ ] **T4.7** — `sendFeedbackEmail` rejects → `502` `{ error: "Failed to send feedback. Please try again later." }`; error logged; no unhandled rejection. _(Task T4; scenarios: "Modal shows error state on send failure", "Email send error does not cause unhandled exception")_
- [ ] **T4.8** — IP over the 12/hour limit → `429`; `sendFeedbackEmail` not called. _(Task T4; scenario: "Submission rejected at rate limit")_
- [ ] **T4.9** — Under the limit → `sendFeedbackEmail` called (positive rate-limit path). _(Task T4; scenario: "Submission accepted within rate limit")_
- [ ] **T4.10** — Malformed body (non-JSON, array, primitive) → `400` before any field access; `sendFeedbackEmail` not called. _(Task T4; retained validation)_
- [ ] **T4.11** — Missing/blank `title` → `400`; `title` > 200 → `400`; `description` > 2000 → `400`. _(Task T4; retained validation)_
- [ ] **T4.12** — `pageUrl` of `//evil.example`, `http://evil.example`, `javascript:alert(1)` → `**Page:**` line in the email `text` is empty; `https://…` and `/relative` URLs are included. _(Task T4; scenario: "Non-https, non-same-origin page URL is excluded")_
- [ ] **T4.13** — User-Agent header with control chars / newlines → sanitized in the email `text`. _(Task T4; scenario: "Untrusted submission text does not reach email headers")_
- [ ] **T4.14** — Submitter with no GitHub username → `Submitted by` line is the email only. _(Task T4; retained logic)_
- [ ] **T4.15** — Unauthenticated request → `401` before rate-limit check or send. _(Task T4; scenario: "Unauthenticated POST rejected")_
- [ ] **T4.16** — Exactly one outbound call per accepted submission (assert `sendFeedbackEmail` call count === 1 and no other network mock invoked). _(Task T4; NFAC scenario: "One outbound email per accepted submission")_

### T5 — `FeedbackModal` (`tests/unit/components/FeedbackModal.test.tsx`)

- [ ] **T5.1** — `fetch` resolves `201` → success view renders "Your feedback has been sent. Thank you!" and the rendered text contains neither "GitHub" nor "issue". _(Task T5; scenario: "Modal shows success state after submission")_
- [ ] **T5.2** — `fetch` resolves `502` with `{ error }` → error view shows that message plus a "Try Again" control. _(Task T5; scenario: "Modal shows error state on send failure")_
- [ ] **T5.3** — `fetch` resolves `503` → error view shows "Feedback is not available." _(Task T5; scenario: "Feedback unavailable when email is not configured")_
- [ ] **T5.4** — `fetch` resolves `429` → error view shows the rate-limit message. _(Task T5; scenario: "Submission rejected at rate limit")_
- [ ] **T5.5** — Network throw → "Network error…" message with retry (regression, unchanged). _(Task T5)_
- [ ] **T5.6** — After success, the form is not rendered / not editable. _(Task T5; scenario: "Modal shows success state after submission")_

### T6 / T7 — configuration & sweep (verification, not unit tests)

- [ ] **T6.1** — `.env.example` contains a `FEEDBACK_TO_EMAIL` line documented as required. _(Task T6; NFAC scenario: "Misconfiguration is diagnosable from server logs")_
- [ ] **T7.1** — `grep -rn "GITHUB_FEEDBACK_TOKEN" app lib` returns nothing (only tests/docs may mention it, asserting absence). _(Task T7; REMOVED requirement)_
- [ ] **T7.2** — `grep -rn "issueUrl" app lib` returns nothing. _(Task T7; scenario: "Successful bug report submission" — response is `{ ok: true }`)_
- [ ] **T7.3** — Production client bundle inspection (existing bundle-scan test, updated) → `MAILTRAP_TOKEN` and `FEEDBACK_TO_EMAIL` strings/values absent from client JS. _(Task T7; scenario: "Mailtrap token not present in client bundle")_

### Reliability — recovery (`tests/unit/app/api/feedback/route.test.ts`)

- [ ] **R.1** — First call: `sendFeedbackEmail` rejects → `502`. Second call (same inputs, mock now resolves) → `201` `{ ok: true }` and one email sent. _(NFAC scenario: "Recovery after a transient send failure")_

## Traceability summary

| Task | Test cases | Spec scenarios |
|------|-----------|----------------|
| T1 | T1.1–T1.3 | sender clause of "POST /api/feedback — sends feedback email" |
| T2 | T2.1–T2.4 | Successful bug/feature submission; send failure; email not configured |
| T3 | T3.1–T3.3 | Auto-context in feedback email (all 3 scenarios) |
| T4 | T4.1–T4.16, R.1 | all "sends feedback email" scenarios; MODIFIED IP rate limiting; MODIFIED Reliability; MODIFIED Security; NFAC performance/reliability |
| T5 | T5.1–T5.6 | Modal success / error state scenarios |
| T6 | T6.1 | NFAC operability |
| T7 | T7.1–T7.3 | REMOVED GitHub-issue requirement; NFAC security bundle scan |
