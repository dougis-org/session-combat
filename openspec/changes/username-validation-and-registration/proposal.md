## GitHub Issues

- #301
- #293

## Why

- **Problem statement:** Users currently register with only email and password. There is no username field collected or validated at registration. The `username` field exists on the `User` model (added in 1a) and a sparse unique index is in place, but nothing populates it at account creation time, and there are no rules governing what constitutes a valid username.
- **Why now:** Issue #301 is the next sub-issue in Phase 1 (Identity & Membership). It directly depends on 1a (which is merged). The username must exist and be valid before user search (#301 1c) and campaign membership (#301 1d/1e) can be built.
- **Business/user impact:** Without this, users have no searchable handle. Campaign membership (the Phase 1 goal) cannot work.

## Problem Space

- **Current behavior:** `POST /api/auth/register` accepts `{ email, password }` only. No username is stored. `GET /api/auth/me` returns `{ authenticated, userId, email, isAdmin }` — no username.
- **Desired behavior:** Registration requires a valid username. `GET /api/auth/me` returns the username. Invalid or duplicate usernames are rejected with actionable error messages.
- **Constraints:**
  - The sparse unique index on `users.username` is already in place (case-sensitive).
  - 4 production users already have usernames assigned via the backfill script (1a). No migration needed.
  - Username is immutable after registration (editable via future enhancement only).
- **Assumptions:**
  - Case-sensitive uniqueness is correct: `"Doug"` and `"doug"` are distinct valid usernames.
  - Reserved words are matched case-insensitively: `"Admin"`, `"ADMIN"`, and `"admin"` are all blocked.
  - The validation module follows the existing pattern in `lib/validation/`.
- **Edge cases considered:**
  - Duplicate username race condition: handled by the DB unique index returning code 11000, caught and mapped to a 409 response.
  - Reserved words with mixed casing (e.g., `"AdMiN"`) must be blocked.
  - Username at or exactly at length boundaries (4 and 20 chars) must be accepted.
  - Username one character short of minimum (3 chars) must be rejected.

## Scope

### In Scope

- New `lib/validation/username.ts` module with `validateUsername()` covering length (4–20), charset (alphanumeric + `-` + `_`), and reserved word rules.
- `POST /api/auth/register` extended to accept and require `username`, validate it, and store it.
- Duplicate username at registration returns a clean 409 with a readable error message.
- `GET /api/auth/me` extended to return `username` in the response body.
- Unit tests for `validateUsername()`.
- Integration tests for the updated register and me endpoints.

### Out of Scope

- Username editing / `PATCH /api/auth/me` (future enhancement).
- Username display in the UI / profile page.
- User search endpoint (`GET /api/users/search`) — that is issue #301 1c.
- Registration UI updates to the `app/register/page.tsx` form (separate concern; not blocking backend work).

## What Changes

- **New file:** `lib/validation/username.ts` — exports `validateUsername(value: unknown): ValidationResult`
- **Modified:** `app/api/auth/register/route.ts` — reads `username` from body, validates, checks 11000 on insert, stores on user document
- **Modified:** `app/api/auth/me/route.ts` — fetches user document and includes `username` in GET response

## Risks

- Risk: Register route currently does not fetch the full user document after insert; returning `username` from the request body is safe since it was just validated and stored.
  - Impact: Low — no extra DB read needed on the happy path.
  - Mitigation: Pass `username` through from the validated request body in the response.

- Risk: The 11000 duplicate key error could theoretically fire on `email` (already checked above) rather than `username`.
  - Impact: Medium — wrong error message surfaced.
  - Mitigation: Inspect the error's `keyPattern` or `keyValue` to distinguish which field caused the conflict.

- Risk: `GET /api/auth/me` currently fetches the user only to determine `isAdmin`. Adding `username` to the response means it must also be read from the fetched document.
  - Impact: Low — the fetch is already happening.
  - Mitigation: Read `username` from the same `getUserById` result.

## Open Questions

No unresolved ambiguity exists. All decisions were made during explore session:
- Case sensitivity: case-sensitive (aligned with 1a index)
- Reserved word matching: case-insensitive
- Length bounds: 4 min, 20 max
- Username at registration: required
- PATCH endpoint: deferred to future enhancement
- GET /api/auth/me: extended to return username

## Non-Goals

- Username change / edit flow
- Admin-side username management
- Username display in any UI component
- Rate-limiting the register endpoint (separate concern)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
