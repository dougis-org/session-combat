## Context

Currently, the character DELETE endpoint is non-functional — when users attempt to delete a character, the UI shows a blink/flash but the character is not actually removed from the system. This causes:
- Deleted characters still appear in lists and detail views
- No audit trail of deletion attempts or which characters were marked for deletion
- User confusion about whether deletion actually succeeded
- Data safety risk (users think data is deleted when it isn't)

The application uses Next.js with MongoDB for persistence, with character data stored in the `characters` collection. A DELETE endpoint exists at `DELETE /api/characters/{id}` but it is not properly persisting deletions. Character retrieval is handled through the storage API layer, which loads all user characters and the API endpoints that filter them. Characters are referenced in parties via `characterIds` arrays.

## Goals / Non-Goals

**Goals:**
- Implement soft delete with immutable audit trail (set `deletedAt` timestamp)
- Prevent deleted characters from appearing in character lists and detail views
- Ensure database queries automatically filter out deleted characters
- Maintain backward compatibility with existing character data
- Preserve ability to reference characters in parties without breaking data integrity

**Non-Goals:**
- Building a recovery/restore UI for deleted characters
- Implementing permanent hard delete functionality
- Creating an audit log system beyond the `deletedAt` timestamp
- Bulk delete operations
- Character recovery API endpoints
- Tracking who deleted characters (see Future Work #80)
- Performance monitoring of deletion queries (see Future Work #79)
- Hard delete or permanent removal of data (see Future Work #78)

## Mapping: Proposal → Design

| Proposal Element | Design Decision |
|--|--|
| Add `deletedAt` field | Add optional `deletedAt?: Date` to Character interface in types.ts |
| Soft delete endpoint | Modify DELETE handler to update `deletedAt` instead of removing document |
| Filter from queries | Create MongoDB view `characters_active` that auto-filters `deletedAt != null` |
| Filter from API | Application queries `characters_active` view instead of characters collection |
| Filter from UI | Character lists automatically filtered via view (no code changes needed) |
| Database performance | Create MongoDB index on `deletedAt` field for view performance |

## Decisions

### 1. Schema Change: Add `deletedAt` Field to Character
**Decision:** Add `deletedAt?: Date` (optional) to the Character interface and MongoDB schema.

**Rationale:**
- ISO 8601 timestamps provide audit trail and recovery potential
- Optional field maintains backward compatibility (existing characters have null/undefined `deletedAt`)
- Single field is simpler than separate deleted boolean + timestamp

**Alternatives Considered:**
- Separate `isDeleted: boolean` + `deletedAt: Date` - adds complexity, less semantic (nullable optional is cleaner)
- Store in separate `deleted_characters` collection - would require duplication and more complex queries

### 2. Soft Delete Implementation at Storage Layer (Fixes Non-Functional Delete)
**Decision:** Modify `deleteCharacter()` in storage.ts to perform an update operation that sets a `deletedAt` timestamp, fixing the currently non-functional delete operation.

**Rationale:**
- Current `deleteCharacter()` implementation is not working (bug fix)
- Soft delete approach provides audit trail and data safety (improvement)
- Centralizes delete logic in one place (storage.ts)
- All API endpoints automatically work with the fixed delete without changes
- Single source of truth prevents inconsistent deletion behavior

**Current Behavior (Broken):**
```
Attempts: db.collection.deleteOne({ id, userId })
Result: No actual deletion occurs; character remains in database
```

**Fixed Behavior:**
```
Updated: db.collection.updateOne(
  { id, userId },
  { $set: { deletedAt: new Date() } }
)
Result: Character marked as deleted with timestamp; soft-delete filters prevent display
```

**Alternative Considered:**
- Implement hard delete (actually remove documents) - loses audit trail and prevents recovery

### 3. Query Filtering Strategy: Create MongoDB View to Exclude Soft-Deleted Characters
**Decision:** Create a MongoDB view named `characters_active` that automatically filters out documents where `deletedAt != null`. The application will query this view instead of the underlying `characters` collection.

**Rationale:**
- Filtering at database level is enforced and consistent across all queries
- No need to remember to add filters to every query in application code
- Impossible to accidentally expose deleted characters through a missed filter
- More efficient than application-layer filtering (filtering happens at source)
- Cleaner code - queries don't need explicit `{ deletedAt: null }` filters

**Implementation:**
```typescript
db.createCollection('characters_active', {
  viewOn: 'characters',
  pipeline: [
    { $match: { deletedAt: null } }
  ]
})
```

**Usage:**
- Application code queries `characters_active` view instead of `characters` collection
- All queries automatically exclude soft-deleted characters
- Underlying `characters` collection preserves all data including deleted records

**Alternative Considered:**
- Application-layer filtering (add filter to every query) - error-prone, less maintainable, duplicate logic across codebase

### 4. Party Cleanup on Delete
**Decision:** Keep existing party cleanup logic but run after soft delete.

**Rationale:**
- Prevents references to deleted characters from appearing in party combats
- Maintains referential integrity even though soft-deleted characters are hidden

**Implementation:** Keep the existing `$pull: { characterIds: id }` operation after updating `deletedAt`

### 5. GET Detail Endpoint Behavior
**Decision:** Return 404 for soft-deleted characters.

**Rationale:**
- From user perspective, soft-deleted characters don't exist
- Consistent with list endpoint (characters don't appear in lists)
- Prevents accidental access to deleted character data

### 6. No Hard Delete Path
**Decision:** Do not provide hard delete functionality at this stage.

**Rationale:**
- Safer default (can always add hard delete later)
- Simplifies implementation and testing
- Preserves audit trail completeness

**Note:** If hard delete is needed in future, can be added as separate dangerous endpoint with explicit authentication

### 7. Database Index on deletedAt Field
**Decision:** Add a MongoDB index on the `deletedAt` field to optimize performance of the `characters_active` view.

**Rationale:**
- The `characters_active` view filters using `{ $match: { deletedAt: null } }` which benefits from an index
- Ensures the view returns results quickly even with many soft-deleted characters
- Single-field index is low-overhead and safe to add
- Index is used by MongoDB's query planner for the view's aggregation pipeline

**Implementation:**
```
db.collection('characters').createIndex({ deletedAt: 1 })
```

**Note:** Can be added via migration, database initialization script, or in connection setup

## Risks / Trade-offs

| Risk | Mitigation |
|--|--|
| **Backward Compatibility:** Existing characters may not have `deletedAt` field | MongoDB views handle missing fields gracefully; they're treated as null |
| **Performance:** View must filter all characters on each query | MongoDB index on `deletedAt` ensures optimal performance (Decision 7) |
| **View Overhead:** Creating a view requires database setup | One-time setup cost; view is lightweight and fully managed by MongoDB |
| **Party Cleanup Timing:** Character may briefly appear in party after soft delete but before cleanup | Unlikely in practice (~1ms window); acceptable risk |

## Rollback / Migration Plan

**Deployment:**
1. Deploy code with `deletedAt` field in Character interface
2. Existing characters will have `deletedAt: undefined` (safely treated as active)
3. Delete operations immediately switch to soft delete
4. No database migration needed (MongoDB handles optional fields)

**Rollback Plan (if needed):**
1. Revert code to hard delete
2. Existing soft-deleted characters (with `deletedAt` timestamp) will be treated as deleted
3. Can reinstate characters by clearing `deletedAt` field (manual database operation)

**Gradual Rollout:**
- Deploy to staging first, run full test suite
- Monitor for any query/list inconsistencies
- Deploy to production with confidence

## Future Work

The following enhancements are documented as future GitHub issues and are out of scope for this implementation:

- **#78** Hard delete characters after retention period - Admin utility for permanent deletion of soft-deleted characters after configurable retention window
- **#79** Performance monitoring for soft delete queries - Monitor query performance and index usage of the characters_active view
- **#80** Audit trail for character deletions - Enhanced logging to track which user deleted characters and when

---

## Non-Functional Requirements Mapping

| Requirement | Validation Strategy |
|--|--|
| Deleted characters don't appear in lists | Unit test: loadCharacters() filters records with deletedAt timestamp |
| GET detail returns 404 for deleted | Integration test: call GET after delete, verify 404 response |
| Party cleanup happens with delete | Integration test: verify characterIds array updated atomic with delete |
| Backward compatibility maintained | Load existing characters without deletedAt field, verify they appear in lists |

