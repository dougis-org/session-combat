# Princes of the Apocalypse — Research

Source: Wikipedia + Tribality + Strange Assembly + BoingBoing. Researched 2026-08-30.

## Adventure structure

Wizards of the Coast hardcover (April 2015), levels 1–15, Forgotten Realms
(Dessarin Valley / Sumber Hills). Sequel to the *Elemental Evil* storyline
and re-skinned version of the classic *Temple of Elemental Evil*. Takes
heroes from level 1 through investigating four elemental cult outposts, a
four-quadrant temple, and the final Elder Elemental Eye temple.

| Chapter | Title                       | Level | Location                                |
|---------|-----------------------------|-------|-----------------------------------------|
| 1       | Rise of Elemental Evil      | 3–5   | Red Larch, Dessarin Valley              |
| 2       | The Dessarin Valley         | 5–7   | Four outposts across the Sumber Hills   |
| 3       | Secret of the Sumber Hills  | 7–10  | Sacred Stone Monastery, Haunted Keep    |
| 4       | Alarums and Excursions      | 10–13 | Temple of the Elder Eye (4 quadrants)   |
| 5       | The Elder Elemental Eye     | 13–15 | Fane of the Eye + 4 Elemental Nodes     |

Source: Strange Assembly review + Wikipedia + `seedCampaignTemplates.ts:509–513`.

## The Four Elemental Cults

| Cult                     | Element | Prophet            | Outpost                       |
|--------------------------|---------|--------------------|-------------------------------|
| Cult of the Howling Hate  | Air     | Aerisi Kalinoth    | Summit Hall / Skyreach Castle |
| Cult of the Crushing Wave| Water   | Gar Shatterkeel    | Riverward Shrine / Black Geode|
| Cult of the Black Earth   | Earth   | Marlos Urnrayle    | Sacred Stone Monastery       |
| Cult of the Eternal Flame | Fire    | Vanifer            | Fane of the Eye (lower levels)|

All four prophets are mid-CR named NPCs; the only truly unique stat block
required is **Marlos Urnrayle** (a unique male **medusa** — SRD base plus
custom spells and lair actions). The rest can be re-skinned from SRD.

## Encounter plan

This is the **sandbox** campaign of 5e — many identical structure outposts.
The encounters below are the **signature set-pieces**.

### Chapter 1 — Rise of Elemental Evil (3–5)

- **Delegation Disappearance in Red Larch** — Investigation scenario.
  Mostly RP; optional combat:
  - 4 × **cultist** (SRD)
  - 1 × **cult fanatical** (SRD) leader
- **Feather of Wind Shrine** *(Howling Hate)* — Air outpost.
  - 1 × **drow** mage (SRD) — Aerisi's lieutenant
  - 4 × **air elemental** (SRD)
  - 2 × **aarakocra** (SRD) sentries
- **Stone Quarry ambush** *(Black Earth)* — Earth outpost.
  - 1 × **medusa** (SRD) — Marlos (use as boss)
  - 3 × **gnoll** (SRD) enforcers
  - 2 × **earth elemental** (SRD)

### Chapter 2 — The Dessarin Valley (5–7)

- **River Guard Keep & Sacred Stone Monastery** *(Crushing Wave + Black
  Earth)* — Two outposts in one chain.
  - **Black Earth monastery interior:**
    - 1 × **black earth cultist** *(custom)* — see *New monsters*
    - 6 × **earth elemental myrmidon** *(no SRD)* — see *New monsters*
    - 1 × **galeb duhr** (SRD)
  - **River Guard Keep (water-side):**
    - 1 × **sahuagin baron** (SRD)
    - 6 × **sahuagin** (SRD)
    - 2 × **water elemental** (SRD)
- **Haunted Keep** *(Black Earth)* — Air outpost variant.
  - 1 × **champion of Lolth** (drow) *(no SRD)* — see *New monsters*
  - 4 × **drow** (SRD)
  - 4 × **shade** (SRD)

### Chapter 3 — Secret of the Sumber Hills (7–10)

- **Temple of Elemental Evil — Four Quadrants** — One boss per quadrant.
  - **Earth quadrant (Fane):**
    - 1 × **medusa** (SRD) — Marlos Urnrayle
    - 2 × **purple worm** (SRD)
    - 4 × **galeb duhr** (SRD)
  - **Air quadrant (Howling Hate):**
    - 1 × **storm giant quintessence** *(no SRD)* — see *New monsters*
    - 3 × **vapor elemental** *(no SRD)* — see *New monsters*
  - **Water quadrant (Crushing Wave):**
    - 1 × **kraken** (SRD) sub-boss
    - 6 × **merfolk** (SRD)
    - 4 × **water elemental** (SRD)
  - **Fire quadrant (Eternal Flame):**
    - 1 × **efreet** (SRD)
    - 6 × **fire elemental** (SRD)
    - 1 × **magmin** swarm (SRD)

### Chapter 4 — Alarums and Excursions (10–13)

- **Fane of the Eye** — Central cult hub; the four prophets reconvene here.
  - 1 × **each prophet** (replaces after being killed above)
  - 8 × **cultist** (SRD)
  - 4 × **drow elite** (SRD)
  - 2 × **yochlol** (SRD) — Lolth's handmaidens

### Chapter 5 — The Elder Elemental Eye (13–15)

- **Elemental Nodes (4 separate)** — One per element.
  - **Earth node:** 1 × **kraken** (SRD), 1 × **purple worm** (SRD)
  - **Air node:** 1 × **storm giant** (SRD), 4 × **air elemental** (SRD)
  - **Water node:** 1 × **kraken** (SRD), 4 × **water elemental** (SRD)
  - **Fire node:** 1 × **marilith** (SRD), 4 × **fire elemental** (SRD)
- **Final Elder Eye encounter (optional, CR 20+):**
  - 1 × **elder elemental eye** *(no SRD)* — see *New monsters*

## New monsters needed

| ID                            | Display Name                | CR  | Source |
|-------------------------------|-----------------------------|-----|--------|
| `cm-black-earth-cultist`      | Black Earth Cultist         | 2   | PotA   |
| `cm-earth-elemental-myrmidon` | Earth Elemental Myrmidon    | 7   | PotA   |
| `cm-champion-of-lolth`        | Champion of Lolth (drow)    | 10  | PotA   |
| `cm-storm-giant-quintessence` | Storm Giant Quintessence    | 9   | PotA   |
| `cm-vapor-elemental`          | Vapor Elemental             | 5   | PotA   |
| `cm-elder-elemental-eye`      | Elder Elemental Eye         | 20+ | PotA   |

Notes:

- *Black Earth Cultist* — humanoid cultist in stone robes with earth
  themed spells; CR ~2.
- *Earth Elemental Myrmidon* — PotA-specific; cr 7 elite earth elemental
  soldier with Extra Attack and commander aura.
- *Champion of Lolth* — drow elite fighter/cleric of Lolth; CR ~10.
- *Storm Giant Quintessence* — PotA's signature creature. A large
  semi-transparent humanoid made of condensed air; fly speed, storm
  spells, lightning breath.
- *Vapor Elemental* — PotA-unique air elemental variant.
- *Elder Elemental Eye* — final boss. Combination of elemental prince
  abilities; CR ~20. The published stat block uses legendary actions.

## Sources

1. Wikipedia — *Princes of the Apocalypse*
   <https://en.wikipedia.org/wiki/Princes_of_the_Apocalypse>
2. Tribality — *Elemental Evil: Princes of the Apocalypse Review*
   <https://www.tribality.com/2015/04/05/elemental-evil-princes-of-the-apocalypse-review/>
3. Strange Assembly — *Review – Princes of the Apocalypse (D&D 5th)*
   <https://www.strangeassembly.com/2015/review-princes-of-the-apocalypse-dd-5th>
4. Boing Boing — *Princes of the Apocalypse is D&D's killer app*
   <https://boingboing.net/2015/05/15/princes-of-the-apocalypse-is-d.html>
5. Wizards of the Coast — PotA errata + online supplement PDF
   <https://media.wizards.com/2015/downloads/dnd/PrincesApocalypse_AdvSupplementv1.0_PrinterFriendly.pdf>

## Confidence notes

- Wikipedia + Tribality confirm chapter structure; matches
  `seedCampaignTemplates.ts` exactly.
- The adventure's four-elemental-cult structure is well-documented across
  multiple review sources — high confidence in the cult roster and
  prophet names.
- CR ratings for the new monsters are best-effort from review summaries;
  author should verify against the published stat blocks during
  authoring.
- The Strange Assembly review explicitly notes that PotA requires the
  Monster Manual (it does NOT reprint MM monsters) — the embedding
  approach in `seedCampaignTemplates.ts` will reuse existing SRD
  stat blocks for the SRD monsters.
- Several mid-chapter encounters (Hatchet Hound cave, Bowgentle's
  Brook ambush) are side-quest only; intentionally excluded.