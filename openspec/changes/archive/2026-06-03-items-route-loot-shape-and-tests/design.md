## Context

- Relevant architecture: Next.js App Router API route at `app/api/items/route.ts`. Auth via `withAuth` wrapper from `lib/middleware.ts` (verifies JWT + tokenVersion against DB). Persistence via MongoDB through `lib/db.ts` `getDatabase()`. Follows the same pattern as `app/api/content/route.ts` and `app/api/characters/route.ts`.
- Dependencies: `lib/middleware.ts` (`withAuth`), `lib/db.ts` (`getDatabase`), `crypto.randomUUID()` for ID generation.
- Interfaces/contracts touched: `Item` interface (internal to route), MongoDB `items` collection shape, POST request body contract.

## Goals / Non-Goals

### Goals

- Define a stable, additive-safe `Item` interface covering the core D&D loot vocabulary
- Extend POST validation to enforce `type` and `rarity` as required fields with enum checks
- Apply safe defaults for `quantity` (1), `attunement` (false), `equipped` (false)
- Unit tests covering all validation branches and error paths
- Integration tests covering the full stack: round-trip, user isolation, auth enforcement

### Non-Goals

- `campaignId` / `characterId` attachment
- DELETE, PATCH, or PUT handlers
- Frontend integration
- Migrating other tests off the deprecated `requireAuth` mock (tracked in #340)

## Decisions

### Decision 1: ItemType and ItemRarity as union types, not enums

- Chosen: TypeScript string union types (`type ItemType = 'weapon' | 'armor' | ...`)
- Alternatives considered: TypeScript `enum`, plain `string`
- Rationale: String unions are serializable to JSON without transformation, work cleanly with MongoDB, and produce clear error messages. Enums add runtime overhead and complicate Jest mocking.
- Trade-offs: No runtime enum object to iterate for validation — validation array must be maintained alongside the type definition.

### Decision 2: Validation via inline array check, not a schema library

- Chosen: `const VALID_TYPES: ItemType[] = [...]` and `VALID_RARITIES` arrays; check with `.includes()`
- Alternatives considered: Zod schema validation, JSON Schema
- Rationale: The route is simple (two handlers, fixed fields). Introducing a schema library for one route is over-engineering. Existing routes in the codebase use inline validation.
- Trade-offs: Validation arrays must be kept in sync with the union types. Acceptable given the low churn expected on loot vocabulary.

### Decision 3: Unit test mock pattern — explicit `withAuth` factory

- Chosen: `jest.mock("@/lib/middleware", () => ({ withAuth: (handler) => (req) => handler(req, MOCK_AUTH) }))`
- Alternatives considered: Auto-mock with `requireAuth` mock (existing pattern, deprecated per #340)
- Rationale: The explicit factory is correct, modern, and tests the handler in isolation without depending on middleware internals. Aligns with `tests/unit/api/users/search/route.unit.test.ts`.
- Trade-offs: Cannot test auth rejection via this mock; auth guard is tested at the integration level and in `middleware.test.ts`.

### Decision 4: Integration test auth via cookie (not Bearer header)

- Chosen: Follow `registerTestUser` helper pattern from `tests/integration/content.integration.test.ts` — register a user, use the returned cookie.
- Alternatives considered: Bearer token header
- Rationale: Consistent with all existing integration tests. The `withAuth` middleware checks both cookie and header; cookie is the primary app flow.
- Trade-offs: None — this is the established pattern.

### Decision 5: No type/rarity validation in GET

- Chosen: GET does not validate or filter by type/rarity; returns all items for `userId`.
- Rationale: GET is a list endpoint scoped to user. Filtering is a future concern once the frontend has the feature.
- Trade-offs: None for this change.

## Proposal to Design Mapping

- Proposal element: Expand `Item` interface with loot fields
  - Design decision: Decision 1 (union types)
  - Validation approach: TypeScript compilation; POST validation array checks
- Proposal element: Add POST validation for `type`, `rarity`, `quantity`
  - Design decision: Decision 2 (inline array check)
  - Validation approach: Unit tests for each invalid-input path
- Proposal element: Unit tests using modern mock pattern
  - Design decision: Decision 3 (explicit `withAuth` factory)
  - Validation approach: Tests import `GET`/`POST` directly; auth tested via integration
- Proposal element: Integration tests for round-trip and user isolation
  - Design decision: Decision 4 (cookie auth)
  - Validation approach: `registerTestUser` for two users; assert isolation via GET

## Functional Requirements Mapping

- Requirement: POST rejects missing `name`
  - Design element: Existing validation in route (unchanged)
  - Acceptance criteria reference: specs/items-api/spec.md
  - Testability notes: Unit test; mock `withAuth`, omit `name` from body

- Requirement: POST rejects missing or invalid `type`
  - Design element: `VALID_TYPES.includes(type)` check
  - Acceptance criteria reference: specs/items-api/spec.md
  - Testability notes: Unit tests for missing, and for value not in enum

- Requirement: POST rejects missing or invalid `rarity`
  - Design element: `VALID_RARITIES.includes(rarity)` check
  - Acceptance criteria reference: specs/items-api/spec.md
  - Testability notes: Unit tests for missing, and for value not in enum

- Requirement: POST applies defaults for optional fields
  - Design element: `quantity = quantity ?? 1`, `attunement = attunement ?? false`, `equipped = equipped ?? false`
  - Acceptance criteria reference: specs/items-api/spec.md
  - Testability notes: Unit test — POST with only required fields; verify defaults on 201 response

- Requirement: GET returns only the authenticated user's items
  - Design element: MongoDB query `{ userId: auth.userId }` (unchanged)
  - Acceptance criteria reference: specs/items-api/spec.md
  - Testability notes: Integration test — two registered users; assert user A's items absent from user B's GET response

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Unauthenticated requests rejected with 401
  - Design element: `withAuth` wrapper (unchanged)
  - Acceptance criteria reference: specs/items-api/spec.md
  - Testability notes: Integration tests — GET and POST without auth cookie → 401

- Requirement category: reliability
  - Requirement: DB errors return 500, not crash
  - Design element: try/catch in both handlers (unchanged)
  - Acceptance criteria reference: specs/items-api/spec.md
  - Testability notes: Unit tests — mock `getDatabase` to throw; assert 500

## Risks / Trade-offs

- Risk/trade-off: Validation arrays (`VALID_TYPES`, `VALID_RARITIES`) can drift from the union types
  - Impact: Low — TypeScript will catch a removed type (the array reference would break), but will NOT catch a type added to the union but forgotten in the array
  - Mitigation: A future refactor should derive the union from the array (`type ItemType = typeof VALID_TYPES[number]`) so the type system and validator are always in sync. For this change, arrays are kept immediately adjacent to the type definitions.

## Rollback / Mitigation

- Rollback trigger: CI failure, type errors, or integration test failures post-merge
- Rollback steps: Revert `app/api/items/route.ts` to the previous interface; delete new test files. No DB migration needed — field additions to the interface don't affect existing documents.
- Data migration considerations: None. Existing items in MongoDB (none in production yet) are unaffected; new fields are optional or have defaults.
- Verification after rollback: Run `npm run test:unit` and `npm run test:integration`; confirm 0 failures.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing checks. There are no waiver exceptions for this change.
- If security checks fail: Same — fix before merge.
- If required reviews are blocked/stale: Re-request review after 48 hours; escalate to repo owner if still blocked after 96 hours.
- Escalation path and timeout: Tag `@dougis` in PR; if no response in 96 hours, re-evaluate priority.

## Open Questions

No open questions. All decisions were made during the explore session prior to this proposal.
