# Baldur's Gate: Descent into Avernus — Research

**Slug:** descent-into-avernus
**Group:** G1 — Classic Forgotten Realms
**Level range:** 1–13
**Setting:** Forgotten Realms — Baldur's Gate → Elturel → Avernus (1st layer of the Nine Hells)
**Author (book):** Christopher Perkins (2019)
**Source product:** Wizards of the Coast hardcover, 256 pages

---

## Adventure Structure

Wikipedia and D&D Beyond both confirm 5 chapters:

| Order | Title | Level | Location |
|---|---|---|---|
| 1 | A Tale of Two Cities | 1–4 | Baldur's Gate (Dungeon of the Dead Three, Elfsong Tavern, Low Lantern, Vanthampur Villa) → Candlekeep |
| 2 | Elturel Has Fallen | 4–6 | Elturel (the city pulled into Avernus), High Hall Cathedral, Grand Cemetery |
| 3 | Avernus | 6–10 | Avernus (Fort Knucklebone, Raggadragga, Haruman's Hill, Hellwasp Nest, Crypt of Hellriders, Bone Brambles, Bel's Forge, Wrecked Flying Fortress, etc.) |
| 4 | Sword of Zariel | 10–12 | The Scab, Idyllglen, Zariel's Citadel |
| 5 | Escape from Avernus | 12–13 | Final battle and endgame in Elturel |

Appendices: A (Diabolical Deals), B (Infernal War Machines — with stat blocks for unique vehicles), C (Magic Items), D (Creatures — full stat-block list of new monsters), E (Infernal Rapture Menu), F (Story Concept Art), G (Infernal Script). The book also includes a 50-page Baldur's Gate Gazetteer (urban appendix).

Existing `seedCampaignTemplates.ts` catalog matches the 5-chapter structure perfectly.

---

## Encounter Plan

The catalog has 2 placeholder encounters: **Cult of the Dead Three**, **Hellwasp Swarm**. Keep those and add several more for the major Avernus set-pieces.

### Encounter 1 — "Cult of the Dead Three in the Bathhouse Dungeon" (Ch 1, lvl 2–4)
- **What:** The party follows the trail of murders to a secret bathhouse dungeon beneath the Elfsong Tavern where the Cult of the Dead Three performs rituals.
- **Monsters (SRD inline):** 4× **cultist of the Dead Three** (new — BGDIA Appendix D), 2× **acolyte**, 1× **priest** (cult leader Mortlock — new stat block)
- **New cm- monsters needed:** **`cm-cultists-dead-three`** (CR 1/8 cultist variant with dark-devotion trait — the WotC appendix entry covers this as one stat block with the SRD cultist base). Could reuse SRD **cultist** with flavour traits.

### Encounter 2 — "Vanthampur Villa Dungeon" (Ch 1, lvl 3–5)
- **What:** The party raids the Vanthampur Villa to expose the cult's leadership. Infernal machinery and a shadow demon lurk in the lower dungeon.
- **Monsters (SRD inline):** 2× **merregon** (devil footsoldier — new BGDIA Appendix D), 4× **cultist of the Dead Three**, 1× **shadow demon**, 1× **erinyes** (devil boss — SRD), optional 1× **fiendish flesh golem** (new BGDIA Appendix D)
- **New cm- monsters needed:** **`cm-merregon`** (CR 1 medium fiend — could reuse SRD **devil** stat block), **`cm-fiendish-flesh-golem`** (CR 10 large construct — could reuse SRD **flesh golem** + fiendish template). Optional `cm-shadow-demon` (CR 4, but SRD **shadow demon** IS already in core SRD — embed inline).

### Encounter 3 — "Elturel's Burning Refugees" (Ch 2, lvl 4–6)
- **What:** The party helps evacuate refugees from Elturel, fighting through flameskull cultists and a dying city.
- **Monsters (SRD inline):** 3× **flameskull**, 2× **cultist of the Dead Three**, 4× **zombie** (dead refugees), 1× **narzugon** (death rider pursuing stragglers — new BGDIA Appendix D)
- **New cm- monsters needed:** **`cm-narzugon`** (CR 13 medium undead/horror — skeletal devil on horseback with hellfire lance). SRD doesn't have a narzugon (the MM version is the SRD **death knight** analog, but BGDIA's narzugon has unique hellfire-themed abilities).

### Encounter 4 — "Hellwasp Nest" (Ch 3, lvl 6–8)
- **What:** The party must clear a hellwasp nest (or harvest hellwasp honey for infernal war-machine fuel).
- **Monsters (SRD inline):** 1× **hellwasp** (new — BGDIA Appendix D, but the SRD **giant wasp** is a near-analog; BGDIA's version has hellfire-themed venom), 4× **hellwasp** (swarm form)
- **New cm- monsters needed:** **`cm-hellwasp`** (CR 5 large fiend — could reuse SRD **giant wasp** with fire damage type) + **`cm-hellwasp-swarm`** (CR 3 medium swarm — could reuse SRD **giant wasp** swarm variant).

### Encounter 5 — "Fort Knucklebone Goblin Bazaar" (Ch 3, lvl 6–8)
- **What:** A fiend-spawn-goblin bazaar run by the warlord Raggadragga, besieged by demonic hoards.
- **Monsters (SRD inline):** 3× **goblin**, 2× **hobgoblin**, 1× **goblin boss** (Raggadragga — new stat block), 1× **yugoloth** (mercenary devil guard — could reuse SRD **yugoloth** or **nycaloth**)
- **New cm- monsters needed:** **`cm-raggadragga`** (CR 5 goblin boss on a war-beast — optional; the SRD **goblin boss** works).

### Encounter 6 — "Crypt of the Hellriders" (Ch 3, lvl 7–9)
- **What:** The party must purge the ancient Crypt of the Hellriders — former knights turned undead — to recover a holy sword.
- **Monsters (SRD inline):** 6× **skeleton** (Hellrider cavalry), 2× **wight** (Hellrider captains), 1× **sword wraith commander** (new — BGDIA Appendix D), 4× **zombie** (conscripts)
- **New cm- monsters needed:** **`cm-sword-wraith-commander`** (CR 10 medium undead — could reuse SRD **wraith** with extra damage). Optional.

### Encounter 7 — "Bel's Forge: Tiamat's Monument" (Ch 3, lvl 8–10)
- **What:** The party raids the war factory Bel's Forge to confront the archdevil Bel and his bulezau attendants.
- **Monsters (SRD inline):** 1× **bulezau** (new — BGDIA Appendix D), 4× **merregon**, 2× **narzugon**, 1× **horned devil** (SRD — Bel's lieutenant)
- **New cm- monsters needed:** **`cm-bulezau`** (CR 3 large fiend — could reuse SRD **bulezau** if it ever existed; otherwise the closest analog is the SRD **horned devil** reskinned). New monster needed unless we accept the SRD **horned devil** as a stand-in.

### Encounter 8 — "Sword of Zariel: Idyllglen Liberation" (Ch 4, lvl 10–12)
- **What:** The party crosses the chaos of the Scab to Idyllglen and confronts Zariel's lieutenants guarding the holy sword.
- **Monsters (SRD inline):** 1× **white abishai** (new — BGDIA Appendix D), 4× **merregon**, 2× **narzugon**, 1× **beholder zombie** (optional variant)
- **New cm- monsters needed:** **`cm-white-abishai`** (CR 6 medium fiend, Tiamat's dragon-touched — could reuse SRD **bearded devil** reskinned). Optional.

### Encounter 9 — "Zariel's Flying Fortress" (Ch 5, lvl 12–13)
- **What:** Final assault on Zariel's citadel, with the redemption-of-Zariel or destruction-of-the-Sword choice.
- **Monsters (SRD inline):** 1× **Zariel** (new — BGDIA Appendix D, archdevil), 4× **merregon**, 2× **pit fiend** (SRD — Zariel's honour guard), 1× **Yeenoghu** (demon lord — new BGDIA Appendix D, the Blood War's other side — optional cameo), 1× **hollyphant** (Lulu the hollyphant — new BGDIA Appendix D)
- **New cm- monsters needed:** **`cm-zariel`** (CR 26 large fiend, fallen angel archdevil — new stat block unique to BGDIA), **`cm-hollyphant`** (CR 4 tiny celestial — Lulu, the hollyphant ally — could reuse SRD **pixie** reskinned but BGDIA's hollyphant is meaningfully different), **`cm-yeenoghu`** (CR 24 large fiend, demon lord — cameo enemy).

---

## New Monsters Needed

| cm- ID | Name | CR | Source / role |
|---|---|---|---|
| `cm-zariel` | Zariel, Archdevil of Avernus | 26 | BGDIA Appendix D — final boss |
| `cm-yeenoghu` | Yeenoghu, Demon Lord of Gnolls | 24 | BGDIA Appendix D — cameo Blood War |
| `cm-narzugon` | Narzugon, the Hellrider | 13 | BGDIA Appendix D — skeletal devil |
| `cm-fiendish-flesh-golem` | Fiendish Flesh Golem | 10 | BGDIA Appendix D — flesh golem + fiend template |
| `cm-hellwasp` | Hellwasp | 5 | BGDIA Appendix D — hellfire wasp |
| `cm-baphomet` (optional) | Baphomet, Demon Lord of Beasts | 23 | BGDIA Appendix D — cameo |
| `cm-hollyphant` | Hollyphant | 4 | BGDIA Appendix D — Lulu, celestial ally |
| `cm-tressym` | Tressym | 1/4 | BGDIA Appendix D — winged cat familiar |
| `cm-bulezau` | Bulezau | 3 | BGDIA Appendix D — Bel's goat fiend |
| `cm-redcap` | Redcap | 3 | BGDIA Appendix D — fey murderer |
| `cm-white-abishai` | White Abishai | 6 | BGDIA Appendix D — Tiamat's draconic devil |
| `cm-nupperibo` | Nupperibo | 1/4 | BGDIA Appendix D — lowest devil |
| `cm-cultists-dead-three` | Cultists of the Dead Three | 1/8 | BGDIA Appendix D — bathhouse cult |
| `cm-sword-wraith-commander` | Sword Wraith Commander | 10 | BGDIA Appendix D — undead Hellrider |
| `cm-amnizu` (optional) | Amnizu | 18 | BGDIA Appendix D — high devil magistrate |
| `cm-crokek-toeck` (optional) | Crokek'toeck | 10 | BGDIA Appendix D — gnoll demon lord pet |
| `cm-merregon` (optional) | Merregon | 1 | BGDIA Appendix D — devil grunt |
| `cm-raggadragga` (optional) | Raggadragga | 5 | BGDIA Ch 3 — goblin warlord |

D&D Beyond's Appendix D lists the full unique-monster roster: Amnizu, Baphomet, Bulezau, Crokek'toeck, Cultists of the Dead Three, Fiendish Flesh Golem, Hellwasp, Hollyphant, Merregon, Narzugon, Nupperibo, Redcap, Tressym, White Abishai, Yeenoghu, Zariel — 16 new stat blocks, plus Baphomet and Amnizu (two of which are cameo/high-CR).

---

## Cross-Campaign Reuse

- No existing Vecna custom monster fits BGDIA.
- All of BGDIA's unique monsters are devil/demon themed — clean slate from the Vecna and Tomb of Annihilation bestiaries.
- The SRD has direct analogs for most low-CR BGDIA monsters (merregon ≈ SRD **devil**, narzugon ≈ SRD **death knight** with fire damage, hellwasp ≈ SRD **giant wasp** with fire damage). The author should consider how many new custom blocks are strictly needed vs. reusing SRD with a flavor trait.

---

## Sources

1. **Wikipedia — *Baldur's Gate: Descent into Avernus*** — https://en.wikipedia.org/wiki/Baldur%27s_Gate:_Descent_into_Avernus — confirms 2019 release, 5 chapters (256 pages), 1–13 level range, "Mad Max: Fury Road" framing by Chris Perkins, prologue-to-BG3 context.
2. **D&D Beyond — Baldur's Gate: Descent into Avernus source page** — https://www.dndbeyond.com/sources/dnd/bgdia — full chapter index (5 chapters + Baldur's Gate Gazetteer + 7 appendices), complete Appendix D creature list (16 named entries), explicit mention of Dungeon of the Dead Three, Hellwasp Nest, Crypt of the Hellriders, Bone Brambles, Bel's Forge, Wrecked Flying Fortress as map locations.
3. **Polygon / Paste / Inverse reviews** (cited by Wikipedia) — confirm the 5-chapter structure and the "Mad Max in hell" framing.
4. **Wargamer — Baldur's Gate: Descent into Avernus review** (planned, returned 410 during research) — NOT USED.

---

## Confidence Notes

- **Very high confidence** on chapter structure (Wikipedia + D&D Beyond + the catalog all agree on 5 chapters).
- **Very high confidence** on the 16 new monsters in Appendix D (D&D Beyond enumerates every entry).
- **Medium confidence** on `cm-zariel`'s exact CR — Wikipedia and D&D Beyond don't list the stat-block numbers; the SRD archdevil is CR 19, but BGDIA's Zariel is more powerful due to plot significance. Recommend 26 as a starting point and adjust at authoring time.
- **Medium confidence** on encounter pack sizes — the book has many optional sandbox locations in Avernus (Ch 3 has ~20 named locations); we recommend picking 4–6 set-pieces rather than all of them.
- **Medium effort** — fewer set-pieces than ToD (~7 catalog encounters vs. ToD's ~13) but more new monsters (~16 candidates, ~6 essential).
- D&D Beyond body text is paywalled — encounter-by-encounter monster pack sizes are author-discretion choices.
