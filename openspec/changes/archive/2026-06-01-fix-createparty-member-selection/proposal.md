## GitHub Issues

- #117

## Why

- Problem statement: `createParty()` in `tests/e2e/helpers/actions.ts` selects party members by checkbox position offset, making tests fragile and member-specific assertions impossible.
- Why now: Issue #117 has been open since April; the current implementation silently creates empty parties in several combat tests (the `Math.min(memberCount, 0)` path), meaning those tests are not verifying what they claim to verify.
- Business/user impact: Tests that silently pass while selecting zero members give false confidence. Member-removal tests cannot be written at all with the current interface.

## Problem Space

- Current behavior: `createParty({ memberCount: N })` selects the first N checkboxes by DOM position. If no characters exist for the user, `Math.min(N, 0) = 0` and an empty party is created without error or assertion.
- Desired behavior: `createParty({ memberNames: string[] })` selects checkboxes by label text using `getByLabel(name)`. Tests that need members must seed those characters explicitly and pass their names.
- Constraints:
  - Each test must own and create its own data — no reliance on pre-existing DB state.
  - Tests must be thread-safe: parallel runs must not share characters or parties.
  - `seedCharacter` (API-based, fast) is the correct seeding mechanism; UI-based `createCharacter` is only appropriate where the UI creation flow itself is under test.
- Assumptions:
  - The `PartyEditor` renders checkboxes as `<label>` elements whose text is the character name, making `getByLabel(name)` the correct Playwright selector.
  - `parties.spec.ts` line 77–81 already validates this label-based pattern manually.
- Edge cases considered:
  - `memberNames: []` is valid and creates an empty party (replaces all `memberCount: 0` callers).
  - A name passed to `memberNames` that doesn't exist as a character will throw a Playwright locator error — this is the correct failure mode (explicit, not silent).

## Scope

### In Scope

- Refactor `createParty()` signature from `{ memberCount: number }` to `{ memberNames: string[] }`.
- Update all callers in `combat.spec.ts` and `parties.spec.ts`.
- Add `seedCharacter` calls to the three combat party tests that currently create empty parties despite claiming a member count.
- Add a new `"Party member management"` describe block in `parties.spec.ts` with three regression tests: add member, remove member, correct names on card.

### Out of Scope

- Changes to `seedCharacter` itself (already correct).
- Changes to `createCharacter` (UI helper, kept as-is for tests that specifically exercise character creation UI).
- Any changes to application code (this is a test-only refactor).
- Changing the return type of `seedCharacter` (callers already hold the name).

## What Changes

- `tests/e2e/helpers/actions.ts`: `createParty` signature and implementation — `memberCount` → `memberNames[]`, positional loop → `getByLabel(name).check()` loop.
- `tests/e2e/combat.spec.ts`:
  - `"user can create a party"`: seed 4 named characters before `createParty`, pass `memberNames`, assert `Members: 4`.
  - `"party with different member counts"`: seed 6 named characters, pass 2 names to Small Group and all 6 to Large Group.
  - `"complete end-to-end flow"`: replace `memberCount: 13` with `memberNames: [identity.name("Thorin")]` (one character exists).
- `tests/e2e/parties.spec.ts`:
  - 4 existing `memberCount: 0` calls → `memberNames: []`.
  - New `"Party member management"` describe block with `beforeEach` seeding two characters and three tests.

## Risks

- Risk: `getByLabel(name)` may be ambiguous if a character name appears elsewhere on the page.
  - Impact: Playwright throws a "strict mode violation" error.
  - Mitigation: The existing manual usage at `parties.spec.ts:77–81` already uses this pattern without issue; `PartyEditor` checkboxes are scoped inside a form.
- Risk: Seeded characters from one test bleed into another in parallel runs.
  - Impact: Non-deterministic member counts or unexpected checkboxes visible.
  - Mitigation: Each test registers a fresh user via `registerTestUser`/`registerUser` — data is user-scoped and naturally isolated.

## Open Questions

No unresolved ambiguity. All decisions were confirmed during the explore session:
- Member selection by name (not position): confirmed.
- Inline `seedCharacter` per test (not shared beforeEach across tests): confirmed.
- Extended scope to add real member seeding to the hollow combat party tests: confirmed.
- New member removal regression tests in `parties.spec.ts`: confirmed.

## Non-Goals

- Do not add character deletion/cleanup after each test — user-scoped isolation via fresh registration makes this unnecessary.
- Do not migrate `createCharacter` UI helper to API-based; it exists to test the character creation UI flow.
- Do not change any application (non-test) code.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
