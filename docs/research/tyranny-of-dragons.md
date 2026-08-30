# Tyranny of Dragons — Research

**Slug:** tyranny-of-dragons
**Group:** G1 — Classic Forgotten Realms
**Level range:** 1–15
**Setting:** Forgotten Realms — Sword Coast → Sea of Moving Ice → Well of Dragons
**Authors (books):** Kobold Press (Wolfgang Baur, Steve Winter, with WotC staff) — *Hoard of the Dragon Queen* (Aug 2014) + *The Rise of Tiamat* (Oct 2014); combined as *Tyranny of Dragons* (2019, 2023 re-release)
**Source product:** Two-book hardcover compilation

---

## Adventure Structure

The combined *Tyranny of Dragons* book contains **17 chapters** (8 from *Hoard of the Dragon Queen* + 9 from *The Rise of Tiamat*). The existing `seedCampaignTemplates.ts` catalog uses 13 condensed "Episodes" that re-arrange the chapter order into a more linear progression (jumping forward to the Council of Waterdeep in Episode 12, for example). The full mapping:

| Catalog Episode | Book Chapter | Title | Level | Location |
|---|---|---|---|---|
| Episode 1 | Ch 1 (HotDQ) | Greenest in Flames | 1–2 | Greenest |
| Episode 2 | Ch 2 (HotDQ) | Raiders' Camp | 2–3 | Cult raider camp |
| Episode 3 | Ch 3 (HotDQ) | Dragon Hatchery | 3 | Dreaming Cave |
| Episode 4 | Ch 4 (HotDQ) | On the Road | 3–4 | Sword Coast road |
| Episode 5 | Ch 5 (HotDQ) | Construction Ahead | 4 | Carnath Roadhouse |
| Episode 6 | Ch 6 (HotDQ) | Castle Naerytar | 4–5 | Castle Naerytar |
| Episode 7 | Ch 7 (HotDQ) | Hunting Lodge | 5 | Hunting Lodge |
| Episode 8 | Ch 8 (HotDQ) | Castle in the Clouds | 5–7 | Cloud Giant Castle (Skyreach) |
| Episode 9 | Ch 16 (RotT) | Mission to Thay | 8–9 | Thay (Red Wizard territory) |
| Episode 10 | Ch 10 (RotT) | The Sea of Moving Ice | 9–10 | Sea of Moving Ice, Oyaviggaton |
| Episode 11 | Ch 15 (RotT) | Xonthal's Tower | 10–11 | Xonthal's Tower |
| Episode 12 | Ch 9 + Ch 14 (RotT) | The Factions Unite | 11–13 | Waterdeep + Council of Dragons |
| Episode 13 | Ch 17 (RotT) | The Well of Dragons | 13–15 | Well of Dragons (Tiamat's portal) |

Skipped from the original books: Ch 11 (Death to the Wyrmpeakers — covers Varram and Neronvain side-treks) and Ch 13 (The Cult Strikes Back — three parallel attack vignettes). The catalog merges the Council of Waterdeep (Ch 9) and Metallic Dragons Arise (Ch 14) into "The Factions Unite" (Episode 12).

---

## Encounter Plan

The catalog has **0 encounters** — the entire encounter list needs to be authored. Recommend ~6–8 set-piece encounters spread across the 13 episodes, one or two per major arc.

### Encounter 1 — "Attack on Greenest" (Ep 1, Ch 1, lvl 1–2)
- **What:** Cyanwrath the half-blue-dragon veteran leads kobold sappers and a blue dragon wyrmling in burning Greenest.
- **Monsters (SRD inline):** 1× **blue dragon wyrmling** (SRD), 4× **kobold**, 2× **kobold inventor** (new — HotDQ monster), 2× **guard drake** (new — HotDQ Appendix D)
- **New cm- monsters needed:** **`cm-langdedrosa-cyanwrath`** (CR 8 half-blue-dragon veteran boss — a signature ToD villain), **`cm-kobold-inventor`** (CR 1/4 small humanoid), **`cm-guard-drake`** (CR 2 medium dragon).

### Encounter 2 — "Raiders' Camp Assault" (Ep 2, Ch 2, lvl 2–3)
- **What:** Infiltrate the cult's roadside raider camp and confront its leader, Frulam Mondath.
- **Monsters (SRD inline):** 5× **cultist**, 2× **cult fanatic**, 1× **mage** (Frulam Mondath — new stat block)
- **New cm- monsters needed:** **`cm-frulam-mondath`** (CR 6 mage, cult leader). Could reuse SRD mage with faction flavour, but Mondath is named enough to warrant a custom block.

### Encounter 3 — "Dragon Hatchery & Cyanwrath's Rematch" (Ep 3, Ch 3, lvl 3)
- **What:** The cult is harvesting dragon eggs in the Dreaming Cave; Cyanwrath reappears as a recurring villain.
- **Monsters (SRD inline):** 2× **guard drake**, 6× **kobold**, 2× **kobold scale sorcerer** (new — HotDQ), 1× **drake** (young adult black dragon — Rezmir's mount, optional)
- **New cm- monsters needed:** **`cm-kobold-scale-sorcerer`** (CR 1 small humanoid caster). Cyanwrath already covered.

### Encounter 4 — "Castle Naerytar: The Keep" (Ep 6, Ch 6, lvl 4–5)
- **What:** The cult's swamp stronghold harbours the black half-dragon Rezmir and her dragon-vassal leadership.
- **Monsters (SRD inline):** 1× **young black dragon** (Pharblex Spattergoo — SRD), 4× **cult fanatic**, 3× **dragonclaw** (new HotDQ), 1× **dragonfang** (new HotDQ), 1× **dragonsoul** (new HotDQ), 1× **dragonwing** (new HotDQ)
- **New cm- monsters needed:** **`cm-rezmir`** (CR 8 half-black-dragon veteran, Wyrmspeaker lieutenant), **`cm-pharblex-spattergoo`** (CR 7 young black dragon with ooze-themed variant — could reuse SRD young black dragon), **`cm-dragonclaw`** / **`cm-dragonfang`** / **`cm-dragonsoul`** / **`cm-dragonwing`** — four dragon-themed cult warrior variants (CR 1–3 each).

### Encounter 5 — "Castle in the Clouds: Langdedrosa Cyanwrath" (Ep 8, Ch 8, lvl 5–7)
- **What:** Cyanwrath and a cloud giant's castle full of reavers make up the high-level climax of *Hoard of the Dragon Queen*.
- **Monsters (SRD inline):** 1× **cloud giant** (Blagothkus — SRD scaled up), 2× **ogre**, 6× **bugbear**, 1× **grick alpha**, 1× **young blue dragon** (Cyanwrath's mount or patron — SRD)
- **New cm- monsters needed:** **`cm-blagothkus`** (CR 9 cloud giant boss — could reuse SRD), optional `cm-langdedrosa-cyanwrath` final form (CR 10 half-blue-dragon with storm-themed spell-stripping).

### Encounter 6 — "Sea of Moving Ice: Arauthator" (Ep 10, Ch 10, lvl 9–10)
- **What:** The ancient white dragon Arauthator rules the frost giant city of Oyaviggaton.
- **Monsters (SRD inline):** 1× **adult white dragon** (Arauthator — SRD), 2× **young white dragon**, 4× **frost giant**, 3× **ice toad** (new — RotT Appendix D)
- **New cm- monsters needed:** **`cm-ice-toad`** (CR 1 medium monstrosity with cold breath). Arauthator can reuse SRD adult white dragon.

### Encounter 7 — "Council of Dragons: Metallic Allies" (Ep 12, Ch 14, lvl 11–13)
- **What:** The party rallies metallic dragon allies against the cult.
- **Monsters (SRD inline):** 1× **adult silver dragon** (Talis the White — SRD scaled), 1× **adult gold dragon**, 1× **adult bronze dragon**, 4× **half-dragon veteran** (cult dragonwings)
- **New cm- monsters needed:** **`cm-talis-the-white`** (CR 16 adult silver dragon with frost-themed spell-stripping — could reuse SRD adult silver dragon), **`cm-half-dragon-veteran`** (CR 5 humanoid template — cult warrior).

### Encounter 8 — "The Well of Dragons: Tiamat's Return" (Ep 13, Ch 17, lvl 13–15)
- **What:** Final battle at the portal beneath the Well of Dragons against Tiamat-aspect and her Wyrmspeaker Severin.
- **Monsters (SRD inline):** 1× **Tiamat** (5-headed dragon goddess — SRD), 1× **death knight** (Severin — SRD), 2× **adult chromatic dragons** (various — SRD), 6× **cult fanatic**, 3× **ambush drake** (new — RotT Appendix D)
- **New cm- monsters needed:** **`cm-severin`** (CR 17 death-knight boss, Wyrmspeaker leader — could reuse SRD death knight with extra spells), **`cm-rath-modar`** (CR 12 Red Wizard archmage, Tiamat's co-conspirator — new RotT), **`cm-ambush-drake`** (CR 1/2 small dragon).
- **Note:** `cm-tiamat-servant` from the Vecna campaign is a "material aspect" of Tiamat — *could* be reused here for the climactic Tiamat fight, but a fresh **`cm-tiamat`** (full CR 30 goddess) is more thematically correct. Recommend the fresh one.

### Encounter 9 (optional) — "Mission to Thay: Rath Modar" (Ep 9, Ch 16, lvl 8–9)
- **What:** Rendezvous with the Red Wizards of Thay to gain a Tiamat-summoning artifact.
- **Monsters (SRD inline):** 1× **archmage** (Szass Tam — could reuse SRD), 4× **Red Wizard evoker** (use SRD mage), 1× **nycaloth**
- **New cm- monsters needed:** **`cm-rath-modar`** (same as above) — could double-count with Ep 8. Otherwise this encounter is optional.

---

## New Monsters Needed

| cm- ID | Name | CR | Source / role |
|---|---|---|---|
| `cm-langdedrosa-cyanwrath` | Langdedrosa Cyanwrath | 8–10 | HotDQ Ch 1, 3, 8 — recurring half-dragon villain |
| `cm-frulam-mondath` | Frulam Mondath | 6 | HotDQ Ch 2 — cult leader, raider camp |
| `cm-rezmir` | Rezmir | 8 | HotDQ Ch 4–6 — half-black-dragon Wyrmspeaker |
| `cm-pharblex-spattergoo` | Pharblex Spattergoo | 7 | HotDQ Ch 6 — ooze-themed black dragon |
| `cm-severin` | Severin, the Wyrmspeaker | 17 | RotT Ch 17 — death-knight cult leader |
| `cm-rath-modar` | Rath Modar | 12 | RotT Ch 16 — Red Wizard co-conspirator |
| `cm-talis-the-white` | Talis the White | 16 | RotT Ch 14 — silver dragon ally |
| `cm-tiamat` | Tiamat, Queen of Evil Dragons | 26–30 | RotT Ch 17 — final boss |
| `cm-blagothkus` | Blagothkus | 9 | HotDQ Ch 8 — cloud giant chief |
| `cm-dragonclaw` | Dragonclaw | 3 | HotDQ Appendix D — cult warrior |
| `cm-dragonfang` | Dragonfang | 3 | HotDQ Appendix D — cult warrior |
| `cm-dragonsoul` | Dragonsoul | 6 | HotDQ Appendix D — cult caster |
| `cm-dragonwing` | Dragonwing | 3 | HotDQ Appendix D — cult warrior (flying) |
| `cm-ambush-drake` | Ambush Drake | 1/2 | RotT Appendix D — small dragon |
| `cm-guard-drake` | Guard Drake | 2 | HotDQ Appendix D — kobold/ward dragon |
| `cm-kobold-inventor` | Kobold Inventor | 1/4 | HotDQ Appendix D — tech kobold |
| `cm-kobold-scale-sorcerer` | Kobold Scale Sorcerer | 1 | HotDQ Appendix D — caster kobold |
| `cm-ice-toad` | Ice Toad | 1 | RotT Appendix D — cold-themed beast |
| `cm-half-dragon-veteran` | Half-Dragon Veteran | 5 | HotDQ Appendix D — cult elite |

Optional new monster to consider: `cm-neronvain` (CR 14 green dragon Wyrmspeaker — RotT Ch 11, currently omitted from catalog). If included, this is the highest-CR single-monster fight outside Tiamat.

---

## Cross-Campaign Reuse

- **`cm-tiamat-servant`** (Vecna) is a "Material Aspect" of Tiamat (smaller, fit for the Vecna boss fight). REUSE in ToD Episode 8 if we want a more balanced Tiamat-aspect encounter; otherwise author a fresh full-Tiamat `cm-tiamat`.
- **`cm-vecna-cultist`** (Vecna) is a fanatical cultist; the SRD cultist is closer to the Cult of the Dragon generic, so NOT reused.
- **`cm-necromancer-wizard`** (Vecna) — generic caster, NOT particularly appropriate for ToD's dragon-focused bestiary.

---

## Sources

1. **Wikipedia — *Tyranny of Dragons*** — https://en.wikipedia.org/wiki/Tyranny_of_Dragons — confirms Kobold Press authorship, 2014 (two-book) + 2019 (combined) + 2023 re-release, character levels 1–15.
2. **D&D Beyond — Tyranny of Dragons source page** — https://www.dndbeyond.com/sources/dnd/tod — full chapter index for both halves, complete Appendix D monster list (Ambush Drake, Azbara Jos, Blagothkus, Captain Othelstan, Dragonclaw, Dragonfang, Dragonsoul, Dragonwing, Frulam Mondath, Guard Drake, Ice Toad, Langdedrosa Cyanwrath, Naergoth Bladelord, Neronvain, Pharblex Spattergoo, Rath Modar, Rezmir, Severin, Talis the White, Tiamat).
3. **D&D Beyond — Tiamat stat block page** — https://www.dndbeyond.com/sources/tod/monsters — confirms Tiamat appears in Appendix D and is a 5-headed chromatic goddess.
4. **Wargamer — Tyranny of Dragons review** (planned, returned 410 during research) — NOT USED.

---

## Confidence Notes

- **Very high confidence** on the 17-chapter book structure (D&D Beyond lists every chapter; catalog's 13-episode mapping is documented).
- **High confidence** on the campaign-specific monster list — Appendix D is explicitly listed on D&D Beyond with 21 named entries, all unique to ToD (none in core SRD).
- **Medium confidence** on exact chapter ordering — the catalog deliberately re-orders the RotT chapters (jumping Episode 9 to Ch 16 "Mission to Thay" before Episode 10's Ch 10 "Sea of Moving Ice") so the linear order is 2–3, 5, 8, 16, 10, 15, 9+14, 17. This is the campaign's standard "episodic" reorder.
- **Medium confidence** on CR for `cm-tiamat` — the SRD lists Tiamat at CR 26, but some DMs scale the final encounter down for 4-player parties. Recommend a side-by-side with 5etools.com's "Tiamat (3-headed)" stat block as a fallback.
- **High effort** — this is the largest G1 encounter set (13+ new monster stat blocks if all optional bosses are authored). Recommend author prioritises the 6 core encounters (Ep 1, 2, 6, 10, 13) and treats Ep 3, 5, 8, 9, 12 as optional / SRD-only.
- D&D Beyond body text is paywalled, so encounter-by-encounter monster pack sizes are author-discretion choices based on encounter-budget math.
