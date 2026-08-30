# Icewind Dale: Rime of the Frostmaiden — Research

Source: Wikipedia + CBR + Polygon + ScreenRant + Tribality. Researched 2026-08-30.

## Adventure structure

Wizards of the Coast hardcover (Sept 2020), levels 1–12, Forgotten Realms. Set in
the Ten-Towns region of Icewind Dale during Auril's Everlasting Rime. Written by
Chris Perkins with 11 co-writers; 320 pages. The campaign opens at level 1 in
Ten-Towns and re-converges with the mid-level thread around level 4; multiple
branching paths are possible.

| Chapter | Title                          | Level    | Location                                 |
|---------|--------------------------------|----------|------------------------------------------|
| 1       | Ten-Towns                      | 1–4      | Ten-Towns, Icewind Dale                  |
| 2       | Icewind Dale                   | 4        | Icewind Dale Wilderness (Bryn Shander)   |
| 3       | Sunblight                      | 4–5      | Sunblight Fortress (dwarven)             |
| 4       | Destruction's Light            | 6        | Ten-Towns (defense)                      |
| 5       | Auril's Abode                  | 7        | Solstice / Grimskalle, Sea of Moving Ice |
| 6       | Caves of Hunger                | 8        | Reghed Glacier                           |
| 7       | Doom of Ythryn                 | 9–12     | Ythryn, Netherese Necropolis             |

Source: `seedCampaignTemplates.ts:457–464` and Wikipedia infobox / CBR review.

## Encounter plan

The campaign is sandbox-shaped; the encounters below are the **set-piece
boss fights / signature combat locations** most likely to be dropped into a
copyable encounter list. SRD monsters (yetis, frost giants, duergar,
mind flayers, etc.) appear throughout and are not enumerated here — author
should embed them inline using the existing SRD shape.

### Chapter 1 — Ten-Towns (1–4)

- **Coldlight Walker** *(existing placeholder)* — An undead frozen wanderer
  attacks in the endless blizzard. Use the SRD **wraith** or ** revenant**
  stat block as the foundation. If the author wants a brand-new monster, see
  *New monsters needed* below.
- **Chardalyn Berserker Cave** — Berserker dwarves corrupted by chardalyn,
  guarded by two **white dragon wyrmlings** (SRD). The brazier must be
  extinguished to kill the berserkers. Mixed encounter:
  - 4 × **berserker** (chardalyn-corrupted, SRD berserker with custom trait)
  - 2 × **white dragon wyrmling** (SRD)
- **Cackling Chasm gnolls** — Emaciated gnolls in an icy chasm.
  - 6 × **gnoll** (SRD)
  - 1 × **gnoll pack lord** (SRD)

### Chapter 2 — Icewind Dale (4)

- **Angajuk's Bell** — The 200-year-old sperm whale Angajuk ferries the party
  underwater. Pure RP, no combat; if combat wanted, swap with SRD **merfolk**
  + **giant constrictor snake** threat.
- **Auril's three forms** (deferred to Chapter 5).

### Chapter 3 — Sunblight (4–5)

- **Sunblight Fortress assault** — Duergar outpost that launches the chardalyn
  dragon at Ten-Towns. The fortress contains:
  - **Xardorok Sunblight** (duergar warlord — use SRD **duergar** + buffs)
  - 8 × **duergar** (SRD)
  - 4 × **duergar stone guard** (use SRD **duergar** with extra HP)
  - 2 × **mezzoloth** yugoloth mercenaries (SRD)

### Chapter 4 — Destruction's Light (6)

- **Battle of Ten-Towns** — Open-air war encounter against the chardalyn
  dragon. Optional prior placeholder:
  - **Chardalyn Dragon** *(existing placeholder)* — a CR ~14 construct
    creature. SRD equivalent: **adult white dragon** with construct traits
    and the damage immunities replaced with the 13 canonical types. See *New
    monsters needed*.

### Chapter 5 — Auril's Abode (7)

- **Grimskalle** — Frost-giant fortress on the Island of Solstice, currently
  inhabited by Auril's devotees.
  - **Kobold Frostheart** *(placeholder, no SRD equivalent)* — see below.
  - 4 × **frost giant** (SRD) sleeping/resting
  - 1 × **white dragon wyrmling** mount
- **Auril, the Frostmaiden** — Deity, three forms. Author should pick one
  canonical form for the encounter (10-ft ice woman, "Lady Icekiss") and
  embed inline stat block.

### Chapter 6 — Caves of Hunger (8)

- **Caves of Hunger** — Ice labyrinth under the Reghed Glacier.
  - 6 × **ogre** (SRD) led by an **ogre howdah** variant
  - **Duergar** patrols (SRD)
  - **Ythryn mythallar** hazards (lair actions, no monsters)

### Chapter 7 — Doom of Ythryn (9–12)

- **Ythryn Necropolis** — Netherese flying city buried in the glacier.
  - **Aunaut Aurilblight** *(no SRD equivalent)* — frost giant priest-king
  - 4 × **mind flayer** (SRD) — illithid survived the Netherese
  - 2 × **mind flayer arcanist** (SRD)
  - **Iriolarthas the necromancer** *(no SRD)* — see below
  - **Leviathan** *(no SRD)* — see below
  - 1 × **kraken** (SRD) beneath the city

## New monsters needed

These are unique to *Rime of the Frostmaiden* with no direct SRD equivalent.
Stat-block authoring happens in the next phase.

| ID                     | Display Name              | CR  | Source              |
|------------------------|---------------------------|-----|---------------------|
| `cm-coldlight-walker`  | Coldlight Walker          | 5   | RoTF                |
| `cm-chardalyn-dragon`  | Chardalyn Dragon          | 14  | RoTF                |
| `cm-aunaut-aurilblight`| Aunaut Aurilblight        | 11  | RoTF                |
| `cm-iriolarthas`       | Iriolarthas, the Netherese Necromancer | 12 | RoTF     |
| `cm-leviathan`         | Leviathan (Netherese)     | 20  | RoTF                |

Notes:

- *Aunaut* — frost-giant priest-king of Ythryn who survived the fall; cleric
  of Auril with frost-themed spells.
- *Iriolarthas* — Netherese archwizard, undead lich pre-casting mythallar
  spells. May be downgraded to CR 12 with a custom `legendaryActions` block.
- *Leviathan* — the apocalyptic sea-monster from Realms lore; CR 20 elder
  kraken-tier; use as the final boss before Auril if the party elects to
  bypass the deity.

## Sources

1. Wikipedia — *Icewind Dale: Rime of the Frostmaiden*
   <https://en.wikipedia.org/wiki/Icewind_Dale:_Rime_of_the_Frostmaiden>
2. CBR — *D&D: 8 Unique Locations Established in Rime of the Frostmaiden*
   <https://www.cbr.com/dungeons-dragons-frostmaiden-unique-locations/>
3. CBR — *D&D: Auril the Frostmaiden, Explained*
   <https://www.cbr.com/dungeons-dragons-auril-the-frostmaiden-explained/>
4. Polygon — *D&D's next adventure will test even the best Dungeon Masters*
   <https://www.polygon.com/reviews/2020/9/9/21428999/dungeons-dragons-icewind-dale-rime-of-the-frostmaiden-review-preview>
5. ScreenRant — *D&D's Latest Campaign Is Perfect For DMs On A Tight Schedule*
   <https://screenrant.com/dungeons-dragons-short-campaign-ideas-rime-frostmaiden-icewind/>

## Confidence notes

- Wikipedia confirms chapter structure (1–12 levels, 7 chapters); matches
  `seedCampaignTemplates.ts` exactly.
- D&D Beyond body text is paywalled; chapter-level details come from
  CBR / Polygon / ScreenRant / Tribality reviews plus Wikipedia.
- The CR ratings for *Chardalyn Dragon* and *Leviathan* are best-effort
  estimates from review summaries; author should cross-check against the
  actual published stat blocks during authoring.
- Several mid-chapter encounters (Revel's End prison break, the Id
  Ascendant in Caves of Hunger) are **non-combat** RP encounters and were
  intentionally omitted — combat encounters only.