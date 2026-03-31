## Context

The combat tracker stores resistance, immunity, and vulnerability data on `CreatureStats` (`damageResistances`, `damageImmunities`, `damageVulnerabilities`) as `string[]`. This data exists on both monster templates and player characters, but:

1. The fields are typed as `string[]` — no validation against canonical D&D 5e damage types
2. 4 SRD monster entries contain freeform qualifier strings (`'from nonmagical attacks'`, `'nonmagical bludgeoning'`, `"that aren't adamantine"`) that are not damage type names
3. All 3 combatant builder sites in `app/combat/page.tsx` silently drop these fields when constructing `CombatantState` — resistance data never reaches the combat runtime
4. `applyDamage()` in `lib/utils/combat.ts` accepts no damage type — all damage is applied raw

The result: resistance/immunity/vulnerability mechanics are entirely non-functional today despite the data model supporting them.

**Proposal mapping:**

| Proposal element | Design decision |
|-----------------|----------------|
| Canonical 13-type list | `DAMAGE_TYPES` constant + `DamageType` union in `lib/constants.ts` |
| `string[]` → `DamageType[]` (BREAKING) | Type-only change; no migration needed (serialization unchanged) |
| Fix 4 SRD entries | Strip qualifiers, keep bare type strings |
| Fix 3 combatant builders | Copy all 4 resistance/immunity fields at each build site |
| New `applyDamageWithType()` | Wraps existing `applyDamage()`; additive, not replacement |
| HP adjustment widget | Add type selector dropdown + feedback line |
| `CreatureStatsForm` upgrade | Tag picker from `DAMAGE_TYPES` constant |
| Combat-scoped temporary effects | `activeDamageEffects` on `CombatantState`; merged with permanent fields at resolution time |
| Preset system | `DAMAGE_EFFECT_PRESETS` constant; 7 initial presets; custom entry always available |
| Add/remove UI | Inline on combatant card; grouped by label for easy bulk removal |

## Goals / Non-Goals

**Goals:**
- Make resistance/immunity/vulnerability mechanics functional in combat for both monsters and player characters, including combat-scoped temporary effects
- Establish a type-safe canonical damage type system used everywhere
- Zero breaking changes at runtime (existing data stays valid; new type constraint is compile-time only)
- Keep `applyDamage()` unchanged (existing callers unaffected)

**Non-Goals:**
- Magical vs. nonmagical weapon tracking
- Silvered / adamantine weapon properties
- Condition immunities auto-application
- Combat damage log / history

## Decisions

### D1: `DAMAGE_TYPES` lives in `lib/constants.ts`

**Decision:** Add to the existing constants file rather than a new `lib/damageTypes.ts`.

**Rationale:** The project has a single `lib/constants.ts` for app-wide constants. One constant and one type don't warrant a new file. If the type grows substantially (e.g., damage modifiers, display labels), it can be extracted later.

**Alternative considered:** New `lib/damageTypes.ts` — rejected for premature file proliferation.

---

### D2: `DamageType[]` not `string[]` on `CreatureStats`

**Decision:** Change `damageResistances`, `damageImmunities`, `damageVulnerabilities` to `DamageType[]`.

**Rationale:** Compile-time safety surfaces bad data immediately. The 4 known bad SRD entries are enumerated and fixed in the same PR. MongoDB serializes `DamageType[]` identically to `string[]` — no schema migration. Any other unknown bad strings will surface as TypeScript errors during the build.

**Alternative considered:** Keep `string[]`, validate at runtime — rejected because it defers errors to production and misses IDE assistance.

---

### D3: `applyDamageWithType()` wraps `applyDamage()`, not replaces it

**Decision:** New function `applyDamageWithType(hp, tempHp, damage, type?, resistances?, immunities?, vulnerabilities?)` computes effective damage then calls `applyDamage()`.

**Rationale:** Existing `applyDamage()` is pure, well-tested, and used in multiple places. Wrapping it keeps the math separation clean — one function does "compute effective damage", the other does "apply to HP pool". Both remain independently testable.

**Signature:**
```typescript
applyDamageWithType(
  hp: number,
  tempHp: number,
  rawDamage: number,
  type?: DamageType,
  resistances?: DamageType[],
  immunities?: DamageType[],
  vulnerabilities?: DamageType[],
): { hp: number; tempHp: number; effectiveDamage: number; modifier: 'normal' | 'resistant' | 'immune' | 'vulnerable' }
```

When `type` is undefined (no type selected), modifier is `'normal'` and no resistance check is performed.

---

### D4: Resistance priority order

**Decision (standard 5e rules):**
1. Immune → damage = 0 (stops here)
2. Resistant + Vulnerable → cancel, damage unchanged
3. Resistant → damage ÷ 2, round down
4. Vulnerable → damage × 2

**Rationale:** These are the official D&D 5e rules. Multiple resistances or immunities to the same type don't stack.

---

### D5: Resistance math applied before temp HP absorption

**Decision:** `applyDamageWithType()` computes `effectiveDamage` (post-modifier), then passes it to `applyDamage()` which applies temp HP drain. Resistance math runs on the raw input number before temp HP is considered.

**Rationale:** Standard 5e rules. A creature resistant to fire that takes 10 fire damage takes 5 effective damage; that 5 is then absorbed by temp HP if available. The inverse (apply temp HP first, then resistance) is not rules-legal.

---

### D6: Damage type selector in UI — grouped dropdown

**Decision:** The HP adjustment widget gets a `<select>` populated from `DAMAGE_TYPES`, grouped by family (Physical / Elemental / Energy & Planar / Other), with a blank/default "No type" option.

**Rationale:** Grouping matches how DMs think about damage. A flat 13-item list is scannable; groups make it faster. "No type" preserves backward-compatible behavior (raw damage, no resistance check).

---

### D7: `CreatureStatsForm` resistance input — tag picker

**Decision:** Replace the free-text comma-separated textarea with a tag-style multi-select sourced from `DAMAGE_TYPES`.

**Rationale:** Free text is how the 4 bad SRD entries were created in the first place. A constrained picker prevents future freeform entries for user-created characters and custom monsters. Existing valid values map cleanly; invalid values are discarded silently with a console warning.

---

### D9: Combat-scoped temporary effects — `activeDamageEffects` on `CombatantState`

**Decision:** Add `activeDamageEffects?: ActiveDamageEffect[]` to `CombatantState` (not `CreatureStats`). Each entry is `{ type: DamageType; kind: 'resistance' | 'immunity' | 'vulnerability'; label: string }`.

**Rationale:** Placing the field on `CombatantState` (not `CreatureStats`) is intentional — these effects are combat-runtime state, not character definition. They don't persist to the character or monster template. They are cleared when a combat session ends.

The `label` field is load-bearing: it's what lets the DM remove "Rage" as a unit when the Barbarian stops raging, without manually hunting individual type entries. Two effects with the same label are treated as one group for removal.

**Alternative considered:** Separate `tempDamageResistances[]` / `tempDamageImmunities[]` / `tempDamageVulnerabilities[]` fields — rejected because they provide no source labeling, making removal ambiguous when multiple effects are active.

**Type definitions (new in `lib/types.ts`):**
```typescript
export interface ActiveDamageEffect {
  type: DamageType
  kind: 'resistance' | 'immunity' | 'vulnerability'
  label: string  // e.g. "Rage", "Stoneskin", "Custom"
}
```

---

### D10: Merge strategy — permanent + temporary at resolution time

**Decision:** `applyDamageWithType()` receives merged arrays. The caller (combat UI) is responsible for merging before calling:
```typescript
const mergedResistances = [
  ...(combatant.damageResistances ?? []),
  ...activeEffectsOf(combatant, 'resistance'),
]
```

The function itself remains pure and unaware of the distinction between permanent and temporary sources. Priority rules (D4) apply to the merged set.

**Rationale:** Keeps `applyDamageWithType()` a pure math function with no knowledge of `CombatantState` shape. The merge is cheap and testable independently.

---

### D11: Preset system — `DAMAGE_EFFECT_PRESETS` constant

**Decision:** Define `DAMAGE_EFFECT_PRESETS` in `lib/constants.ts` as a readonly array of `DamageEffectPreset`. Initial set of 7 presets. Extensible by adding entries to the array — no other code changes required.

**Preset data structure:**
```typescript
export interface DamageEffectPreset {
  id: string           // kebab-case, stable identifier
  label: string        // Display name and stored as effect label
  description: string  // Short tooltip — source ability/spell
  effects: Array<{
    type: DamageType | null   // null = user must choose (prompt shown)
    kind: 'resistance' | 'immunity' | 'vulnerability'
  }>
}
```

**Initial preset set:**

| id | label | Effects |
|----|-------|---------|
| `rage` | Rage | resistance: bludgeoning, piercing, slashing |
| `stoneskin` | Stoneskin | resistance: bludgeoning, piercing, slashing |
| `protection-from-energy` | Protection from Energy | resistance: [user chooses 1 of acid/cold/fire/lightning/thunder] |
| `fire-shield-warm` | Fire Shield (Warm) | resistance: cold |
| `fire-shield-chill` | Fire Shield (Chill) | resistance: fire |
| `absorb-elements` | Absorb Elements | resistance: [user chooses type] |
| `warding-bond` | Warding Bond | resistance: all 13 types |

When a preset has `type: null` entries, the UI prompts the user to pick a type before applying. Custom entry (no preset) always available.

**Rationale:** Presets reduce friction for the most common mid-combat state changes. The `id` is stable so future features (e.g., duration tracking) can reference presets without breaking. New presets are additive — just add to the array.

---

### D12: Add/remove UI on combatant card

**Decision:** A collapsible "Active Effects" section on the combatant card shows current `activeDamageEffects` grouped by label. A "+" button opens a modal/dropdown to add an effect (preset picker or custom). Each label group has a "×" to remove all entries with that label.

**Rationale:** Grouping by label lets the DM remove "Rage" with one click rather than removing bludgeoning, piercing, slashing individually. The modal flow (preset → optional type selection → apply) mirrors the existing condition-adding flow in the codebase.

---

### D8: Visual feedback on HP widget

**Decision:** After applying typed damage, show a one-line feedback message below the input for 3 seconds:
- Immune: `"Immune — 0 dmg"`
- Resistant: `"Resisted — 10 → 5 dmg"`
- Vulnerable: `"Vulnerable — 10 → 20 dmg"`
- Normal (typed): `"10 dmg (fire)"` — no modification label

**Rationale:** DMs need immediate confirmation that resistance fired. A transient message is less disruptive than a modal. 3 seconds matches common toast patterns.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Unknown freeform resistance strings in user character data (MongoDB) | At runtime, non-canonical strings simply won't match `DAMAGE_TYPES` entries — no crash, no resistance applied. DM re-enters via new picker. |
| TypeScript errors in tests that construct `CreatureStats` with string literals | `tsc` surfaces these at CI time. Fix is mechanical: replace strings with `DamageType` values. |
| DM forgets to select a damage type | "No type" is the default — raw damage is applied. No silent resistance bypass. DM must actively select a type to get resistance math. |
| Feedback message timing (3s) | Short enough to not clutter; if it becomes annoying, user preference is a future concern. |
| DM forgets to remove expired effects | Manual removal only by design. Duration tracking is deferred. Visual prominence of active effects helps remind DMs. |
| Warding Bond preset applies all 13 types | Large but valid. Expanding all 13 at apply time is correct; no special handling needed. |
| Preset `type: null` (choose-at-apply) UX | Protection from Energy and Absorb Elements require one extra interaction. Handled by a brief type-picker step before applying. |

## Rollback / Mitigation

- No database migration — `DamageType[]` serializes as `string[]`
- `applyDamage()` is unchanged — any callsite that bypasses `applyDamageWithType()` continues working as before
- If the feature causes regressions, reverting the `app/combat/page.tsx` UI changes is sufficient to disable typed damage; the type system changes can remain

**CI blocking policy:** If TypeScript compilation fails after the type change, no PR merge. The compile errors are the test — they identify remaining freeform string usages that need fixing.

## Open Questions

None. All design decisions were resolved during the exploration session prior to this proposal.
