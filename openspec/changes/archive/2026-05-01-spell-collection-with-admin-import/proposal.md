## GitHub Issues

- #146
- #93 (blocked by this)

## Why

- **Problem statement:** The application has no spell infrastructure, preventing concentration tracking (issue #93) from implementing a spell dropdown. Additionally, the existing monster data is sourced from static JSON files that don't stay in sync with open5e.

- **Why now:** Issue #93 (Concentration Tracking) is blocked because it needs a spell collection to populate its dropdown. This provides the opportunity to build proper API-based ingestion infrastructure for both monsters and spells.

- **Business/user impact:** Users gain access to 1955+ spells via open5e API sync. Monsters become synchronized with open5e source (300+). Admin import becomes a proper ETL pipeline rather than static JSON seeding.

## Problem Space

- **Current behavior:**
  - Monsters are seeded from static JSON files in `lib/data/monsters/` via `PUT /api/monsters/global/seed`
  - The seed endpoint DELETES all global monsters then re-inserts (not incremental)
  - No spell infrastructure exists
  - No spell dropdown for concentration tracking

- **Desired behavior:**
  - Admin can sync monsters and spells from open5e API
  - Sync is incremental (only adds net-new items, skips existing)
  - Sync is restartable if interrupted
  - Spell dropdown in combat tracker powered by spell collection
  - Same collection for monsters, distinguished by `isGlobal: true` and `source` field

- **Constraints:**
  - Single `monsterTemplates` collection (existing)
  - Admin-only import/sync
  - Must preserve user-created monsters (never overwrite)
  - Existing monster library UI/presentation logic must continue working

- **Assumptions:**
  - open5e API remains available and rate-limits are manageable
  - Admin users understand the sync behavior (skip existing)

- **Edge cases considered:**
  - open5e API rate limiting mid-sync → restartable via dedupe check
  - Duplicate monster names from different sources → dedupe by name + source
  - User with same name as open5e monster → user monsters are separate (different userId)

## Scope

### In Scope

- `SpellTemplate` type and `spellTemplates` collection
- `lib/import/open5eAdapter.ts` - paginated fetch from open5e
- `lib/import/dedupeEngine.ts` - skip-if-exists logic
- `lib/import/transformMonster.ts` - open5e monster → our schema
- `lib/import/transformSpell.ts` - open5e spell → our schema
- `POST /api/import/open5e` - admin sync endpoint
- `GET/POST /api/spells` - spell CRUD
- `GET/PUT/DELETE /api/spells/[id]` - spell CRUD by ID
- `app/spells/import/page.tsx` - admin import UI
- `app/spells/page.tsx` - spell library page
- Enhanced monster import UI with open5e sync option
- Migration: retroactively set `source: "SRD"` on existing global monsters
- Migration: delete `lib/data/monsters/` (14 category files)
- Migration: delete `lib/data/srd-monsters.ts`
- Migration: delete `lib/scripts/seedMonsters.ts`

### Out of Scope

- User-owned spell templates (all spells are global)
- Scheduled/automated sync (admin-triggered only)
- Spell detail pages or spell search UI beyond dropdown
- Editing spells via UI (admin import only)
- Import from sources other than open5e

## What Changes

1. **New `spellTemplates` collection** stores open5e spells with schema including `concentration: boolean`

2. **Centralized import infrastructure** (`lib/import/`) handles paginated fetch, deduplication, and transformation for both monsters and spells

3. **Admin sync endpoint** `POST /api/import/open5e` triggers sync for monsters and/or spells

4. **Existing `PUT /api/monsters/global/seed`** replaced by open5e sync

5. **Static JSON files deleted** after migration (no longer needed)

6. **Existing global monsters** retroactively tagged with `source: "SRD"`

## Risks

- **Risk:** open5e API rate limiting or downtime
  - **Impact:** Sync may fail mid-import
  - **Mitigation:** Restartable - dedupe check ensures already-imported items are skipped

- **Risk:** Schema mismatch between open5e response and our MonsterTemplate/SpellTemplate
  - **Impact:** Transform failures, partial imports
  - **Mitigation:** Transform functions validate required fields; invalid items logged and skipped

- **Risk:** Removing static JSON breaks if open5e API becomes unavailable
  - **Impact:** No way to populate monster/spell data
  - **Mitigation:** Sync is one-time per item; already-synced data remains in DB

- **Risk:** Name collisions between user monsters and open5e monsters
  - **Impact:** User's "Goblin" confused with open5e's "Goblin"
  - **Mitigation:** Dedupe by name + source; user monsters have different userId

## Open Questions

- **Question:** Should spell templates be editable by admins post-import, or are they read-only from open5e?
  - **Needed from:** Decision on admin UX
  - **Blocker for apply:** No (can implement as admin-only create/update)

- **Question:** Should the spell dropdown in #93 reference spell ID or store spell name as text?
  - **Needed from:** #93 requirements clarity
  - **Blocker for apply:** No (dropdown can use either)

- **Question:** Do we need pagination on the spell library page, or load all spells?
  - **Needed from:** UX decision
  - **Blocker for apply:** No (can add pagination later)

## Non-Goals

- User-owned spell templates (all spells are admin-managed global)
- Automated/scheduled sync from open5e
- Import from sources other than open5e
- Spell editing UI for admins
- Changing the existing monsterTemplates collection structure

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
