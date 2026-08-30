# Storm King's Thunder — Research

**Module code:** SKT · **Levels:** 1–11 · **Setting:** Forgotten Realms
(Savage Frontier / Sword Coast North)
**Author:** Wizards of the Coast (lead: Chris Perkins) · **Released:** 6 September 2016
**Chapter count:** 12 in source, condensed to 10 in codebase

---

## Adventure Structure

| # | Chapter title | Level | Location |
|---|---|---|---|
| 1 | A Great Upheaval | 1–5 | Nightstone, Sword Coast Frontier |
| 2 | Rumblings | 5–6 | Bryn Shander / Goldenfields / Triboar |
| 3 | The Savage Frontier | 6–7 | Sword Coast North (sandbox) |
| 4 | The Herald of Doom (The Chosen Path) | 7–8 | Blistercoil / Eye of the All-Father |
| 5 | Den of the Hill Giants | 8–9 | Grudd Haug |
| 6 | Glacial Rift of the Frost Giants | 9 | Ice Road |
| 7 | Forge of the Fire Giants | 9–10 | Ironslag |
| 8 | Maelstrom | 10–11 | Maelstrom / Trackless Sea |
| 9 | Citadel Felbarr | 10–11 | Citadel Felbarr |
| 10 | Hold of the Storm Giant King | 11 | Maelstrom (final) |

> **Canonical SKT chapter count is 12** ("The Chosen Path", "Canyon of the
> Stone Giants", "Berg of the Frost Giants", "Castle of the Cloud Giants",
> "Hold of the Storm Giants", "Caught in the Tentacles", "Doom of the Desert"
> per Wikipedia + D&D Beyond). The codebase condenses these to 10 — the
> author should treat the codebase 10 as the canonical structure to implement
> and pick representative set-pieces.

---

## Encounter Plan

### Chapter 1 — A Great Upheaval (Nightstone, 1–5)
Set piece: giants destroy Nightstone; party falls into Dripping Caves; Tower of Zephyros.
- **Cloud Giant Pillow Pet Attack** — 1× Cloud Giant (MM p.154) raining boulders
  on Nightstone; party meets Nandar the village hero.
- **Bell Tower Goblins** — 8× Goblin (MM p.166) swinging on the bell tower rope.
- **Dripping Caves** — 1× Ettin (MM p.132), 1× Ogre (MM p.237), 2× Bugbear
  (MM p.33), 1× Piercer (MM p.251) ceiling ambush.
- **Tower of Zephyros (cloud giant flying tower)** — 1× Cloud Giant (MM p.154),
  2× Manticore (MM p.213), 1× Kraken Priest (MM p.211) — replaces placeholder
  "Hill Giant Raid" (see Hill Giant variant below).

### Chapter 2 — Rumblings (Bryn Shander / Goldenfields / Triboar, 5–6)
Three giant attacks on different towns; party picks at least one.
- **Frost Giant Raid on Triboar** — 1× Frost Giant (MM p.167), 2× Frost Giant
  Scout (MM p.167), 1× Yeti (MM p.305).
- **Fire Giant Raid on Goldenfields** — 1× Fire Giant (MM p.154), 2× Fire
  Giant Dreadnought (MM p.154), 1× Magmin (MM p.214).
- **Hill Giant Raid on Bryn Shander** — 1× Hill Giant (MM p.165), 2× Ogre
  (MM p.237), 1× Ettin (MM p.132). (One of these three is the placeholder
  "Hill Giant Raid" — recommend the Bryn Shander variant.)

### Chapter 3 — The Savage Frontier (Sandbox, 6–7)
Open-world; featured encounters at Old Tower, Inner Circles, Harshnag's camp.
- **Harshnag the Frost Giant** — 1× Frost Giant (MM p.167) + 1× polar bear
  (MM p.317) + 2× orogs (MM p.246). (Harshnag is friendly NPC — use frost
  giant statblock.)
- **Old Tower** — 1× Manticore (MM p.213), 2× Giant Spider (MM p.157).
- **Inner Circles (cloud giant meeting)** — 4× Cloud Giant (MM p.154), 1×
  Storm Giant (MM p.288).

### Chapter 4 — The Herald of Doom (Blistercoil / Eye, 7–8)
Set piece: Harshnag guides party to Eye of the All-Father; they meet Iymrith in
disguised form.
- **Sea Serpent Ambush** — 1× Plesiosaurus (MM p.279), 1× Sahuagin Priestess
  (MM p.264), 4× Sahuagin (MM p.264).
- **Eye of the All-Father Oracle** — 1× Iymrith in human form (medium
  humanoid, commoner statblock, CR 1/8). Optional `cm-iymrith-disguised`
  custom entry.
- **Airship of a Cult (Kraken Society)** — 4× Kraken Priest (MM p.211),
  1× Mind Flayer (MM p.222) passenger.

### Chapter 5 — Den of the Hill Giants (Grudd Haug, 8–9)
Set piece: Chief Guh holds the party for ransom.
- **Grudd Haug Throne Room** — 1× Chief Guh (hill giant chief), 2× Hill Giant
  (MM p.165), 2× Ogre (MM p.237), 1× Ettin (MM p.132). `cm-chief-guh` needed.

### Chapter 6 — Glacial Rift of the Frost Giants (Ice Road, 9)
Set piece: Jarl Storvald (frost giant jarl) refuses to share the ordning.
- **Glacial Rift Throne** — 1× Jarl Storvald (frost giant chief), 2× Frost
  Giant (MM p.167), 1× Yeti (MM p.305), 1× Remorhaz (MM p.261).
  `cm-jarl-storvald` needed (or merge with Harshnag-style chief).

### Chapter 7 — Forge of the Fire Giants (Ironslag, 9–10)
Set piece: Duke Zalto forges the Vonindod skeleton of golden dragons.
- **Ironslag Smithy** — 1× Duke Zalto (fire giant duke), 2× Fire Giant
  (MM p.154), 1× Smoke Mephit (MM p.216), 1× Magmin (MM p.214).
  `cm-duke-zalto` needed.
- **Yakfolk Prisoners (Special Delivery)** — 1× Yakfolk (Yikaria) per SKT
  Appendix C, 2× Gnoll Fang of Yeenoghu (MM p.170). `cm-yikaria` needed
  (Yikaria is a yakfolk mage, CR 8).

### Chapter 8 — Maelstrom (Trackless Sea, 10–11)
Set piece: Slarkrethel the kraken manipulates events via the Kraken Society.
- **Morkoth Assault** — 1× Morkoth (VGtM), 4× Sahuagin (MM p.264), 2×
  Sahuagin Priestess (MM p.264).
- **Golden Goose Inn Attack** — 1× Sea Hag (MM p.264), 1× Sahuagin Baron
  (MM p.264), 4× Sahuagin (MM p.264).
- **The Kraken Cometh** — 1× Slarkrethel the Kraken (per SKT; CR 23).
  `cm-slarkrethel` needed (or use standard Kraken with custom description).

### Chapter 9 — Citadel Felbarr (10–11)
Set piece: dwarves defend Citadel Felbarr against a giant assault.
- **Battle of Citadel Felbarr** — 1× Hill Giant (MM p.165), 1× Stone Giant
  (MM p.287), 2× Ogre (MM p.237), 1× Ogre Chain Brute (VGtM),
  4× Uthgardt Shaman (per SKT Appendix C). `cm-uthgardt-shaman` needed (CR 5).

### Chapter 10 — Hold of the Storm Giant King (Maelstrom, 11)
Set piece: party descends the Maelstrom to rescue Hekaton, then confronts
Iymrith in her desert lair.
- **Maelstrom Dive** — 1× Storm Giant (MM p.288), 1× Kraken (MM p.196).
- **King Hekaton's Court** — 1× King Hekaton (storm giant king), 2× Storm
  Giant (MM p.288), 1× Iymrith (blue dragon, ancient — see Iymrith reveal).
  `cm-king-hekaton` needed.
- **Iymrith's Deception Reveal** — 1× Iymrith (ancient blue dragon, MM p.117).
  Replaces placeholder "Iymrith's Deception". `cm-iymrith-ancient-blue` needed.
- **Iymrith's Lair (final)** — 1× Iymrith (ancient blue dragon), 2× Cult
  Fanatic (MM p.345), 1× Maegera the Dawn Titan (per SKT Appendix C).
  `cm-maegera-dawn-titan` needed (CR 22, titan).

---

## New Monsters Needed (full `cm-` stat blocks)

| ID | Display name | Approx. CR | Source / rationale |
|---|---|---|---|
| `cm-chief-guh` | Chief Guh | 7 | Hill giant chief, Grudd Haug (ch 5) |
| `cm-jarl-storvald` | Jarl Storvald | 9 | Frost giant jarl, Glacial Rift (ch 6) |
| `cm-duke-zalto` | Duke Zalto | 11 | Fire giant duke, Ironslag (ch 7) |
| `cm-yikaria` | Yikaria the Yakfolk | 8 | SKT Appendix C, prisoner in Ironslag (ch 7) |
| `cm-uthgardt-shaman` | Uthgardt Shaman | 5 | SKT Appendix C, Citadel Felbarr + Ch3 (ch 3, 9) |
| `cm-slarkrethel` | Slarkrethel the Kraken | 23 | Kraken Society patron, Maelstrom (ch 8) |
| `cm-king-hekaton` | King Hekaton | 16 | Storm giant king, Maelstrom court (ch 10) |
| `cm-iymrith-disguised` | Iymrith in Human Form | 1/8 | Polymorphed dragon at Eye of the All-Father (ch 4) |
| `cm-iymrith-ancient-blue` | Iymrith the Blue Dragon | 22 | Ancient blue dragon final boss (ch 10) |
| `cm-maegera-dawn-titan` | Maegera the Dawn Titan | 22 | SKT Appendix C, captured in Iymrith's lair (ch 10) |

> **SRD monsters used** (embed inline, no new entry needed):
> Cloud Giant, Hill Giant, Fire Giant, Frost Giant, Storm Giant, Stone Giant,
> Ettin, Ogre, Bugbear, Goblin, Manticore, Kraken Priest, Yeti, Remorhaz,
> Magmin, Smoke Mephit, Kraken, Sahuagin, Sea Hag, Morkoth, Plesiosaurus,
> Polar Bear, Giant Spider, Cult Fanatic, Gnoll Fang of Yeenoghu,
> Orc/Orog, Mind Flayer, Iymrith-as-Ancient-Blue-Dragon (statblock SRD but
> named character needs `cm-`).
> **Other SKT Appendix C creatures** (Crag Cat, Hulking Crab, Purple Wormling,
> Tressym) appear in random encounters and may need `cm-` entries if used.

---

## Sources

1. Wikipedia — *Storm King's Thunder*:
   <https://en.wikipedia.org/wiki/Storm_King%27s_Thunder>
2. D&D Beyond — *Storm King's Thunder* (full chapter TOC, Locations in the North
   index, Appendix C Creatures list):
   <https://www.dndbeyond.com/sources/dnd/skt>
3. Wargamer — original review (slug 410'd as of research; cached mirror via
   EN World / Kotaku comparative):
   <https://kotaku.com/the-best-dungeons-dragons-campaigns-keep-things-simpl-1788186403>
4. Paste Magazine — Cameron Kunzelman chapter review:
   <https://www.pastemagazine.com/articles/2016/10/storm-kings-thunder-is-a-performative-dungeon-mast.html>
5. (Encounter stat-block references) 5e.tools bestiary mirror:
   <https://5e.tools/bestiary.html>

---

## Confidence Notes

- **12-vs-10 chapter structure**: D&D Beyond canonical SKT has 12 chapters;
  the codebase condenses to 10 (the optional "Canyon of the Stone Giants"
  and "Castle of the Cloud Giants" are absorbed). The encounter plan above
  is keyed to the codebase's 10-chapter structure; the author may wish to
  add a Stone Giant (Deadstone Cleft) and Castle of the Cloud Giants
  (Lyn Armaal) encounter as additional optional picks.
- **Iymrith statblock**: published in SKT Appendix C as a custom named
  ancient blue dragon with a lair. Statblock is similar to SRD ancient blue
  dragon but with extra spells (Hold Monster, Confusion); recommend
  modeling on the SRD ancient blue dragon statblock (MM p.117) and adding
  the module-specific spells.
- **Yikaria the Yakfolk**: SKT Appendix C provides the statblock; treat
  as a CR 8 yakfolk mage. (Yakfolk is not SRD; new monster needed.)
- **Slarkrethel**: the canonical SKT Kraken is not in SRD — use SRD
  Kraken statblock with module lore. Alternative: skip and use generic
  Kraken (MM p.196) embedded inline.
- **Maegera the Dawn Titan**: SKT Appendix C — a unique CR 22 fire titan
  trapped in Iymrith's lair. Statblock is fully published in the module;
  recommend a `cm-` entry modeled on the SRD Fire Giant statblock at
  higher CR with titan traits.
- **Kraken Society** (Ch 4) and **Morkoth** (Ch 8): Morkoth is in VGtM
  (not SRD) but appears here; author may want a `cm-morkoth` entry.
