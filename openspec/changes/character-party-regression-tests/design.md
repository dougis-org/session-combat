## Context

Two helper functions (`createCharacter`, `createParty`) and two passing smoke tests per domain already exist in `combat.spec.ts`. The gap is dedicated domain spec files with full coverage of validation paths, field interactions, persistence/display assertions, and data-driven parameterization. The project uses Playwright with `test.each()`, and `tsconfig.json` already has `resolveJsonModule: true`. The `npm run test:regression` script runs all of `tests/e2e/` automatically.

The existing `e2e-test-patterns` spec assigns character/party coverage to `combat.spec.ts` — that assignment must be updated to reflect the new domain ownership split.

## Goals / Non-Goals

**Goals:**
- Two new domain spec files (`characters.spec.ts`, `parties.spec.ts`) satisfying #51's minimum test counts
- Fixture-driven parameterization via `fixtures/characters.json` and `fixtures/parties.json`
- API-seeded test setup (no UI cross-domain coupling)
- Updated `e2e-test-patterns` spec reflecting the new file ownership

**Non-Goals:**
- Modifying any existing passing tests
- `createParty()` helper refactor (deferred to #117)
- Party member removal tests (deferred to #117)
- Gender field tests (deferred to #118)

## Decisions

### Decision 1: Domain spec files over monolithic `regression.spec.ts`

**Chosen:** `characters.spec.ts` + `parties.spec.ts` as independent files.

**Rejected:** Single `regression.spec.ts` aggregating all non-auth, non-combat tests.

**Rationale:** Domain files map cleanly to Playwright shards — each file is an independent execution unit. A failure in character tests doesn't pollute the party test report. The pattern scales: `monsters.spec.ts`, `encounters.spec.ts` follow naturally. The monolithic approach creates a growing file that requires code changes to re-shard as the suite grows.

---

### Decision 2: API seeding for test setup, not UI helpers

**Chosen:** `page.request.post('/api/characters', { data: { ... } })` directly in `beforeEach`.

**Rejected:** Calling `createCharacter()` UI helper as setup for party tests.

**Rationale:** UI helper calls create a cascade failure mode — a regression in character creation UI would break every party test even though parties aren't broken. API seeding is faster (no browser render), deterministic, and isolated. The UI creation flow is already covered in `combat.spec.ts` and will be covered by `characters.spec.ts` itself.

Seed payload is kept minimal:
```ts
await page.request.post('/api/characters', {
  data: {
    name: 'Seed Fighter',
    classes: [{ class: 'Fighter', level: 1 }],
    hp: 10, maxHp: 10, ac: 10,
    abilityScores: { strength: 10, dexterity: 10, constitution: 10,
                     intelligence: 10, wisdom: 10, charisma: 10 },
  },
});
```

---

### Decision 3: `test.each()` with external fixture JSON over inline arrays

**Chosen:** Import `characters.json` / `parties.json`, pass to `test.each()`.

**Rejected:** Inline `test.each([[...]])` arrays inside the spec file.

**Rationale:** Inline arrays embed data in code — any new character variant requires a code review and CI run. JSON fixtures can be extended by anyone without touching test logic. Test titles auto-generate from fixture fields (`$name ($class / $race)`), giving clear per-variant failure messages in reports and sharded runs. `resolveJsonModule` is already enabled — zero setup cost.

Fixture shape:
```json
// characters.json
[{ "name": "Warrior", "class": "Fighter", "race": "Human", "alignment": "Lawful Good" }, ...]

// parties.json
[{ "name": "Solo Scout", "description": "" }, ...]
```

---

### Decision 4: `createCharacter()` helper used for creation tests, direct locators for field-interaction tests

**Chosen:** Use `createCharacter()` for happy-path creation variants (data-driven), use direct `page.getByLabel()` locators for validation, interaction, and persistence tests.

**Rationale:** The helper abstracts the creation flow well for happy-path parameterized variants. Validation tests (empty name, HP > maxHP) need to interact with the form *without* submitting successfully — the helper always submits and asserts success, so these tests use the form directly. This keeps the helper contract clean.

---

### Decision 5: Test organisation within each spec file

Each spec uses `test.describe()` blocks to group by behaviour category:

**`characters.spec.ts`:**
- `describe("Character creation — data-driven")` → `test.each(characterFixtures)`
- `describe("Character creation — validation")` → empty name, HP > maxHP, save button state
- `describe("Character form interactions")` → race dropdown, alignment dropdown, multiclass add/remove
- `describe("Character persistence and display")` → list appearance after save, class/level text
- `describe("Character editing")` → name change persists
- `describe("Character deletion")` → disappears from list

**`parties.spec.ts`:**
- `describe("Party creation — data-driven")` → `test.each(partyFixtures)`
- `describe("Party creation — validation")` → empty name, save button state
- `describe("Party creation — member state")` → no-characters message, member count display
- `describe("Party persistence and display")` → list appearance after save, member names
- `describe("Party editing")` → name change persists
- `describe("Party deletion")` → disappears from list

---

### Decision 6: User registration via `registerUser()` in `beforeEach`, not `beforeAll`

**Chosen:** Fresh registration per test (or per describe block using `beforeEach` at describe scope).

**Rationale:** Shared auth state across tests creates ordering dependencies. The existing `auth.spec.ts` and `combat.spec.ts` pattern uses per-test registration. Consistency prevents subtle failures when tests run in a different order.

Authentication via `registerUser()` is fast enough (< 1s in CI) that per-test cost is acceptable given the isolation benefit.

## Proposal → Design Mapping

| Proposal Element | Design Decision |
|-----------------|-----------------|
| Domain-specific spec files | Decision 1 |
| API seeding for setup | Decision 2 |
| Fixture JSON + test.each | Decision 3 |
| createCharacter() helper usage | Decision 4 |
| Test organisation | Decision 5 |
| Auth isolation | Decision 6 |
| e2e-test-patterns spec update | Covered in specs artifact |

## Risks / Trade-offs

**API seed contract drift** → If `/api/characters` request shape changes, seeds break silently (no TypeScript enforcement on `page.request.post` payloads). Mitigation: keep seed payloads minimal; a seed failure produces an obvious test failure pointing at the `beforeEach`.

**Fixture `name` collisions in `test.each` titles** → Duplicate names produce identical test titles, making failure reports ambiguous. Mitigation: enforce unique `name` values across all fixture entries; enforced by code review.

**`e2e-test-patterns` spec staleness** → If the spec update is missed, it contradicts the new file layout. Mitigation: spec update is a task item, not optional; CI doesn't enforce spec consistency automatically so it requires reviewer attention.

**Existing `combat.spec.ts` coverage overlap** → Two passing tests per domain already exist there. New spec files add more; the overall suite has partial overlap on happy-path character/party creation. This is acceptable — the existing tests serve a different purpose (combat setup verification) and removing them carries regression risk.

## Rollback / Mitigation

Test-only change — no application code modified. Rollback is `git revert` of the new spec files and fixture directory. No migration steps required. No database schema changes.

If CI blocks on the new tests (e.g., application endpoint not matching expected selectors), the new spec files can be temporarily skipped with `test.skip()` while the application issue is investigated — existing coverage is unaffected.

## Open Questions

None. All decisions confirmed during the explore session prior to proposal creation.
