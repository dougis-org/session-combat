## Context

- API endpoints (`POST /api/auth/password/forgot`, `POST /api/auth/password/reset`) available from Part 2 (#266).
- Existing UI: Next.js App Router, Tailwind CSS, existing login page at `app/login/page.tsx`.
- Parent design decisions (D1–D7) in `openspec/changes/add-password-reset-ability/design.md`.

## Goals / Non-Goals

### Goals

- Implement the two user-facing pages that complete the password reset flow.
- Handle all UX states gracefully, including the most common real-world case (expired link).

### Non-Goals

- Email template design (handled by `lib/email.ts` in Part 1).
- Password strength meter UI (existing `validatePassword` error list is sufficient).
- Animated state transitions.
- Resend-link functionality on the reset page.

## Decisions

### D-U1: forgot-password page — stateless email form with confirmation state

- **Chosen:** Single-page component with `idle | loading | success | error` state. On success (200), replace form with confirmation message. On error, show inline or banner message per state table in proposal.
- **Alternatives considered:** Separate confirmation page (extra route, unnecessary complexity).
- **Rationale:** Simpler; one route, one component, all states handled inline.
- **Trade-offs:** None material.

### D-U2: reset-password page — server component extracts token; client component renders form

- **Chosen:** `app/reset-password/page.tsx` is a **server component** (no `'use client'`). It receives `searchParams` as a prop, awaits the token, and calls `redirect('/forgot-password')` server-side if the token is missing. It then renders `<ResetPasswordForm token={token} />`, a co-located client component at `app/reset-password/ResetPasswordForm.tsx` that receives the token as a prop.
- **Alternatives considered:**
  - `useSearchParams()` in a `'use client'` page wrapped in `<Suspense>` — works but redirect happens client-side after hydration, causing a flash before navigation.
  - Hash-based token — less conventional for Next.js App Router.
- **Rationale:** No `useSearchParams()` is used anywhere in UI pages in this codebase; there is no established Suspense pattern to follow. The server component approach avoids both the Suspense boilerplate and the client-side redirect flash. Server-side redirect on missing token is instant with no visible intermediate state.
- **Trade-offs:** Two files instead of one. Component location follows the existing `app/campaigns/CampaignEditor.tsx` co-location precedent — page-local components live alongside their page, not in `lib/components/`.

### D-U3: Client-side confirm-password validation before submit

- **Chosen:** Validate password === confirmPassword in the submit handler before calling the API. Show "Passwords do not match" inline without a round-trip.
- **Rationale:** Improves UX; avoids unnecessary API calls.
- **Trade-offs:** None.

### D-U4: Success state on reset page — message + link to login

- **Chosen:** On 200 response, replace form with "Password reset successfully. You can now log in." and a link to `/login`.
- **Rationale:** Clear completion state; avoids auto-redirect which could confuse users.
- **Trade-offs:** None.

### D-U5: Login page link to forgot-password

- **Chosen:** Add "Forgot password?" link below the login form pointing to `/forgot-password`.
- **Rationale:** Discoverability — users need an obvious path from the login screen.
- **Trade-offs:** Minor login page change; low risk.

## Proposal to Design Mapping

- Forgot page UX states → D-U1.
- Reset page token handling → D-U2.
- Client-side mismatch check → D-U3.
- Reset success UX → D-U4.
- Login page discoverability → D-U5.

## Functional Requirements Mapping

- Forgot page: renders email form; on 200 shows confirmation; on 400 shows field error; on 429 shows rate-limit message → D-U1.
- Reset page: redirects to `/forgot-password` if no token in URL (server-side, via `redirect()` in server component) → D-U2.
- Reset page: validates password match client-side before submit → D-U3.
- Reset page: on 200 shows success + login link → D-U4.
- Login page: has "Forgot password?" link → D-U5.

## Non-Functional Requirements Mapping

- **Security:** Token only in URL param, never stored in component state beyond what's needed for the API call.
- **Accessibility:** Error messages associated with form fields via aria-describedby or similar; buttons disabled during loading.
- **Operability:** All API error states have user-visible messages; no silent failures.

## Risks / Trade-offs

- Token in browser history (D-U2) — mitigated by 15-minute TTL and one-time-use token.
- `useSearchParams()` requires a Suspense boundary in Next.js App Router — must wrap reset page in `<Suspense>` or use a client component pattern.

## Rollback / Mitigation

- Rollback trigger: UI defect or security finding in page behavior.
- Rollback steps: remove `app/forgot-password/page.tsx` and `app/reset-password/page.tsx`; revert login page change.
- Data migration: none.
- Verification after rollback: routes return 404; login page has no forgot link.

## Operational Blocking Policy

- If CI checks fail: fix, commit, push; do not merge with failing checks.
- If security checks fail: remediate before merge.
- If required reviews are blocked/stale: escalate to maintainer within 24 h.

## Open Questions

None.
