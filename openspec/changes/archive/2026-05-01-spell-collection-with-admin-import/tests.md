---
name: tests
description: Tests for spell-collection-with-admin-import
---

# Tests

## Overview

This document outlines the tests for the `spell-collection-with-admin-import` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: Add SpellTemplate Type

- [ ] **Test: SpellTemplate has required fields**
  - Given a raw spell object from open5e
  - When transformed to SpellTemplate
  - Then it should have: id, userId, isGlobal, source, name, level, concentration, school, description, castingTime, range, duration, components (with verbal, somatic, material booleans)

- [ ] **Test: SpellTemplate concentration field is boolean**
  - Given a spell with concentration: true in open5e
  - When transformed
  - Then concentration should be boolean true

- [ ] **Test: Cantrip spells have level 0**
  - Given a cantrip spell from open5e
  - When transformed
  - Then level should be 0

### Task 2: Add Spell Storage Methods

- [ ] **Test: saveSpellTemplate upserts spell**
  - Given a SpellTemplate with id
  - When saveSpellTemplate is called
  - Then the spell should be in the database

- [ ] **Test: loadSpells returns global spells**
  - Given 3 global spell templates in DB
  - When loadSpells is called
  - Then all 3 should be returned

- [ ] **Test: spellExistsByNameAndSource returns true for existing**
  - Given a spell "Fireball" with source "open5e" exists
  - When spellExistsByNameAndSource("Fireball", "open5e") is called
  - Then it should return true

- [ ] **Test: spellExistsByNameAndSource returns false for non-existing**
  - Given no spell "Magic Missile" with source "open5e" exists
  - When spellExistsByNameAndSource("Magic Missile", "open5e") is called
  - Then it should return false

### Task 3: Create open5e Adapter

- [ ] **Test: fetchSpells handles pagination**
  - Given open5e API has 1955 spells (paginated)
  - When fetchSpells is called
  - Then it should handle multiple pages automatically

- [ ] **Test: fetchSpells handles rate limit with backoff**
  - Given open5e API returns 429
  - When fetchSpells is called
  - Then it should retry with exponential backoff

- [ ] **Test: transformSpell maps concentration correctly**
  - Given open5e spell with concentration: true
  - When transformSpell is called
  - Then the result should have concentration: true

- [ ] **Test: transformSpell validates required fields**
  - Given open5e spell missing required fields
  - When transformSpell is called
  - Then it should return null or throw (logged as invalid)

### Task 4: Create Dedupe Engine

- [ ] **Test: shouldImport returns false for existing**
  - Given spell "Fireball" with source "open5e" exists
  - When shouldImport("spellTemplates", "Fireball", "open5e") is called
  - Then it should return false

- [ ] **Test: shouldImport returns true for new**
  - Given no spell "NewSpell" with source "open5e" exists
  - When shouldImport("spellTemplates", "NewSpell", "open5e") is called
  - Then it should return true

- [ ] **Test: importWithDedup skips duplicates**
  - Given 5 spells, 2 already exist
  - When importWithDedup is called with all 5
  - Then only 3 should be inserted

### Task 5: Create Import API Endpoint

- [ ] **Test: POST /api/import/open5e returns 401 without auth**
  - Given no auth token
  - When POST /api/import/open5e is called
  - Then it should return 401

- [ ] **Test: POST /api/import/open5e returns 403 for non-admin**
  - Given authenticated non-admin user
  - When POST /api/import/open5e is called
  - Then it should return 403

- [ ] **Test: POST /api/import/open5e triggers spell sync for admin**
  - Given authenticated admin user
  - When POST /api/import/open5e with { type: "spells" } is called
  - Then it should trigger open5e spell sync
  - And return { inserted: number, skipped: number }

### Task 6: Create Spell CRUD API

- [ ] **Test: GET /api/spells returns all global spells**
  - Given 10 global spells in DB
  - When GET /api/spells is called
  - Then it should return all 10

- [ ] **Test: GET /api/spells?concentration=true filters correctly**
  - Given 5 concentration spells and 3 non-concentration spells
  - When GET /api/spells?concentration=true is called
  - Then it should return only the 5 concentration spells

- [ ] **Test: POST /api/spells creates spell for admin**
  - Given authenticated admin
  - When POST /api/spells with valid spell data is called
  - Then it should create the spell with isGlobal: true
  - And return 201

- [ ] **Test: POST /api/spells returns 403 for non-admin**
  - Given authenticated non-admin user
  - When POST /api/spells is called
  - Then it should return 403

- [ ] **Test: DELETE /api/spells/[id] deletes for admin**
  - Given authenticated admin
  - And a spell exists with ID
  - When DELETE /api/spells/[id] is called
  - Then the spell should be deleted
  - And return 204

### Task 7: Create Spell Import UI

- [ ] **Test: /spells/import shows sync button for admin**
  - Given admin user
  - When navigating to /spells/import
  - Then a "Sync from open5e" button should be visible

- [ ] **Test: /spells/import returns 403 for non-admin**
  - Given non-admin user
  - When navigating to /spells/import
  - Then it should return 403 or redirect

- [ ] **Test: Sync button calls correct API**
  - Given admin user on /spells/import
  - When "Sync from open5e" is clicked
  - Then POST /api/import/open5e with { type: "spells" } should be called

### Task 9: Enhance Monster Import UI

- [ ] **Test: /monsters/import has open5e sync option**
  - Given admin user
  - When navigating to /monsters/import
  - Then "Sync from open5e" option should be visible

- [ ] **Test: Monster open5e sync calls correct API**
  - Given admin user on /monsters/import
  - When "Sync from open5e" is selected and sync is clicked
  - Then POST /api/import/open5e with { type: "monsters" } should be called

### Task 10: Replace Seed Endpoint

- [ ] **Test: PUT /api/monsters/global/seed syncs from open5e**
  - Given authenticated admin
  - When PUT /api/monsters/global/seed is called
  - Then it should sync from open5e (not static JSON)
  - And return sync results

### Task 11: Migration Script

- [ ] **Test: Migration sets source on existing global monsters**
  - Given existing global monster with no source field
  - When migration runs
  - Then that monster should have source: "SRD"

- [ ] **Test: Migration does not affect user monsters**
  - Given existing user monster (isGlobal: false)
  - When migration runs
  - Then that monster should not be modified

### Task 12: Delete Static JSON Files

- [ ] **Test: No imports of deleted files exist**
  - When checking all .ts files
  - Then no imports should reference lib/data/monsters/, lib/data/srd-monsters.ts, or lib/scripts/seedMonsters.ts

## Integration Tests

- [ ] **Test: Full spell sync flow**
  - Given open5e API is available
  - When admin triggers spell sync
  - Then spells should be fetched, transformed, deduplicated, and stored
  - And GET /api/spells should return the synced spells

- [ ] **Test: Full monster sync flow**
  - Given open5e API is available
  - When admin triggers monster sync
  - Then monsters should be fetched, transformed, deduplicated, and stored
  - And existing global monsters with source "SRD" should be preserved

- [ ] **Test: Restartable sync**
  - Given 500 spells have been synced
  - When sync is triggered again
  - Then only remaining spells should be imported
  - And no duplicates should be created
