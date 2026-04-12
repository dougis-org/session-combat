## 1. Implementation

- [x] 1.1 Simplify `lib/storage.ts` so `saveParty()` always upserts by
  `{ id: party.id, userId: party.userId }`
- [x] 1.2 Remove the party-specific `_id` query branch and update any related
  comments to reflect the canonical UUID-based contract

## 2. Verification

- [x] 2.1 Add or update automated test coverage for party create/edit flows so
  updates without `_id` continue to succeed
- [x] 2.2 Run the relevant validation commands and confirm the party
  persistence change does not regress existing behavior
