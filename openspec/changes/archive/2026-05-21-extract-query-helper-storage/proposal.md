## GitHub Issues

- #157

## Why

- **Problem statement:** `lib/storage.ts` repeats an identical five-line query-building block in five save functions. Four of them also use `let query: any`, leaving the MongoDB filter type unverified at compile time.
- **Why now:** The pattern has already spread to five call sites. A sixth save function (`saveSpellTemplate`) made a partial improvement to `Record<string, unknown>` inconsistently. The cost of extraction only grows.
- **Business/user impact:** Pure internal code quality — no user-visible change. Reduces the chance of a future developer introducing a subtle query bug in a copy-pasted block.

## Problem Space

- **Current behavior:** Five save functions (`saveEncounter`, `saveCharacter`, `saveCombatState`, `saveMonsterTemplate`, `saveSpellTemplate`) each contain:
  ```typescript
  let query: any = { userId: entity.userId };
  if (entity._id) {
    query._id = new ObjectId(entity._id);
  } else {
    query.id = entity.id;
  }
  ```
  Four use `any`; one uses `Record<string, unknown>`. None use the correct MongoDB `Filter<Document>` type.
- **Desired behavior:** A single private helper encapsulates the logic and returns a properly typed `Filter<Document>`. All five call sites delegate to it.
- **Constraints:** Must not touch `saveParty`, which intentionally uses a different query shape (`id + userId` only — no `_id` branch) with an explicit comment explaining the decision.
- **Assumptions:** `Filter<Document>` is assignable to `Filter<TSchema>` for each collection's typed `updateOne` call without additional casting.
- **Edge cases considered:** `saveParty` exclusion; `saveSpellTemplate`'s partial existing improvement gets replaced by the canonical helper.

## Scope

### In Scope

- Extract `buildEntityQuery` as a module-private function in `lib/storage.ts`
- Update all five save functions to use it
- Eliminate all `any` and `Record<string, unknown>` query locals in those functions

### Out of Scope

- Moving code to a separate `lib/storage/query-helpers.ts` file
- Refactoring `saveParty`
- Any other changes to `lib/storage.ts`

## What Changes

- New private function `buildEntityQuery(entity: QueryableEntity): Filter<Document>` added near top of `lib/storage.ts`
- New private interface `QueryableEntity` (or inline type constraint) capturing the `{ _id?: string; id: string; userId: string }` shape
- Five call sites updated to use the helper, removing their local query variable

## Risks

- Risk: `Filter<Document>` may not satisfy the generic `Filter<TSchema>` constraint on typed collection calls without casting.
  - Impact: Compile error; build breaks.
  - Mitigation: Verify during implementation; if needed, use `Filter<WithId<TSchema>>` or cast at the call site only.

## Open Questions

- None — no blockers identified.

## Non-Goals

- Creating a new file or directory for storage helpers
- Improving any other aspect of `lib/storage.ts`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
