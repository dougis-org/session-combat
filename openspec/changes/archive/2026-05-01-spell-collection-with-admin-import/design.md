## Context

- **Relevant architecture:**
  - Single `monsterTemplates` collection (existing pattern)
  - `GLOBAL_USER_ID` constant for admin-owned global templates
  - `isGlobal: true` flag distinguishes global from user templates
  - Existing monster library UI at `/monsters`

- **Dependencies:**
  - open5e API availability
  - MongoDB `spellTemplates` collection (new)

- **Interfaces/contracts touched:**
  - `app/api/monsters/global/route.ts` (replace seed logic)
  - `app/api/monsters/upload/route.ts` (enhance with open5e sync)
  - `app/monsters/import/page.tsx` (enhance with open5e sync)
  - `lib/storage.ts` (add spell methods)
  - `lib/types.ts` (add SpellTemplate type)

## Goals / Non-Goals

### Goals

- Build spell infrastructure (type, collection, CRUD API, UI)
- Replace static JSON monster seeding with live open5e API ingestion
- Create centralized import framework extensible for future sources
- Support incremental, restartable sync via deduplication
- Preserve existing monster library UI without modifications

### Non-Goals

- User-owned spell templates
- Automated/scheduled sync
- Import from sources other than open5e
- Spell editing UI (admin import only)

## Decisions

### Decision 1: Single Collection for Monsters, Single Collection for Spells

- **Chosen:** Existing `monsterTemplates` for monsters, new `spellTemplates` for spells
- **Alternatives considered:** Separate global/local collections for each
- **Rationale:** Matches existing monster pattern, simpler UI (same presentation logic), consistent admin experience
- **Trade-offs:** `isGlobal` flag must be consistently applied

### Decision 2: Dedupe by Name + Source

- **Chosen:** Check `{ name, source }` before insert, skip if exists
- **Alternatives considered:** Last-write-wins, skip all globals, merge fields
- **Rationale:** Restartable sync, preserves user customizations, simple to reason about
- **Trade-offs:** If open5e data changes (e.g., stat fix), existing entries won't update

### Decision 3: Admin-Only Sync

- **Chosen:** Only admin users can trigger sync
- **Alternatives considered:** Auto-sync on first deploy, any authenticated user
- **Rationale:** open5e data is authoritative SRD content, shouldn't be user-modified
- **Trade-offs:** Requires admin action to populate initially

### Decision 4: Source Field for Provenance

- **Chosen:** Each template has `source` field ("SRD", "open5e")
- **Alternatives considered:** Infer from userId, no source tracking
- **Rationale:** Clear provenance, enables future dedupe between sources
- **Trade-offs:** Migration needed to set source on existing global monsters

### Decision 5: Transform Functions Map External Schema to Internal

- **Chosen:** `transformMonster.ts` and `transformSpell.ts` in `lib/import/`
- **Alternatives considered:** Store raw open5e data, use open5e IDs
- **Rationale:** Our schema is the canonical form, decouples from source API changes
- **Trade-offs:** Transform logic must be maintained if open5e schema changes

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation Approach |
|-----------------|----------------|---------------------|
| Spell infrastructure | `spellTemplates` collection + SpellTemplate type | Tests verify CRUD + concentration field |
| Centralized import | `lib/import/open5eAdapter.ts` + `dedupeEngine.ts` | Unit tests for dedupe logic |
| Admin sync endpoint | `POST /api/import/open5e` | Integration test with mock API |
| Replace seed endpoint | Reimplement as open5e sync | Verify existing tests pass |
| Delete static JSON | Remove files after migration | File system check in tests |
| Migration: set source: "SRD" | One-time migration script | Migration test |
| Enhanced monster import | Add open5e sync option to UI | UI integration test |

## Functional Requirements Mapping

- **Requirement:** Spell collection stored in database
  - **Design element:** `SpellTemplate` interface, `spellTemplates` collection, `storage.ts` methods
  - **Acceptance criteria:** `specs/spell-schema/spec.md`
  - **Testability notes:** Unit test for SpellTemplate shape, integration test for CRUD operations

- **Requirement:** Admin import UI for spells
  - **Design element:** `app/spells/import/page.tsx`
  - **Acceptance criteria:** `specs/spell-import-ui/spec.md`
  - **Testability notes:** UI test simulating admin import flow

- **Requirement:** open5e API integration for spell data
  - **Design element:** `lib/import/open5eAdapter.ts`, `lib/import/transformSpell.ts`
  - **Acceptance criteria:** `specs/open5e-adapter/spec.md`
  - **Testability notes:** Mock open5e responses, verify transformation

- **Requirement:** Robust dedupe (only add net new)
  - **Design element:** `lib/import/dedupeEngine.ts`
  - **Acceptance criteria:** `specs/dedupe-logic/spec.md`
  - **Testability notes:** Unit test: insert same item twice, verify only one exists

- **Requirement:** Searchable dropdown for concentration spell selection (#93)
  - **Design element:** Spell dropdown component reading from `spellTemplates` filtered by `concentration: true`
  - **Acceptance criteria:** Covered in #93 specs
  - **Testability notes:** #93 implementation

- **Requirement:** Monster import extended to use open5e
  - **Design element:** `lib/import/transformMonster.ts`, enhanced import UI
  - **Acceptance criteria:** `specs/monster-open5e-sync/spec.md`
  - **Testability notes:** Integration test with mock open5e creature data

## Non-Functional Requirements Mapping

- **Requirement category: performance**
  - **Requirement:** Sync 1955+ spells without timeout
  - **Design element:** Paginated API fetch (50/page), batch inserts
  - **Acceptance criteria:** All items sync successfully
  - **Testability notes:** Load test with mocked API

- **Requirement category: reliability**
  - **Requirement:** Restartable sync on failure
  - **Design element:** Dedupe check before each insert
  - **Acceptance criteria:** Partial sync can resume
  - **Testability notes:** Simulate failure mid-sync, resume, verify all items present

- **Requirement category: security**
  - **Requirement:** Only admins can trigger sync
  - **Design element:** `requireAuth` + `isUserAdmin` middleware on sync endpoint
  - **Acceptance criteria:** Non-admin gets 403
  - **Testability notes:** Auth middleware test

## Risks / Trade-offs

- **Risk:** open5e API changes schema, transforms fail
  - **Impact:** Partial imports, data inconsistency
  - **Mitigation:** Validate required fields in transform; log and skip invalid items

- **Risk:** open5e rate limits during sync
  - **Impact:** Sync interrupted
  - **Mitigation:** Handle 429 responses, implement backoff, dedupe enables restart

- **Risk:** Static JSON removal breaks if open5e unavailable
  - **Impact:** Cannot populate data without open5e
  - **Mitigation:** Data persists in DB once synced; admin can trigger sync when API available

- **Trade-off:** Dedupe by name means open5e stat corrections won't propagate
  - **Impact:** Bug fixes in open5e won't update existing entries
  - **Mitigation:** Admin can manually delete specific entries and re-sync

## Rollback / Mitigation

- **Rollback trigger:** Migration fails, data corruption, open5e API issues
- **Rollback steps:**
  1. Restore static JSON files from git history
  2. Re-run `PUT /api/monsters/global/seed` to repopulate monsters
  3. SpellTemplates collection can be dropped (no user data lost)
- **Data migration considerations:** Existing user monsters unaffected (different userId)
- **Verification after rollback:** Verify monster count matches JSON, no spellTemplates collection

## Operational Blocking Policy

- **If CI checks fail:** Block merge; do not proceed to apply until green
- **If security checks fail:** Block merge; security review required
- **If required reviews are blocked/stale:** Escalate to team lead after 48 hours
- **Escalation path:** Team lead → Project owner

## Open Questions

- None remaining - all questions resolved during exploration

  Confirmation: open5e rate limits manageable, dedupe enables restart, admin triggers manually, existing monsters tagged "SRD", JSON files deleted after migration.
