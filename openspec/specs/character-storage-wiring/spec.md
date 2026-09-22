## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-09-22-migrate-character-repo-callers/design.md) document, not a replacement.

### Requirement: ADDED Character API routes call characterRepo directly for character persistence

The system SHALL route all character-domain reads and writes (`loadCharacters`, `loadCharacterById`, `saveCharacter`, `deleteCharacter`) in `app/api/characters/route.ts`, `app/api/characters/[id]/route.ts`, `app/api/characters/import/route.ts`, `app/api/campaigns/[id]/characters/[cid]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, and `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts` through `lib/storage/characterRepo.ts`'s named exports instead of the `storage` facade.

#### Scenario: Pure character route imports characterRepo directly

- **Given** `app/api/characters/route.ts` needs to load and save a user's characters
- **When** the route handler executes `GET` or `POST`
- **Then** it calls `loadCharacters`/`saveCharacter` imported from `@/lib/storage/characterRepo`, and the file no longer imports `storage` from `@/lib/storage`

#### Scenario: Mixed route keeps storage import alongside characterRepo import

- **Given** `app/api/campaigns/[id]/characters/[cid]/route.ts` needs both `loadCharacterById` (character domain) and `getMember`/`removeShare`/`setPartyMemberLeftAt` (membership/share domain)
- **When** the route handler executes any of its handlers
- **Then** `loadCharacterById` is called via the import from `@/lib/storage/characterRepo`, while `getMember`, `removeShare`, and `setPartyMemberLeftAt` continue to be called via the retained `storage` import from `@/lib/storage`

## MODIFIED Requirements

None. This change does not alter any existing user-facing requirement — it is an internal caller-wiring change with no behavior change, per proposal.md "What Changes".

## REMOVED Requirements

None.

## Traceability

- Proposal element: "In Scope" (six file bullets) -> Requirement: ADDED Character API routes call characterRepo directly for character persistence
- Design decision: Decision 1 (per-file import strategy) -> Requirement: ADDED Character API routes call characterRepo directly for character persistence
- Requirement: ADDED Character API routes call characterRepo directly for character persistence -> Task(s): per-file import/call-site edits in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Pure character route imports characterRepo directly", "Mixed route keeps storage import alongside characterRepo import". Ownership/auth enforcement (401 unauthenticated, 404 for non-owned characters) is unchanged by this migration — the underlying `withAuth`/`withAuthAndParams` middleware and `auth.userId` scoping are not modified, only the import source of the persistence call. No new access-control scenario is introduced beyond confirming existing behavior is preserved (see proposal.md "Scope", regression tests bullet, and design.md Decision 3).

### Requirement: Reliability

#### Scenario: No change to existing error handling

- **Given** any of the six touched routes previously returned a specific status code (200/201/400/401/404/500) for a given condition via `storage.*`
- **When** the same condition occurs after migrating the call to `characterRepo`
- **Then** the route returns the identical status code and response shape, since `characterRepo`'s exported functions have identical signatures and behavior to their `storage.*` equivalents
