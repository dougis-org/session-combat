# Hell's Rebels — Research

> **Note:** This campaign is a **Pathfinder Adventure Path**, not a D&D 5e
> hardcover. Pathfinder Adventure Path #97–102 (Aug 2015–Jan 2016), levels
> 1–17, set in **Kintargo** (Cheliax / Ravounel) in Golarion. Encounters
> below assume 5e SRD-style stat blocks; CRs are best-effort conversions.

Source: Pathfinder Wiki + Paizo product pages + Know Direction podcast. Researched 2026-08-30.

## Adventure structure

Paizo Pathfinder Adventure Path #97–102, levels 1–17. Set in **Kintargo**,
a freewheeling coastal city in **Cheliax**, after inquisitor **Barzillai
Thrune** seizes control and imposes martial law. Heroes form the **Silver
Ravens** resistance and ultimately liberate the city from Chelish rule.
The 4th chapter (*A Song of Silver*) is the milestone 100th volume of the
Pathfinder AP line.

| Chapter | Title                     | Level  | Location                           |
|---------|---------------------------|--------|------------------------------------|
| 1       | In Hell's Bright Shadow   | 1–3    | Kintargo (rebellion begins)       |
| 2       | Turn of the Torrent       | 3–6    | Kintargo (find allies, HQ)        |
| 3       | Dance of the Damned       | 6–9    | Kintargo + Vyre + aquatic elves   |
| 4       | A Song of Silver          | 9–12   | Kintargo (assault on Temple)      |
| 5       | The Kintargo Contract     | 12–15  | Kintargo (legal battle, monster)  |
| 6       | Breaking the Bones of Hell| 15–17  | Kintargo + Hell / Caina           |

Source: Pathfinder Wiki + `seedCampaignTemplates.ts:536–541`.

## Encounter plan

This is a city-based rebellion AP; encounters blend **urban intrigue** with
**outright combat against Hellknights, devils, and cultists of Asmodeus**.

### Chapter 1 — In Hell's Bright Shadow (1–3)

- **The Proclamation Protest Riot** — Barzillai's first day in power.
  - 6 × **guard** (SRD) — Korvosan Guard (re-skin as Kintargan Guard)
  - 4 × **hellknight** *(custom)* — see *New monsters*
  - 1 × **veteran** (SRD) — protest enforcer
- **Bestiary from In Hell's Bright Shadow:**
  - **impaler shrike** *(no SRD)* — see *New monsters*
  - **gambling devil** *(no SRD)* — see *New monsters*
  - **scrivenite** *(no SRD)* — see *New monsters*

### Chapter 2 — Turn of the Torrent (3–6)

- **Order of the Torrent Hellknights** (allies the PCs recruit):
  - 6 × **hellknight** *(custom)* — see *New monsters*
  - 1 × **pit fiend** (SRD) — Barzillai's direct liaison
- **Secret Milani cult (underground allies):**
  - 4 × **cultist** (SRD)
  - 1 × **mage** (SRD) — priest of Milani

### Chapter 3 — Dance of the Damned (6–9)

- **Sea-side diplomacy — aquatic elves + Vyre:**
  - 1 × **merrow** (SRD) — aquatic elf scout
  - 4 × **merfolk** (SRD) — aquatic elf attendants
  - 1 × **kraken** (SRD) — deep-sea guardian
- **Barzillai's response (urban):**
  - 4 × **assassin** (SRD)
  - 1 × **rakshasa** (SRD) — Barzillai's advisor
  - 6 × **hellknight** *(custom)*

### Chapter 4 — A Song of Silver (9–12)

- **Assault on the Temple of Asmodeus** — Decisive battle.
  - 1 × **pit fiend** (SRD) — high priest
  - 4 × **erinyes** (SRD)
  - 6 × **lemure** (SRD) — diabolical foot soldiers
  - **Barzillai Thrune** *(no SRD, signature boss)* — see *New monsters*

### Chapter 5 — The Kintargo Contract (12–15)

- **Cheliax's negotiation response:**
  - 4 × **veteran** (SRD) — Chelish legate guard
  - 1 × **archmage** (SRD) — Chelish advisor
- **The "monster of its own making" — Kintargo ancient evil:**
  - **nightprowler** *(no SRD)* — see *New monsters*
  - 1 × **shadow dragon** *(no SRD)* — see *New monsters*

### Chapter 6 — Breaking the Bones of Hell (15–17)

- **Infernal hauntings in Kintargo:**
  - 6 × **lemure** (SRD)
  - 2 × **erinyes** (SRD)
- **Barzillai in Hell (final boss):**
  - **Barzillai Thrune** *(possessed archdevil form)* — see *New monsters*
  - 1 × **pit fiend** (SRD) — servant
  - 2 × **shadow demon** (SRD)
  - **shadow golem** *(no SRD)* — see *New monsters*
  - 4 × **forsaken legion** *(no SRD)* — see *New monsters*
- **New monsters from Breaking the Bones of Hell bestiary:**
  - **cruciarus** *(no SRD)* — see *New monsters*
  - **forsaken legion** *(no SRD)* — see *New monsters*
  - **shadow golem** *(no SRD)* — see *New monsters*
  - **nightprowler** *(no SRD)* — see *New monsters*

## New monsters needed

| ID                    | Display Name              | CR  | Source |
|-----------------------|---------------------------|-----|--------|
| `cm-hellknight`       | Hellknight (Order of the Torrent) | 5 | HR |
| `cm-impaler-shrike`   | Impaler Shrike            | 2  | HR |
| `cm-gambling-devil`   | Gambling Devil            | 4  | HR |
| `cm-scrivenite`       | Scrivenite                | 3  | HR |
| `cm-barzillai-thrune` | Barzillai Thrune (mortal)  | 12 | HR |
| `cm-barzillai-archdevil`| Barzillai Thrune (archdevil) | 17 | HR |
| `cm-shadow-dragon`    | Shadow Dragon             | 13 | HR |
| `cm-shadow-golem`     | Shadow Golem              | 10 | HR |
| `cm-nightprowler`     | Nightprowler              | 9  | HR |
| `cm-cruciarus`        | Cruciarus (devil)         | 11 | HR |
| `cm-forsaken-legion`  | Forsaken Legion           | 6  | HR |

Notes:

- *Hellknight* — armored devil-binding warrior of Cheliax; CR ~5 with
  martial weapons, infernal pact tie, Order-specific class abilities.
- *Barzillai Thrune* — the AP's signature villain. Has a mortal form
  (CR ~12) and an archdevil form (CR ~17). Both should be created.
- *Impaler Shrike* — fey bird from chapter 1 bestiary; CR ~2.
- *Gambling Devil* (a.k.a. *Lascivitriarch* or *Belaphos*) — small
  pit-fiend-adjacent devil; CR ~4.
- *Shadow Dragon* — 5e has no shadow dragon in SRD; convert from the
  Pathfinder monster (CR ~13).
- *Shadow Golem* — CR ~10 unique construct.
- *Cruciarus* — unique greater devil introduced in chapter 6; CR ~11.

## Sources

1. Pathfinder Wiki — *Hell's Rebels*
   <https://pathfinderwiki.com/wiki/Hell%27s_Rebels>
2. Pathfinder Wiki — *In Hell's Bright Shadow* (bestiary list)
   <https://pathfinderwiki.com/wiki/In_Hell%27s_Bright_Shadow>
3. Pathfinder Wiki — *Breaking the Bones of Hell* (bestiary list)
   <https://pathfinderwiki.com/wiki/Breaking_the_Bones_of_Hell>
4. Paizo product page (Wayback Machine) — #97–102: Hell's Rebels AP
   <https://web.archive.org/web/20160112031359/http://paizo.com/pathfinder/adventurePath/hellsRebels>
5. Wikipedia — *Curse of the Crimson Throne* (covers Paizo AP line
   context)
   <https://en.wikipedia.org/wiki/Curse_of_the_Crimson_Throne>

## Confidence notes

- Pathfinder Wiki confirms 6-chapter structure; matches
  `seedCampaignTemplates.ts` exactly.
- The bestiary for each issue is explicitly enumerated on Pathfinder Wiki;
  high confidence in the monster roster.
- CR ratings are best-effort conversions from Pathfinder stats; author
  must verify against the 5e conversion during authoring.
- Hellknights are a Paizo-flavoured class — the 5e conversion uses SRD
  *knight* / *veteran* with class levels. CR ~5.
- D&D Beyond body text is paywalled and not relevant; primary sources
  are Pathfinder Wiki and Paizo product pages.
- The Book of the Damned (Pathfinder) and the Pathfinder Wiki *devil*
  pages are good references for devil stat-block shapes.