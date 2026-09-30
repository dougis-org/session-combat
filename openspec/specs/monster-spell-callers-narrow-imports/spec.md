## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-09-30-migrate-monster-spell-repo-callers/design.md) document, not a replacement.

### Requirement: ADDED Callers use monsterTemplateRepo for Monster Template operations

The system SHALL route every call to a Monster Template operation (`saveMonsterTemplate`, `loadMonsterTemplates`, `loadAllMonsterTemplates`, `loadGlobalMonsterTemplates`, `deleteMonsterTemplate`, `saveManyMonsterTemplates`, `deleteMonsterTemplatesByIds`, `findExistingMonsterKeys`, `findMonsterByNameAndSource`) from the identified caller files (`lib/import/dedupeEngine.ts`, `app/api/monsters/route.ts`, `app/api/monsters/[id]/route.ts`, `app/api/monsters/[id]/duplicate/route.ts`, `app/api/monsters/global/route.ts`, `app/api/monsters/global/[id]/route.ts`, `app/api/monsters/upload/route.ts`) through a direct `monsterTemplateRepo` import (`import * as monsterTemplateRepo from '@/lib/storage/monsterTemplateRepo'`) rather than through the `storage` facade.

#### Scenario: Creating a monster template calls monsterTemplateRepo directly

- **Given** a POST request to `app/api/monsters/route.ts` with a valid monster template payload
- **When** the route handler persists the new template
- **Then** it calls `monsterTemplateRepo.saveMonsterTemplate(...)`, not `storage.saveMonsterTemplate(...)`

#### Scenario: Dedupe check inside dedupeEngine.ts uses monsterTemplateRepo for the monster path

- **Given** `lib/import/dedupeEngine.ts`'s `shouldImport("monsters", name, source)` path checks for an existing monster template
- **When** the migration is applied
- **Then** it calls `monsterTemplateRepo.findMonsterByNameAndSource(...)`, not `storage.findMonsterByNameAndSource(...)`

#### Scenario: Bulk upload ingestion and compensating delete both use monsterTemplateRepo

- **Given** `app/api/monsters/upload/route.ts`'s `ingest` function bulk-inserts survivor templates and, on failure, deletes the generated batch
- **When** the migration is applied
- **Then** it calls `monsterTemplateRepo.saveManyMonsterTemplates(...)` and, on the compensating-delete path, `monsterTemplateRepo.deleteMonsterTemplatesByIds(...)`, not the `storage` equivalents

### Requirement: ADDED Callers use spellRepo for Spell Template operations

The system SHALL route every call to a Spell Template operation (`loadSpells`, `loadSpellById`, `saveSpellTemplate`, `deleteSpellTemplate`, `spellExistsByNameAndSource`) from the identified caller files (`lib/import/dedupeEngine.ts`, `app/api/spells/route.ts`, `app/api/spells/[id]/route.ts`) through a direct `spellRepo` import (`import * as spellRepo from '@/lib/storage/spellRepo'`) rather than through the `storage` facade.

#### Scenario: Loading a spell by id calls spellRepo directly

- **Given** a GET request to `app/api/spells/[id]/route.ts` for an existing spell id
- **When** the route handler loads the spell
- **Then** it calls `spellRepo.loadSpellById(...)`, not `storage.loadSpellById(...)`

#### Scenario: Dedupe check inside dedupeEngine.ts uses spellRepo for the spell path

- **Given** `lib/import/dedupeEngine.ts`'s `shouldImport("spells", name, source)` path checks for an existing spell template
- **When** the migration is applied
- **Then** it calls `spellRepo.spellExistsByNameAndSource(...)`, not `storage.spellExistsByNameAndSource(...)`

### Requirement: ADDED dedupeEngine.ts imports both repos without a shared abstraction

The system SHALL have `lib/import/dedupeEngine.ts` import both `monsterTemplateRepo` and `spellRepo` directly (no intermediate wrapper module), selecting the correct repo per call site based on the `collection` value (`"monsters"` vs `"spells"`).

#### Scenario: shouldImport dispatches to the correct repo per collection

- **Given** `shouldImport(collection, name, source)` is called with `collection === "spells"`
- **When** the function executes
- **Then** it calls `spellRepo.spellExistsByNameAndSource(name, source)` and does not reference `monsterTemplateRepo` in that branch

### Requirement: ADDED No other storage.ts domain or file is touched by this migration

The system SHALL leave `lib/storage.ts`'s Monster/Spell Template delegation methods (lines 81-222) intact and unmodified, and SHALL leave `lib/storage/campaignTemplateRepo.ts` untouched, since it does not import the `storage` facade.

#### Scenario: storage.ts continues to expose the same public methods

- **Given** external code (or an existing test) calls `storage.saveMonsterTemplate(template)` directly
- **When** the call executes
- **Then** `lib/storage.ts`'s `saveMonsterTemplate` method still delegates to `monsterTemplateRepo.saveMonsterTemplate(template)` and behaves identically to before this change

#### Scenario: campaignTemplateRepo.ts is unaffected

- **Given** `lib/storage/campaignTemplateRepo.ts` implements its own MongoDB access via `runStorageOp` and never imports `@/lib/storage`
- **When** this migration is applied
- **Then** `lib/storage/campaignTemplateRepo.ts` has zero diff

## MODIFIED Requirements

*(None — this change does not modify externally observable requirements; it modifies internal module organization only. See ADDED Requirements above.)*

## REMOVED Requirements

*(None — no requirement, capability, or facade method is removed. `storage.ts`'s public surface is fully preserved via delegation.)*

## Traceability

- Proposal element: "9 production files change their import statement and call-site prefix only" -> Requirement: "ADDED Callers use monsterTemplateRepo for Monster Template operations" + "ADDED Callers use spellRepo for Spell Template operations"
- Proposal element: "`lib/import/dedupeEngine.ts` calls into both `monsterTemplateRepo` and `spellRepo`" -> Requirement: "ADDED dedupeEngine.ts imports both repos without a shared abstraction"
- Proposal element: "`lib/storage.ts` delegation code and `lib/storage/campaignTemplateRepo.ts` are explicitly out of scope" -> Requirement: "ADDED No other storage.ts domain or file is touched by this migration"
- Design decision: Decision 1 (namespace import matching facade style) -> Requirement: "ADDED Callers use monsterTemplateRepo for Monster Template operations" / "ADDED Callers use spellRepo for Spell Template operations"
- Design decision: Decision 2 (mechanical per-file replacement, no shared abstraction) -> Requirement: "ADDED dedupeEngine.ts imports both repos without a shared abstraction"

## Non-Functional Acceptance Criteria

### Requirement: Performance

Not applicable — this change makes no functional or runtime changes; the underlying implementation invoked is identical before and after migration.

### Requirement: Security

No new security-relevant surface is introduced (no new I/O, no new external calls, no new user-input handling). See functional scenarios: "storage.ts continues to expose the same public methods", "campaignTemplateRepo.ts is unaffected" — access-control and validation behavior in the migrated routes is unchanged because the underlying repo implementations are unchanged.

### Requirement: Reliability

#### Scenario: Full test suite passes unmodified except for facade-coupled tests

- **Given** the 9 production files are migrated to narrow repo imports
- **When** the full test suite is run
- **Then** all tests pass, with the only test file changes being to `tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage.characterization.test.ts`, `tests/unit/import/dedupeEngine.test.ts`, and `tests/unit/api/monsters/upload.route.test.ts` (per design.md Decision 3), and no other test file requires modification
