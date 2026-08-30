# Lost Mine of Phandelver — Research

**Slug:** lost-mine-of-phandelver
**Group:** G1 — Classic Forgotten Realms
**Level range:** 1–5
**Setting:** Forgotten Realms — Sword Coast, town of Phandalin
**Author (book):** Chris Perkins (2014)
**Source product:** Included with the *D&D 5e Starter Set* (2014), also sold standalone on D&D Beyond

---

## Adventure Structure

Wikipedia (under "D&D Starter Set" — Lost Mine of Phandelver redirects there) confirms LMoP is a 64-page introductory adventure for levels 1–5 set in and around the village of Phandalin. D&D Beyond lists the contents as **Part 1–4** (the book calls them "Parts" not "Chapters"):

| Order | Title | Level | Location |
|---|---|---|---|
| 1 | Part 1: Goblin Arrows | 1–2 | Triboar Trail → Cragmaw Hideout |
| 2 | Part 2: Phandalin | 2–3 | Phandalin town + Redbrand Hideout |
| 3 | Part 3: The Spider's Web | 3–4 | Sword Coast frontier (Triboar Trail, Conyberry, Old Owl Well, Thundertree, Wyvern Tor, Cragmaw Castle) |
| 4 | Part 4: Wave Echo Cave | 4–5 | Wave Echo Cave |

The existing `seedCampaignTemplates.ts` catalog uses these exact 4 part titles — perfect 1:1 mapping, no consolidation needed.

The "Spider's Web" chapter is a sandbox with five optional side-locations; D&D Beyond's ToC lists them in this order:
1. Triboar Trail (returning from Phandalin)
2. Conyberry and Agatha's Lair (green hag)
3. Old Owl Well (cult of Talos ruins)
4. Ruins of Thundertree (Venomfang the green dragon)
5. Wyvern Tor (wyverns + orcs)
6. Cragmaw Castle (goblinoid + Bugbear king)

The Wargamer "How to play" guide summarises these locations explicitly.

---

## Encounter Plan

The catalog has 3 placeholder encounters: **Cragmaw Ambush**, **Redbrand Ruffians**, **Venomfang**. Keep those and add a few more for completeness.

### Encounter 1 — "Cragmaw Ambush on the Triboar Trail" (Part 1, lvl 1–2)
- **What:** Four goblins ambush the party on the road, then flee to Cragmaw Hideout.
- **Monsters (SRD inline):** 4× **goblin**, 1× **goblin** (leader with shortbow — same stat block), optional 1× **wolf** (mounted scout)
- **New cm- monsters needed:** none — all SRD.

### Encounter 2 — "Cragmaw Hideout Klarg & Yeemik" (Part 1, lvl 1–2)
- **What:** A bugbear chief (Klarg) rules a cave hideout full of goblins; the goblin Yeemik plots against him.
- **Monsters (SRD inline):** 1× **bugbear chief**, 6× **goblin**, 1× **goblin boss** (Yeemik), optional 1× **wolf**
- **New cm- monsters needed:** none — all SRD.

### Encounter 3 — "Redbrand Ruffians in Phandalin" (Part 2, lvl 2–3)
- **What:** A street encounter with Redbrand ruffians — bandits extorting locals — leading to the Tresendar Manor "Redbrand Hideout".
- **Monsters (SRD inline):** 4× **bandit** (Redbrand ruffians), 1× **bandit captain** (Iarno "Glasstaff" Albrek in disguise)
- **New cm- monsters needed:** none — all SRD.

### Encounter 4 — "Redbrand Hideout: Glasstaff" (Part 2, lvl 2–3)
- **What:** The party infiltrates the Tresendar Manor hideout of the Redbrands to confront the Glasstaff — a CR 2 mage who is actually a doppelganger in disguise (a recurring twist).
- **Monsters (SRD inline):** 3× **bandit**, 1× **bandit captain**, 4× **goblin** (allies via secret passage), 1× **mage** (Glasstaff)
- **New cm- monsters needed:** optional `cm-doppelganger-glasstaff` (CR 3 shape-changer) — but the SRD **doppelganger** works as-is.

### Encounter 5 — "Agatha the Green Hag at Conyberry" (Part 3, lvl 3–4)
- **What:** A reclusive green hag disguises herself as an old apple-farmer; she can give the party a useful magical item in exchange for a quest.
- **Monsters (SRD inline):** 1× **green hag**, 2× **giant rat** (familiar)
- **New cm- monsters needed:** none — all SRD.

### Encounter 6 — "Wyvern Tor" (Part 3, lvl 3–4)
- **What:** A wyvern (sometimes ridden by an orc) attacks the party on the Triboar Trail.
- **Monsters (SRD inline):** 1× **wyvern**, 3× **orc**, 1× **orc war chief** (optional rider)
- **New cm- monsters needed:** none — all SRD.

### Encounter 7 — "Venomfang the Young Green Dragon" (Part 3, lvl 3–4)
- **What:** Venomfang, a young green dragon, has taken over the ruined village of Thundertree and is recruiting cultists.
- **Monsters (SRD inline):** 1× **young green dragon** (Venomfang — SRD), 4× **cult fanatics**, 2× **druid** (Reidoth ally — optional encounter)
- **New cm- monsters needed:** none — all SRD. Optional `cm-venomfang` if we want a distinct named stat block, but the SRD young green dragon works.

### Encounter 8 — "Wave Echo Cave: The Black Spider" (Part 4, lvl 4–5)
- **What:** Nezznar the Black Spider — a CR 4 drow mage who is also a doppelganger — lurks in the heart of Wave Echo Cave guarding the Forge of Spells.
- **Monsters (SRD inline):** 1× **drow mage** (Nezznar), 2× **doppelganger** (lieutenants), 3× **grick** (cave fauna), 4× **skeleton** (summoned undead), 1× **spectator** (construct bound to the Forge of Spells)
- **New cm- monsters needed:** optional `cm-black-spider` (CR 4 drow mage / doppelganger hybrid) — but SRD **drow mage** + **doppelganger** work fine.

---

## New Monsters Needed

| cm- ID | Name | CR | Source / role |
|---|---|---|---|
| (optional) `cm-venomfang` | Venomfang, the Young Green Dragon | 7–8 | LMoP Part 3 — Thundertree dragon |
| (optional) `cm-black-spider` | Nezznar, the Black Spider | 4 | LMoP Part 4 — drow doppelganger boss |

Everything else is core SRD and can be embedded as inline stat blocks following the Vecna precedent. LMoP is the lowest-monster-cost G1 campaign.

---

## Cross-Campaign Reuse

- No existing custom monster fits LMoP's low-level Sword-Coast bestiary.
- The Vecna/ToA campaign monsters (Acererak, etc.) are way too high-CR for LMoP.
- Clean slate: SRD-only with optional 1–2 named bosses.

---

## Sources

1. **Wikipedia — *Dungeons & Dragons Starter Set*** — https://en.wikipedia.org/wiki/Dungeons_%26_Dragons_Starter_Set — confirms 2014 release, Lost Mine of Phandelver as the included 64-page adventure, level 1–5, Phandalin setting, Sword Coast.
2. **D&D Beyond — Lost Mine of Phandelver source page** — https://www.dndbeyond.com/sources/dnd/lmop — confirms 4-Part structure (Goblin Arrows, Phandalin, Spider's Web, Wave Echo Cave), lists every sandbox location under Part 3, documents the Appendix B monster compendium.
3. **Wargamer — *How to play DnD Lost Mine of Phandelver*** — https://www.wargamer.com/dnd/lost-mine-of-phandelver/ — provides chapter summaries confirming Cragmaw Ambush (Part 1), Redbrand Hideout (Part 2), Venomfang at Thundertree (Part 3), and Wave Echo Cave (Part 4) as the four pivotal encounters.
4. **Open5e (referenced for SRD stat-block verification)** — https://open5e.com/ — used to confirm bugbear chief, doppelganger, young green dragon, green hag, wyvern all in core SRD.

---

## Confidence Notes

- **Very high confidence** on chapter structure (Wikipedia + D&D Beyond + Wargamer all agree on 4 parts; catalog already matches).
- **High confidence** on encounter flow — Wargamer's "How to play" guide explicitly names the four pivotal encounters and the five Part-3 sandbox locations.
- **High confidence** on SRD coverage — the WotC starter set deliberately sticks to SRD monsters so a DMG isn't required; every monster in LMoP is core 5e SRD.
- **Low effort** — this is the easiest of the G1 campaigns; only the 3 catalog placeholder encounters strictly need authoring, and even the optional bosses (Venomfang, Black Spider) work as SRD inline blocks.
- **No paywalled concerns** — the LMoP text is freely available on D&D Beyond for owners of the Starter Set.
