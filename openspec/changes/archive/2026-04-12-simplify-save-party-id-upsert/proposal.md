## Why

Issue #125 identified `storage.saveParty()` as carrying a legacy dual-query path
that matches by MongoDB `_id` when `_id` is present and by app-level `id`
otherwise. That branch adds ambiguity to the party persistence model, and after
review it does not appear to be used by the current create or edit flows.

The remaining risk was legacy data without a UUID `id` field. The database has
no party records, so there is no compatibility constraint to preserve. This is
the right time to remove the dead path and make party writes consistently match
by the stored application UUID.

## What Changes

- Simplify `storage.saveParty()` to always upsert parties by `{ id, userId }`
- Remove party-specific reliance on MongoDB `_id` for save matching
- Add or update automated coverage so party create and edit flows still succeed
  after the simplification
- Document the party persistence contract that the app-level UUID `id` is the
  canonical identifier for reads, writes, and deletes

## Capabilities

### New Capabilities

- `party-persistence`: Defines the identifier contract for persisting party
  records and updating existing parties

### Modified Capabilities

None.

## Impact

- Affected code: `lib/storage.ts`, party API routes, and party persistence tests
- Affected system: MongoDB-backed party create/update flow
- No API shape changes are expected
- No data migration is required because there are no existing party records
