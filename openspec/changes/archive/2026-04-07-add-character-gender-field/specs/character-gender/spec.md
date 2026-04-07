## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Gender field on Character type

The system SHALL support an optional `gender` string property on the `Character` type.

#### Scenario: Character created with gender

- **Given** the `Character` type in `lib/types.ts`
- **When** a character is created with `gender: "Female"`
- **Then** TypeScript accepts the value and the field is stored and retrievable

#### Scenario: Character created without gender

- **Given** the `Character` type in `lib/types.ts`
- **When** a character is created without a `gender` field
- **Then** TypeScript accepts the omission and existing character objects are unaffected

---

### Requirement: ADDED Gender input in CharacterEditor

The system SHALL render a free-text input labeled `"Character gender"` inside `CharacterEditor`.

#### Scenario: Gender field present in creation form

- **Given** a user navigates to `/characters` and clicks "Add New Character"
- **When** the `CharacterEditor` form opens
- **Then** an input with `aria-label="Character gender"` is visible and enabled

#### Scenario: Gender field present in edit form

- **Given** an existing character is displayed in the character list
- **When** the user opens the edit form for that character
- **Then** an input with `aria-label="Character gender"` is visible, enabled, and pre-populated with the character's current gender (if any)

---

### Requirement: ADDED Gender persists through create flow

The system SHALL save the gender value entered during character creation.

#### Scenario: Gender saved on new character

- **Given** the character creation form is open
- **When** the user fills in a gender value and clicks "Save Character"
- **Then** the character card appears with the gender value visible

#### Scenario: Gender omitted on new character

- **Given** the character creation form is open
- **When** the user leaves the gender field empty and clicks "Save Character"
- **Then** the character card appears without any gender value displayed; race (if set) displays normally

---

### Requirement: ADDED Gender persists through edit flow

The system SHALL update the gender value when a character is edited.

#### Scenario: Gender updated on existing character

- **Given** an existing character with a gender value
- **When** the user opens the edit form, changes the gender, and saves
- **Then** the character card displays the updated gender value

#### Scenario: Gender cleared on existing character

- **Given** an existing character with a gender value
- **When** the user opens the edit form, clears the gender field, and saves
- **Then** the character card displays no gender value

---

### Requirement: ADDED Gender displayed prepended to race on character card

The system SHALL display gender prepended to race (space-separated) in the character card subtitle, wherever race is displayed.

#### Scenario: Both gender and race set

- **Given** a character with `gender: "Female"` and `race: "Half-Elf"`
- **When** the character list is viewed
- **Then** the card subtitle includes "Female Half-Elf"

#### Scenario: Gender set, race not set

- **Given** a character with `gender: "Non-binary"` and no race
- **When** the character list is viewed
- **Then** the card subtitle includes "Non-binary" without a trailing space or separator

#### Scenario: Race set, gender not set

- **Given** a character with `race: "Human"` and no gender
- **When** the character list is viewed
- **Then** the card subtitle includes "Human" — identical to current behavior

#### Scenario: Neither gender nor race set

- **Given** a character with no gender and no race
- **When** the character list is viewed
- **Then** the card subtitle shows nothing — identical to current behavior

---

### Requirement: ADDED API accepts and validates gender on POST

The system SHALL accept an optional `gender` field in the `POST /api/characters` request body and reject values exceeding 50 characters.

#### Scenario: Valid gender accepted on create

- **Given** a POST request to `/api/characters` with `gender: "Female"`
- **When** the request is processed
- **Then** the response is 201 and the character is stored with the gender value

#### Scenario: Gender exceeding 50 chars rejected on create

- **Given** a POST request to `/api/characters` with a `gender` value of 51+ characters
- **When** the request is processed
- **Then** the response is 400 with a descriptive error message

#### Scenario: Missing gender accepted on create

- **Given** a POST request to `/api/characters` with no `gender` field
- **When** the request is processed
- **Then** the response is 201 and the character is stored without a gender

---

### Requirement: ADDED API accepts and validates gender on PUT

The system SHALL accept an optional `gender` field in the `PUT /api/characters/:id` request body and reject values exceeding 50 characters.

#### Scenario: Valid gender accepted on update

- **Given** a PUT request to `/api/characters/:id` with `gender: "Male"`
- **When** the request is processed
- **Then** the response is 200 and the character is updated with the new gender value

#### Scenario: Gender exceeding 50 chars rejected on update

- **Given** a PUT request to `/api/characters/:id` with a `gender` value of 51+ characters
- **When** the request is processed
- **Then** the response is 400 with a descriptive error message

## MODIFIED Requirements

### Requirement: MODIFIED `createCharacter()` E2E helper accepts optional gender

The `createCharacter()` helper in `tests/e2e/helpers/actions.ts` SHALL accept an optional `gender` field and fill the gender input when provided.

#### Scenario: Helper called with gender

- **Given** `createCharacter(page, { name, class, race, gender: "Female" })` is called
- **When** the helper runs
- **Then** the gender input is filled with "Female" and the character is saved successfully

#### Scenario: Helper called without gender (existing callers)

- **Given** `createCharacter(page, { name, class, race })` is called (no gender)
- **When** the helper runs
- **Then** the gender input is left empty and the character is saved successfully — no regression

## REMOVED Requirements

No requirements removed by this change.

## Traceability

- Proposal: `gender?: string` on `Character` type → Requirement: Gender field on Character type
- Proposal: Free-text input in CharacterEditor → Requirement: Gender input in CharacterEditor
- Proposal: Gender persists through create/edit → Requirements: Create persistence, Edit persistence
- Proposal: Gender displayed prepended to race → Requirement: Display on card
- Proposal: API max 50 chars → Requirements: API POST validation, API PUT validation
- Design Decision 1 (free-text) → Requirement: Gender input in CharacterEditor
- Design Decision 2 (join expression) → Requirement: Display on card
- Design Decision 3 (optional helper param) → Requirement: createCharacter() helper
- Design Decision 4 (inline length check) → Requirements: API POST/PUT validation
- All requirements → Tasks: see `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Security — Input length bounded

#### Scenario: Gender value at boundary

- **Given** a POST or PUT request with `gender` exactly 50 characters long
- **When** the request is processed
- **Then** the response is 2xx and the value is stored

#### Scenario: Gender value over boundary

- **Given** a POST or PUT request with `gender` 51+ characters long
- **When** the request is processed
- **Then** the response is 400 with a validation error

### Requirement: Reliability — Existing characters unaffected

#### Scenario: Character without gender field loaded

- **Given** an existing character record in the database with no `gender` field
- **When** the character list is loaded
- **Then** the card renders correctly with race displayed as before — no error or missing data

### Requirement: Accessibility — Gender input is keyboard accessible

#### Scenario: Input reachable via keyboard

- **Given** the `CharacterEditor` form is open
- **When** a user navigates the form using keyboard Tab
- **Then** the gender input is focusable and its label ("Character gender") is announced by screen readers via `aria-label`
