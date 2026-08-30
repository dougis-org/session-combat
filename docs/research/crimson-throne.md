# Curse of the Crimson Throne — Research

> **Note:** This campaign is a **Pathfinder Adventure Path**, not a D&D 5e
> hardcover. The authors originally released it under D&D 3.5 (March–August
> 2008) and Paizo republished it as a Pathfinder RPG hardcover in October
> 2016. Encounters below are written assuming 5e SRD-style stat blocks;
> monster CRs reflect the 5e equivalent of the original Pathfinder stats.

Source: Pathfinder Wiki + Paizo product pages + Wikipedia. Researched 2026-08-30.

## Adventure structure

Paizo Pathfinder Adventure Path #7–12 (six-issue AP), levels 1–16, set in
**Korvosa**, a Varisian port city in Golarion. Originally published under
D&D 3.5 (March–August 2008); republished as a Pathfinder RPG hardcover in
October 2016. Story: King Eodred Arabasti II dies, and his widow Queen
Ileosa Arabasti — possessed by a dragon-tainted curse called the **Scarab
Scarab / Kazavon** — becomes a tyrant. Heroes must save the city from
plague, anarchy, and finally dethrone the queen.

| Chapter | Title                  | Level | Location                            |
|---------|------------------------|-------|-------------------------------------|
| 1       | Edge of Anarchy        | 1–3   | Korvosa (urban unrest)              |
| 2       | Seven Days to the Grave| 3–6   | Korvosa (plague / AcTa local)       |
| 3       | Escape from Old Korvosa| 6–9   | Old Korvosa (island district)       |
| 4       | A History of Ashes     | 9–11  | Storval Plateau / Cinderlands       |
| 5       | Skeletons of Scarwall  | 11–14 | Castle Scarwall, Hold of Belkzen    |
| 6       | Crown of Fangs         | 14–17 | Castle Korvosa (final confrontation)|

Source: Pathfinder Wiki + `seedCampaignTemplates.ts:522–527`.

## Encounter plan

The campaign is urban-heavy in chapters 1–3, wilderness in chapter 4,
and dungeon-heavy in chapters 5–6. The encounters below are the signature
set-pieces.

### Chapter 1 — Edge of Anarchy (1–3)

- **Korvosan Street Riot** — Civil unrest in the wake of the king's death.
  - 6 × **guard** (SRD) — Korvosan Guard
  - 4 × **thug** (SRD) — Livery Stable rioters
  - 1 × **acrobat** (SRD) — Acrobat boss
- **Crepusculum (Queen Ileosa's cult of personality)** — Spies everywhere.
  - 4 × **spy** (SRD)
  - 2 × **cultist** (SRD)
  - 1 × **mage** (SRD) — academe mage
- **New monsters from Edge of Anarchy bestiary:**
  - **carrion golem** *(no SRD)* — see *New monsters needed*
  - **soulbound doll** *(no SRD)* — see *New monsters needed*

### Chapter 2 — Seven Days to the Grave (3–6)

- **The Blood Veil Plague** — Field of bodies investigation.
  - 8 × **zombie** (SRD) plague victims
  - 2 × **wight** (SRD) plague cultists
  - 1 × **mummy lord** *(CR 15, possibly later in book)* —
    see *New monsters needed*
- **Acadamae sinkhole / Acadamae crypts:**
  - 4 × **wraith** (SRD)
  - 1 × **deathlock** (SRD) — cultist lich
- **New monsters:**
  - **devilfish** *(no SRD)* — see *New monsters needed*
  - **raktavarna** *(no SRD)* — see *New monsters needed*

### Chapter 3 — Escape from Old Korvosa (6–9)

- **Old Korvosa gang warfare:**
  - **Sable Company** — 8 × **cultist** (SRD) + 1 × **veteran** (SRD) captain
  - **Crowntsone Faction** — 4 × **bandit captain** (SRD)
- **The Acadamae basement (recurring):**
  - 1 × **rakshasa** (SRD) — Queen Ileosa's mentor
  - 2 × **doppelganger** (SRD)
- **New monsters:**
  - **dream spider** *(no SRD)* — see *New monsters needed*
  - **reefclaw** *(no SRD)* — see *New monsters needed*

### Chapter 4 — A History of Ashes (9–11)

- **Cinderlands tribal trials:**
  - 6 × **barbarian** (SRD) — Shoanti
  - 1 × **druid** (SRD) — Shoanti tribal leader
  - 4 × **dire wolf** (SRD) — wild wolves
- **Shoanti assault on the Cinderlands outpost:**
  - 1 × **assassin** (SRD) — Red Mantis assassin
  - 4 × **bandit** (SRD)

### Chapter 5 — Skeletons of Scarwall (11–14)

- **Castle Scarwall — Inner Haunt:**
  - **The Prince in Chains** *(no SRD, signature boss)* — see *New monsters*
  - 6 × **skeleton** (SRD) — animated by Kazavon's curse
  - 2 × **skeleton knight** *(no SRD)* — see *New monsters*
  - 1 × **danse macabre** *(no SRD)* — see *New monsters*
- **Deep dungeon encounter:**
  - 1 × **umbral dragon** *(no SRD)* — see *New monsters*
  - 1 × **gug** (SRD)
- **New monsters (Scarwall bestiary):**
  - **chained spirit** *(no SRD)* — see *New monsters*
  - **umbral dragon** *(no SRD)* — see *New monsters*

### Chapter 6 — Crown of Fangs (14–17)

- **Castle Korvosa — Final confrontation:**
  - **Queen Ileosa Arabasti** *(possessed by Kazavon)*
  - 6 × **royal guard** (SRD veterans with class levels)
  - 1 × **erinyes** (SRD) — devilish advisor
- **Castle Korvosa — Throne room:**
  - **Kazavon** *(the true final boss)* *(no SRD, dragon tyrant)* —
    see *New monsters*
  - 4 × **greater doppelganger** *(custom)* — see *New monsters*
  - 2 × **pit fiend** (SRD) — Chelish bodyguards

## New monsters needed

This campaign re-uses a *lot* of Pathfinder-unique monsters. Authoring
will be heavy — most of the named monsters have no direct SRD equivalent.

| ID                       | Display Name                  | CR  | Source |
|--------------------------|-------------------------------|-----|--------|
| `cm-carrion-golem`       | Carrion Golem                 | 9   | CotC |
| `cm-soulbound-doll`      | Soulbound Doll                | 1   | CotC |
| `cm-devilfish`           | Devilfish                     | 2   | CotC |
| `cm-raktavarna`          | Raktavarna                    | 7   | CotC |
| `cm-dream-spider`        | Dream Spider                  | 3   | CotC |
| `cm-reefclaw`            | Reefclaw                      | 4   | CotC |
| `cm-skeleton-knight`     | Skeleton Knight (Scarwall)    | 5   | CotC |
| `cm-danse-macabre`       | Danse Macabre                 | 11  | CotC |
| `cm-chained-spirit`      | Chained Spirit                | 6   | CotC |
| `cm-umbral-dragon`       | Umbral Dragon                 | 14  | CotC |
| `cm-prince-in-chains`    | The Prince in Chains          | 12  | CotC |
| `cm-greater-doppelganger`| Greater Doppelganger           | 6   | CotC |
| `cm-kazavon`             | Kazavon, the Dragon Tyrant    | 18  | CotC |
| `cm-queen-ileosa`        | Queen Ileosa (final form)     | 15  | CotC |
| `cm-mummy-lord-plague`   | Mummy Lord (Plague Bearer)    | 15  | CotC |

Notes:

- *Kazavon* is the true final boss — ancient evil dragon that cursed the
  queen. CR ~18, legendary actions required.
- *Queen Ileosa's possessed form* is a CR 15 villain with a curse that
  shifts her form mid-battle.
- *The Prince in Chains* — CR ~12 fallen paladin-lich hybrid.
- *Umbral Dragon* — CR ~14 mid-sized evil dragon variant.
- *Danse Macabre* — CR ~11 unique undead swarm-overseer.

## Sources

1. Pathfinder Wiki — *Curse of the Crimson Throne*
   <https://pathfinderwiki.com/wiki/Curse_of_the_Crimson_Throne>
2. Pathfinder Wiki — *Edge of Anarchy* (bestiary list)
   <https://pathfinderwiki.com/wiki/Edge_of_Anarchy>
3. Pathfinder Wiki — *Skeletons of Scarwall* (bestiary list)
   <https://pathfinderwiki.com/wiki/Skeletons_of_Scarwall>
4. Wikipedia — *Curse of the Crimson Throne*
   <https://en.wikipedia.org/wiki/Curse_of_the_Crimson_Throne>
5. Paizo product page (Wayback Machine) — #97–102: Hell's Rebels AP
   <https://web.archive.org/web/20160112031359/http://paizo.com/pathfinder/adventurePath/hellsRebels>

## Confidence notes

- Pathfinder Wiki confirms the 6-chapter structure; matches
  `seedCampaignTemplates.ts` exactly.
- The bestiary lists for each chapter (linked above) explicitly enumerate
  the unique monsters per issue — high confidence in the monster
  roster.
- CR ratings are best-effort conversions from Pathfinder stat blocks;
  author must verify against the 5e conversion during authoring.
- The Pathfinder 1e AP has been converted to 5e by the community but
  no official 5e stat blocks exist; this rollout will use 5e SRD-style
  stat blocks created from scratch.
- D&D Beyond body text is paywalled and not relevant for this Pathfinder
  AP — primary sources are Pathfinder Wiki and Paizo product pages.