# Red Hand of Doom — Research

Source: Wikipedia + TheGamer + EN World + Wizards.com (Wayback). Researched 2026-08-30.

## Adventure structure

Wizards of the Coast module (Feb 2006), 128 pages, **D&D 3.5** (designed for
characters of 6–12, the authors state 5–11 is ideal). Generic D&D —
designed to drop into Greyhawk, Forgotten Realms, or Eberron. Story: a
massive hobgoblin horde devoted to **Tiamat**, led by half-dragon warlord
**Azarr Kul**, marches on the **Elsir Vale**. Heroes must rally the
inhabitants, gather intelligence, and stop the Red Hand.

| Chapter | Title                | Level | Location                         |
|---------|----------------------|-------|----------------------------------|
| 1       | The Witchwood        | 5–6   | Elsir Vale, Witchwood forest     |
| 2       | The Horde Grows      | 6–7   | Elsir Vale (skirmishes)          |
| 3       | Forging an Army      | 7–8   | Elsir Vale (recruitment)         |
| 4       | The Battle of Brindol| 8–9   | Brindol (defense)                |
| 5       | Fane of Tiamat       | 9–10  | Fane of Tiamat (final dungeon)   |

Source: Wikipedia + `seedCampaignTemplates.ts:550–554`.

## Encounter plan

This is the **army-vs-heroes** adventure — most encounters involve
overwhelming numbers of hobgoblins, bugbears, and their Tiamat-worshipping
lieutenants. Combat is heavy throughout.

### Chapter 1 — The Witchwood (5–6)

- **Witchwood ambush:**
  - 8 × **hobgoblin** (SRD)
  - 2 × **bugbear** (SRD)
  - 1 × **bugbear chief** (SRD)
  - 1 × **ogre** (SRD) — cohort
- **Skalmad the Red Fang** (vampire lieutenant) — see *New monsters*.
  - 1 × **vampire spawn** (SRD) — Skalmad's retinue
  - 4 × **skeleton** (SRD)

### Chapter 2 — The Horde Grows (6–7)

- **Hobgoblin patrols / Red Hand outriders:**
  - 6 × **hobgoblin** (SRD)
  - 1 × **hobgoblin captain** (SRD)
  - 2 × **worg** (SRD) — mounts
- **Killer Ghosts of the Vale (revenants):**
  - 1 × **revenant** (SRD)
  - 4 × **skeleton** (SRD)
- **Kulk'zor the Wyrmspeaker** *(unique dragon-cohort)* — see *New monsters*.

### Chapter 3 — Forging an Army (7–8)

- **Gathering allies — Vale settlements:**
  - **Brindol patrol:** 8 × **guard** (SRD), 1 × **knight** (SRD)
  - **Dawnbringer army:** 12 × **guard** (SRD), 1 × **veteran** (SRD) captain
- **Vraath Keep (bugbear fortress):**
  - 1 × **bugbear chief** (SRD) — warlord
  - 8 × **bugbear** (SRD)
  - 2 × **ogre** (SRD)
- **Nesim wardstones (Druidic defense):**
  - 1 × **archdruid** (SRD)
  - 4 × **druid** (SRD)

### Chapter 4 — The Battle of Brindol (8–9)

- **The siege of Brindol:**
  - 20 × **hobgoblin** (SRD) — Red Hand infantry
  - 4 × **hobgoblin captain** (SRD)
  - 4 × **ogre** (SRD) — battering rams
  - 2 × **hill giant** (SRD) — boulders
  - **Azarr Kul's vanguard** — see *New monsters*
- **Red Hand heroes / champions:**
  - **Harnoth Bloodwatcher** *(unique hobgoblin warlord)* — see *New monsters*
  - 1 × **young red dragon** (SRD) — Azarr's ally
  - 1 × **erinyes** (SRD) — Tiamat's herald
- **Brindol defense:**
  - 4 × **veteran** (SRD) — Brindol militia
  - 1 × **paladin** (SRD) — Kerrick Erindar (ally)

### Chapter 5 — Fane of Tiamat (9–10)

- **Approach to the Fane:**
  - 6 × **hobgoblin** (SRD) — fanatics
  - 2 × **wyvern** (SRD) — sentries
- **The Fane itself — outer chambers:**
  - **Zanthrus, Wyrm-Speaker** *(unique dragon priest)* — see *New monsters*
  - 4 × **cultist** (SRD)
  - 2 × **gnoll** (SRD)
- **Inner sanctum:**
  - **The Wyrmlords** *(dragons of Tiamat, often juvenile or young adults)* —
    at minimum 1 × **adult red dragon** (SRD) plus Wyrm-Speaker
  - 1 × **pit fiend** (SRD) — Tiamat's emissary
- **Azarr Kul (final boss):**
  - **Azarr Kul** *(half-red-dragon hobgoblin warlord)* — see *New monsters*
  - 1 × **young adult red dragon** *(no SRD — use adult)* (SRD)
  - 4 × **hobgoblin** (SRD) — bodyguard

## New monsters needed

Red Hand of Doom's signature bosses and unique lieutenants require new
stat blocks. Most "fodder" hobgoblins / ogres are SRD.

| ID                          | Display Name              | CR  | Source |
|-----------------------------|---------------------------|-----|--------|
| `cm-azarr-kul`              | Azarr Kul, the Red Hand   | 15  | RHoD |
| `cm-harnoth-bloodwatcher`   | Harnoth Bloodwatcher       | 8   | RHoD |
| `cm-zanthrus-wyrmspeaker`   | Zanthrus, Wyrm-Speaker     | 11  | RHoD |
| `cm-kulkzor-wyrmspeaker`    | Kulk'zor the Wyrmspeaker   | 8   | RHoD |
| `cm-skalmad-red-fang`       | Skalmad the Red Fang       | 7   | RHoD |

Notes:

- *Azarr Kul* — half-red-dragon hobgoblin warlord. CR ~15 with breath
  weapon, legendary actions, and Tiamat-themed spellcasting.
- *Harnoth Bloodwatcher* — hobgoblin warlord champion. CR ~8.
- *Zanthrus, Wyrm-Speaker* — CR ~11 hobgoblin cleric of Tiamat with
  dragon-themed spells.
- *Kulk'zor the Wyrmspeaker* — early-AP hobgoblin dragon-priest, CR ~8.
- *Skalmad the Red Fang* — vampire (or vampire spawn) lieutenant;
  CR ~7.

## Sources

1. Wikipedia — *Red Hand of Doom*
   <https://en.wikipedia.org/wiki/Red_Hand_of_Doom>
2. TheGamer — *D&D: The Best 3.5 Edition Adventures*
   <https://www.thegamer.com/dungeons-and-dragons-best-3-5-edition-adventures/>
3. EN World — *Review of Red Hand of Doom* (John Cooper)
   <https://www.enworld.org/forum/reviews/165325-red-hand-doom.html>
4. Wizards of the Coast — *Product Spotlight: Red Hand of Doom* (Wayback
   Machine)
   <https://web.archive.org/web/20140727135643/http://www.wizards.com/default.asp?x=dnd%2Fps%2F20060210a>
5. Wikipedia — *List of Dungeons & Dragons modules* (Red Hand of Doom
   entry confirms chapter order)
   <https://en.wikipedia.org/wiki/List_of_Dungeons_%26_Dragons_modules>

## Confidence notes

- Wikipedia confirms chapter structure (5 chapters, 6–12 levels); matches
  `seedCampaignTemplates.ts` exactly.
- The campaign is **3.5e**, not 5e. All stat-block authoring needs to
  be done from scratch (the original 3.5 stat blocks are paywalled in the
  PDF). The 5e SRD analogues (hobgoblin, ogre, hill giant, red dragon,
  knight, veteran) are well-documented and easy to embed inline.
- The Wyrm-Speaker / Red Fang names are from EN World reviews and
  Wikipedia; high confidence on the roster.
- D&D Beyond does not host RHoD (it's a 3.5-era product); primary sources
  are EN World reviews, Wikipedia, and the Wayback-Machine-archived
  Wizards.com product spotlight.
- The campaign is setting-agnostic but the campaign map assumes the
  Elsir Vale (often placed in the Forgotten Realms near the
  Heartlands). When authored into 5e stat blocks, the setting text can
  remain generic.
- Red Hand of Doom is famous for its **mass-combat** mechanics (the
  army-vs-army rules). Those don't translate to the SRD Monster system —
  the encounters above are simplified into per-monster encounters that
  can be run in standard 5e combat.
- CR ratings for *Azarr Kul* and the Wyrm-Speakers are best-effort
  estimates from review summaries; author should cross-check against
  community 5e conversions (popular on Reddit / EN World) during
  authoring.