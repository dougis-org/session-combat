# Curse of Strahd — Research

**Slug:** curse-of-strahd
**Group:** G1 — Classic Forgotten Realms
**Level range:** 1–10
**Setting:** Ravenloft / Barovia (gothic horror demiplane)
**Author (book):** Jeremy Crawford, Laura & Tracy Hickman, Adam Lee, Christopher Perkins, Richard Whitters (2016)
**Source product:** Wizards of the Coast hardcover + 2020 Revamped box set

---

## Adventure Structure

The book is organised into 15 chapters plus Death House (Appendix B) and several appendices. The existing `seedCampaignTemplates.ts` catalog condenses this into 13 logical arcs; the mapping below shows where each catalog entry sits in the source book.

| Order | Catalog entry | Book chapters | Level | Location |
|---|---|---|---|---|
| 1 | Death House | Appendix B | 1–2 | Village of Barovia (house outside) |
| 2 | Into the Mists | Ch 1 (Into the Mists) + Ch 2 (Lands of Barovia) | 1–3 | Barovian roads / random encounter table |
| 3 | The Village of Barovia | Ch 3 | 2–3 | Village of Barovia |
| 4 | The Town of Vallaki | Ch 5 | 3–5 | Vallaki |
| 5 | The Village of Krezk | Ch 8 | 4–5 | Krezk |
| 6 | Old Bonegrinder | Ch 6 | 4–6 | Old Bonegrinder windmill |
| 7 | Argynvostholt | Ch 7 | 5–7 | Argynvostholt manor |
| 8 | The Wizard of Wines | Ch 12 | 5–7 | Wizard of Wines vineyard |
| 9 | Yester Hill & Van Richten's Tower | Ch 11 + Ch 14 | 6–8 | Van Richten's Tower, Yester Hill |
| 10 | The Werewolf Den | Ch 15 | 6–8 | Werewolf Den |
| 11 | The Ruins of Berez | Ch 10 | 7–8 | Berez swamp |
| 12 | The Amber Temple | Ch 13 | 8–9 | Mount Ghakis |
| 13 | Castle Ravenloft | Ch 4 | 9–10 | Castle Ravenloft |

Catalog skips Ch 2 ("Lands of Barovia" — random-encounter rules) and Ch 9 ("Tsolenka Pass" — transitional mountain area), folding their content into the surrounding entries.

---

## Encounter Plan

The catalog has 3 placeholder encounter names: **Vampire Spawn Ambush**, **Baba Lysaga's Creeping Hut**, **The Wintersplinter**. Recommend keeping those and adding 2–4 more for the catalog's most iconic set-pieces.

### Encounter 1 — "Death House Lurching Halls" (Ch 1, lvl 1–2)
- **What:** Animated armor and ghouls stalk the haunted mansion; the final boss is a shambling mound nesting in the basement.
- **Monsters (SRD inline):** 4× **animated armor**, 3× **ghoul**, 1× **shambling mound** (final boss)
- **New cm- monsters needed:** none — all SRD.

### Encounter 2 — "Vampire Spawn Ambush at Vallaki" (Ch 5, lvl 3–5)
- **What:** Strahd dispatches vampire spawn to attack the party in the streets of Vallaki, or in the coffin shop beneath the Blue Water Inn.
- **Monsters (SRD inline):** 3× **vampire spawn**, 1× **spectral servant** (optional Strahd messenger)
- **New cm- monsters needed:** none — all SRD.

### Encounter 3 — "Old Bonegrinder Dream Eaters" (Ch 6, lvl 4–6)
- **What:** Three night hag sisters (Morgantha + two daughters) grind children's bones into dream pastries inside the windmill.
- **Monsters (SRD inline):** 3× **night hag**, 2× **sack-of-flesh** (covenant of Strahd goons), optional 4× **giant rat**
- **New cm- monsters needed:** none — all SRD.

### Encounter 4 — "The Wintersplinter" (Ch 14, lvl 6–8)
- **What:** Druids of the Ravenkin summon a massive tree blight atop Yester Hill to destroy Strahd's enemies — but it goes awry.
- **Monsters (SRD inline):** 1× **tree blight** (reuse SRD, scale HP), 4× **awakened shrub**, 2× **druid** (cult fanatics), 1× **wight** (Keepers of the Feather villain)
- **New cm- monsters needed:** **cm-wintersplinter** — a CR 9 blighted treant-like boss (custom stat block; the SRD tree blight is CR 2 and too small to be the actual Wintersplinter).

### Encounter 5 — "Baba Lysaga's Creeping Hut" (Ch 10, lvl 7–8)
- **What:** The swamp witch Baba Lysaga attacks from atop her hut (a statted creature with legs) to defend Ireena's infant form.
- **Monsters (SRD inline):** 1× **scarecrow** (re-skin if desired), 4× **vine blight**, 2× **wight** (Berez undead lieutenants)
- **New cm- monsters needed:** **cm-baba-lysaga** (CR 11 night-hag-statblock witch with shapechange + magic) and **cm-creeping-hut** (CR 8 monstrosity — a giant hut walking on chicken legs; large construct/plant hybrid).

### Encounter 6 — "Amber Temple Dark Vestiges" (Ch 13, lvl 8–9)
- **What:** In the deepest amber sarcophagi of the Amber Temple, dark vestiges offer power to any who touch them. Defenders include flameskulls and an arcanaloth.
- **Monsters (SRD inline):** 1× **arcanaloth**, 3× **flameskull**, 2× **wraith** (exarchs guarding the temple)
- **New cm- monsters needed:** none — all SRD.

### Encounter 7 — "Strahd's Heart of Sorrow" (Ch 4, lvl 9–10)
- **What:** The final confrontation with Count Strahd von Zarovich in his study atop Castle Ravenloft, where his animating heart-of-sorrow crystal is hidden.
- **Monsters (SRD inline):** 1× **vampire** (use SRD stats for Strahd; unique flavor lives in traits/tactics, not stats), 2× **vampire spawn** (Brides of Strahd — Anastrasya, Ludmilla, Volenta), 1× **spectral servant**
- **New cm- monsters needed:** optional **cm-strahd-von-zarovich** if we want him as a distinct named boss with extra lair actions; otherwise reuse SRD vampire.

---

## New Monsters Needed

| cm- ID | Name | CR | Source / role |
|---|---|---|---|
| `cm-wintersplinter` | The Wintersplinter | 9 | CoS Ch 14 — gargantuan awakened-tree boss |
| `cm-baba-lysaga` | Baba Lysaga | 11 | CoS Ch 10 — Berez swamp hag, Ireena's mother |
| `cm-creeping-hut` | Creeping Hut | 8 | CoS Ch 10 — Baba Lysaga's animated hut-walker |

Optional but recommended for narrative weight:
- `cm-strahd-von-zarovich` (CR 15, named vampire with Heart of Sorrow legendary action)

Everything else (vampire, vampire spawn, shambling mound, animated armor, ghoul, night hag, tree blight, wight, druid, arcanaloth, flameskull, wraith) is core SRD and can be embedded as inline stat blocks following the Vecna precedent.

---

## Cross-Campaign Reuse

- `cm-acererak` (from Vecna) is NOT used here — Acererak is the Vecna boss, not the Curse of Strahd boss.
- No existing custom monster fits CoS without modification.

---

## Sources

1. **Wikipedia — *Curse of Strahd*** — https://en.wikipedia.org/wiki/Curse_of_Strahd — confirms 2016 release date, authors, Ravenloft adaptation context, level 1–10 range.
2. **D&D Beyond — Curse of Strahd source page** — https://www.dndbeyond.com/sources/dnd/cos — full chapter index (15 chapters + appendices + Death House), confirms Appendix D monster compendium.
3. **Wargamer — Curse of Strahd review** (planned, returned 410 during research) — would have provided a third-party chapter summary; **NOT USED**.
4. **D&D Beyond — "Running Lairs" article** — https://www.dndbeyond.com/posts/1910-running-lairs-how-to-make-the-most-of-a-monsters — referenced for Strahd lair-action guidance.

---

## Confidence Notes

- **High confidence** on the 15-chapter structure and monster appendix contents (confirmed via D&D Beyond ToC, which lists every chapter heading and every stat-block appendix entry).
- **Medium confidence** on the catalog's condensed 13-chapter mapping (it skips Ch 2 and Ch 9 intentionally; that matches the book's emphasis on "open sandbox with random encounters" so the omission is justified).
- **Medium confidence** on Baba Lysaga's and Wintersplinter's CRs — D&D Beyond's body text is paywalled, so CRs are inferred from their encounter-tier role (Baba Lysaga is the boss of a lvl 7–8 arc; Wintersplinter is the climax of a lvl 6–8 arc). Recommend cross-check against 5etools.com or open5e.com when authoring.
- **Low confidence** on exact monster pack sizes — these are author-discretion choices based on encounter-budget math, not direct book quotes.
- D&D Beyond chapter bodies (cos/old-bonegrinder, cos/amber-temple, etc.) are paywalled — encounter descriptions derive from the ToC and public review summaries.
