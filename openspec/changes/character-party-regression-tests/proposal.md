## Why

Issue #51 calls for character and party creation regression tests with ≥5 character tests and ≥4 party tests. The helper functions (`createCharacter`, `createParty`) already exist in `actions.ts`, and two passing tests per domain already live in `combat.spec.ts` as combat setup prerequisites — but the dedicated coverage, negative-path tests, persistence/display assertions, and data-driven fixture approach required by #51 are all missing. Adding them now closes the regression gap and establishes the fixture-driven pattern before the test suite grows further.

## What Changes

- **New** `tests/e2e/characters.spec.ts` — dedicated character domain spec covering creation (valid + invalid), form field interactions (class, race, alignment, multiclass), persistence, display, edit, and delete
- **New** `tests/e2e/parties.spec.ts` — dedicated party domain spec covering creation (name-only and with members), display, edit, delete, and the empty-roster state
- **New** `tests/e2e/fixtures/characters.json` — data-driven character variants for `test.each()` parameterization (name, class, race, alignment)
- **New** `tests/e2e/fixtures/parties.json` — data-driven party variants (name, description)
- **Changed** `e2e-test-patterns` spec — "No duplicate E2E spec coverage" requirement updated to add `characters.spec.ts` and `parties.spec.ts` as recognized owners of their domains; `combat.spec.ts` standalone character/party creation tests may remain (they serve as combat-setup fixtures) but all *new* character/party coverage goes in the domain specs
- All new test setup uses API seeding (`page.request.post`) instead of UI creation helpers to avoid cascading failures between domains

## Capabilities

### New Capabilities

- `character-regression-tests`: E2E regression coverage for character creation, editing, deletion, validation, field interactions, and persistence — implemented as `tests/e2e/characters.spec.ts` with fixture-driven parameterization
- `party-regression-tests`: E2E regression coverage for party creation, editing, deletion, validation, and member display — implemented as `tests/e2e/parties.spec.ts` with fixture-driven parameterization
- `e2e-fixture-data`: Externalized JSON fixture files for `test.each()` parameterization in E2E specs, enabling data-driven test variants without code changes

### Modified Capabilities

- `e2e-test-patterns`: The "No duplicate E2E spec coverage" requirement currently names only `auth.spec.ts` and `combat.spec.ts`. It must be updated to recognize `characters.spec.ts` (owns character CRUD) and `parties.spec.ts` (owns party CRUD) as valid separate spec owners.

## Impact

- **New files**: `tests/e2e/characters.spec.ts`, `tests/e2e/parties.spec.ts`, `tests/e2e/fixtures/characters.json`, `tests/e2e/fixtures/parties.json`
- **No changes** to existing passing tests in `combat.spec.ts` or `auth.spec.ts`
- **No application code changes** — tests only
- **`npm run test:regression`** already runs all of `tests/e2e/`; new spec files are picked up automatically
- Sharding/parallelism improves: 4 independent spec files run concurrently with `--workers=4`
- **Out of scope**: `createParty()` helper name-based member selection fix (tracked in #117), gender field on character form (tracked in #118), party member removal tests (tracked in #117 as dependent on the helper fix)

## Scope

**In scope:**
- `characters.spec.ts` with ≥5 tests satisfying #51 character acceptance criteria
- `parties.spec.ts` with ≥4 tests satisfying #51 party acceptance criteria
- `fixtures/characters.json` and `fixtures/parties.json` used via `test.each()`
- `e2e-test-patterns` spec update for new file ownership
- API-seeded test setup (no UI dependency between domains)

**Out of scope:**
- `createParty()` helper refactor (positional → name-based) → #117
- Party member add/remove regression tests → #117
- Gender field on character form → #118
- Monster, encounter, or combat domain spec files
- `regression.spec.ts` (rejected in favour of domain-specific files)

## Risks

- **`e2e-test-patterns` spec conflict**: The existing spec explicitly assigns character/party coverage to `combat.spec.ts`. Not updating it leaves the spec contradicting reality. Mitigation: update the spec as part of this change.
- **API seed coupling**: Tests that seed characters via `page.request.post('/api/characters')` depend on the API contract staying stable. If the API shape changes, seeds break. Mitigation: keep seed payloads minimal (name, class, hp, maxHp only).
- **`test.each` test naming**: If `characters.json` entries share a name field, Playwright test titles collide. Mitigation: ensure all fixture `name` values are unique.

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during the explore session:
- Domain spec files (not monolithic `regression.spec.ts`) ✓
- API seeding for setup (not UI helpers) ✓
- `test.each()` with fixture JSON (not inline arrays) ✓
- `resolveJsonModule: true` already enabled in `tsconfig.json` ✓
- Party member removal deferred to #117 ✓
- Gender field deferred to #118 ✓

## Non-Goals

- Achieving 100% character/party UI coverage — this satisfies #51's stated minimums and establishes the pattern
- Migrating existing `combat.spec.ts` character/party tests — they pass, provide value in their context, and moving them carries risk for zero gain
- Performance or load testing of character/party endpoints

---

*If scope changes after approval, proposal.md, design.md, specs, and tasks.md must all be updated before apply proceeds.*
