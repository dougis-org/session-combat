---
name: tests
description: Tests for the extract-dnd-beyond-abilities change
---

# Tests

## Overview

This document outlines TDD test cases for the `extract-dnd-beyond-abilities` change (issue #154). All implementation follows strict TDD: write failing test first, implement to pass, refactor while passing.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — Capture the requirement before writing implementation. Run and verify it fails.
2. **Write code to pass** — Simplest code that makes the test pass.
3. **Refactor** — Improve code quality while test remains passing.

---

## Test Cases by Task

### Task 1: Create lib/import/dndBeyond-abilities.ts

**Test File:** `tests/unit/import/dndBeyond-abilities.test.ts`

#### Test 1.1: normalizeAbilities categorizes actions, bonusActions, reactions correctly

**Maps to:** Spec scenario "Successfully normalize all ability categories"  
**Task:** Task 1

```typescript
describe("normalizeAbilities", () => {
  it("should categorize abilities into actions, bonusActions, reactions, and traits", () => {
    const input = {
      actions: {
        class: [
          {
            name: "Fireball",
            snippet: "Cast a fireball spell.",
            activation: { activationType: 1 }, // action
          },
          {
            name: "Bonus Spell",
            snippet: "Cast a bonus action spell.",
            activation: { activationType: 3 }, // bonus action
          },
          {
            name: "Reaction Spell",
            snippet: "React to an attack.",
            activation: { activationType: 4 }, // reaction
          },
        ],
      },
      traits: {
        personalityTraits: "I am brave",
        ideals: "Justice",
      },
      notes: {
        backstory: "Once a wizard...",
      },
    };

    const result = normalizeAbilities(input.actions, input.traits, input.notes);

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].name).toBe("Fireball");

    expect(result.bonusActions).toHaveLength(1);
    expect(result.bonusActions[0].name).toBe("Bonus Spell");

    expect(result.reactions).toHaveLength(1);
    expect(result.reactions[0].name).toBe("Reaction Spell");

    expect(result.traits).toHaveLength(2);
    expect(result.traits[0].name).toBe("Personality Traits");
    expect(result.traits[1].name).toBe("Ideals");
  });
});
```

**Acceptance Criteria:** Result object has correct arrays, abilities are in correct categories, traits have humanized titles.

---

#### Test 1.2: normalizeAbilities handles null/undefined inputs gracefully

**Maps to:** Spec scenario "Handle null/undefined inputs gracefully"  
**Task:** Task 1

```typescript
it("should return empty arrays when inputs are null or undefined", () => {
  const result1 = normalizeAbilities(null, null, null);
  const result2 = normalizeAbilities(undefined, undefined, undefined);
  const result3 = normalizeAbilities({}, {}, {});

  [result1, result2, result3].forEach((result) => {
    expect(result.actions).toEqual([]);
    expect(result.bonusActions).toEqual([]);
    expect(result.reactions).toEqual([]);
    expect(result.traits).toEqual([]);
  });
});
```

**Acceptance Criteria:** No errors thrown; all arrays are empty.

---

#### Test 1.3: normalizeAbilities throws on 2+ invalid entries

**Maps to:** Spec scenario "Fail batch on multiple invalid entries"  
**Task:** Task 1

```typescript
it("should throw DndBeyondImportError when 2+ entries are invalid", () => {
  const input = {
    actions: {
      class: [
        { name: "", snippet: "No name" }, // invalid
        { name: "Action", snippet: "" }, // invalid (no description)
        { name: "Valid", snippet: "Valid action" }, // valid
      ],
    },
    traits: null,
    notes: null,
  };

  expect(() =>
    normalizeAbilities(input.actions, input.traits, input.notes)
  ).toThrow(DndBeyondImportError);
  expect(() =>
    normalizeAbilities(input.actions, input.traits, input.notes)
  ).toThrow(/2 entries invalid/);
});
```

**Acceptance Criteria:** Throws `DndBeyondImportError` with count of invalid entries in message.

---

#### Test 1.4: normalizeAbilities tolerates single invalid entry

**Maps to:** Spec scenario "Tolerate single invalid entry with warning"  
**Task:** Task 1

```typescript
it("should succeed and filter single invalid entry without throwing", () => {
  const input = {
    actions: {
      class: [
        { name: "", snippet: "No name" }, // invalid
        { name: "Valid", snippet: "Valid action" }, // valid
      ],
    },
    traits: null,
    notes: null,
  };

  const result = normalizeAbilities(input.actions, input.traits, input.notes);

  expect(result.actions).toHaveLength(1);
  expect(result.actions[0].name).toBe("Valid");
});
```

**Acceptance Criteria:** Single invalid entry filtered out; function succeeds, returns valid data.

---

#### Test 1.5: normalizeAbilities sanitizes HTML without throwing

**Maps to:** Spec scenario (sanitization is expected behavior)  
**Task:** Task 1

```typescript
it("should sanitize HTML in action descriptions without warning", () => {
  const input = {
    actions: {
      class: [
        {
          name: "Fireball",
          snippet: "<p>Deal <strong>8d6</strong> damage</p>",
          activation: { activationType: 1 },
        },
      ],
    },
    traits: null,
    notes: null,
  };

  const result = normalizeAbilities(input.actions, input.traits, input.notes);

  expect(result.actions[0].description).toBe("Deal 8d6 damage");
});
```

**Acceptance Criteria:** HTML stripped; content preserved; no error/warning.

---

#### Test 1.6: ACTIONS_BY_ACTIVATION_TYPE constant maps DnD Beyond activation IDs

**Maps to:** Spec requirement "ADDED DnD Beyond provider-specific constants"  
**Task:** Task 1

```typescript
it("should have ACTIONS_BY_ACTIVATION_TYPE with correct mappings", () => {
  expect(ACTIONS_BY_ACTIVATION_TYPE[3]).toBe("bonusActions");
  expect(ACTIONS_BY_ACTIVATION_TYPE[4]).toBe("reactions");
  // Unknown activation types default to "actions" (handled in pushAbilityByActivation)
});
```

**Acceptance Criteria:** Constant exists and has correct key-value pairs.

---

#### Test 1.7: TRAIT_TITLE_MAP and NOTE_TITLE_MAP contain expected keys

**Maps to:** Spec requirement "ADDED DnD Beyond provider-specific constants"  
**Task:** Task 1

```typescript
it("should have TRAIT_TITLE_MAP and NOTE_TITLE_MAP with D&D field names", () => {
  expect(TRAIT_TITLE_MAP).toEqual({
    personalityTraits: "Personality Traits",
    ideals: "Ideals",
    bonds: "Bonds",
    flaws: "Flaws",
    appearance: "Appearance",
  });

  expect(NOTE_TITLE_MAP).toEqual({
    backstory: "Backstory",
    allies: "Allies",
    enemies: "Enemies",
    organizations: "Organizations",
    otherNotes: "Other Notes",
  });
});
```

**Acceptance Criteria:** Both maps have all expected fields and correct titles.

---

### Task 2: Move generic functions to lib/import/utils.ts

**Test File:** `tests/unit/import/utils.test.ts`

#### Test 2.1: sanitizeHtmlSnippet removes HTML tags

**Maps to:** Spec scenario "Strip HTML tags from action snippet"  
**Task:** Task 2

```typescript
describe("sanitizeHtmlSnippet", () => {
  it("should remove HTML tags and preserve content", () => {
    const input = "<p>Use your <strong>bonus action</strong> to activate.</p>";
    const result = sanitizeHtmlSnippet(input);
    expect(result).toBe("Use your bonus action to activate.");
  });
});
```

**Acceptance Criteria:** HTML removed; text content preserved; whitespace normalized.

---

#### Test 2.2: sanitizeHtmlSnippet normalizes whitespace

**Maps to:** Spec scenario "Normalize whitespace"  
**Task:** Task 2

```typescript
it("should normalize whitespace (collapse multiple spaces and newlines)", () => {
  const input = "Use   your\n\nreaction";
  const result = sanitizeHtmlSnippet(input);
  expect(result).toBe("Use your reaction");
});
```

**Acceptance Criteria:** Multiple spaces, tabs, newlines collapsed to single space.

---

#### Test 2.3: sanitizeHtmlSnippet handles empty input

**Maps to:** Spec scenario "Empty or whitespace-only input"  
**Task:** Task 2

```typescript
it("should return empty string for empty or whitespace-only input", () => {
  expect(sanitizeHtmlSnippet("")).toBe("");
  expect(sanitizeHtmlSnippet("   ")).toBe("");
  expect(sanitizeHtmlSnippet("\n\n")).toBe("");
});
```

**Acceptance Criteria:** Empty or whitespace-only returns empty string.

---

#### Test 2.4: mapNarrativeEntries maps entries with title map

**Maps to:** Spec scenario "Map traits with title mapping"  
**Task:** Task 2

```typescript
describe("mapNarrativeEntries", () => {
  it("should convert record of strings to CreatureAbility array with titles", () => {
    const traits = {
      personalityTraits: "I like gold",
      ideals: "Charity",
      bonds: null,
    };
    const titleMap = {
      personalityTraits: "Personality Traits",
      ideals: "Ideals",
      bonds: "Bonds",
    };

    const result = mapNarrativeEntries(traits, titleMap);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: "Personality Traits",
      description: "I like gold",
    });
    expect(result[1]).toEqual({ name: "Ideals", description: "Charity" });
  });
});
```

**Acceptance Criteria:** Entries with values mapped to CreatureAbility; null filtered out.

---

#### Test 2.5: mapNarrativeEntries falls back to titleize() for unmapped keys

**Maps to:** Spec scenario "Handle missing title map entries"  
**Task:** Task 2

```typescript
it("should use titleize() for keys not in title map", () => {
  const entries = { custom_field: "Some value" };
  const titleMap = {};

  const result = mapNarrativeEntries(entries, titleMap);

  expect(result[0].name).toBe("Custom Field"); // titleized
});
```

**Acceptance Criteria:** Unmapped keys are titleized (e.g., "custom_field" → "Custom Field").

---

#### Test 2.6: mapNarrativeEntries filters empty strings

**Maps to:** Spec scenario "Filter empty strings"  
**Task:** Task 2

```typescript
it("should filter empty and whitespace-only values", () => {
  const entries = { trait1: "Value", trait2: "", trait3: "  " };
  const titleMap = { trait1: "Trait 1", trait2: "Trait 2", trait3: "Trait 3" };

  const result = mapNarrativeEntries(entries, titleMap);

  expect(result).toHaveLength(1);
  expect(result[0].name).toBe("Trait 1");
});
```

**Acceptance Criteria:** Empty or whitespace-only values filtered out.

---

### Task 3: Update lib/dndBeyondCharacterImport.ts

#### Test 3.1: normalizeDndBeyondCharacter produces same output as before refactor

**Maps to:** Spec scenario "normalizeDndBeyondCharacter still produces same output"  
**Task:** Task 3

```typescript
describe("normalizeDndBeyondCharacter (integration after refactor)", () => {
  it("should produce identical NormalizedDndBeyondCharacter before/after refactor", () => {
    const sampleResponse = sampleDndBeyondCharacterResponse;

    const result = normalizeDndBeyondCharacter(sampleResponse.data);

    // Verify abilities structure matches pre-refactor
    expect(result.abilities).toHaveProperty("actions");
    expect(result.abilities).toHaveProperty("bonusActions");
    expect(result.abilities).toHaveProperty("reactions");
    expect(result.abilities).toHaveProperty("traits");

    // Spot-check trait titles are humanized
    expect(result.abilities.traits.some((t) => t.name === "Personality Traits")).toBe(
      true
    );
  });
});
```

**Acceptance Criteria:** Output structure and content match pre-refactor behavior.

---

### Task 4 & 5: Existing Tests Pass

#### Test 4.1: All existing dndBeyondCharacterImport tests pass without modification

**Maps to:** Spec scenario "All existing tests pass"  
**Task:** Task 4, Task 6

**Command:**
```bash
npm run test -- tests/unit/dndBeyondCharacterImport.test.ts
```

**Acceptance Criteria:** All existing tests pass; no modifications to test code needed.

---

#### Test 5.1: All new utility tests pass

**Maps to:** Spec scenarios for sanitizeHtmlSnippet and mapNarrativeEntries  
**Task:** Task 5

**Command:**
```bash
npm run test -- tests/unit/import/utils.test.ts
```

**Acceptance Criteria:** All sanitize and map tests pass.

---

### Task 7: Integration Verification

#### Test 7.1: Full test suite passes

**Maps to:** Validation step  
**Task:** Task 7

**Command:**
```bash
npm run test
```

**Acceptance Criteria:** All tests pass; no regressions.

---

#### Test 7.2: TypeScript type checking passes

**Maps to:** Validation step  
**Task:** Task 7

**Command:**
```bash
npm run type-check
```

**Acceptance Criteria:** No type errors in lib/ or tests/.

---

#### Test 7.3: Build succeeds

**Maps to:** Validation step  
**Task:** Task 7

**Command:**
```bash
npm run build
```

**Acceptance Criteria:** Build completes without errors.

---

#### Test 7.4: Linting passes

**Maps to:** Validation step  
**Task:** Task 7

**Command:**
```bash
npm run lint
```

**Acceptance Criteria:** No new linting errors or warnings.

---

## Test Execution Order

1. **Phase 1 — Write Tests**: Tasks 1, 2 (write all failing tests first)
2. **Phase 2 — Implement**: Tasks 1, 2 (implement to pass tests)
3. **Phase 3 — Refactor**: Tasks 1, 2 (improve code while tests pass)
4. **Phase 4 — Verify**: Tasks 3, 4, 5, 6, 7 (integration and regression)

---

## Test File Summary

| Test File | Coverage | Task(s) |
|---|---|---|
| `tests/unit/import/dndBeyond-abilities.test.ts` | New module functions and constants | Tasks 1, 7 |
| `tests/unit/import/utils.test.ts` | Generic helper functions | Tasks 2, 5, 7 |
| `tests/unit/dndBeyondCharacterImport.test.ts` | Unchanged; verify backward compat | Tasks 4, 6 |
| Full test suite | All tests in project | Task 7 |

---

## Notes

- **TDD Workflow**: Write test → see it fail → implement → see it pass → refactor
- **Acceptance Criteria**: Each test maps to a spec scenario; all scenarios must have passing tests
- **No Regression**: All existing tests continue to pass; no modifications to existing test code required
- **Integration**: Final validation runs full test suite, type check, build, lint
