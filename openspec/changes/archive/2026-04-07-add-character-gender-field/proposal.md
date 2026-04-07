## GitHub Issues

- #118
- #51 (related — character creation regression tests)

## Why

- Problem statement: Characters in session-combat have race, alignment, and class fields but no gender field. D&D 5e characters commonly have a gender identity that players want to record and display.
- Why now: Issue #51's acceptance criteria already references a gender field; the form never implemented it. This change closes that gap properly.
- Business/user impact: Players cannot record a character's gender, leaving a common character attribute homeless. Adding it completes the character identity data model.

## Problem Space

- Current behavior: `CharacterEditor` supports name, class/level, race, and alignment. There is no gender input, no gender field on the `Character` type, and no API handling for gender.
- Desired behavior: A free-text gender input appears in `CharacterEditor`. Gender is persisted through create and edit flows, displayed alongside race wherever race is shown (prepended: "Female Human"), and covered by E2E regression tests.
- Constraints:
  - Free-text only — no closed enum or dropdown — to remain inclusive and future-proof.
  - Optional field; existing characters and API callers must not break.
  - Max 50 characters (API validation).
  - Gender shown prepended to race everywhere race is displayed.
- Assumptions:
  - Race is currently the only place in the UI where gender needs to appear (character card subtitle). No separate detail/profile view exists beyond the list card.
  - `createCharacter()` E2E helper extends with an optional `gender` parameter; existing callers need no changes.
- Edge cases considered:
  - Gender set, race empty → display gender alone.
  - Race set, gender empty → display race alone (current behavior preserved).
  - Both set → display "Female Human" (gender + space + race).
  - Neither set → display nothing (current behavior preserved).
  - Gender value > 50 chars → API returns 400.

## Scope

### In Scope

- `gender?: string` added to `Character` type in `lib/types.ts`
- Free-text gender input in `CharacterEditor` (`aria-label="Character gender"`)
- Gender persisted via `POST /api/characters` and `PUT /api/characters/:id`
- API validation: optional string, max 50 chars
- Gender displayed prepended to race in the character list card
- `createCharacter()` E2E helper extended with optional `gender` param
- E2E tests in `tests/e2e/characters.spec.ts` covering field presence, persistence, and display

### Out of Scope

- Dropdown or predefined gender options
- Gender displayed in party views, encounter views, or any surface other than the character list card
- Search or filter by gender
- Migration of existing character records (field is optional; existing records are unaffected)

## What Changes

- `lib/types.ts` — add `gender?: string` to `Character` interface (appears in two locations)
- `app/characters/page.tsx` — add gender state + input in `CharacterEditor`; update card display to prepend gender to race
- `app/api/characters/route.ts` — destructure and persist `gender`; validate max 50 chars
- `app/api/characters/[id]/route.ts` — handle `gender` in PUT update
- `tests/e2e/helpers/actions.ts` — extend `createCharacter` helper with optional `gender`
- `tests/e2e/characters.spec.ts` — add gender field presence and persistence tests

## Risks

- Risk: Free-text gender with no length limit could cause layout issues on character cards.
  - Impact: Low — card readability degrades for very long values.
  - Mitigation: API enforces max 50 chars. Card layout is user's responsibility beyond that.
- Risk: Extending `createCharacter()` helper could break existing test callers if not done carefully.
  - Impact: Medium — test suite failures.
  - Mitigation: Add `gender` as an optional field; all existing callers pass no gender and continue working unchanged.

## Open Questions

No unresolved ambiguity. All decisions confirmed during explore session:
- Free text confirmed (not dropdown).
- Display location confirmed: prepended to race, everywhere race appears.
- Test location confirmed: extend `tests/e2e/characters.spec.ts`, not a separate file.
- Card width overflow is the user's concern to manage.

## Non-Goals

- Predefined gender options or a hybrid dropdown
- Gender on any view other than character list card
- Filtering or sorting characters by gender
- Backfilling or migrating existing character data

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
