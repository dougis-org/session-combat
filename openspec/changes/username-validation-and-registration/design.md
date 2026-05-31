## Context

- **Relevant architecture:** Next.js API routes under `app/api/auth/`. Validation helpers follow the module pattern in `lib/validation/` (`core.ts`, `dnd.ts`, `password.ts`). The `User` interface lives in `lib/types.ts`. MongoDB access is via `lib/db.ts` and `lib/permissions.ts`.
- **Dependencies:** 1a (`add-username-to-user-model`) is merged — `username?: string` exists on `User`, the sparse case-sensitive unique index is in place, all 4 prod users have usernames from the backfill.
- **Interfaces/contracts touched:**
  - `POST /api/auth/register` — request body gains required `username` field
  - `GET /api/auth/me` — response body gains `username` field
  - New export: `lib/validation/username.ts` → `validateUsername()`

## Goals / Non-Goals

### Goals

- Enforce username rules (length, charset, reserved words) in a reusable validation module
- Require username at registration and store it on the user document
- Surface clean, actionable errors for invalid/duplicate usernames
- Return username from `GET /api/auth/me`

### Non-Goals

- Username editing (`PATCH /api/auth/me`)
- Registration UI form changes
- User search endpoint (1c)

## Decisions

### Decision 1: Validation in a dedicated `lib/validation/username.ts` module

- **Chosen:** New file `lib/validation/username.ts` exporting `validateUsername(value: unknown): ValidationResult` following the same pattern as `lib/validation/password.ts`.
- **Alternatives considered:** Inline validation inside the register route handler.
- **Rationale:** Keeps the route handler thin; makes the validation independently testable; consistent with the project's existing validation layer. The user search endpoint (1c) may also reuse this function.
- **Trade-offs:** One more file, but the consistency payoff is clear.

### Decision 2: Reserved word matching is case-insensitive

- **Chosen:** Compare `value.toLowerCase()` against the reserved word list. The stored value retains its original casing.
- **Alternatives considered:** Store a normalised lower-case copy for comparison only.
- **Rationale:** The reserved word list is a blocklist, not a uniqueness index. Case-insensitive matching prevents trivially bypassing it with `Admin` or `ADMIN`.
- **Trade-offs:** None significant — simple `.toLowerCase()` comparison at validation time.

### Decision 3: Uniqueness enforced at DB layer; 11000 mapped in register route

- **Chosen:** Rely on the existing sparse unique index. Catch `MongoServerError` with code 11000 in the register route and check `error.keyPattern` to identify which field caused the conflict; return `409 { error: 'Username already taken' }`.
- **Alternatives considered:** Pre-check uniqueness with a `findOne` before insert.
- **Rationale:** Pre-check is racy under concurrent registration. The index guarantee is authoritative. We already check email with `findOne` before insert (legacy pattern); we do not replicate that for username — the index is enough.
- **Trade-offs:** The 11000 handler must distinguish username vs. email conflicts — handled via `keyPattern`.

### Decision 4: `GET /api/auth/me` reads `username` from the already-fetched user document

- **Chosen:** The route already calls `getUserById` to determine `isAdmin`. Read `username` from that same result and include it in the response.
- **Alternatives considered:** Decode username from the JWT token.
- **Rationale:** The JWT does not include `username` (and we don't want to re-issue tokens). The DB fetch is already happening; no extra round-trip needed.
- **Trade-offs:** None — the fetch cost is unchanged.

### Decision 5: Length bounds 4–20, charset `[a-zA-Z0-9_-]`

- **Chosen:** Min 4, max 20. Allowed characters: ASCII letters (upper and lower), digits, underscore, hyphen. No spaces. No other special characters.
- **Alternatives considered:** 3–30 range; allowing dots.
- **Rationale:** 4 characters is sufficient to prevent trivially short handles while allowing short but meaningful ones. 20 keeps usernames scannable in UI contexts. The charset matches common platform conventions and is URL-safe.
- **Trade-offs:** Users cannot have purely numeric usernames shorter than 4 characters; acceptable given the 4 prod user constraint.

### Decision 6: Reserved word list (initial)

- **Chosen:** `["admin", "root", "system", "support", "moderator", "api", "null", "undefined"]` — compared case-insensitively.
- **Alternatives considered:** Regex pattern, external config file.
- **Rationale:** A small hardcoded list in the validation module is simple and auditable. It can be extended as an array constant without structural change.
- **Trade-offs:** Must be updated in code; acceptable for now given the small list.

## Proposal to Design Mapping

- Proposal element: New `lib/validation/username.ts`
  - Design decision: Decision 1 (dedicated module)
  - Validation approach: Unit tests in `tests/unit/lib/validation/username.test.ts`

- Proposal element: Case-sensitive uniqueness
  - Design decision: Decision 3 (DB index layer), Decision 5 (charset/length)
  - Validation approach: Integration test — two users with same username rejected; same username different casing accepted

- Proposal element: Reserved words matched case-insensitively
  - Design decision: Decision 2
  - Validation approach: Unit tests cover `"admin"`, `"Admin"`, `"ADMIN"` all failing validation

- Proposal element: `POST /api/auth/register` extended
  - Design decision: Decisions 3, 5, 6
  - Validation approach: Integration tests — missing username 400, invalid username 400, duplicate username 409, valid username 201

- Proposal element: `GET /api/auth/me` returns username
  - Design decision: Decision 4
  - Validation approach: Integration test — authenticated GET returns `username` field

## Functional Requirements Mapping

- Requirement: `validateUsername()` rejects values outside 4–20 characters
  - Design element: Decision 5; `lib/validation/username.ts`
  - Acceptance criteria reference: username-validation spec
  - Testability notes: Unit test boundary values (3, 4, 20, 21 chars)

- Requirement: `validateUsername()` rejects characters outside `[a-zA-Z0-9_-]`
  - Design element: Decision 5; regex `/^[a-zA-Z0-9_-]+$/`
  - Acceptance criteria reference: username-validation spec
  - Testability notes: Unit test spaces, dots, `@`, `#`, unicode

- Requirement: `validateUsername()` rejects reserved words regardless of casing
  - Design element: Decision 2, Decision 6
  - Acceptance criteria reference: username-validation spec
  - Testability notes: Unit test each reserved word and mixed-case variants

- Requirement: Register rejects missing username with 400
  - Design element: Decision 1 (validation called before DB insert)
  - Acceptance criteria reference: username-registration spec
  - Testability notes: Integration test — omit username field from body

- Requirement: Register rejects duplicate username with 409
  - Design element: Decision 3 (11000 catch)
  - Acceptance criteria reference: username-registration spec
  - Testability notes: Integration test — register same username twice

- Requirement: `GET /api/auth/me` response includes `username`
  - Design element: Decision 4
  - Acceptance criteria reference: auth-me spec
  - Testability notes: Integration test — register then GET /api/auth/me

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Duplicate username under concurrent registration does not corrupt data
  - Design element: Decision 3 — DB-level unique index is the authoritative guard
  - Acceptance criteria reference: username-registration spec (duplicate scenario)
  - Testability notes: Not directly testable in unit/integration suite; covered by design rationale

- Requirement category: security
  - Requirement: Reserved words cannot be used as usernames regardless of casing
  - Design element: Decision 2, Decision 6
  - Acceptance criteria reference: username-validation spec
  - Testability notes: Unit test case-insensitive matching for each reserved word

## Risks / Trade-offs

- Risk/trade-off: `keyPattern` inspection to distinguish 11000 on email vs. username requires knowing exact index field names.
  - Impact: If field name in keyPattern doesn't match expectation, wrong error message surfaced.
  - Mitigation: Test covers the duplicate-username 409 path explicitly in integration tests.

- Risk/trade-off: 4 prod users already have usernames. If any prod username violates the new validation rules (e.g., fewer than 4 chars), those are now unreachable via normal registration but are still valid in the DB.
  - Impact: Very low — the backfill derived from email local-parts which are virtually always ≥4 chars.
  - Mitigation: No action needed; existing usernames are grandfathered.

## Rollback / Mitigation

- **Rollback trigger:** Regression in register or auth flows detected post-deploy.
- **Rollback steps:** Revert the commit; no DB migration needed (the `username` field and index pre-exist from 1a).
- **Data migration considerations:** None — this change only adds required validation at the API layer. Existing user documents are unaffected.
- **Verification after rollback:** Run `npm run test:unit` and integration auth tests; verify `POST /api/auth/register` accepts `{ email, password }` without username.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing tests or type errors before re-review.
- **If security checks fail:** Do not merge. Codacy/lint issues must be resolved; no `// eslint-disable` bypasses without justification.
- **If required reviews are blocked/stale:** Re-request review after 24 hours; escalate to repo owner after 48 hours.
- **Escalation path and timeout:** Tag `@dougis` directly if blocked for more than 48 hours.

## Open Questions

No open questions — all design decisions were resolved during the explore session prior to this proposal.
