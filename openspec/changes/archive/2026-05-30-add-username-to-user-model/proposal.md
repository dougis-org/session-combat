## GitHub Issues

- dougis-org/session-combat#300
- dougis-org/session-combat#293 (parent epic: Phase 1 — Identity & membership foundations)

## Why

- Problem statement: Users have no searchable handle beyond email. The multi-user campaigns initiative (Phase 1) requires a unique `username` field so users can be found and invited to campaigns without exposing email addresses.
- Why now: This is the foundational sub-issue (1a) that all other Phase 1 work depends on — user search, campaign membership, and access control all build on username existing in the model.
- Business/user impact: Enables player discovery and invitation flows. Without it, Phase 1 cannot proceed.

## Problem Space

- Current behavior: `User` has `email`, `passwordHash`, `tokenVersion`, `isAdmin`, `createdAt`, `updatedAt`. No username field exists. The `users` collection has a unique index only on `email`.
- Desired behavior: `User` gains an optional `username?: string` field. MongoDB enforces uniqueness (case-sensitive) via a sparse index. Existing users are backfilled with a username derived from their email local-part.
- Constraints: Only 4 users exist in production; scale is not a concern. Usernames are case-sensitive (`Doug` ≠ `doug`). `AuthPayload` is not touched — username does not enter the JWT in this issue.
- Assumptions: Email local-part is an acceptable default username. Collision de-duplication via `-2`/`-3` suffix is acceptable.
- Edge cases considered: Email local-part collisions (two users share a local-part); backfill re-runs (must skip already-assigned users); `null` vs absent field (field must be absent, not `null`, for sparse index to skip it).

## Scope

### In Scope

- Add `username?: string` to the `User` interface in `lib/types.ts`
- Add sparse unique case-sensitive index on `users.username` in `lib/db.ts` (isolated try/catch, mirrors email index pattern)
- One-shot backfill script `scripts/backfill-usernames.ts` — assigns email local-part, de-dupes with `-2`/`-3` suffix, idempotent (skips docs where username already exists)

### Out of Scope

- Username validation, set/edit UI (issue 1b)
- User search endpoint (issue 1c)
- `AuthPayload` changes — username stays out of the JWT for now
- Any frontend changes

## What Changes

- `lib/types.ts`: `username?: string` added to `User` interface
- `lib/db.ts`: sparse unique index creation in `initializeDatabase()` for `users.username`
- `scripts/backfill-usernames.ts`: new standalone migration script (run once via `ts-node`)

## Risks

- Risk: Sparse index with explicit `null` stored vs field absent
  - Impact: If backfill writes `null` instead of omitting the field, two `null` docs would collide on the unique index in older MongoDB versions
  - Mitigation: Backfill uses `$exists: false` filter and `$set: { username: <value> }` — never sets `null`

- Risk: Email local-part contains characters invalid for display (e.g. `+`, `.`)
  - Impact: Cosmetically odd usernames (e.g. `doug+test`)
  - Mitigation: Accepted for now; issue 1b (validation/edit) will allow users to change their username

- Risk: Index creation fails on existing duplicate usernames
  - Impact: `initializeDatabase` would warn but not crash (isolated try/catch)
  - Mitigation: With 4 users and a fresh field, duplicates are impossible before backfill runs

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- Case-sensitive index: confirmed
- Collision strategy (`-2`/`-3` suffix): confirmed
- `AuthPayload` untouched: confirmed
- One-shot script via `ts-node`: confirmed

## Non-Goals

- Username uniqueness enforcement in application code (the DB index handles it)
- Username format validation (deferred to issue 1b)
- Exposing username in JWT/session tokens (deferred to later phase)
- Bulk migration tooling or rollback scripts (4 prod users, one-shot is sufficient)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
