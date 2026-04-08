## Context

`storage.saveParty()` currently mirrors the legacy query pattern used by several
other storage helpers: if `_id` is present on the input object, it updates by
MongoDB `_id`; otherwise it updates by `{ id, userId }`. For parties, that
branch no longer matches the observed application flow.

Parties are created with `id: crypto.randomUUID()` in the POST route, then
loaded and edited through API handlers that operate on the app-level `id`.
Issue #125 asked whether the `_id` branch was still needed. The remaining
compatibility concern was legacy party documents without a UUID `id`, but the
database currently contains no party records.

## Goals / Non-Goals

**Goals:**

- Remove ambiguous legacy matching logic from `saveParty()`
- Make party persistence consistently keyed by `{ id, userId }`
- Preserve existing create and edit behavior for parties
- Leave the canonical identifier contract clear for future maintenance

**Non-Goals:**

- Changing identifier handling for encounters, characters, combat state, or
  monster templates
- Migrating existing legacy party records
- Refactoring the broader storage layer into shared helpers

## Decisions

### Decision: Match saved parties only by application UUID and user

`saveParty()` will always issue its upsert query using `{ id: party.id,
userId: party.userId }`.

Rationale:

- The create route already guarantees a UUID `id` before persistence.
- The party edit flow finds records by app-level `id` and re-saves the loaded
  party object.
- The delete flow already relies on `{ id, userId }`, so aligning save behavior
  removes an unnecessary difference between read, write, and delete paths.
- With no existing party records in the database, there is no migration burden.

Alternatives considered:

- Keep the `_id` fallback branch indefinitely.
  Rejected because it preserves an unverified legacy path that obscures the
  actual persistence contract.
- Add a data migration for hypothetical legacy parties.
  Rejected because there are no party records to migrate.

### Decision: Validate through regression coverage instead of migration logic

The implementation should keep or add automated coverage for party creation and
edit/update behavior so the simplified upsert path is exercised directly.

Rationale:

- The risk is behavioral regression, not data conversion.
- Tests provide a durable guard once the dead branch is removed.

## Risks / Trade-offs

- [Party records are later imported without `id`] → The simplified query would
  not match such documents; mitigate by keeping party creation paths responsible
  for assigning UUIDs and revisiting with a migration if a new import path is
  introduced.
- [Other storage helpers still use the legacy dual-query pattern] → This change
  improves parties only, not the wider storage layer; mitigate by keeping scope
  narrow and documenting the reason in the proposal.
