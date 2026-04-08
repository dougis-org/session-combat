---
name: tests
description: Tests for the centralize-alignment-select change
---

# Tests

## Overview

Tests for `centralize-alignment-select`. All work follows strict TDD: write a failing test first, implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run it; confirm it fails.
2. **Write minimum code** to make the test pass.
3. **Refactor** without breaking the test.

## Test Cases

### Phase 1 — Type safety

- [ ] `tsc --noEmit` baseline: confirm current types compile (pre-change)
- [ ] `tsc --noEmit` after change: zero new errors after `alignment?: DnDAlignment` on `Character`, `MonsterTemplate`, `Monster`
- [ ] `dndBeyondCharacterImport.ts` assignment still compiles: `normalizeAlignment()` → `DnDAlignment | undefined` is compatible

### Phase 2 — AlignmentSelect component (`lib/components/__tests__/AlignmentSelect.test.tsx`)

- [ ] Renders `<label>` with text "Alignment"
- [ ] Renders `<select>` with `aria-label="Alignment"`
- [ ] Renders exactly 10 options: 1 placeholder ("Select Alignment") + 9 from `VALID_ALIGNMENTS`
- [ ] Placeholder option has `value=""`
- [ ] Each alignment option `value` matches the alignment string
- [ ] Controlled value: when `value="lawful good"`, that option is selected
- [ ] `onChange` fires with the string value when user selects an option
- [ ] `disabled={true}` sets `disabled` attribute on the select element
- [ ] `disabled={false}` — select is not disabled
- [ ] `getByRole('combobox', { name: 'Alignment' })` resolves (accessibility assertion)

  **Spec ref:** `specs/alignment-select-component.md` — ADDED Requirement scenarios
  **Task ref:** tasks.md Phase 2a–2c

### Phase 3 — Character editor integration (`app/characters/__tests__/page.test.tsx` or equivalent)

- [ ] Character editor renders a select accessible as `getByRole('combobox', { name: 'Alignment' })`
- [ ] ESLint: no unused `AbilityScores` import in `app/characters/page.tsx`

  **Spec ref:** `specs/alignment-select-component.md` — MODIFIED Character editor scenarios
  **Task ref:** tasks.md Phase 3a–3c

### Phase 4 — Monster editor integration (`app/monsters/__tests__/page.test.tsx` or equivalent)

- [ ] Monster editor renders a select accessible as `getByRole('combobox', { name: 'Alignment' })`

  **Spec ref:** `specs/alignment-select-component.md` — MODIFIED Monster editor scenario
  **Task ref:** tasks.md Phase 4a–4b

### Phase 5 — API validation (per route)

Each route gets three parameterized cases: invalid alignment → 400, valid alignment → success, omitted alignment → success.

**POST `/api/characters`** (`app/api/characters/__tests__/route.test.ts`)
- [ ] `alignment: "chaotic pancake"` → HTTP 400, `{ error: "Invalid alignment" }`
- [ ] `alignment: "neutral good"` → HTTP 201
- [ ] no `alignment` field → HTTP 201

**PUT `/api/characters/[id]`** (`app/api/characters/[id]/__tests__/route.test.ts`)
- [ ] `alignment: "true neutral"` (non-standard) → HTTP 400
- [ ] `alignment: "lawful evil"` → HTTP 200
- [ ] no `alignment` field → HTTP 200

**POST `/api/monsters`** (`app/api/monsters/__tests__/route.test.ts`)
- [ ] Invalid alignment → HTTP 400
- [ ] Valid alignment → HTTP 201
- [ ] No alignment → HTTP 201

**PUT `/api/monsters/[id]`** (`app/api/monsters/[id]/__tests__/route.test.ts`)
- [ ] Invalid alignment → HTTP 400
- [ ] Valid alignment → HTTP 200
- [ ] No alignment → HTTP 200

**POST `/api/monsters/global`** (`app/api/monsters/global/__tests__/route.test.ts`)
- [ ] Invalid alignment → HTTP 400
- [ ] Valid alignment → HTTP 201
- [ ] No alignment → HTTP 201

**PUT `/api/monsters/global/[id]`** (`app/api/monsters/global/[id]/__tests__/route.test.ts`)
- [ ] Invalid alignment → HTTP 400
- [ ] Valid alignment → HTTP 200
- [ ] No alignment → HTTP 200

  **Spec ref:** `specs/alignment-api-validation.md` — ADDED Requirement scenarios
  **Task ref:** tasks.md Phase 5a–5l
