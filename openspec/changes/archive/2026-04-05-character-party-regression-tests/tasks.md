## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch: `git checkout -b feat/character-party-regression-tests`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/character-party-regression-tests`

## 2. Fixture Files

- [x] 2.1 Create `tests/e2e/fixtures/` directory
- [x] 2.2 Create `tests/e2e/fixtures/characters.json` with ≥5 entries spanning distinct class/race/alignment combinations (all values from `VALID_CLASSES` / `VALID_RACES` / `VALID_ALIGNMENTS` in `lib/types.ts`); ensure all `name` values are unique
- [x] 2.3 Create `tests/e2e/fixtures/parties.json` with ≥3 entries including at least one with `"description": ""`; ensure all `name` values are unique

## 3. Character Spec File

- [x] 3.1 Create `tests/e2e/characters.spec.ts` with imports: `{ test, expect }` from `./fixtures`, `registerUser` / `createCharacter` from `./helpers/actions`, `createTestIdentity` from `./helpers/isolation`, and fixture JSON from `./fixtures/characters.json`
- [x] 3.2 Add `test.beforeEach` that clears cookies
- [x] 3.3 Add `describe("Character creation — data-driven")` with `test.each(characterFixtures)('create character: $name ($class / $race)', ...)` — registers user, calls `createCharacter()`, asserts character name visible in list
- [x] 3.4 Add `describe("Character creation — validation")` with three tests:
  - Save button disabled when name field is cleared
  - Validation error "Character name is required" on whitespace-only name
  - Validation error "Current HP cannot be greater than Max HP" when hp > maxHp
- [x] 3.5 Add `describe("Character form interactions")` with tests:
  - Class dropdown (`aria-label="Character class"`) is visible and accepts "Rogue"
  - Race dropdown (`aria-label="Character race"`) is visible and accepts "Tiefling"
  - Alignment dropdown (`aria-label="Character alignment"`) is visible and accepts "Chaotic Good"
  - Add Class button appends a second class row
  - Remove button disabled when only one class exists
- [x] 3.6 Add `describe("Character persistence and display")` — creates a "Paladin Level 1" character, asserts list card shows name and "Paladin Level 1" text
- [x] 3.7 Add `describe("Character editing")` — creates character via API seed or UI, edits name, asserts new name visible and old name gone
- [x] 3.8 Add `describe("Character deletion")` — creates character, clicks Delete, accepts browser confirm dialog, asserts name no longer in list

## 4. Party Spec File

- [x] 4.1 Create `tests/e2e/parties.spec.ts` with imports: `{ test, expect }` from `./fixtures`, `registerUser` / `createParty` from `./helpers/actions`, `createTestIdentity` from `./helpers/isolation`, and fixture JSON from `./fixtures/parties.json`
- [x] 4.2 Add `test.beforeEach` that clears cookies
- [x] 4.3 Add `describe("Party creation — data-driven")` with `test.each(partyFixtures)('create party: $name', ...)` — registers user, creates party via UI, asserts party name visible in list
- [x] 4.4 Add `describe("Party creation — validation")` with two tests:
  - Save Party button disabled when name field is empty
  - Validation error "Party name is required" on whitespace-only name
- [x] 4.5 Add `describe("Party creation — member state")` with one test:
  - When user has no characters, party form shows "No characters available" and no checkboxes
- [x] 4.6 Add `describe("Party persistence and display")` with two tests using API-seeded character:
  - Party card shows "Members: 1" after creating party with one seeded member
  - Party card shows the seeded character's name in the member list
- [x] 4.7 Add `describe("Party — no members")`:
  - Party with no members checked saves and shows "Members: 0" in list card
- [x] 4.8 Add `describe("Party editing")` — creates party, clicks Edit, changes name, saves, asserts new name visible and old name gone
- [x] 4.9 Add `describe("Party deletion")` — creates party, clicks Delete, accepts browser confirm dialog, asserts name no longer in list

## 5. API Seed Helper

- [x] 5.1 Extract a reusable `seedCharacter(page, data?)` helper into `tests/e2e/helpers/actions.ts` that calls `page.request.post('/api/characters', { data: minimalCharacterPayload })` and returns the created character's `id` — used by party tests that need a pre-existing character without UI overhead

## 6. Validation

- [x] 6.1 Run `npm run test:regression -- tests/e2e/characters.spec.ts` locally and confirm all tests pass
- [x] 6.2 Run `npm run test:regression -- tests/e2e/parties.spec.ts` locally and confirm all tests pass
- [x] 6.3 Run full `npm run test:regression` and confirm no regressions in `auth.spec.ts` or `combat.spec.ts`
- [x] 6.4 Confirm character test count ≥ 5 (satisfies #51 acceptance criteria)
- [x] 6.5 Confirm party test count ≥ 4 (satisfies #51 acceptance criteria)
- [x] 6.6 Verify `test.each` test titles include fixture field values (name, class, race) for traceability

## 7. Self-Review

- [x] 7.1 Dispatch `superpowers:requesting-code-review` sub-agent against all new and modified files (`tests/e2e/characters.spec.ts`, `tests/e2e/parties.spec.ts`, `tests/e2e/fixtures/characters.json`, `tests/e2e/fixtures/parties.json`, `tests/e2e/helpers/actions.ts`) — review must complete with no unresolved findings before proceeding
- [x] 7.2 Address any findings from the sub-agent review; re-run affected tests to confirm fixes do not introduce regressions

## 8. PR and Merge

- [x] 8.1 Commit all changes with a clear message referencing issue #51
- [x] 8.2 Push to remote: `git push`
- [x] 8.3 Open PR from `feat/character-party-regression-tests` to `main`; reference issues #51 and link follow-ups #117 (createParty helper) and #118 (gender field)
- [x] 8.4 Monitor CI — if any test fails: diagnose, fix, commit, push, repeat until all checks pass
- [x] 8.5 Address all review comments; commit fixes and push until no unresolved comments remain
- [x] 8.6 Enable auto-merge once all required CI checks are green and no blocking review comments remain

## 9. Post-Merge

- [x] 9.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [x] 9.2 Verify merged files appear on `main` (`tests/e2e/characters.spec.ts`, `tests/e2e/parties.spec.ts`, `tests/e2e/fixtures/`)
- [x] 9.3 Sync approved spec deltas to `openspec/specs/`:
  - Copy `openspec/changes/character-party-regression-tests/specs/character-regression-tests/spec.md` → `openspec/specs/character-regression-tests/spec.md`
  - Copy `openspec/changes/character-party-regression-tests/specs/party-regression-tests/spec.md` → `openspec/specs/party-regression-tests/spec.md`
  - Copy `openspec/changes/character-party-regression-tests/specs/e2e-fixture-data/spec.md` → `openspec/specs/e2e-fixture-data/spec.md`
  - Merge `openspec/changes/character-party-regression-tests/specs/e2e-test-patterns/spec.md` delta into `openspec/specs/e2e-test-patterns/spec.md` (update the "No duplicate E2E spec coverage" requirement)
- [ ] 9.4 Archive the change as a single atomic commit (copy to `openspec/archive/` AND delete `openspec/changes/character-party-regression-tests/` in the same commit): `openspec archive character-party-regression-tests`
- [ ] 9.5 Push archive commit to `main`
- [ ] 9.6 Delete local feature branch: `git branch -d feat/character-party-regression-tests`
- [ ] 9.7 Mark GitHub issue #51 as complete
