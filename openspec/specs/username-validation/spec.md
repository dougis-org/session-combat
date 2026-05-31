## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Username validation module

The system SHALL provide a `validateUsername(value: unknown): ValidationResult` function in `lib/validation/username.ts` that enforces length, charset, and reserved word rules.

#### Scenario: Valid username passes validation

- **Given** a string `"doug_42"` (7 characters, letters/digits/underscore)
- **When** `validateUsername("doug_42")` is called
- **Then** it returns `{ valid: true, errors: [] }`

#### Scenario: Username shorter than 4 characters is rejected

- **Given** a string `"abc"` (3 characters)
- **When** `validateUsername("abc")` is called
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }` with a message indicating minimum length

#### Scenario: Username of exactly 4 characters is accepted

- **Given** a string `"abcd"` (4 characters)
- **When** `validateUsername("abcd")` is called
- **Then** it returns `{ valid: true, errors: [] }`

#### Scenario: Username of exactly 20 characters is accepted

- **Given** a string of 20 alphanumeric characters
- **When** `validateUsername` is called with it
- **Then** it returns `{ valid: true, errors: [] }`

#### Scenario: Username longer than 20 characters is rejected

- **Given** a string of 21 characters
- **When** `validateUsername` is called with it
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }` with a message indicating maximum length

#### Scenario: Username with disallowed characters is rejected

- **Given** a string `"doug smith"` (contains a space)
- **When** `validateUsername("doug smith")` is called
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }` with a message indicating allowed characters

#### Scenario: Username with `@` symbol is rejected

- **Given** a string `"doug@site"` (contains `@`)
- **When** `validateUsername("doug@site")` is called
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }`

#### Scenario: Username with hyphen and underscore is accepted

- **Given** a string `"doug-is_cool"` (contains `-` and `_`)
- **When** `validateUsername("doug-is_cool")` is called
- **Then** it returns `{ valid: true, errors: [] }`

#### Scenario: Reserved word `admin` (lowercase) is rejected

- **Given** a string `"admin"`
- **When** `validateUsername("admin")` is called
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }` with a message indicating the username is reserved

#### Scenario: Reserved word `Admin` (mixed case) is rejected

- **Given** a string `"Admin"`
- **When** `validateUsername("Admin")` is called
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }`

#### Scenario: Reserved word `ADMIN` (all caps) is rejected

- **Given** a string `"ADMIN"`
- **When** `validateUsername("ADMIN")` is called
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }`

#### Scenario: All reserved words are rejected regardless of casing

- **Given** each of: `root`, `system`, `support`, `moderator`, `api`, `null`, `undefined`
- **When** `validateUsername` is called with each (and mixed-case variants)
- **Then** each call returns `{ valid: false, ... }`

#### Scenario: Non-string input is rejected

- **Given** a value of `null`, `undefined`, `42`, or `{}`
- **When** `validateUsername` is called with it
- **Then** it returns `{ valid: false, errors: [{ field: "username", message: "..." }] }` with a message indicating the username must be a string

## MODIFIED Requirements

_(none — no existing requirements are changed by this spec)_

## REMOVED Requirements

_(none)_

## Traceability

- Proposal element: New `lib/validation/username.ts` → Requirement: ADDED Username validation module
- Design Decision 1 (dedicated module) → Requirement: ADDED Username validation module
- Design Decision 2 (case-insensitive reserved words) → Scenarios: Reserved word `Admin`, `ADMIN`
- Design Decision 5 (length 4–20, charset `[a-zA-Z0-9_-]`) → Scenarios: length and charset scenarios
- Design Decision 6 (reserved word list) → Scenarios: All reserved word scenarios
- Requirement: ADDED Username validation module → Task 1 (implement `lib/validation/username.ts`)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Validation is a pure function with no side effects

- **Given** `validateUsername` is imported
- **When** it is called multiple times with the same input
- **Then** it always returns the same result and does not mutate any external state
