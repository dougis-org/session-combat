# http-utils Specification

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## ADDED Requirements

### Requirement: ADDED calculateBackoffMs computes exponential backoff

The system SHALL return the minimum of `1000 * 2^attempt` and `MAX_BACKOFF_MS` (10 000 ms) when no `Retry-After` header value is provided.

#### Scenario: Backoff grows exponentially with attempt number

- **Given** no Retry-After header value (undefined or null)
- **When** `calculateBackoffMs(attempt)` is called with attempt 0, 1, 2, 3, 4
- **Then** the returned values are 1000, 2000, 4000, 8000, 10000 ms respectively

#### Scenario: Backoff caps at MAX_BACKOFF_MS

- **Given** no Retry-After header value
- **When** `calculateBackoffMs(attempt)` is called with attempt 4 or higher
- **Then** the returned value is exactly 10 000 ms (never exceeds cap)

---

### Requirement: ADDED calculateBackoffMs respects Retry-After header

The system SHALL parse a `Retry-After` header string as seconds and convert to milliseconds, capped at `MAX_BACKOFF_MS`.

#### Scenario: Retry-After value within cap

- **Given** a Retry-After header value of `"5"`
- **When** `calculateBackoffMs(0, "5")` is called
- **Then** the returned value is 5000 ms

#### Scenario: Retry-After value exceeds cap

- **Given** a Retry-After header value of `"30"` (30 000 ms > MAX_BACKOFF_MS)
- **When** `calculateBackoffMs(0, "30")` is called
- **Then** the returned value is 10 000 ms (capped)

#### Scenario: Retry-After value of zero

- **Given** a Retry-After header value of `"0"`
- **When** `calculateBackoffMs(0, "0")` is called
- **Then** the returned value is 0 ms

---

### Requirement: ADDED handleRateLimitResponse sleeps and signals retry when retries remain

The system SHALL wait for the calculated backoff duration and return `true` when `attempt < retries`.

#### Scenario: Mid-sequence 429 triggers sleep and retry signal

- **Given** a 429 response with no Retry-After header, attempt=0, retries=3
- **When** `handleRateLimitResponse(response, 0, 3)` is called
- **Then** a sleep of 1000 ms occurs and the function resolves to `true`

#### Scenario: 429 with Retry-After header uses header value for sleep

- **Given** a 429 response with `Retry-After: 3`, attempt=1, retries=3
- **When** `handleRateLimitResponse(response, 1, 3)` is called
- **Then** a sleep of 3000 ms occurs and the function resolves to `true`

---

### Requirement: ADDED handleRateLimitResponse returns false on last attempt without sleeping

The system SHALL return `false` immediately (no sleep) when `attempt === retries`.

#### Scenario: Final attempt 429 returns false with no sleep

- **Given** a 429 response, attempt=3, retries=3
- **When** `handleRateLimitResponse(response, 3, 3)` is called
- **Then** no sleep occurs and the function resolves to `false`

---

## MODIFIED Requirements

### Requirement: MODIFIED fetchWithBackoff delegates backoff and rate-limit logic

The system SHALL continue to retry failed requests with exponential backoff and honour 429 Retry-After responses, delegating the math to `calculateBackoffMs` and `handleRateLimitResponse`.

#### Scenario: End-to-end retry behaviour is unchanged

- **Given** a fetch function that returns a 429 on the first call and 200 on the second
- **When** `fetchWithBackoff(fetchFn, url, 3)` is called
- **Then** the final resolved response has status 200 and exactly one sleep occurred

#### Scenario: No magic numeric literals remain in fetchWithBackoff

- **Given** the refactored `lib/import/open5eAdapter.ts`
- **When** the source is inspected
- **Then** no literal `10000` or `10_000` appears in `fetchWithBackoff`

---

## REMOVED Requirements

### Requirement: REMOVED Inline backoff calculation in fetchWithBackoff

Reason for removal: The duplicated inline math (`Math.min(1000 * Math.pow(2, attempt), 10000)`) is replaced by calls to `calculateBackoffMs`. The magic literal `10000` is replaced by the named constant `MAX_BACKOFF_MS` in `http-utils.ts`.

---

## Traceability

- Proposal element "Extract calculateBackoffMs" → Requirement: ADDED calculateBackoffMs computes exponential backoff, ADDED calculateBackoffMs respects Retry-After header
- Proposal element "Extract handleRateLimitResponse" → Requirement: ADDED handleRateLimitResponse sleeps and signals retry, ADDED handleRateLimitResponse returns false on last attempt
- Proposal element "Keep fetchWithBackoff as orchestrator" → Requirement: MODIFIED fetchWithBackoff delegates backoff and rate-limit logic
- Design decision D1 → ADDED requirements (new file), MODIFIED fetchWithBackoff
- Design decision D2 → ADDED handleRateLimitResponse requirements
- Design decision D3 → REMOVED inline backoff calculation
- Design decision D4 → ADDED calculateBackoffMs requirements
- Requirement ADDED calculateBackoffMs → Task: Create lib/import/http-utils.ts, Task: Unit test calculateBackoffMs
- Requirement ADDED handleRateLimitResponse → Task: Create lib/import/http-utils.ts, Task: Unit test handleRateLimitResponse
- Requirement MODIFIED fetchWithBackoff → Task: Refactor open5eAdapter.ts

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability — Backoff values are deterministic

#### Scenario: Same inputs always produce same output

- **Given** `calculateBackoffMs` is a pure function with no side effects
- **When** called with the same `attempt` and `retryAfterHeader` values multiple times
- **Then** it returns the identical value every time

### Requirement: Operability — TypeScript compilation succeeds

#### Scenario: No type errors introduced

- **Given** the refactored files `lib/import/http-utils.ts` and `lib/import/open5eAdapter.ts`
- **When** `tsc --noEmit` is run
- **Then** zero type errors are reported
