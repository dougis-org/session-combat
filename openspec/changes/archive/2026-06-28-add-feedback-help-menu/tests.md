---
name: tests
description: Tests for the add-feedback-help-menu change
---

# Tests

## Overview

Tests for the `add-feedback-help-menu` change. All work follows strict TDD: write a failing test → write code to pass → refactor.

Test files:
- `tests/unit/components/FeedbackForm.test.tsx`
- `tests/unit/components/FeedbackModal.test.tsx`
- `tests/unit/components/NavBar.test.tsx` (updated)
- `tests/unit/app/api/feedback/route.test.ts`
- `tests/unit/db/feedbackRateLimit.test.ts`

## Testing Steps

For each task in `tasks.md`:
1. **Write a failing test** before writing any implementation code
2. **Write the simplest code** to make the test pass
3. **Refactor** while keeping tests green

---

## Test Cases

### Task 1 — feedbackRateLimit.ts

Maps to spec: "IP rate limiting — 12 submissions per hour"

- [ ] **First submission from new IP is allowed**
  - Mock MongoDB; no existing document for IP
  - Call `checkAndIncrementRateLimit('1.2.3.4')`
  - Assert returns `{ allowed: true }`; upsert called with `count: 1`

- [ ] **Submission within limit (count < 12) is allowed**
  - Mock MongoDB; existing document with `count: 5`
  - Call `checkAndIncrementRateLimit('1.2.3.4')`
  - Assert returns `{ allowed: true }`; count incremented

- [ ] **12th submission is allowed**
  - Mock MongoDB; existing document with `count: 11`
  - Call `checkAndIncrementRateLimit('1.2.3.4')`
  - Assert returns `{ allowed: true }`

- [ ] **13th submission is rejected**
  - Mock MongoDB; existing document with `count: 12`
  - Call `checkAndIncrementRateLimit('1.2.3.4')`
  - Assert returns `{ allowed: false }`; no increment attempted

- [ ] **TTL index is ensured on collection init**
  - Mock MongoDB `createIndex`
  - Import `feedbackRateLimit` module
  - Assert `createIndex` called with `{ windowResetAt: 1 }` and `{ expireAfterSeconds: 0 }`

---

### Task 2 — POST /api/feedback route

Maps to spec: "POST /api/feedback — creates GitHub issue"; "Unauthenticated POST rejected"; "GitHub API error does not cause unhandled exception"

- [ ] **Returns 401 when unauthenticated**
  - Mock session as null
  - POST to `/api/feedback`
  - Assert response status 401; GitHub API not called

- [ ] **Returns 429 when rate limit exceeded**
  - Mock session as valid; mock `checkAndIncrementRateLimit` → `{ allowed: false }`
  - POST to `/api/feedback` with valid body
  - Assert response status 429 with message; GitHub API not called

- [ ] **Returns 400 when title is missing**
  - Mock session and rate limit as passing
  - POST with body `{ type: 'bug', title: '', description: 'desc', pageUrl: '/' }`
  - Assert response status 400

- [ ] **Creates GitHub issue for bug report**
  - Mock session, rate limit (allowed), and `fetch` to GitHub API (return 201)
  - POST with `{ type: 'bug', title: 'Something broke', description: 'Details', pageUrl: '/combat' }`
  - Assert `fetch` called with GitHub API URL, `Authorization: Bearer <token>`, body includes label `"bug"`, title `"Something broke"`, and body text contains username, email, `/combat`, user-agent
  - Assert response status 201 with `{ issueUrl }`

- [ ] **Creates GitHub issue for feature request with label "enhancement"**
  - Mock session, rate limit (allowed), and `fetch` to GitHub API (return 201)
  - POST with `{ type: 'feature', title: 'Add dark mode' }`
  - Assert label `"enhancement"` in GitHub API call

- [ ] **Returns 502 on GitHub API failure**
  - Mock session, rate limit (allowed), and `fetch` → 500 from GitHub
  - POST with valid body
  - Assert response status 502 with user-readable error message; no unhandled rejection

- [ ] **GITHUB_FEEDBACK_TOKEN not present in response body or error**
  - Mock GitHub API failure
  - POST and capture response body
  - Assert response body does not contain the token value

---

### Task 3 — FeedbackForm component

Maps to spec: "FeedbackForm — type toggle, title, description"

- [ ] **Renders with Bug Report selected by default**
  - Render `<FeedbackForm onSubmit={jest.fn()} onCancel={jest.fn()} />`
  - Assert Bug Report toggle is in selected/active state

- [ ] **Toggle switches to Feature Request**
  - Render form; click Feature Request button
  - Assert Feature Request is selected; Bug Report is not

- [ ] **Submit button is disabled when title is empty**
  - Render form; title field is empty
  - Assert submit button has `disabled` attribute

- [ ] **Submit button enabled when title is non-empty**
  - Render form; type into title field
  - Assert submit button is not disabled

- [ ] **Description enforces 2000 character limit**
  - Render form; inspect description textarea
  - Assert `maxLength` attribute is 2000

- [ ] **onSubmit called with correct data**
  - Render form; select Feature Request; fill title and description; click Submit
  - Assert `onSubmit` called with `{ type: 'feature', title: '...', description: '...', pageUrl: expect.any(String) }`

- [ ] **onCancel called when Cancel clicked**
  - Render form; click Cancel
  - Assert `onCancel` called once

- [ ] **Submit button disabled when isSubmitting is true**
  - Render `<FeedbackForm onSubmit={jest.fn()} onCancel={jest.fn()} isSubmitting={true} />`
  - Fill title; assert submit button is still disabled

---

### Task 4 — FeedbackModal component

Maps to spec: "FeedbackModal opens on help button click"; "Modal shows success state"; "Modal shows error state"

- [ ] **Renders FeedbackForm when open**
  - Render `<FeedbackModal isOpen={true} onClose={jest.fn()} />`
  - Assert FeedbackForm is present in the DOM

- [ ] **Does not render form content when closed**
  - Render `<FeedbackModal isOpen={false} onClose={jest.fn()} />`
  - Assert FeedbackForm is not visible (or modal is not in DOM)

- [ ] **Shows success state after successful submission**
  - Mock `fetch` to return 201
  - Render modal open; fill form; submit
  - Assert success confirmation message is displayed; form inputs are gone

- [ ] **Shows error state on API failure**
  - Mock `fetch` to return 502 with error message
  - Render modal open; fill form; submit
  - Assert error message is displayed

- [ ] **Calls onClose when Close clicked from success state**
  - Reach success state; click Close button
  - Assert `onClose` called

- [ ] **onClose called on Cancel from form state**
  - Render modal open; click Cancel in form
  - Assert `onClose` called

---

### Task 5 — NavBar (updated)

Maps to spec: "NavBar help button — auth-gated"; "MODIFIED NavBar — authenticated nav element set"

- [ ] **`?` button present when authenticated**
  - Render NavBar with `isAuthenticated: true, loading: false`
  - Assert element with `data-testid="feedback-button"` is in the DOM

- [ ] **`?` button absent when not authenticated**
  - Render NavBar with `isAuthenticated: false, loading: false`
  - Assert no `data-testid="feedback-button"` in the DOM

- [ ] **`?` button absent while loading**
  - Render NavBar with `isAuthenticated: true, loading: true`
  - Assert no `data-testid="feedback-button"` in the DOM

- [ ] **Clicking `?` opens FeedbackModal**
  - Render NavBar authenticated; click `data-testid="feedback-button"`
  - Assert FeedbackModal is now visible

- [ ] **Modal closes when onClose triggered**
  - Open modal via `?` click; trigger `onClose` (e.g. click Cancel)
  - Assert FeedbackModal is no longer visible
