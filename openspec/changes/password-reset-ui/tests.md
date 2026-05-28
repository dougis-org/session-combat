---
name: tests
description: Test plan for password-reset-ui
---

# Tests

## Scope

Integration tests for both pages. Mock the API responses at the fetch boundary
to exercise all UX states without requiring a live backend.

## Planned test cases

### `app/forgot-password/page.tsx`
- [ ] Integration: page renders with email input and submit button.
- [ ] Integration: submitting a valid email → confirmation message shown; form hidden.
- [ ] Integration: submitting an invalid email format → inline field error shown.
- [ ] Integration: API returns 429 → rate-limit message shown.
- [ ] Integration: API returns 500 → generic error banner shown.
- [ ] Integration: submit button is disabled while request is in-flight.

### `app/reset-password/page.tsx`
- [ ] Integration: page with valid `?token=abc` renders new password form.
- [ ] Integration: page with no `?token=` redirects to `/forgot-password` (server-side redirect — response is a 307/308, not a rendered page).
- [ ] Integration: confirm password mismatch shows client-side error before submit.
- [ ] Integration: API returns 200 → success message and login link shown.
- [ ] Integration: API returns 400 (invalid token) → "link is invalid or expired" message shown with link to forgot-password.
- [ ] Integration: API returns 400 with `details` (weak password) → inline validation errors shown.
- [ ] Integration: API returns 429 → rate-limit message shown.
- [ ] Integration: submit button disabled while request is in-flight.
