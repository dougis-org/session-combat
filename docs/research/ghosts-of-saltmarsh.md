# Ghosts of Saltmarsh — Research

**Module code (proposed):** `GoS`
**Type:** Anthology / seafaring campaign (7 adventures + ship-combat rules)
**Source:** WotC 5e, May 2019 (ISBN 978-0-7869-6675-2)
**Levels:** 1–12
**Setting:** Greyhawk default (Keoland, Azure Sea); setting-agnostic.

## Adventure structure (7 chapters)

| # | Chapter | Level | Original module | Hook |
|---|---|---|---|---|
| 1 | The Sinister Secret of Saltmarsh | 1 | U1 (1981) | Haunted house / smugglers. |
| 2 | Danger at Dunwater | 3 | U2 (1982) | Lizardfolk diplomacy. |
| 3 | Salvage Operation | 4 | 3.5e (2005) | Undersea wreck recovery. |
| 4 | Isle of the Abbey | 5 | Dungeon #63 (1992) | Sea-abbey ruins vs. sahuagin. |
| 5 | The Final Enemy | 7 | U3 (1983) | Sahuagin stronghold assault. |
| 6 | Tammeraut's Fate | 9 | Dungeon #106 (2004) | Frost-giant-skulled tower. |
| 7 | The Styes | 11 | Dungeon #123 (2005) | Town-of-the-still horror mystery. |

(The CAMPAIGN_CATALOG in `seedCampaignTemplates.ts` currently lists 8 chapters —
the eighth slot likely belongs to the "Ship-to-Ship Combat" appendix chapter
which doesn't have its own set-piece encounter. Author agent should drop one
or expand Salvage Operation to two if 8 entries are required.)

## Encounter plan

One standout encounter per chapter. Seafaring chapters skew toward aquatic
monsters that are mostly SRD.

- **1 · Sinister Secret of Saltmarsh** — *Haunted House Cellar.* **Smugglers**
  (SRD *bandits*), then **zombie** swarms and the **albatross-pale phantom**
  (new monster — specter variant) in the cellar.
- **2 · Danger at Dunwater** — *Lizardfolk Throne Room.* **Lizardfolk** warband
  led by a **lizardfolk shaman** (SRD); final encounter is diplomatic but
  ends with a **Bulette** ambush if diplomacy fails.
- **3 · Salvage Operation** — *Wreck of the *Wave Spirit*.* **Merrow** +
  **sahuagin** salvage crew (SRD).
- **4 · Isle of the Abbey** — *The Sunken Crypt.* **Sahuagin priestess** +
  **merfolk** prisoners + a **sea hag** coven (SRD).
- **5 · The Final Enemy** — *Sahuagin Stronghold.* **Sahuagin baron** + **shark
  troop** + **storm giant** as surprise ally (SRD).
- **6 · Tammeraut's Fate** — *Frost Tower Summit.* **Frost giant skeleton**
  + **ice mephits** + **owlbear** (SRD).
- **7 · The Styes** — *The Drowners Below.* **Sea spawn**, **grick**, and the
  **Master of the Sty** — a **kraken priest** of Dagon (new monster — multi-
  class aboleth priest).

## New monsters needed

Most seafaring creatures (sahuagin, merrow, lizardfolk, mephits, etc.) are in
the SRD. A few unique antagonists warrant new stat blocks:

| cm- id | Name | CR (est.) | Notes |
|---|---|---|---|
| `cm-gos-phantom-albatross` | Albatross-Pale Phantom | 5 | Sinister Secret finale; specter-template. |
| `cm-gos-sahuagin-baron` | Sahuagin Baron of the Final Enemy | 8 | Major villain with trident of dominance. |
| `cm-gos-master-styes` | Master of the Sty (Kraken-Priest) | 12 | Aboleth-spawn high priest; The Styes finale. |

(All other monsters are SRD substitutions. Optional additional new monsters:
`cm-gos-tammeraut-ghost` for the Tammeraut's Fate finale.)

## Sources

1. Wikipedia — *Ghosts of Saltmarsh* — full chapter list with original
   publication years and level ranges.
   <https://en.wikipedia.org/wiki/Ghosts_of_Saltmarsh>
2. Bleeding Cool — Gavin Sheehan, "Review: D&D Ghosts of Saltmarsh" — confirms
   structure and Greyhawk roots.
   <https://www.bleedingcool.com/2019/05/23/review-dungeons-dragons-ghosts-of-saltmarsh/>
3. Tribality — Brandes Stoddard, "Ghosts of Saltmarsh Review" — detailed
   analysis of ship-to-ship combat rules.
   <https://www.tribality.com/2019/05/30/ghosts-of-saltmarsh-review/>
4. Comicbook.com / WWG — Christian Hoffer, "New 'Dungeons & Dragons' Book
   Contains Lots of Greyhawk References" — confirms Scarlet Brotherhood and
   Sea Princes factions.
   <https://comicbook.com/gaming/2019/05/08/dungeons-and-dragons-ghosts-of-saltmarsh-greyhawk/>

## Confidence notes

- Chapter list and level ranges confirmed via Wikipedia and the official D&D
  Beyond product page.
- The book also contains detailed ship-combat rules — these are *system*
  content rather than encounters and don't translate to the campaign
  template shape.
- Chapter 7 ("The Styes") is widely considered the standout horror chapter;
  it inspired the "Master of the Sty" kraken-priest concept flagged above.
- If the author agent needs 8 chapter slots to match the CAMPAIGN_CATALOG,
  recommend either splitting Salvage Operation (wraith shark + sahuagin ship)
  or adding a "Ship Combat Vignette" chapter.
