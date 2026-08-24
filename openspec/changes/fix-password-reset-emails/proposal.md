## GitHub Issues

- #544

## Why

- Problem statement: Password reset emails are not being sent when users request them, likely due to background promise execution being aborted by the Next.js serverless environment. Additionally, case sensitivity on emails and missing Mailtrap tokens silently fail.
- Why now: Users are currently unable to reset their passwords, leading to locked-out accounts.
- Business/user impact: High friction for returning users, increased support burden, and potential loss of user retention if they cannot access their accounts.

## Problem Space

- Current behavior: When a user requests a password reset, the server immediately returns a success message (to prevent enumeration). Background tasks for storing the token and sending the email via Mailtrap are spawned but often killed by the serverless environment before completion. The database lookup is case-sensitive, silently failing if email casing does not exactly match. 
- Desired behavior: 
  - Background tasks (like email sending) must reliably complete.
  - The email lookup should match user accounts insensitively to casing.
  - Missing Mailtrap configurations should be logged gracefully or surfaced properly if possible, but at least the background task must not be preempted.
- Constraints: 
  - Must avoid timing attacks (cannot wait synchronously for the email to send before returning the 200 OK, as this reveals if an email is registered).
- Assumptions: 
  - The app runs in a Next.js environment that supports `waitUntil` or similar for background execution, or we need an alternative like a queue.
- Edge cases considered: 
  - Missing `MAILTRAP_TOKEN` environment variable.
  - Users typing email with different casing than registration.

## Scope

### In Scope

- Fixing the early termination of the background email sending promise.
- Updating the email lookup to be case-insensitive for the password reset form.
- Adding clearer logging when Mailtrap fails or is misconfigured.

### Out of Scope

- Implementing a full background job queue (e.g., BullMQ) if a simpler Next.js native solution exists.
- Refactoring the entire authentication flow.

## What Changes

- Use `waitUntil` (or an appropriate Next.js construct) to ensure the `sendPasswordResetEmail` and `storeResetToken` promises complete before the serverless function spins down.
- Update the MongoDB query in the forgot password route to perform a case-insensitive search for the user's email.
- Ensure `MAILTRAP_TOKEN` absence is caught without breaking the response flow but prominently logged.

## Risks

- Risk: Case-insensitive email queries might be slow without an appropriate index.
  - Impact: Potential slow down or DOS vulnerability if the collection grows large.
  - Mitigation: Ensure there is a case-insensitive index on the email field, or use regex cautiously if the collection is small.

## Open Questions

- Question: Does the hosting environment (e.g. Vercel) support `NextResponse` with `waitUntil` (via `import { waitUntil } from '@vercel/functions'` or `NextRequest.waitUntil`)? 
  - Needed from: User
  - Blocker for apply: yes

## Non-Goals

- Migrating off Mailtrap to another email provider.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
