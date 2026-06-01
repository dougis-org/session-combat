## GitHub Issues

- #302

## Why

- Problem statement: There is no way for a logged-in user to discover other users by handle. The campaign invite flow (Phase 1d/1e) requires this to add members to a campaign.
- Why now: Issue 302 is the next unblocked sub-issue of Phase 1 (after 1a adds `username` to the User model). The invite flow cannot be built without a user search surface.
- Business/user impact: Without search, DMs have no way to find and invite players by username. It blocks the entire multi-user campaign initiative.

## Problem Space

- Current behavior: There is no `GET /api/users/search` route. User records exist in the `users` collection but are not publicly queryable.
- Desired behavior: Authenticated users can search for other users by a partial username prefix and receive a minimal list of `{ id, username }` pairs — enough to power an invite picker UI.
- Constraints:
  - Must never return PII fields (email, passwordHash, tokenVersion, isAdmin).
  - Must be rate-limited to prevent enumeration attacks.
  - Requires authentication — anonymous access is not permitted.
  - Depends on 1a being complete (all users have a `username`; sparse unique index exists).
- Assumptions:
  - All users have a `username` set (1a backfill complete); no `$exists` filter needed.
  - The sparse unique index on `users.username` from 1a makes prefix regex queries efficient.
  - The caller should not appear in their own search results.
- Edge cases considered:
  - Empty or missing `q` → 400.
  - `q` exceeding max length → 400.
  - No matches → 200 with empty array (not 404).
  - Rate limit exceeded → 429.
  - MongoDB regex injection: query is anchored (`^`) and escaped before use.

## Scope

### In Scope

- `GET /api/users/search?q=<prefix>` route under `app/api/users/search/route.ts`
- Authentication via `withAuth` middleware
- Rate limiting via `checkRateLimit` (20 req/min per userId)
- Prefix search using MongoDB `$regex` on `username` field
- Response shape: `{ results: Array<{ id: string; username: string }> }`
- Input validation: `q` required, length 1–50 chars
- Result cap: 15 results maximum
- Caller excluded from results
- Unit tests for validation and rate-limit logic
- Integration test for the route

### Out of Scope

- Fuzzy/fuse.js search
- Pagination
- Searching by email or display name
- Unauthenticated access
- Admin-only user listing
- Any UI components (invite picker is a separate concern)

## What Changes

- New file: `app/api/users/search/route.ts`
- New file (possibly): `app/api/users/search/` directory
- Test files: unit + integration coverage for the new route

## Risks

- Risk: MongoDB regex injection via `q` parameter
  - Impact: Could match unintended usernames or cause ReDoS
  - Mitigation: Escape special regex characters in `q` before constructing the pattern; anchor with `^`; enforce max length of 50 chars
- Risk: Username enumeration even with rate limiting
  - Impact: An attacker could script requests across multiple authenticated accounts
  - Mitigation: Single-char minimum is acceptable given auth requirement and rate limit; consider increasing if product concern arises
- Risk: Cold-start resets in-memory rate limit state (existing known limitation of `lib/rate-limit.ts`)
  - Impact: Rate limit resets on Fly.io machine stop/start
  - Mitigation: Documented in `lib/rate-limit.ts`; acceptable at current scale

## Open Questions

No unresolved ambiguity. All design decisions confirmed during exploration:
- Min `q` length: 1 character ✓
- Rate limit: 20 req/min per userId ✓
- Username required for all users (no `$exists` filter) ✓
- Prefix query (not fuse.js) ✓

## Non-Goals

- Fuzzy matching or typo tolerance
- Paginated results
- Searching users who have not set a username
- Public (unauthenticated) user discovery
- Exposing any user fields beyond `id` and `username`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
