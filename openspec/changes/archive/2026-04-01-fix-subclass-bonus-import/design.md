## Context

`lib/dndBeyondCharacterImport.ts` normalizes raw D&D Beyond API responses into
local `Character` records. Two normalization functions are incomplete:

- `normalizeArmorClass()` only reads modifiers with `subType === "armor-class"`.
  D&D Beyond sends unarmored AC contributions under `subType === "unarmored-armor-class"`
  using two type shapes: `"set"` (base override, e.g. Draconic Resilience = 3)
  and `"bonus"` (additive, e.g. Bracers of Defense = 2). Neither is handled.

- `normalizeMaxHp()` never consults the modifiers array. D&D Beyond sends
  per-level HP bonuses as `subType === "hit-points-per-level"` (e.g. Draconic
  Resilience = 1/level) and flat HP bonuses as `subType === "hit-points"` (e.g.
  item bonuses). Both are ignored.

The `DndBeyondModifier` interface does not model the `"set"` type, which is
distinct from `"set-base"` and is used specifically for unarmored AC.

All bugs confirmed from live D&D Beyond character API response for character
105034644 (Mond Blue, level 12 Draconic Bloodline Sorcerer).

## Goals / Non-Goals

**Goals:**

- `normalizeArmorClass()` correctly incorporates `unarmored-armor-class`
  modifiers of both `"set"` and `"bonus"` types when no armor is equipped.
- `normalizeMaxHp()` correctly incorporates `hit-points-per-level` (×level) and
  flat `hit-points` modifiers.
- `DndBeyondModifier` interface models `"set"` as a recognized type.
- All three changes are covered by unit tests with realistic fixture data.

**Non-Goals:**

- Supporting `choose-an-ability-score` ASI modifiers (ability is not resolvable
  from the modifier data alone — pre-existing gap, separate concern).
- Supporting other unimplemented modifier subtypes not related to HP or AC.
- Changing the `overrideHitPoints` or equipped-armor calculation paths.

## Decisions

### Decision 1: `unarmored-armor-class` — `"set"` type means base override, not additive

D&D Beyond uses `type=set, subType=unarmored-armor-class, value=3` for Draconic
Resilience, which yields AC = 13 + DEX (i.e. a base of 10 + 3). Multiple `set`
modifiers could theoretically exist (e.g. if two features both set a base); the
correct behavior is to take the **maximum** `set` value, then add all `bonus`
values on top.

**Alternative considered**: treat `set` as additive like `bonus`. Rejected —
two `set` modifiers for the same feature (e.g. Draconic Resilience at different
levels) should not stack; the intent is "use the highest base override".

**Formula** (unarmored path):
```
AC = 10
   + max(all "set" unarmored-armor-class values, default 0)
   + sum(all "bonus" unarmored-armor-class values)
   + dexterityModifier
```

### Decision 2: `hit-points-per-level` multiplies by **total** level, not class level

D&D Beyond sends a single `hit-points-per-level` modifier per feature without
tying it to a specific class. The value is 1 (for Draconic Resilience), and the
correct HP gain is 1 × total character level (12 for this character = +12 HP).

**Alternative considered**: multiply by the level of the class granting the
feature. Rejected — the modifier carries no class-level attribution in the
response, and DnD Beyond's own character sheet computes this as total level ×
modifier value.

### Decision 3: `DndBeyondModifier.type` gets `"set"` added alongside `"set-base"`

`"set"` and `"set-base"` are both present in D&D Beyond responses but used for
different purposes (`"set-base"` appears on senses; `"set"` appears on unarmored
AC). The interface should model both explicitly so the type system is accurate.

`isBonusLikeModifier` is not extended to include `"set"` because `"set"` for
unarmored AC is not additive — it is handled separately in the new unarmored AC
helper.

## Risks / Trade-offs

- **Risk**: Future D&D Beyond modifier subtypes use `"set"` in other contexts
  where taking-the-max is wrong.
  → **Mitigation**: The `"set"` handling is scoped to `subType === "unarmored-armor-class"`
  only, not applied broadly.

- **Risk**: `hit-points-per-level` modifier could theoretically appear from
  multiple sources (multiple subclasses in a multiclass character), causing HP
  to be over-counted if each is already reflected in `baseHitPoints`.
  → **Mitigation**: D&D Beyond's `baseHitPoints` field does not include
  per-level HP bonuses (confirmed: level 12 sorcerer's `baseHitPoints` = 58,
  which equals hit-dice HP only). Summing modifiers is correct.

## Open Questions

None. All modifier shapes confirmed from live API data.
