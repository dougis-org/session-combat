---
name: tests
description: Tests for the user-search-endpoint change
---

# Tests

## Overview

This document outlines the tests for the `user-search-endpoint` change. All work follows strict TDD: write a failing test, make it pass with the simplest code, then refactor.

Test files:
- Unit: `app/api/users/search/__tests__/route.unit.test.ts`
- Integration: `app/api/users/search/__tests__/route.integration.test.ts`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — capture the requirement before writing implementation code; run it and confirm it fails
2. **Write code to pass the test** — minimal implementation to make it green
3. **Refactor** — clean up while keeping tests green

---

## Test Cases

### Task 2 — Input validation (unit)

- [ ] Missing `q` param → `checkRateLimit` not called; response is 400
  - Spec: specs/search.md — "Missing q parameter"
- [ ] Empty string `q=""` → response is 400
  - Spec: specs/search.md — "Empty q parameter"
- [ ] `q` with length 51 → response is 400
  - Spec: specs/search.md — "q exceeds maximum length"
- [ ] `q` with length 50 → passes validation (no 400)
  - Spec: specs/search.md — "q at maximum length (boundary)"
- [ ] `q` with length 1 → passes validation (no 400)
  - Spec: specs/search.md — "Single character query"

### Task 3 — Rate limiting (unit)

- [ ] `checkRateLimit` throws `RateLimitError` → response is 429
  - Spec: specs/search.md — "Rate limit exceeded"
- [ ] `checkRateLimit` does not throw → request proceeds past rate-limit check
  - Spec: specs/search.md — "Under rate limit"

### Task 4 — Regex escaping (unit)

- [ ] `q = ".*"` → escaped to `\.\*`; regex does not match all usernames
  - Spec: specs/search.md — "Metacharacter in query"
- [ ] `q = "(test"` → escaped to `\(test`; treated as literal
  - Spec: specs/search.md — "Metacharacter in query"
- [ ] `q = "doug"` (no metacharacters) → unchanged; regex is `^doug`
  - Spec: specs/search.md — "Successful prefix search"

### Task 5 — Integration tests

- [ ] Authenticated GET with `?q=dou` returns users whose username starts with "dou" (case-insensitive)
  - Spec: specs/search.md — "Successful prefix search"
- [ ] Authenticated GET where no usernames match `q` → 200 with `{ results: [] }`
  - Spec: specs/search.md — "No matches"
- [ ] Caller's own username matches `q` → caller not present in results
  - Spec: specs/search.md — "Caller matches search prefix"
- [ ] 20+ users match `q` → exactly 15 results returned
  - Spec: specs/search.md — "Result cap at 15"
- [ ] Each result object has only `id` and `username` keys (no email, passwordHash, etc.)
  - Spec: specs/search.md — "Response shape enforcement"
- [ ] Unauthenticated request (no token) → 401
  - Spec: specs/search.md — "No auth token" / "No session token"
- [ ] Single-char `q` → valid; returns matching users
  - Spec: specs/search.md — "Single character query"
