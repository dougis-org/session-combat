## GitHub Issue

- dougis-org/session-combat#267 (this change — Part 3 of 3)
- Parent: dougis-org/session-combat#208 (full password reset feature)
- Prerequisite: dougis-org/session-combat#266 (password-reset-api)

## Why

With the API endpoints live, the user-facing pages complete the password reset
flow. These are the two screens a user sees when recovering their account.

## Problem Space

- Users need a way to request a reset link without exposing whether their email
  is registered (the page cannot reveal this either).
- The reset page receives the one-time token via URL query param and must handle
  all failure states gracefully — expired links are the most common real-world case.

## Scope

### In Scope

- `app/forgot-password/page.tsx` — email form, confirmation state, error states.
- `app/reset-password/page.tsx` — new password form, reads `?token=` from URL,
  all error states, redirect on missing token.
- Integration tests for both pages.
- Link from login page to forgot-password page.

### Out of Scope

- Email template design (handled by `lib/email.ts` in Part 1).
- Password strength meter UI (existing `validatePassword` error list is sufficient).
- Magic-link / social recovery flows.

## UX States

### forgot-password page
| State | Display |
|---|---|
| Initial | Email input + submit button |
| Loading | Button disabled + spinner |
| Success (200) | "If an account with that email exists, a reset link has been sent. Check your inbox." |
| Invalid email (400) | Inline field error |
| Rate limited (429) | "Too many requests. Please wait before trying again." |
| Server error (5xx) | Generic error banner |

### reset-password page
| State | Display |
|---|---|
| Missing token in URL | Redirect to `/forgot-password` |
| Initial | New password + confirm password fields + submit |
| Mismatch (client) | "Passwords do not match" before submit |
| Loading | Button disabled + spinner |
| Success (200) | "Password reset successfully. You can now log in." + link to login |
| Invalid/expired token (400) | "This link is invalid or has expired." + link to request new one |
| Weak password (400) | Inline error from API `details` array |
| Rate limited (429) | "Too many requests." |
| Server error (5xx) | Generic error banner |

## Risks

- Token in URL is visible in browser history and server logs. This is standard
  practice for reset flows and acceptable given the 15-minute TTL.

## Non-Goals

- Animated transitions between states.
- Resend-link functionality on the reset page (user returns to forgot-password instead).

## Change Control

Design reference: `openspec/changes/add-password-reset-ability/design.md`.
