---
name: tests
description: Tests for extract-monster-template-components
---

# Tests

## Overview

This document outlines the tests for the `extract-monster-template-components` change. All work follows a strict TDD process: write a failing test, make it pass with the minimal implementation, then refactor.

Test files:
- **New:** `tests/unit/components/MonsterTemplateEditor.test.tsx`
- **Moved:** `tests/unit/monstersPage.test.tsx` → `tests/unit/components/MonstersPage.test.tsx`
- **Reference model:** `tests/unit/components/MonsterEditor.test.tsx`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before writing any implementation code. Run it and confirm it fails.
2. **Write the minimal code** to make the test pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task 2 — Extract MonsterTemplateEditor (`tests/unit/components/MonsterTemplateEditor.test.tsx`)

Spec reference: `specs/monster-template-editor-extraction/spec.md` — ADDED MonsterTemplateEditor requirements

- [ ] **Render with template data** — Given a valid `MonsterTemplate`, render `MonsterTemplateEditor`; assert name, size, type, alignment, speed, CR, source, and description inputs are populated
  - Spec scenario: "MonsterTemplateEditor renders with a template"
- [ ] **Empty-name validation** — Render with a template, clear the name field, click Save; assert validation error message appears and `onSave` is NOT called
  - Spec scenario: "MonsterTemplateEditor validates empty name on save"
- [ ] **onSave called with updated data** — Render with a valid template, update the name, click Save; assert `onSave` is called with the updated template object
  - Spec scenario: "MonsterTemplateEditor calls onSave with updated data"
- [ ] **onCancel called** — Render and click Cancel; assert `onCancel` is called and `onSave` is not called
  - Spec scenario: "MonsterTemplateEditor calls onCancel"
- [ ] **isGlobal styling** — Render with `isGlobal: true`; assert the global-variant styling marker (purple border class or badge element) is present in the output
  - Spec scenario: "MonsterTemplateEditor applies isGlobal styling"

### Task 1 — Extract MonsterTemplateCard (covered by moved page test)

Spec reference: `specs/monster-template-editor-extraction/spec.md` — ADDED MonsterTemplateCard requirements

- [ ] **Existing page tests continue to pass after move** — `npx jest --testPathPattern=MonstersPage` green; no test content changed
  - Spec scenario: "MonstersPage renders without regressions"
- [ ] *(Optional / low priority)* Add a focused `MonsterTemplateCard` render test if the page test does not exercise the global badge path
  - Spec scenario: "MonsterTemplateCard shows global badge for global templates"

### Task 2 — formatSpeedValue helper (tested within MonsterTemplateEditor test file)

Spec reference: `specs/monster-template-editor-extraction/spec.md` — ADDED formatSpeedValue requirement

- [ ] **String passthrough** — Render editor with `template.speed = "30 ft."`; assert the speed input shows `"30 ft."` unchanged
  - Spec scenario: "formatSpeedValue with string input"
- [ ] **Object conversion** — Render editor with `template.speed = { walk: "30 ft.", fly: "60 ft." }`; assert the speed input shows `"walk 30 ft., fly 60 ft."`
  - Spec scenario: "formatSpeedValue with object input"

### Task 3 — Move monstersPage test

- [ ] **Path move only** — `tests/unit/monstersPage.test.tsx` must not exist; `tests/unit/components/MonstersPage.test.tsx` must exist with identical content
- [ ] **All previously passing scenarios still pass** — `npx jest --testPathPattern=MonstersPage` passes with same count as before

### Task 5 — Final verification

- [ ] **TypeScript clean** — `npx tsc --noEmit` exits 0
- [ ] **No normalizeSpeed in app/monsters/** — `grep -r "normalizeSpeed" app/monsters/` returns empty
- [ ] **Build clean** — `npm run build` exits 0
- [ ] **Full monsters suite** — `npx jest --testPathPattern=monsters` passes with test count equal to or greater than pre-change baseline
