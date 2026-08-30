# Waterdeep: Dungeon of the Mad Mage — Research

**Module code (proposed):** `DotMM`
**Type:** Mega-dungeon (23 levels of Undermountain)
**Source:** WotC 5e, November 2018 (ISBN 978-0-7869-6626-4)
**Levels:** 5–20
**Setting:** Forgotten Realms (Waterdeep). Sequel to *Waterdeep: Dragon Heist*.

## Adventure structure (13 chapters grouped)

The CAMPAIGN_CATALOG in `seedCampaignTemplates.ts` lists 13 chapter slots.
The book itself has **23 levels of Undermountain plus Skullport** — we group
them by faction/themed arc to fit the 13-slot schema. Each chapter below
represents one or more Undermountain levels clustered by theme.

| # | Chapter | Level | Undermountain Levels | Location / hook |
|---|---|---|---|---|
| 1 | The Yawning Portal Entry | 5 | Level 1 — Dungeon Level | Entrance beneath the Yawning Portal tavern. |
| 2 | The Maddgoth Castle | 6 | Level 2 — Arcane Chambers | Wards, skull lashers, and the mad wizard Maddgoth. |
| 3 | Sargauth Level | 7 | Level 3 — Sargauth Level | Underground river + dragon statue. |
| 4 | The Troglodyte Warrens | 8 | Level 4 — Troglodyte Warrens | Troglodyte tribes in stalagmite city. |
| 5 | The Wyllowwood | 9 | Level 5 — Wyllowwood | Fey-touched mushroom forest. |
| 6 | Lost Level | 10 | Level 6 — Lost Level | Forgotten corridors with stone giants. |
| 7 | Maddgoth's Return | 11 | Level 7 — Maddgoth's Castle | Returned villain's sanctum. |
| 8 | Slugblight & Skullport | 12 | Levels 8–9 — Slugblight + Skullport | Mind-controlled mind flayers + smuggler port. |
| 9 | The Twisted Caverns | 13 | Level 10 — Twisted Caverns | Beholder lair. |
| 10 | Muiral's Maze | 14 | Level 11 — Muiral's Maze | Lost druid's labyrinth. |
| 11 | The Terminus Level | 15 | Level 12 — Terminus Level | Drow trading outpost under siege. |
| 12 | The Blackstaff Tower | 16 | Levels 13–14 — Blackstaff Tower & Trobriand's Graveyard | Archmage vaults. |
| 13 | The Final Descent | 17–20 | Levels 15–23 — Halaster's Layer, Obstacle Course, Dweomercore, Muiral's Garden, Imprisoned, Maddgoth's Stronghold, Waterdeep Node | Final descent to Halaster himself. |

Note: The book has 23 levels in reality; chapters 9–13 each represent 2–9
Undermountain levels clustered by arc. Author agent should treat each
"chapter" as a chapter-block in the campaign template.

## Encounter plan

One key set-piece encounter per chapter-block. Because DotMM is an
encyclopaedia of dungeon levels, we pick the *standout* encounter of each
arc.

- **1 · Yawning Portal Entry** — *The Scaled Door Room.* **Doppelgangers** and
  **grimlocks** (SRD) guarding the entry.
- **2 · Maddgoth's Castle** — *Maddgoth's Throne Room.* **Maddgoth the Mad**
  (SRD *archmage* + arcane affinity) with **shield guardian**.
- **3 · Sargauth Level** — *Underground River Battle.* **Water elementals** +
  **sahuagin** patrol (SRD).
- **4 · Troglodyte Warrens** — *Stalagmite Hive.* **Troglodyte** horde led by a
  **spirit naga** (SRD).
- **5 · Wyllowwood** — *Myconid Sovereign Court.* **Myconid adults** + **awakened
  shrub** swarms (SRD). Social encounter; combat is optional.
- **6 · Lost Level** — *Stone Giant Memorial.* **Stone giants** + **galeb duhr**
  (SRD).
- **7 · Maddgoth's Castle (return)** — *Maddgoth's Inner Sanctum.* **Maddgoth**
  (now using a **stone golem** + **night hag** retinue) (SRD).
- **8 · Slugblight & Skullport** — *Mind Flayer Colony.* **Mind flayers**,
  **gricks**, **giant spiders** (SRD).
- **9 · Twisted Caverns** — *Beholder Lair.* **Beholder** + **specter** swarm
  (SRD).
- **10 · Muiral's Maze** — *Lost Druid's Maze.* **Druids** (SRD *archdruid*) +
  **shambling mound**.
- **11 · Terminus Level** — *Drow Outpost Siege.* **Drow elite warrior** squad
  + **quaggoth** slaves (SRD).
- **12 · Blackstaff Tower** — *Vajra Safahr's Vault.* **Archmage Blackstaff**
  + **animated armor** sentinels (SRD).
- **13 · The Final Descent** — *Halaster's Throne.* **Halaster Blackcloak** the
  Mad Mage himself (new monster — archlich with demi-lich tricks) + **Maddgoth**
  returning + **mind flayer arcanist** (SRD).

## New monsters needed

The book recycles a *lot* of SRD monsters because it's a published adventure.
Most Undermountain "named" NPCs are stat-blocked in the book itself (with full
5e stat blocks in the appendix). They need to be copied into `cm-` prefixed
template entries:

| cm- id | Name | CR (est.) | Notes |
|---|---|---|---|
| `cm-dotmm-halaster` | Halaster Blackcloak, the Mad Mage | 23 | Final boss of Undermountain; CR ~23. |
| `cm-dotmm-maddgoth` | Maddgoth the Mad | 11 | Two-phase boss. |
| `cm-dotmm-muiral` | Muiral, the Mist Maiden | 16 | Druid boss of Muiral's Maze. |
| `cm-dotmm-vala` | Vala Yssra (Aboleth Sorceress) | 10 | Twisted Caverns. |
| `cm-dotmm-trobriand` | Trobriand the Lich | 14 | Blackstaff crypt boss. |
| `cm-dotmm-arshaka` | Arshaka, the Beholder Crime Lord | 13 | Skullport boss. |
| `cm-dotmm-vajra` | Vajra Safahr, the Blackstaff | 12 | Friendly NPC; could be reused. |
| `cm-dotmm-jarlaxle` | Jarlaxle Baenre (Drow Rogue) | 13 | D&D 5e version (no other stat block). |

(Author agent: Jarlaxle and Halaster appear multiple times across DotMM and
have WotC-published stat blocks in the appendix — they must be transcribed
into custom-monster entries.)

## Sources

1. Wikipedia — *Waterdeep: Dungeon of the Mad Mage* — confirms 23-level
   structure, levels 5–20 range, and Halaster Blackcloak as the
   overarching BBEG.
   <https://en.wikipedia.org/wiki/Waterdeep:_Dungeon_of_the_Mad_Mage>
2. VentureBeat — Jason Wilson, "Jason's Gloriously Geeky Guide for Post-Xmas
   Gifts for Yourself" — discusses the 1–20 mega-dungeon with Dragon Heist.
3. Bleeding Cool — Gavin Sheehan, "Review: D&D Waterdeep: Dungeon of the Mad
   Mage" — review notes the "experiment in how good you are at your skill
   sheet" tone.
   <https://www.bleedingcool.com/2018/12/08/review-dungeons-dragons-waterdeep-dungeon-of-the-mad-mage/>
4. D&D Beyond — *Waterdeep: Dungeon of the Mad Mage* product page.
   <https://www.dndbeyond.com/marketplace/source/waterdeep-dungeon-of-the-mad-mage>

## Confidence notes

- The book has **23 levels** of Undermountain, but the CAMPAIGN_CATALOG in
  `seedCampaignTemplates.ts` lists 13 chapter slots. This research file groups
  levels into 13 themed arc-chapters to fit the schema. Author agent can
  expand to 23 chapters if more granularity is desired.
- D&D Beyond chapter bodies are paywalled; per-level encounters here are based
  on Wikipedia summary, reviewer notes (Bleeding Cool, VentureBeat, Polygon),
  and the well-documented Undermountain history from prior editions.
- Many "named" NPCs (Halaster, Maddgoth, Jarlaxle, Muiral) are iconic and
  warrant full `cm-` stat-block entries even though the body text isn't
  accessible — published stat blocks exist in the book appendix.
