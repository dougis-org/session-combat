# Campaign Encounter & Monster Rollout

**Status:** in progress (Vecna first rollout complete via PR #615; G1 complete via PR #647; G2 complete via PR #661)

This document is the source of truth for the work described in
[`openspec/specs/campaign-monsters/spec.md`](../openspec/specs/campaign-monsters/spec.md)
and the open issues #578, #581. It tracks the bulk-data ingest of encounter
content and custom monsters for every campaign in
[`lib/scripts/seedCampaignTemplates.ts`](../lib/scripts/seedCampaignTemplates.ts).

---

## Goals

1. **Every campaign** in `CAMPAIGN_CATALOG` has well-defined encounters with
   full `Monster` stat blocks (no empty `monsters: []` arrays).
2. **Every required custom monster** is defined in
   [`lib/data/customMonsters.ts`](../lib/data/customMonsters.ts) with a
   valid `MonsterTemplate` shape (canonical `DamageType` values only).
3. **SRD monsters** are referenced by full stat block inline in the encounter
   (the same pattern used for custom monsters) so a copied campaign is
   immediately playable without depending on the global SRD library being
   loaded first.
4. **Bulk ingest**: changes are grouped by campaign group (one PR per group),
   not iterated one campaign at a time. Vecna was the pilot; the remaining
   49 campaigns will follow in 3-4 group PRs.

## Out of Scope

- Ingesting encounters into existing user campaigns (handled by the
  `migrate:encounters` script — PR #591).
- A "Global Encounters Library" feature (#578) — separate scope.
- UI work on the encounters panel (#606, #607) — separate scope.

---

## Architecture Reference

### Encounter shape
```ts
// lib/types.ts
export interface EncounterTemplate {
  id?: string;
  name: string;
  description: string;
  monsters: Monster[];          // ← must contain full stat blocks
}
```

### Monster shape
```ts
export interface Monster extends CreatureStats {
  _id?: string;
  id: string;                   // ← unique per instance, never shared
  userId?: string;
  templateId?: string;          // ← optional, set from source template
  name: string;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  type: string;
  alignment?: DnDAlignment;
  speed: string;
  challengeRating: number;
  experiencePoints?: number;
  lairActions?: CreatureAbility[];
  legendaryActions?: CreatureAbility[];
  legendaryActionCount?: number;
  source?: string;
  description?: string;
  initiative?: number;
}
```

### Helpers (`lib/data/customMonsters.ts`)
```ts
findCustomMonsterById(id)                       // typed lookup
toEncounterMonster(template, instanceId?)       // → Monster, strips template-only fields
toEncounterMonsters(template, count)            // → Monster[], each instance unique
```

### Constraints
- **`DamageType` values must be canonical** — only the 13 types in
  `lib/constants.ts:10` (acid, bludgeoning, cold, fire, force, lightning,
  necrotic, piercing, poison, psychic, radiant, slashing, thunder).
  Descriptive modifiers like "bludgeoning, piercing, and slashing from
  nonmagical attacks" belong in a `traits[].description`, not in
  `damageResistances` / `damageImmunities` arrays.
- **`passive Perception` value is a string** (e.g. `"12"`).
- **Every monster instance must have a unique `id`** — never reuse the
  same object reference. Use `toEncounterMonsters(template, n)` for
  repeated mobs.

---

## Design Templates

### Encounter template

```ts
const encounter = (
  name: string,
  description: string,
  monsters: Monster[]
): EncounterTemplate => ({ name, description, monsters });
```

**Naming convention:** `<Chapter> · <Scene>` (e.g. `"Kas's Vampire Ambush"`,
`"Acererak's False Liches"`).

**Description convention:** one sentence — what the encounter is, where it
happens, why it matters.

### Monster template

```ts
{
  id: "cm-<lowercase-short-name>",       // e.g. "cm-vampire-spawn"
  userId: GLOBAL_USER_ID,
  isGlobal: true,
  source: "<campaign title>",            // e.g. "Curse of Strahd"
  name: "<Display Name>",
  size: "medium",
  type: "humanoid",
  alignment: "Neutral Evil",
  speed: "30 ft.",
  challengeRating: 5,
  ac: 14,
  acNote: "leather armor",
  hp: 75,
  maxHp: 75,
  abilityScores: { strength: 11, dexterity: 14, constitution: 12,
                   intelligence: 10, wisdom: 13, charisma: 14 },
  savingThrows: { wisdom: 3 },
  skills: { Deception: 4, Religion: 2 },
  damageResistances: ["fire"],            // canonical DamageType values only
  damageImmunities: ["poison", "necrotic"],
  conditionImmunities: ["charmed", "exhausted"],
  senses: { darkvision: "60 ft.", "passive Perception": "12" },
  languages: ["Common", "Abyssal"],
  traits: [
    { name: "Dark Devotion",
      description: "Has advantage on saves vs. charm/frighten." },
  ],
  actions: [
    { name: "Multiattack",
      description: "Two melee attacks." },
    { name: "Scimitar",
      description: "Melee Weapon Attack",
      attackBonus: 4,
      damageDescription: "1d6+2 slashing" },
  ],
  legendaryActions: [ ... ],              // omit field entirely if no LA
  description: "<Lore paragraph>",       // for unique campaign bosses
}
```

For SRD monsters already in the open-source SRD library (mind flayer,
vampire, aboleth, beholder, etc.), still embed the stat block inline
in `customMonsters.ts` (using the `cm-` prefix convention) so the
encounter is self-contained.

---

## Process (Bulk Pass)

1. **Group** — Partition the 49 remaining campaigns into 3-4 groups by
   affinity (e.g. classic adventures, planar adventures, OSR/classic
   modules, modern anthologies). See [Campaign Groups](#campaign-groups).
2. **Research (parallel)** — One research agent per group. Output: a
   research markdown file per campaign listing chapters, key encounters,
   and required new monsters.
3. **Author (parallel)** — One author agent per group. Output: a TS patch
   for `lib/data/customMonsters.ts` (new monsters) and
   `lib/scripts/seedCampaignTemplates.ts` (encounters wired in) plus
   updates to existing test files.
4. **Verify (sequential)** — Run `npm run typecheck`, `npm run test:unit`,
   and `npm run lint` for each group before commit.
5. **Commit (per group)** — One PR per group, one commit per campaign
   inside the group for clean diffs.
6. **Track status** — Update the [Status table](#status) below as each
   group lands.

---

## Campaign Groups

| Group | Campaigns | Rationale | Target PR |
|---|---|---|---|
| **G1 — Classic Forgotten Realms** | Curse of Strahd, Tomb of Annihilation, Lost Mine of Phandelver, Tyranny of Dragons, Baldur's Gate: Descent into Avernus | All published 5e hardcover adventures, Forgotten Realms flavor, heavy use of undead/Fiend/Cult | #TBD |
| **G2 — Sword Coast & Savage Frontier** | Waterdeep: Dragon Heist, Storm King's Thunder, Out of the Abyss, Dragon of Icespire Peak, Phandelver and Below: The Shattered Obelisk | Geographic cluster (Sword Coast), mix of urban/heavy wilderness/Underdark | #TBD |
| **G3 — Planar & Crossover** | Icewind Dale: Rime of the Frostmaiden, The Wild Beyond the Witchlight, Princes of the Apocalypse, Curse of the Crimson Throne, Hell's Rebels, Red Hand of Doom | Elemental Evil / non-Realms / Planescape-adjacent | #TBD |
| **G4 — Anthologies & OSR/3.5e conversions** | Candlekeep Mysteries, Journeys Through the Radiant Citadel, Keys from the Golden Vault, Tales from the Yawning Portal, Ghosts of Saltmarsh, Waterdeep: Dungeon of the Mad Mage, Rise of the Runelords, Kingmaker, Wrath of the Righteous | Anthology / adventure path / OSR-to-5e conversions | #TBD |
| **G5 — Classic Adventures & Settings** | Age of Worms, Dungeon of the Mad Mage (already in G4), Drakkenheim, Hot Springs Island, Scarlet Citadel, Courts of Shadow Fey, Vault of the Drow, Shackled City, Reavers of Harkenwold, Lost City, Planescape: Turn of Fortune's Wheel, Dragonlance, Empire of the Ghouls, Temple of Elemental Evil, Keep on the Borderlands, Points of Light, Night Below, Return to Temple, Desert of Desolation, Queen of the Spiders, Reptile God, Spelljammer, Barrier Peaks, Return to Tomb of Horrors, Savage Tide, Expedition | All other 5e and 3.5e modules — mix of low/mid/high level | #TBD |

> Final grouping will be tuned after research lands. Some campaigns are
> easy 1-encounter add-ons; others (Dungeon of the Mad Mage with 13
> levels) are multi-PR on their own.

---

## Status

> Per-campaign status. Update as research / authoring / review lands.
>
> | campaign | chapters | encounters | monsters | source | status |
> |---|---|---|---|---|---|
> | Vecna: Eve of Ruin | 11 | 19 | 12 | PR #615 | ✅ merged |
> | Curse of Strahd | 13 | 3 placeholder | 0 new | — | 🚧 G1 |
> | Tomb of Annihilation | 5 | 3 placeholder | 0 new | — | 🚧 G1 |
> | Lost Mine of Phandelver | 4 | 3 placeholder | 0 new | — | 🚧 G1 |
> | Tyranny of Dragons | 13 | 0 | 0 new | — | 🚧 G1 |
> | Baldur's Gate: Descent into Avernus | 5 | 2 placeholder | 0 new | — | 🚧 G1 |
> | Waterdeep: Dragon Heist | 9 | 3 | 8 new | PR #661 | ✅ merged |
> | Storm King's Thunder | 10 | 10 | 19 new | PR #661 | ✅ merged |
> | Out of the Abyss | 17 | 16 | 37 new | PR #661 | ✅ merged |
> | Dragon of Icespire Peak | 4 | 15 | 6 new | PR #661 | ✅ merged |
> | Phandelver and Below: The Shattered Obelisk | 8 | 9 | 21 new | PR #661 | ✅ merged |
> | Icewind Dale: Rime of the Frostmaiden | 7 | 12 | 14 new | PR #581 | ✅ merged |
> | The Wild Beyond the Witchlight | 5 | 8 | 14 new | PR #581 | ✅ merged |
> | Princes of the Apocalypse | 5 | 22 | 16 new | PR #581 | ✅ merged |
> | Curse of the Crimson Throne | 6 | 13 | 15 new | PR #581 | ✅ merged |
> | Hell's Rebels | 6 | 13 | 14 new | PR #581 | ✅ merged |
> | Red Hand of Doom | 5 | 15 | 14 new | PR #581 | ✅ merged |
> | Candlekeep Mysteries | 17 | 0 | TBD | docs/research/candlekeep-mysteries.md | 🚧 G4 |
> | Journeys Through the Radiant Citadel | 13 | 0 | TBD | docs/research/radiant-citadel.md | 🚧 G4 |
> | Keys from the Golden Vault | 13 | 0 | TBD | docs/research/golden-vault.md | 🚧 G4 |
> | Tales from the Yawning Portal | 7 | 0 | TBD | docs/research/yawning-portal.md | 🚧 G4 |
> | Ghosts of Saltmarsh | 8 | 0 | TBD | docs/research/ghosts-of-saltmarsh.md | 🚧 G4 |
> | Waterdeep: Dungeon of the Mad Mage | 13 | 0 | TBD | docs/research/mad-mage.md | 🚧 G4 |
> | Rise of the Runelords | 6 | 0 | TBD | docs/research/rise-of-the-runelords.md | 🚧 G4 |
> | Kingmaker | 6 | 0 | TBD | docs/research/kingmaker.md | 🚧 G4 |
> | Wrath of the Righteous | 6 | 0 | TBD | docs/research/wrath-of-the-righteous.md | 🚧 G4 |
> | Age of Worms | 12 | 0 | 0 new | research/age-of-worms.md | 🚧 G5 |
> | Dungeons of Drakkenheim | 7 | 0 | 0 new | research/drakkenheim.md | 🚧 G5 |
> | Dark of Hot Springs Island | 4 | 0 | 0 new | research/hot-springs-island.md | 🚧 G5 |
> | Scarlet Citadel | 8 | 0 | 0 new | research/scarlet-citadel.md | 🚧 G5 |
> | Courts of the Shadow Fey | 4 | 0 | 0 new | research/courts-of-the-shadow-fey.md | 🚧 G5 |
> | Vault of the Drow | 4 | 0 | 0 new | research/vault-of-the-drow.md | 🚧 G5 |
> | Shackled City | 12 | 0 | 0 new | research/shackled-city.md | 🚧 G5 |
> | Reavers of Harkenwold | 5 | 0 | 0 new | research/reavers-of-harkenwold.md | 🚧 G5 |
> | The Lost City | 4 | 0 | 0 new | research/lost-city.md | 🚧 G5 |
> | Turn of Fortune's Wheel | 14 | 0 | 0 new | research/turn-of-fortunes-wheel.md | 🚧 G5 |
> | Dragonlance: Shadow of the Dragon Queen | 7 | 0 | 0 new | research/dragonlance-shadow-of-the-dragon-queen.md | 🚧 G5 |
> | Empire of the Ghouls | 6 | 0 | 0 new | research/empire-of-the-ghouls.md | 🚧 G5 |
> | Temple of Elemental Evil | 6 | 0 | 0 new | research/temple-of-elemental-evil.md | 🚧 G5 |
> | Keep on the Borderlands | 3 | 0 | 0 new | research/keep-on-the-borderlands.md | 🚧 G5 |
> | Points of Light | 3 | 0 | 0 new | research/points-of-light.md | 🚧 G5 |
> | Night Below | 3 | 0 | 0 new | research/night-below.md | 🚧 G5 |
> | Return to Temple of Elemental Evil | 4 | 0 | 0 new | research/return-to-temple-of-elemental-evil.md | 🚧 G5 |
> | Desert of Desolation | 3 | 0 | 0 new | research/desert-of-desolation.md | 🚧 G5 |
> | Queen of the Spiders | 7 | 0 | 0 new | research/queen-of-the-spiders.md | 🚧 G5 |
> | Against the Cult of the Reptile God | 3 | 0 | 0 new | research/against-the-cult-of-the-reptile-god.md | 🚧 G5 |
> | Spelljammer: Light of Xaryxis | 4 | 0 | 0 new | research/spelljammer-light-of-xaryxis.md | 🚧 G5 |
> | Expedition to the Barrier Peaks | 6 | 0 | 0 new | research/expedition-to-the-barrier-peaks.md | 🚧 G5 |
> | Return to the Tomb of Horrors | 3 | 0 | 0 new | research/return-to-the-tomb-of-horrors.md | 🚧 G5 |
> | Savage Tide | 12 | 0 | 0 new | research/savage-tide.md | 🚧 G5 |

**Legend:** ✅ merged · 🚧 authoring · 🔍 researching · ⏳ queued · ❌ blocked

---

## Sources (research)

Each research agent should consult at least three of the following, in
priority order:

1. **Wikipedia** — `<Adventure Name>` page (high-level summary, chapter list)
2. **D&D Beyond product page** (`/sources/dnd/<code>`) — official chapter
   list, bestiary index, character dossier
3. **5etools mirror** (`5e.tools/bestiary.html`) — SRD monster stats lookup
4. **Wargamer / ScreenRant review** — chapter-by-chapter summary, monster
   highlights, encounter flow
5. **Kobold Press / EN World review** — alternate perspective, monster
   counts, level ranges
6. **Open5e.com** — open-licensed SRD content for stat-block verification

> Note: D&D Beyond chapter text and bestiary bodies are paywalled and
> not fetchable. Research agents must rely on review summaries + open
> SRD references, not raw book content.

---

## Verification Checklist (per group PR)

Before requesting review:

- [ ] `npm run typecheck` exits clean
- [ ] `npm run test:unit` exits clean — all groups have ≥ 1 new test per
      campaign covering: encounter count, monster presence, instance-id
      uniqueness
- [ ] `npx eslint lib/data/customMonsters.ts lib/scripts/seedCampaignTemplates.ts`
      exits clean
- [ ] No `as any` casts introduced (the Vecna fix removed all of them)
- [ ] No `eslint-disable` comments introduced
- [ ] No descriptive strings in `damageResistances`/`damageImmunities`
      arrays — only canonical `DamageType` values
- [ ] `passive Perception` is a string, not a number
- [ ] Every monster instance has a unique `id`
- [ ] PR title follows the pattern
      `feat(campaigns): populate <Group> campaign encounters`
- [ ] PR body lists: campaigns covered, new monsters added, encounter
      counts per campaign, source citations

---

## Cross-References

- Issue #578 — Global Encounters Library (out of scope here, but the
  custom-monster registry in `lib/data/customMonsters.ts` is the
  foundation that library would build on)
- Issue #581 — Ingest encounter content for existing campaigns (handled
  by `migrate:encounters` script, ships with this rollout when run)
- Issue #601 — Closed. PR #604 was the initial Vecna populate; PR #615
  completes the Vecna rollout
- `openspec/specs/campaign-monsters/spec.md` — the canonical contract
- `openspec/specs/campaign-templates/spec.md` — embedding semantics
- PR #591 / `lib/scripts/backfillCampaignEncounters.ts` — retroactive
  ingest for users with pre-existing campaigns

---

## Maintenance

When new campaigns or encounters are added:

1. Append to `CAMPAIGN_CATALOG` in
   `lib/scripts/seedCampaignTemplates.ts`.
2. Add any new unique monsters to `lib/data/customMonsters.ts` (with
   `cm-` prefix and `source: "<campaign title>"`).
3. Use the helpers `findCustomMonsterById` and `toEncounterMonster(s)`
   when wiring encounters.
4. Add or extend the campaign test in
   `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`.
5. Update this doc's status table.
