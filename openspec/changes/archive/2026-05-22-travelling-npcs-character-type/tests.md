---
name: tests
description: Tests for the travelling-npcs-character-type change
---

# Tests

## Overview

All work follows strict TDD: write a failing test first, implement the minimum code to pass it, then refactor. Each test case is mapped to a task in `tasks.md` and to a scenario in `specs/character-type/spec.md`.

## Testing Steps

For each task:

1. **Write a failing test** — run it and confirm it fails
2. **Write the minimum code to pass** — no more, no less
3. **Refactor** — improve structure while keeping the test green

---

## Test Cases

### Step 2 — Type definition and Mongoose model (tasks.md Step 1)

- [ ] **Unit — default characterType on create**
  - Spec: "New character defaults to 'character' type"
  - Test: POST body without `characterType` → response includes `characterType: 'character'`
  - File: `tests/integration/api/characters.test.ts` (or equivalent)

- [ ] **Unit — valid enum values accepted**
  - Spec: "Create character as travelling NPC"; "Create character as companion"
  - Test: POST with `characterType: 'npc'` succeeds; POST with `characterType: 'companion'` succeeds
  - File: `tests/unit/models/Character.test.ts`

- [ ] **Unit — invalid enum value rejected**
  - Spec: "Invalid characterType is rejected"
  - Test: POST with `characterType: 'villain'` → Mongoose validation error / 400 response
  - File: `tests/unit/models/Character.test.ts`

### Step 3 — Characters API (tasks.md Step 3)

- [ ] **Integration — persist on create**
  - Spec: "Create character as travelling NPC"
  - Test: POST `{ characterType: 'npc', ...requiredFields }` → GET `/api/characters/[id]` → `characterType === 'npc'`
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — persist on update**
  - Spec: "Update characterType from 'character' to 'npc'"
  - Test: PUT `{ characterType: 'npc' }` on existing character → GET → `characterType === 'npc'`
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — update omitting field leaves value unchanged**
  - Spec: "Update leaves characterType unchanged when field omitted"
  - Test: Create with `characterType: 'companion'`, PUT body without field → GET → `characterType === 'companion'`
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — backward-compat coercion**
  - Spec: "Existing character without characterType field in BSON"
  - Test: Insert raw document without `characterType` via Mongoose → GET → response includes `characterType: 'character'`
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — filter by npc returns only NPCs**
  - Spec: "Filter returns only NPCs"
  - Test: Seed one of each type; GET `?characterType=npc` → array length 1, all items have `characterType: 'npc'`
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — filter with 'all' returns every character**
  - Spec: "Filter with 'all' returns every character"
  - Test: Seed three; GET `?characterType=all` → array length 3
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — omitting filter returns every character**
  - Spec: "Omitting the filter returns every character"
  - Test: Seed three; bare GET → array length 3
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — filter with no matches returns empty array**
  - Spec: "Filter returns empty array when no matches"
  - Test: Seed only player characters; GET `?characterType=npc` → `[]` with status 200
  - File: `tests/integration/api/characters.test.ts`

- [ ] **Integration — unauthenticated request returns 401**
  - Spec: "Unauthenticated request to characters API"
  - Test: GET `?characterType=npc` without auth → status 401, no character data
  - File: `tests/integration/api/characters.test.ts`

### Step 4 — Characters UI (tasks.md Step 4)

- [ ] **Integration — page renders three sections when all types present**
  - Spec: "Characters grouped into labelled sections"
  - Test: Mount page with fixture containing one of each type; assert headings "Player Characters", "Travelling NPCs", "Companions" all present; each character in correct section
  - File: `tests/integration/ui/characters-page.test.ts`

- [ ] **Integration — empty section not rendered**
  - Spec: "Empty sections are hidden"
  - Test: Fixture with only PCs and companions; assert "Travelling NPCs" heading absent
  - File: `tests/integration/ui/characters-page.test.ts`

- [ ] **Integration — filter control narrows visible sections**
  - Spec: "Type filter control narrows visible section"
  - Test: Select "Travelling NPCs only"; assert only NPC section visible
  - File: `tests/integration/ui/characters-page.test.ts`

- [ ] **Integration — Type selector defaults to Player Character**
  - Spec: "Type selector appears in editor"
  - Test: Open editor for new character; selector value is "Player Character"
  - File: `tests/integration/ui/characters-page.test.ts`

- [ ] **Integration — Type selector shows current value on edit**
  - Spec: "Saved type is reflected in selector on edit"
  - Test: Open editor for character with `characterType: 'npc'`; selector shows "Travelling NPC"
  - File: `tests/integration/ui/characters-page.test.ts`

### Step 5 — Parties UI (tasks.md Step 5)

- [ ] **Integration — party with all types renders three sections**
  - Spec: "Party with all three types renders three sections"
  - Test: Render party containing one of each type; assert all three section headings present; members in correct sections
  - File: `tests/integration/ui/parties-page.test.ts`

- [ ] **Integration — party with only PCs renders one section**
  - Spec: "Party with only player characters renders one section"
  - Test: Render party containing only PCs; assert only "Player Characters" heading present
  - File: `tests/integration/ui/parties-page.test.ts`
