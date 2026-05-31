---
name: tests
description: Tests for the username-validation-and-registration change
---

# Tests

## Overview

All work follows strict TDD: write the failing test first, then write the minimum implementation to pass, then refactor.

Test files:
- Unit: `tests/unit/lib/validation/username.test.ts` (new)
- Integration: `tests/integration/api/auth/register.test.ts` (extends existing)
- Integration: `tests/integration/api/auth/me.test.ts` (new or extends existing)

---

## Task 1 — `lib/validation/username.ts`

File: `tests/unit/lib/validation/username.test.ts`

### Happy path

- [x] **Valid username passes** — `validateUsername("doug_42")` returns `{ valid: true, errors: [] }`
  - Spec: `specs/username-validation/spec.md` — Scenario: Valid username passes validation

- [x] **Hyphen and underscore accepted** — `validateUsername("doug-is_cool")` returns `{ valid: true, errors: [] }`
  - Spec: `specs/username-validation/spec.md` — Scenario: Username with hyphen and underscore is accepted

- [x] **Exactly 4 chars accepted** — `validateUsername("abcd")` returns `{ valid: true, errors: [] }`
  - Spec: `specs/username-validation/spec.md` — Scenario: Username of exactly 4 characters is accepted

- [x] **Exactly 20 chars accepted** — `validateUsername("a".repeat(20))` returns `{ valid: true, errors: [] }`
  - Spec: `specs/username-validation/spec.md` — Scenario: Username of exactly 20 characters is accepted

### Length failures

- [x] **3 chars rejected** — `validateUsername("abc")` returns `valid: false` with field `"username"` and a message referencing minimum length
  - Spec: `specs/username-validation/spec.md` — Scenario: Username shorter than 4 characters is rejected

- [x] **21 chars rejected** — `validateUsername("a".repeat(21))` returns `valid: false` with a message referencing maximum length
  - Spec: `specs/username-validation/spec.md` — Scenario: Username longer than 20 characters is rejected

### Charset failures

- [x] **Space rejected** — `validateUsername("doug smith")` returns `valid: false`
  - Spec: `specs/username-validation/spec.md` — Scenario: Username with disallowed characters is rejected

- [x] **`@` rejected** — `validateUsername("doug@site")` returns `valid: false`
  - Spec: `specs/username-validation/spec.md` — Scenario: Username with `@` symbol is rejected

### Reserved words

- [x] **`"admin"` (lowercase) rejected** — returns `valid: false` with reserved message
  - Spec: `specs/username-validation/spec.md` — Scenario: Reserved word `admin` (lowercase) is rejected

- [x] **`"Admin"` (mixed case) rejected** — returns `valid: false`
  - Spec: `specs/username-validation/spec.md` — Scenario: Reserved word `Admin` (mixed case) is rejected

- [x] **`"ADMIN"` (all caps) rejected** — returns `valid: false`
  - Spec: `specs/username-validation/spec.md` — Scenario: Reserved word `ADMIN` (all caps) is rejected

- [x] **All reserved words rejected** — parameterised test over `["root", "system", "support", "moderator", "api", "null", "undefined"]` in lowercase and at least one mixed-case variant each
  - Spec: `specs/username-validation/spec.md` — Scenario: All reserved words are rejected regardless of casing

### Non-string input

- [x] **`null` rejected** — `validateUsername(null)` returns `valid: false` with `field: "username"`
- [x] **`undefined` rejected** — `validateUsername(undefined)` returns `valid: false`
- [x] **Number rejected** — `validateUsername(42)` returns `valid: false`
- [x] **Object rejected** — `validateUsername({})` returns `valid: false`
  - Spec: `specs/username-validation/spec.md` — Scenario: Non-string input is rejected

---

## Task 2 — `app/api/auth/register/route.ts`

File: `tests/integration/api/auth/register.test.ts`

### Happy path

- [x] **Valid registration with username succeeds** — `POST /api/auth/register` with `{ email, password, username: "doug42" }` returns `201` with `{ userId, email, username: "doug42", message }`, and a subsequent `findOne` on the DB shows `username: "doug42"` stored
  - Spec: `specs/username-registration/spec.md` — Scenario: Valid registration with username succeeds

### Missing / invalid username

- [x] **Missing username returns 400** — body without `username` field returns `400`
  - Spec: `specs/username-registration/spec.md` — Scenario: Registration without username is rejected

- [x] **Invalid username (too short) returns 400** — `username: "ab"` returns `400`
  - Spec: `specs/username-registration/spec.md` — Scenario: Registration with invalid username is rejected

- [x] **Reserved username returns 400** — `username: "Admin"` returns `400`
  - Spec: `specs/username-registration/spec.md` — Scenario: Registration with reserved username is rejected

### Uniqueness

- [x] **Duplicate username (same casing) returns 409** — register twice with `username: "doug42"`; second call returns `409` with `{ error: "Username already taken" }`
  - Spec: `specs/username-registration/spec.md` — Scenario: Duplicate username returns 409

- [x] **Same username in different casing is accepted** — register `"Doug42"` then `"doug42"`; both return `201`
  - Spec: `specs/username-registration/spec.md` — Scenario: Same username in different casing is accepted

- [x] **Duplicate email conflict message is distinct from username conflict** — register with same email but different username; response is `409` referencing email, not username
  - Spec: `specs/username-registration/spec.md` — Scenario: Duplicate email is still rejected independently

---

## Task 3 — `app/api/auth/me/route.ts`

File: `tests/integration/api/auth/me.test.ts` (or extend existing login/register test)

### Happy path

- [x] **Authenticated GET returns `username`** — register user with `username: "doug42"`, then `GET /api/auth/me` with the auth cookie returns `200` with `{ authenticated: true, userId, email, isAdmin, username: "doug42" }`
  - Spec: `specs/auth-me/spec.md` — Scenario: Authenticated user receives username in response

### Backward compatibility

- [x] **Existing fields still present** — `GET /api/auth/me` response includes `authenticated`, `userId`, `email`, `isAdmin` unchanged
  - Spec: `specs/auth-me/spec.md` — Scenario: Response shape is backward-compatible

### Auth guard

- [x] **Unauthenticated request returns 401** — `GET /api/auth/me` with no cookie returns `401`
  - Spec: `specs/auth-me/spec.md` — Scenario: Unauthenticated request is still rejected
