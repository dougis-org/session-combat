## Why

Currently, the character DELETE endpoint is non-functional — when users attempt to delete a character, the UI shows a brief confirmation/flash but the character is not actually removed from the database or the character list. This creates confusion about whether deletions succeeded. We need to fix the delete functionality while implementing soft delete to preserve audit trails and prevent data loss, allowing deleted characters to be marked with a timestamp rather than permanently removed.

## What Changes

- Add `deletedAt` timestamp field to character model to mark deletion (null when active)
- Fix broken DELETE /api/characters/{id} endpoint by implementing soft delete (set `deletedAt` instead of non-functional removal)
- Filter deleted characters from all character list queries in UI and API responses
- Update character retrieval endpoints to return 404 for soft-deleted characters
- Preserve character data in database for audit trail

## Capabilities

### New Capabilities
- `character-soft-delete`: Implement soft delete functionality for characters with timestamp tracking and automatic filtering of deleted characters from API and UI responses

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

**Affected Code:**
- Character model schema (add `deletedAt` field)
- Character repository/database queries (add soft delete filters)
- Character delete endpoint implementation (fix non-functional deletion)
- Character list endpoints (API and hooks)

**Affected APIs:**
- DELETE `/api/characters/{id}` - currently broken; will implement soft delete functionality
- GET `/api/characters` - now filters out soft-deleted characters
- GET `/api/characters/{id}` - returns 404 for soft-deleted characters

**Affected UI:**
- Character list displays
- Character detail views
- Delete confirmation flows

**Dependencies:**
- Database migration needed to add `deletedAt` field

## Scope

**In-Scope:**
- Adding `deletedAt` field to character schema
- Soft delete endpoint implementation
- Filtering deleted characters from queries
- Update character list views to exclude deleted characters

**Out-of-Scope:**
- Hard delete of character data
- Recovery/restore UI for deleted characters
- Audit logging system
- Bulk delete operations

## Risks

- Filtering logic must be applied consistently across all queries (prevent deleted characters from leaking through)
- Potential performance impact if filtering not done at database level (mitigated by MongoDB index on `deletedAt`)
- Backward compatibility: existing characters without `deletedAt` field must be treated as active
- If fix doesn't work, characters still won't delete (regression possible but less likely than current state)

## Non-Goals

- Building a full audit log system
- UI deletion recovery feature
- Admin tools for permanently removing characters

## Future Work

The following enhancements are documented as future GitHub issues and are out of scope for this implementation:

- **#78** Hard delete characters after retention period - Admin utility for permanent deletion of soft-deleted characters after configurable retention window
- **#79** Performance monitoring for soft delete queries - Monitor query performance and index usage of the characters_active view
- **#80** Audit trail for character deletions - Enhanced logging to track which user deleted characters and when

## Change Control Note

This proposal represents the agreed-upon scope for the character soft delete feature. If requirements change after approval, the proposal, design, specs, and tasks must be updated before proceeding to implementation.
