## GitHub Issues

- #245

## Why

- Problem statement: `app/api/items/route.ts` has 0% test coverage. The route is fully implemented (GET + POST, auth-gated, MongoDB-backed) but was built as forward infrastructure for a loot system not yet connected to the frontend. The `Item` interface is also under-specified — it carries only `name` and `description`, missing the D&D-specific fields (`type`, `rarity`, etc.) that the feature will require.
- Why now: Issue #245 calls for coverage. Rather than write tests against a placeholder interface and throw them away when the feature is built, we should specify the stable loot fields now so the tests document the real contract.
- Business/user impact: Tests protect against regressions and document the intended API shape for the future frontend feature. Specifying the interface now avoids duplicate work later.

## Problem Space

- Current behavior: Route exists, has no tests, and uses a minimal `Item` interface (`name`, `description` only). POST only validates `name`.
- Desired behavior: Route has a well-specified `Item` interface with stable D&D loot fields. POST validates required fields (`name`, `type`, `rarity`). Unit and integration tests cover all meaningful paths.
- Constraints: `campaignId` and `characterId` are intentionally excluded — item attachment to characters/campaigns is not yet designed. The interface must be additive-safe for those fields later.
- Assumptions: `type` and `rarity` are stable enough to specify now. All other loot fields (`quantity`, `value`, `weight`, `attunement`, `equipped`, `properties`, `notes`) are optional with safe defaults.
- Edge cases considered: Invalid enum values for `type`/`rarity`; `quantity` < 1; numeric fields with negative values; user isolation in GET (user A must not see user B's items).

## Scope

### In Scope

- Update `Item` interface in `app/api/items/route.ts` with full loot field set
- Add POST validation for `type` and `rarity` (required, enum-checked); `quantity` (min 1, default 1); `attunement`/`equipped` (boolean defaults)
- Unit tests: `tests/unit/api/items/route.test.ts`
- Integration tests: `tests/integration/api/items.test.ts`

### Out of Scope

- `campaignId` / `characterId` attachment — not yet designed
- Frontend pages or components that consume this route
- DELETE or PATCH/PUT handlers — not implemented in the route
- Migrating existing `requireAuth` mock pattern (tracked separately in #340)

## What Changes

- `app/api/items/route.ts` — expand `Item` interface; add `ItemType` and `ItemRarity` union types; extend POST handler to validate new required fields and apply defaults
- `tests/unit/api/items/route.test.ts` — new file, 11 unit tests
- `tests/integration/api/items.test.ts` — new file, 5 integration tests

## Risks

- Risk: Future loot fields added to the interface may conflict with the field names chosen here.
  - Impact: Low — interface is internal to the route; no external callers yet.
  - Mitigation: Field names (`type`, `rarity`, `quantity`, etc.) are conventional D&D 5e vocabulary; conflict is unlikely.
- Risk: Integration tests rely on the shared test server setup; a misconfigured `TEST_BASE_URL` would fail all integration tests.
  - Impact: Low — existing integration tests already depend on this setup.
  - Mitigation: Follow existing pattern in `tests/integration/content.integration.test.ts`.

## Open Questions

No unresolved ambiguity. The following decisions were made explicitly during exploration:
- `campaignId`/`characterId` deferred — confirmed by user.
- `type` and `rarity` are required fields — confirmed.
- `quantity`, `attunement`, `equipped` get safe defaults — confirmed.
- Test target: solid, value-justified coverage, not padding — confirmed.

## Non-Goals

- 100% branch coverage for its own sake — tests are written where they add signal.
- Implementing the frontend loot feature.
- Defining how items attach to characters or campaigns.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
