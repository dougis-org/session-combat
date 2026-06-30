## GitHub Issues

- dougis-org/session-combat#445

## Why

- Problem statement: Users have no way to report bugs or request features from within the app. They must navigate to GitHub directly, which requires a GitHub account and knowledge of the repo — a barrier most end-users won't cross.
- Why now: The app is growing in users and operational maturity. Capturing user feedback in-context (where the problem is visible) yields higher-quality reports and more actionable feature requests.
- Business/user impact: Reduces friction for feedback submission; all feedback lands directly in the issue tracker where the team already works, with full context (page, user, user-agent) auto-attached.

## Problem Space

- Current behavior: No in-app mechanism to contact the team. Users who encounter bugs or have feature ideas have no path forward within the app.
- Desired behavior: Authenticated users see a `?` button in the top-right NavBar. Clicking opens a modal with a type toggle (Bug Report / Feature Request), a title field, and a description field. On submit, a GitHub issue is created in the project repo via the GitHub API, labeled `bug` or `enhancement`, with auto-attached context (username, email, current page URL, user-agent). The modal shows success/error feedback.
- Constraints:
  - Only visible to authenticated users (auth guard on both UI and API route)
  - Rate limit: 12 submissions per IP per hour, tracked in MongoDB
  - GitHub PAT (`GITHUB_FEEDBACK_TOKEN`) stored as an env var; no client-side token exposure
  - `FeedbackForm` must be a standalone reusable component, not tightly coupled to the modal
- Assumptions:
  - The submitting user's email and username are available from the session
  - The app runs on a single-process container (Fly.io); MongoDB is the only DB
  - The GitHub PAT is scoped to `issues:write` on this repo only
- Edge cases considered:
  - GitHub API failure → show user-facing error, do not swallow silently
  - Rate limit hit → show friendly "too many submissions" message
  - User submits while unauthenticated (race) → 401 from API route
  - Very long descriptions → enforce a character limit on the form (e.g. 2000 chars)

## Scope

### In Scope

- `?` button added to NavBar right side, visible only when authenticated
- `FeedbackModal` component wrapping `FeedbackForm`
- `FeedbackForm` component: type toggle (Bug / Feature), title, description, submit/cancel
- Auto-population: user email, username, current page URL, user-agent (from request headers)
- `POST /api/feedback` API route: auth check, IP rate limiting via MongoDB, GitHub issue creation
- MongoDB `feedbackRateLimits` collection with TTL index for automatic window expiry
- New env var: `GITHUB_FEEDBACK_TOKEN`
- Success and error states in the modal UI

### Out of Scope

- `/help` page (future; `FeedbackForm` is designed to drop in there later)
- Unauthenticated feedback submission
- Email-based issue ingestion
- Admin dashboard for submitted feedback
- Attachment/screenshot uploads
- User notification when their issue is triaged

## What Changes

- `lib/components/NavBar.tsx` — add `?` button (auth-gated, right side, opens modal)
- `lib/components/FeedbackForm.tsx` — new standalone form component
- `lib/components/FeedbackModal.tsx` — new modal wrapping `FeedbackForm`
- `app/api/feedback/route.ts` — new POST route: auth, rate limit, GitHub API call
- `lib/db/feedbackRateLimit.ts` — MongoDB upsert logic for IP rate limiting
- `.env.example` / deployment config — document `GITHUB_FEEDBACK_TOKEN`

## Risks

- Risk: GitHub API token leaked via client-side code
  - Impact: High — could allow anonymous issue creation or repo access
  - Mitigation: Token only used server-side in the API route; never passed to client
- Risk: Spam / abuse before rate limit kicks in
  - Impact: Medium — noisy issue tracker
  - Mitigation: 12/hr IP limit; auth required; issues visible in tracker so easy to close
- Risk: MongoDB rate limit collection grows unbounded
  - Impact: Low — TTL index auto-deletes expired documents
  - Mitigation: Set TTL index on `windowResetAt` field at collection creation
- Risk: GitHub API rate limit (5000 req/hr for authenticated PAT)
  - Impact: Low — app rate limit of 12/hr/IP makes it very unlikely to hit
  - Mitigation: Log GitHub API errors; surface to user as "try again later"

## Open Questions

No unresolved ambiguity remains. All decisions made during exploration:
- Auth required: yes (login required to submit)
- Rate limit: 12/hr per IP, MongoDB-backed
- Storage: MongoDB only (no PostgreSQL)
- Form placement: modal off `?` NavBar button; `FeedbackForm` extracted for reuse
- Auto-context: email, username, page URL, user-agent all included in issue body
- `?` button position: right side of NavBar, adjacent to Logout

## Non-Goals

- Building a general help system or FAQ page
- Replacing GitHub as the issue tracker
- Supporting unauthenticated users submitting feedback
- Providing feedback status tracking to the submitter

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
