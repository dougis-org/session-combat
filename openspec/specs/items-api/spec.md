## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Item interface includes full loot vocabulary

The system SHALL define `ItemType` and `ItemRarity` as TypeScript string union types and the `Item` interface SHALL include: `id`, `userId`, `name`, `type`, `rarity`, `createdAt`, `updatedAt` (required); and `description?`, `quantity`, `value?`, `weight?`, `attunement`, `equipped`, `properties?`, `notes?` (optional with safe defaults where applicable).

#### Scenario: Interface is additive-safe

- **Given** the `Item` interface is defined with loot fields
- **When** `campaignId` or `characterId` are added in a future change
- **Then** those fields can be added as optional properties without breaking existing documents or handlers

---

### Requirement: ADDED POST validates `type` as a required enum field

The system SHALL reject POST requests where `type` is missing or not one of: `weapon`, `armor`, `potion`, `scroll`, `wondrous`, `ammunition`, `gear`, `tool`, `other`.

#### Scenario: POST with missing type returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with a valid `name` and `rarity` but no `type`
- **Then** the response status is `400` and the body contains `{ "error": "Item type is required" }`

#### Scenario: POST with invalid type returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with `type: "banana"`
- **Then** the response status is `400` and the body contains `{ "error": "Invalid item type" }`

#### Scenario: POST with valid type succeeds

- **Given** an authenticated user
- **When** POST `/api/items` is called with `type: "weapon"` and all other required fields
- **Then** the response status is `201` and the returned item includes `type: "weapon"`

---

### Requirement: ADDED POST validates `rarity` as a required enum field

The system SHALL reject POST requests where `rarity` is missing or not one of: `common`, `uncommon`, `rare`, `very_rare`, `legendary`, `artifact`.

#### Scenario: POST with missing rarity returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with valid `name` and `type` but no `rarity`
- **Then** the response status is `400` and the body contains `{ "error": "Item rarity is required" }`

#### Scenario: POST with invalid rarity returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with `rarity: "epic"`
- **Then** the response status is `400` and the body contains `{ "error": "Invalid item rarity" }`

#### Scenario: POST with valid rarity succeeds

- **Given** an authenticated user
- **When** POST `/api/items` is called with `rarity: "rare"` and all other required fields
- **Then** the response status is `201` and the returned item includes `rarity: "rare"`

---

### Requirement: ADDED POST applies safe defaults for optional fields

The system SHALL default `quantity` to `1`, `attunement` to `false`, and `equipped` to `false` when those fields are omitted from the POST body.

#### Scenario: POST with only required fields returns item with defaults

- **Given** an authenticated user
- **When** POST `/api/items` is called with only `name`, `type`, and `rarity`
- **Then** the response status is `201` and the returned item has `quantity: 1`, `attunement: false`, `equipped: false`

---

### Requirement: ADDED POST validates numeric field constraints

When provided, the system SHALL reject POST requests where `quantity` is not a positive number, or where `value` or `weight` are not non-negative numbers. These fields are optional; omitting them bypasses validation.

#### Scenario: POST with non-positive quantity returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with `quantity: 0` or `quantity: -1`
- **Then** the response status is `400` and the body contains `{ "error": "Quantity must be a positive number" }`

#### Scenario: POST with negative value returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with `value: -5`
- **Then** the response status is `400` and the body contains `{ "error": "Value must be a non-negative number" }`

#### Scenario: POST with negative weight returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with `weight: -1`
- **Then** the response status is `400` and the body contains `{ "error": "Weight must be a non-negative number" }`

---

## MODIFIED Requirements

### Requirement: MODIFIED POST validates `name` (existing, unchanged behavior)

The system SHALL reject POST requests where `name` is missing or empty/whitespace. (This requirement exists in the current route; no logic change, but it is now tested.)

#### Scenario: POST with missing name returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called without a `name` field
- **Then** the response status is `400` and the body contains `{ "error": "Item name is required" }`

#### Scenario: POST with whitespace-only name returns 400

- **Given** an authenticated user
- **When** POST `/api/items` is called with `name: "   "`
- **Then** the response status is `400` and the body contains `{ "error": "Item name is required" }`

---

## REMOVED Requirements

None.

---

## Traceability

- Proposal: "Expand `Item` interface with loot fields" → Requirement: ADDED Item interface includes full loot vocabulary
- Proposal: "Add POST validation for `type` and `rarity`" → Requirements: ADDED POST validates `type`; ADDED POST validates `rarity`
- Proposal: "Apply safe defaults" → Requirement: ADDED POST applies safe defaults
- Design Decision 1 (union types) → ADDED Item interface includes full loot vocabulary
- Design Decision 2 (inline array check) → ADDED POST validates `type`; ADDED POST validates `rarity`
- Design Decision 3 (withAuth factory mock) → All unit test scenarios
- Requirement: ADDED POST validates `type` → Tasks: update route, write unit tests, write integration tests
- Requirement: ADDED POST validates `rarity` → Tasks: update route, write unit tests, write integration tests
- Requirement: ADDED POST validates numeric field constraints → Tasks: update route POST handler, write unit tests (POST-10/11/12)

---

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: GET requires authentication

- **Given** a request with no auth cookie or Bearer token
- **When** GET `/api/items` is called
- **Then** the response status is `401`

#### Scenario: POST requires authentication

- **Given** a request with no auth cookie or Bearer token
- **When** POST `/api/items` is called
- **Then** the response status is `401`

#### Scenario: GET enforces user isolation

- **Given** user A and user B are both registered and have created items
- **When** user A calls GET `/api/items`
- **Then** the response contains only user A's items — no items belonging to user B are returned

### Requirement: Reliability

#### Scenario: GET returns 500 on DB error

- **Given** an authenticated user and a database that throws on query
- **When** GET `/api/items` is called
- **Then** the response status is `500` and the body contains `{ "error": "Failed to fetch items" }`

#### Scenario: POST returns 500 on DB error

- **Given** an authenticated user, a valid request body, and a database that throws on insert
- **When** POST `/api/items` is called
- **Then** the response status is `500` and the body contains `{ "error": "Failed to create item" }`
