---
name: tests
description: Tests for items-route-loot-shape-and-tests
---

# Tests

## Overview

Tests for the `items-route-loot-shape-and-tests` change. All implementation follows strict TDD: write a failing test first, write the minimum code to make it pass, then refactor.

All unit tests live in `tests/unit/api/items/route.test.ts`.
All integration tests live in `tests/integration/api/items.test.ts`.

Auth mock pattern for unit tests (per design Decision 3):
```ts
jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: Function) =>
    (request: NextRequest) => handler(request, { userId: "user-123" }),
}));
```

---

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before writing any implementation code, write a test that captures the requirement. Run it and confirm it fails.
2. **Write code to pass the test** — minimum code to turn the test green.
3. **Refactor** — improve clarity/structure without breaking the test.

---

## Test Cases

### Task: Update `app/api/items/route.ts`

These tests drive the route changes. Write them first — they will fail until the interface and validation are implemented.

- [x] **GET-1** `GET /api/items` returns 200 with items array
  - Spec: Non-Functional / Reliability
  - Mock `getDatabase` to return a collection with `find().toArray()` resolving to `[mockItem]`
  - Assert status 200 and body equals `[mockItem]`

- [x] **GET-2** `GET /api/items` returns 500 when DB throws
  - Spec: Non-Functional / Reliability — "GET returns 500 on DB error"
  - Mock `getDatabase` to throw
  - Assert status 500 and `body.error === "Failed to fetch items"`

- [x] **POST-1** `POST /api/items` returns 400 when `name` is missing
  - Spec: MODIFIED — POST validates `name`
  - Body: `{ type: "weapon", rarity: "common" }`
  - Assert status 400 and `body.error === "Item name is required"`

- [x] **POST-2** `POST /api/items` returns 400 when `name` is whitespace-only
  - Spec: MODIFIED — POST validates `name`
  - Body: `{ name: "   ", type: "weapon", rarity: "common" }`
  - Assert status 400 and `body.error === "Item name is required"`

- [x] **POST-3** `POST /api/items` returns 400 when `type` is missing
  - Spec: ADDED — POST validates `type` / "POST with missing type returns 400"
  - Body: `{ name: "Sword", rarity: "common" }`
  - Assert status 400 and `body.error === "Item type is required"`

- [x] **POST-4** `POST /api/items` returns 400 when `type` is not a valid enum value
  - Spec: ADDED — POST validates `type` / "POST with invalid type returns 400"
  - Body: `{ name: "Sword", type: "banana", rarity: "common" }`
  - Assert status 400 and `body.error === "Invalid item type"`

- [x] **POST-5** `POST /api/items` returns 400 when `rarity` is missing
  - Spec: ADDED — POST validates `rarity` / "POST with missing rarity returns 400"
  - Body: `{ name: "Sword", type: "weapon" }`
  - Assert status 400 and `body.error === "Item rarity is required"`

- [x] **POST-6** `POST /api/items` returns 400 when `rarity` is not a valid enum value
  - Spec: ADDED — POST validates `rarity` / "POST with invalid rarity returns 400"
  - Body: `{ name: "Sword", type: "weapon", rarity: "epic" }`
  - Assert status 400 and `body.error === "Invalid item rarity"`

- [x] **POST-7** `POST /api/items` returns 201 with full item shape on valid request
  - Spec: ADDED — POST validates `type` / "POST with valid type succeeds"; POST validates `rarity` / "POST with valid rarity succeeds"
  - Body: `{ name: "Longsword", type: "weapon", rarity: "uncommon", description: "A sharp blade", quantity: 2, value: 15, weight: 3, attunement: false, equipped: true, properties: ["martial"], notes: "Found in the dungeon" }`
  - Mock `getDatabase` collection `insertOne` to resolve
  - Assert status 201; body contains all provided fields; `id` is a UUID string; `userId === "user-123"` (from mock auth)

- [x] **POST-8** `POST /api/items` returns 201 with defaults when only required fields provided
  - Spec: ADDED — POST applies safe defaults / "POST with only required fields returns item with defaults"
  - Body: `{ name: "Potion of Healing", type: "potion", rarity: "common" }`
  - Assert status 201; `body.quantity === 1`; `body.attunement === false`; `body.equipped === false`

- [x] **POST-9** `POST /api/items` returns 500 when DB throws on insert
  - Spec: Non-Functional / Reliability — "POST returns 500 on DB error"
  - Mock `getDatabase` to throw
  - Assert status 500 and `body.error === "Failed to create item"`

---

### Task: Write integration tests — `tests/integration/api/items.test.ts`

These tests require the full stack (real server + MongoDB). Follow `tests/integration/content.integration.test.ts` for setup.

- [x] **INT-1** `GET /api/items` without auth cookie returns 401
  - Spec: Non-Functional / Security — "GET requires authentication"
  - Call GET with no `Cookie` header
  - Assert status 401

- [x] **INT-2** `POST /api/items` without auth cookie returns 401
  - Spec: Non-Functional / Security — "POST requires authentication"
  - Call POST with no `Cookie` header
  - Assert status 401

- [x] **INT-3** `POST /api/items` with valid body returns 201 with correct shape and defaults
  - Spec: ADDED — POST validates `type` / "POST with valid type succeeds"
  - Call POST with `{ name: "Dagger", type: "weapon", rarity: "common" }`
  - Assert status 201; `body.quantity === 1`; `body.attunement === false`; `body.equipped === false`; `body.id` is a string

- [x] **INT-4** POST then GET round-trip: created item appears in GET response
  - Spec: Implied by all ADDED requirements — item must be persisted and retrievable
  - POST a valid item; capture `body.id`
  - Call GET; assert response contains an item with the same `id`

- [x] **INT-5** User isolation: user A's items not visible to user B
  - Spec: Non-Functional / Security — "GET enforces user isolation"
  - Register two users (user A and user B) via `registerTestUser`
  - User A POSTs an item
  - User B calls GET; assert the response array does NOT contain user A's item id
  - This is the highest-signal test — it verifies the `{ userId: auth.userId }` query filter works end-to-end
