## Why

Combat damage in D&D 5e is not uniform — creatures and characters resist, are immune to, or are vulnerable to specific damage types (fire, necrotic, psychic, etc.). The tracker currently has no concept of damage types: all damage is applied raw, meaning a fire elemental takes full damage from fire, and a barbarian's rage-granted resistance to physical damage is silently ignored. This feature closes that gap, making combat outcomes mechanically correct without requiring the DM to do manual math.

## What Changes

- **NEW** `DAMAGE_TYPES` constant and `DamageType` union type covering all 13 canonical D&D 5e damage types
- **BREAKING** `damageResistances`, `damageImmunities`, `damageVulnerabilities` on `CreatureStats` change from `string[]` to `DamageType[]`
- **FIX** 4 SRD monster entries contain freeform qualifier strings (`'from nonmagical attacks'`, `'nonmagical bludgeoning'`, `"that aren't adamantine"`) — stripped to bare canonical types
- **FIX** 3 combatant builder sites in `app/combat/page.tsx` silently drop `damageResistances`, `damageImmunities`, `damageVulnerabilities`, `conditionImmunities` when building `CombatantState` — all four fields now copied through
- **NEW** `applyDamageWithType()` pure utility function that applies resistance/immunity/vulnerability math before forwarding to `applyDamage()`
- **NEW** Damage type selector on the HP adjustment widget (dropdown grouped by type family)
- **NEW** Visual feedback on the HP adjustment widget when damage is modified: `"Immune — 0 dmg"`, `"Resisted — 10 → 5"`, `"Vulnerable — 10 → 20"`
- **NEW** `CreatureStatsForm` resistance fields upgraded from free-text textarea to structured tag picker sourced from `DAMAGE_TYPES`
- **NEW** `activeDamageEffects` field on `CombatantState` — an array of named, combat-scoped resistance/immunity/vulnerability entries that do not persist to the character or monster template
- **NEW** Add/remove UI on the combatant card for managing active effects mid-combat
- **NEW** Preset system: a fixed set of named common effects (Rage, Stoneskin, Protection from Energy, Fire Shield, Absorb Elements, Warding Bond) that pre-fill type selections; extensible via the `DAMAGE_EFFECT_PRESETS` constant

## Capabilities

### New Capabilities
- `damage-types`: Canonical 13-type D&D 5e damage type system — constant, union type, and grouped UI representation
- `damage-resistance-application`: Runtime damage modification logic — immunity zeroes damage, resistance halves (round down), vulnerability doubles; resistant+vulnerable cancel to normal; immunity always wins; permanent and combat-scoped effects merged at resolution time
- `combat-damage-effects`: Combat-scoped temporary damage effects — `activeDamageEffects` on `CombatantState`, add/remove UI, preset library

### Modified Capabilities
- `temp-hp-tracking`: Resistance/vulnerability math is applied to the raw input value *before* temp HP absorption, preserving the existing temp HP drain mechanics

## Impact

**Code affected:**
- `lib/types.ts` — `CreatureStats` field type change (breaking)
- `lib/constants.ts` — new `DAMAGE_TYPES` and `DamageType` exports
- `lib/data/srd-monsters.ts` — 4 data fixes
- `lib/utils/combat.ts` — new `applyDamageWithType()` function
- `app/combat/page.tsx` — 3 combatant builder sites + HP adjustment widget UI + active effects add/remove UI on combatant card
- `lib/components/CreatureStatsForm.tsx` — resistance field UI upgrade
- `lib/constants.ts` — new `DAMAGE_EFFECT_PRESETS` constant alongside `DAMAGE_TYPES`

**Tests affected:**
- `tests/unit/combat/combat.test.ts` — new test cases for `applyDamageWithType()`
- Any test that constructs `CreatureStats` or `CombatantState` with freeform resistance strings will need updating (compile-time errors will surface these)

**No API or database schema changes required** — `DamageType[]` serializes identically to `string[]` in MongoDB/JSON.

## Scope

**In scope:**
- All 13 canonical damage types: acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison, psychic, radiant, slashing, thunder
- Resistances, immunities, vulnerabilities for both monsters and player characters (unified `CombatantState` path)
- Damage type selector on the direct HP adjustment widget
- Damage type selector on the deal-damage-to-target widget
- Visual modifier feedback after applying typed damage
- `activeDamageEffects` on `CombatantState` for combat-scoped resistance/immunity/vulnerability
- Add/remove UI on combatant card for temporary effects
- Preset library: Rage, Stoneskin, Protection from Energy, Fire Shield (Warm), Fire Shield (Chill), Absorb Elements, Warding Bond
- `DAMAGE_EFFECT_PRESETS` constant — extensible, ships with the above initial set

**Out of scope:**
- Magical vs. nonmagical weapon tracking (separate feature)
- Silvered / adamantine weapon properties
- Condition immunities auto-application
- Damage type tracking in the combat log (no log exists yet)

## Risks

- **Breaking type change** — any TypeScript code passing arbitrary strings into resistance fields will fail to compile. Mitigated: the 4 known bad entries are enumerated; `tsc` will surface any others.
- **SRD data loss** — stripping qualifiers like `"that aren't adamantine"` loses nuance from the SRD. Accepted: the feature decision is that resistances are unconditional; weapon-type tracking is explicitly deferred.
- **Player resistance data** — existing player characters may have freeform resistance strings entered before this change. Mitigated: MongoDB stores strings; old values will simply not match `DAMAGE_TYPES` entries and will be ignored at runtime (no crash). DMs can re-enter them using the new picker.
- **Active effects not persisted** — `activeDamageEffects` live on `CombatantState` only, cleared when combat ends. This is by design; there is no data loss risk.

## Open Questions

No unresolved ambiguity. All design decisions were made during exploration:
- Resistances are unconditional (confirmed)
- Magical/nonmagical weapon tracking is deferred (confirmed)
- `DamageType[]` over `string[]` (confirmed, Option B)
- Priority order: immune > (resistant + vulnerable = normal) > resistant > vulnerable (standard 5e rules)
- Damage modified before temp HP absorption (standard 5e rules)
- Temporary effects use named source labels for DM tracking; manual removal only (duration/expiry is deferred)
- Preset effects pre-fill type selections; user can also define fully custom effects
- `activeDamageEffects` cleared automatically when combat ends

## Non-Goals

- Modeling magical vs. nonmagical damage sources
- Silvered or adamantine weapon properties
- Auto-populating resistances from race/class features
- Combat log / damage history

---

*If scope changes after approval, proposal.md, design.md, specs/, and tasks.md must all be updated before implementation proceeds.*
