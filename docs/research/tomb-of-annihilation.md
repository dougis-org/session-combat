# Tomb of Annihilation — Research

**Slug:** tomb-of-annihilation
**Group:** G1 — Classic Forgotten Realms
**Level range:** 1–11
**Setting:** Forgotten Realms — Chult (tropical peninsula, dinosaur-infested jungle)
**Author (book):** Chris Perkins, Will Doyle, Steve Winter, Adam Lee (2017)
**Source product:** Wizards of the Coast hardcover, 256 pages

---

## Adventure Structure

Wikipedia confirms the book table of contents lists exactly five numbered chapters, matching the existing catalog:

| Order | Title | Level | Location |
|---|---|---|---|
| 1 | Port Nyanzaru | 1–4 | Port Nyanzaru (free port city, Chult) |
| 2 | The Land of Chult | 1–6 | Chult jungles, swamps, mountains |
| 3 | Dwellers of the Forbidden City | 5–7 | Omu (ruined city, home of the Trickster Gods) |
| 4 | Fane of the Night Serpent | 7–9 | Fane of the Night Serpent (yuan-ti temple beneath Omu) |
| 5 | Tomb of the Nine Gods | 9–11 | Tomb of the Nine Gods (Acererak's death-trap dungeon) |

Appendices: A (Backgrounds), B (Random Encounters), C (Discoveries), D (Monsters and NPCs — ~40 new stat blocks), E (Player Handouts), F (Trickster Gods of Omu).

---

## Encounter Plan

The catalog has 3 placeholder encounters: **Zombie T-Rex**, **Yuan-ti Temple Guards**, **Acererak's Arrival**. Keep those; add a couple more from the unique Chult bestiary.

### Encounter 1 — "Zombie T-Rex in the Jungles of Chult" (Ch 2, lvl 5–6)
- **What:** A tyrannosaurus zombie prowls the jungle, regurgitating other zombies that attack the party. Iconic image of the module.
- **Monsters (SRD inline):** 1× **tyrannosaurus zombie** (use SRD tyrannosaurus reskinned with zombie immunities), 4× **zombie** (regurgitated fodder)
- **New cm- monsters needed:** none — tyrannosaurus and zombie are both SRD; the composite can be built by re-using the SRD tyrannosaurus stat block with condition immunities (poisoned) and undead fortitude trait added at author time. If preferred as a single distinct unit: optional **`cm-tyrannosaurus-zombie`** (CR 8, large undead, undead fortitude, stench aura).

### Encounter 2 — "Firenewt Ambush" (Ch 2, lvl 5–6)
- **What:** Firenewt warlocks of Imix patrol the jungle and summon flame-aligned dinosaurs.
- **Monsters (SRD inline):** 2× **firenewt warlock of Imix** (new monster in ToA Appendix D), 3× **firenewt warrior**, 1× **giant strider** (large fire lizard mount)
- **New cm- monsters needed:** firenewt warlock + warrior are flagged as new stat blocks in ToA Appendix D and are NOT core SRD. Need **`cm-firenewt-warlock`** (CR 1, small humanoid) and **`cm-firenewt-warrior`** (CR 1/2, small humanoid). Alternatively, treat them as generic kobold-analogs (kobold stats + fire-bolt spell) at author discretion.

### Encounter 3 — "Yuan-ti Temple Guards of the Fane" (Ch 4, lvl 7–9)
- **What:** Yuan-ti defend the inner sanctum of the Fane of the Night Serpent while their demon-god summoning ritual completes.
- **Monsters (SRD inline):** 2× **yuan-ti broodguard** (new in ToA Appendix D), 4× **yuan-ti malison**, 2× **yuan-ti pureblood**, 1× **yuan-ti nightmare speaker** (Ras Nsi's lieutenant — new in ToA Appendix D)
- **New cm- monsters needed:** **yuan-ti broodguard** and **yuan-ti nightmare speaker** are flagged as new stat blocks in ToA Appendix D — need **`cm-yuan-ti-broodguard`** (CR 4, medium monstrosity) and **`cm-yuan-ti-nightmare-speaker`** (CR 6, medium monstrosity, with innate spellcasting). Yuan-ti malison and pureblood are core SRD.

### Encounter 4 — "Ras Nsi's Final Stand" (Ch 4, lvl 7–9)
- **What:** Ras Nsi, the cursed yuan-ti exarch, is the boss of the Fane — a one-time paladin now turned yuan-ti.
- **Monsters (SRD inline):** 1× **yuan-ti nightmare speaker** (Ras Nsi himself, scaled up — or custom), 2× **yuan-ti broodguard**, 4× **yuan-ti malison**
- **New cm- monsters needed:** optional **`cm-ras-nsi`** (CR 8, cursed paladin yuan-ti) — if we want him as a distinct named boss. The default `cm-yuan-ti-nightmare-speaker` works if no named block is needed.

### Encounter 5 — "Acererak's Arrival at the Cradle of the Death God" (Ch 5 lvl 6, lvl 9–11)
- **What:** The demilich Acererak manifests (or his atropal manifestation does) when the party nears the Soulmonger in the deepest level of the Tomb.
- **Monsters (SRD inline):** 1× **atropal** (SRD), 2× **bodak** (SRD), 4× **skeleton** (in Acererak's honour guard)
- **New cm- monsters needed:** Acererak himself is ALREADY defined as **`cm-acererak`** in `customMonsters.ts` (Vecna campaign). Re-use that stat block for Acererak's Arrival.
- **Atropal** is SRD — embed inline.

### Encounter 6 — "Froghemoth of the Lost City" (Ch 3, lvl 5–7)
- **What:** A froghemoth haunts the marshes around Omu — a classic ToA set-piece.
- **Monsters (SRD inline):** 1× **froghemoth** (SRD), 3× **giant frog** (optional escort)
- **New cm- monsters needed:** none — all SRD.

---

## New Monsters Needed

| cm- ID | Name | CR | Source / role |
|---|---|---|---|
| `cm-tyrannosaurus-zombie` (optional) | Zombie T-Rex | 8 | ToA Ch 2 — iconic undead dinosaur |
| `cm-firenewt-warlock` | Firenewt Warlock of Imix | 1 | ToA Appendix D — Chult cult caster |
| `cm-firenewt-warrior` | Firenewt Warrior | 1/2 | ToA Appendix D — Chult cult infantry |
| `cm-yuan-ti-broodguard` | Yuan-ti Broodguard | 4 | ToA Appendix D — temple elite |
| `cm-yuan-ti-nightmare-speaker` | Yuan-ti Nightmare Speaker | 6 | ToA Appendix D — temple caster (used for Ras Nsi too) |
| `cm-ras-nsi` (optional) | Ras Nsi | 8 | ToA Ch 4 — cursed paladin boss |

Re-use existing: **`cm-acererak`** for Acererak's Arrival.

---

## Cross-Campaign Reuse

- `cm-acererak` (Vecna) — REUSED here for Acererak's Arrival.
- `cm-vecna-cultist` — generic cultist, not appropriate for ToA.
- No other existing custom monsters fit ToA without modification.

---

## Sources

1. **Wikipedia — *Tomb of Annihilation*** — https://en.wikipedia.org/wiki/Tomb_of_Annihilation — confirms 2017 release, 256 pages, 5-chapter structure, Death Curse / Soulmonger plot, level 1–11 range.
2. **D&D Beyond — Tomb of Annihilation source page** — https://www.dndbeyond.com/sources/dnd/toa — confirms all 5 chapter names and lists every monster in Appendix D (Acererak, Tyrannosaurus Zombie, Yuan-ti Broodguard, Yuan-ti Nightmare Speaker, Froghemoth, Firenewt Warlock of Imix, Firenewt Warrior, Ras Nsi, Atropal, Bodak, etc.).
3. **Wargamer — Tomb of Annihilation review** (planned, returned 410 during research) — NOT USED.
4. **D&D Beyond — "Exploring Acererak" article** (referenced in Wikipedia link) — CBR cross-reference for Acererak stat block.

---

## Confidence Notes

- **Very high confidence** on chapter structure (5 chapters confirmed by Wikipedia AND D&D Beyond AND the catalog).
- **High confidence** on monster appendix contents (D&D Beyond lists ~55 named stat blocks under Appendix D; cross-referenced with the unique-ToA monsters we expect).
- **Medium confidence** on the FR of firenewt + yuan-ti non-core variants — these are listed as new stat blocks in ToA Appendix D, so they are unambiguously campaign-specific (not SRD); the exact CR is inferred from their encounter-budget role in the original adventure (CR 1 warlock + CR 1/2 warriors used in pairs; yuan-ti broodguard is a "broodguard" bodyguard stat). Confirm exact CRs against open5e.com / 5etools.com when authoring.
- **Medium confidence** on Ras Nsi — appears in the monster index as just "Ras Nsi" but the stat block is likely a lightly-modified nightmare speaker. Treat as optional custom block.
- Wargamer URL returned 410 (article removed); WotC product page body text is paywalled.
