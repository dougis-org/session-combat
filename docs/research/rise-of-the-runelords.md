# Rise of the Runelords — Research

**Module code (proposed):** `RotR`
**Type:** Adventure Path (Pathfinder 1e, original; conversion target for 5e)
**Source:** Paizo, August 2007 – January 2008 (Anniversary Edition July 2012)
**Levels:** 1 → ~17
**Setting:** Varisia, Golarion (Pathfinder setting)

## Adventure structure (6 chapters)

| # | Chapter | Level | Author | Location / hook |
|---|---|---|---|---|
| 1 | Burnt Offerings | 1–3 | James Jacobs | Sandpoint, Varisia — goblin raid on Swallowtail Festival. |
| 2 | The Skinsaw Murders | 4–5 | Richard Pett | Magnimar — serial-killer cult of the Skinsaw Men. |
| 3 | The Hook Mountain Massacre | 6–8 | Nicolas Logue | Hook Mountain — ogre tribe slaughters Fort Rannick. |
| 4 | Fortress of the Stone Giants | 9–11 | Wolfgang Baur | Storval Plateau — stone giant army marches on Sandpoint. |
| 5 | Sins of the Saviors | 12–14 | Stephen S. Greer | Sandpoint / Runeforge — sins of Thassilon emerge. |
| 6 | Spires of Xin-Shalast | 15–17 | Greg A. Vaughan | Xin-Shalast — Runelord Karzoug's frozen mountaintop city. |

## Encounter plan

Two to three encounters per chapter covering the major set-pieces. Pathfinder
monsters don't appear in the 5e SRD by default, so this AP requires the
heaviest custom-monster work of all G4 campaigns. Monsters below are listed
with the closest 5e SRD analogue plus the recommended new custom monster
where needed.

### Chapter 1 — Burnt Offerings

- **The Swallowtail Festival Goblin Raid.** Goblins + dire wolves (SRD) led by
  the goblin warlord **Bruthazmus** (new monster — goblin boss + bugbear
  stats). Use 4e stats or 5e conversion.
- **Catacombs of Wrath (Thistletop).** **Bugbears**, **goblin boss**, **ogre**
  under the goblin priest **Lyre** (SRD *green hag* with goblin flavour).
  End-boss is **Nualia Tobyn** (new monster — fallen paladin with corrupted
  blessings, CR 3).

### Chapter 2 — The Skinsaw Murders

- **The Scarecrow Fields.** **Scarecrows** (new monster — animated object with
  sneak-attack trait) and **ghouls** (SRD).
- **Foxglove Manor.** **Skulker** (new monster — stealth assassin), **ghast**,
  and the **Skulker of the Skinsaw** (new monster — high-CR cult lieutenant,
  CR 5).
- **Justice Ironbriar's Hideout.** **Xill** (SRD extra-planar infiltrator) +
  **shadow demon** (SRD) and the **Justice** himself (new monster — Ironbriar,
  CR 8 — *acolyte* with *vampire spawn* template).

### Chapter 3 — The Hook Mountain Massacre

- **Fort Rannick Reconquest.** **Ogres** + **ogre brute** (SRD) led by **Jubray
  Vinshafek**, an ogre sorcerer (new monster — CR 5).
- **Witchwood Hex.** **Annis hag** (SRD), **green hag** (SRD), **dretch** and
  the **Witchfire** hag coven (new monster — coven hag lieutenant, CR 6).
- **Black Magga's Lair.** **Black Magga** (new monster — green-hag-turned-
  succubus, CR 13) with **vargouille** (SRD) spawn.

### Chapter 4 — Fortress of the Stone Giants

- **Sandpoint Under Siege.** **Stone giant** army (SRD) led by **General
  Lugrus** (new monster — stone giant + barbarian levels, CR 11).
- **The Jorgenfist Garrison.** **Frost giant** veterans (SRD), **ogre** auxiliaries.
- **The Crystal Falls.** **Cloud giant** castellan (new monster — cloud giant
  + cleric levels, CR 14) with **invisible stalker** bodyguards.

### Chapter 5 — Sins of the Saviors

- **The Singing Tower (Eurithrates' lair).** **Adult blue dragon** (SRD) — first
  opportunity for a dragon fight in the AP.
- **Runeforge.** **Rune giant** (new monster — CR 14) and **sinspawn** (new
  monster — sin-themed monstrosity, CR 4 each).
- **Karzoug's Reemergence.** **Karzoug the Claimer** (new monster — Runelord
  of Greed, CR 16 wizard with rune magic).

### Chapter 6 — Spires of Xin-Shalast

- **The Pinnacle of Woe.** **Stone giant dreamers** (SRD stone giants + dreams)
  and **nightmares** (SRD).
- **The Citadel of Xin-Shalast.** **Storm giant** (SRD), **adult cloud giant**
  (SRD), **wyvern** flocks.
- **Karzoug's Throne (finale).** **Karzoug the Runelord** (new monster — full
  Runelord form, CR 17-18) with **runelord servitor** lieutenants and **sinspawn**
  bodyguards. Encounter is the iconic finale: Karzoug atop his floating
  citadel.

## New monsters needed (major list)

Pathfinder-specific monsters dominate this AP. The following all require
`cm-` entries if the encounters above are to be authored faithfully:

| cm- id | Name | CR (est.) | Notes |
|---|---|---|---|
| `cm-rotr-bruthazmus` | Bruthazmus the Goblin Warlord | 3 | Ch 1 goblin leader. |
| `cm-rotr-nualia` | Nualia Tobyn | 3 | Fallen aasimar paladin, Ch 1 finale. |
| `cm-rotr-scarecrow` | Scarecrow | 1 | Skinsaw Murders creature. |
| `cm-rotr-skulker` | Skulker | 4 | Rogue-class infiltrator. |
| `cm-rotr-ironbriar` | Justice Ironbriar | 8 | Vampire-skin vigilante leader. |
| `cm-rotr-jubray` | Jubray Vinshafek | 5 | Ogre sorcerer. |
| `cm-rotr-black-magga` | Black Magga, the Mother of Witches | 13 | Hag-succubus hybrid, Ch 3 finale. |
| `cm-rotr-lugrus` | General Lugrus | 11 | Stone giant warlord. |
| `cm-rotr-rune-giant` | Rune Giant | 14 | Runeforge boss. |
| `cm-rotr-sinspawn` | Sinspawn | 4 | Sin-themed minion. |
| `cm-rotr-karzoug-claimer` | Karzoug the Claimer (wizard form) | 16 | Runelord of Greed, Runeforge. |
| `cm-rotr-karzoug-runelord` | Karzoug the Runelord (final form) | 18 | Ch 6 finale. |
| `cm-rotr-runnemede` | Runnemede the Spire Witch | 12 | Xin-Shalast sub-boss. |
| `cm-rotr-mokmurian` | Mokmurian (Stone Giant Warlord) | 12 | Optional Ch 4 sub-boss. |

## Sources

1. Wikipedia — *Rise of the Runelords* — full chapter list, author credits,
   publication dates. <https://en.wikipedia.org/wiki/Rise_of_the_Runelords>
2. PathfinderWiki — *Rise of the Runelords* — official Paizo wiki with
   detailed chapter summaries and monster notes.
   <https://pathfinderwiki.com/wiki/Rise_of_the_Runelords>
3. Paizo.com — *Rise of the Runelords Anniversary Edition* product page.
   <https://paizo.com/products/btpy93os>
4. Black Gate — Scott Taylor, "Art of the Genre: The Top 10 Campaign Adventure
   Module Series of All Time" (ranked RotR #4).
   <https://www.blackgate.com/2015/03/31/art-of-the-genre-the-top-10-campaign-module-series-of-all-time/>

## Confidence notes

- Chapter structure is from the Wikipedia article plus PathfinderWiki
  (authoritative for Pathfinder content).
- The Pathfinder Bestiary 1–6 contain stat blocks for Bruthazmus, Nualia,
  Black Magga, Mokmurian, Karzoug, etc. These can be converted to 5e using
  the Kingmaker 5E Bestiary (Paizo, 2022) as a reference for the
  conversion ratios.
- The 5e Bestiary (Kingmaker Bestiary (5E)) is paywalled on Paizo's store
  but is summarised in PathfinderWiki monster entries which are open-
  licensed under Paizo's Community Use Policy.
- RotR was the first Pathfinder AP and is heavily referenced; encounter
  design here is well-supported by public reviews and wiki summaries.
