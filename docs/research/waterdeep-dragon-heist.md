# Waterdeep: Dragon Heist — Research

**Module code:** WDH · **Levels:** 1–5 · **Setting:** Forgotten Realms (Waterdeep)
**Author:** Wizards of the Coast (lead: Chris Perkins) · **Released:** 18 September 2018
**Chapter count:** 9 (4-variant villain structure)

---

## Adventure Structure

| # | Chapter title | Level | Location |
|---|---|---|---|
| 1 | A Friend in Need | 1–2 | Yawning Portal, Waterdeep |
| 2 | Trollskull Alley | 2–3 | North Ward, Waterdeep |
| 3 | Fireball | 3–4 | Trollskull Alley (after the blast) |
| 4 | Dragon Season | 4–5 | City-wide chase for the gold |
| 5 | Spring: The Zhentarim Villain (Manshoon) | 4–5 | Kolat Towers / Sanctum |
| 6 | Summer: The Xanathar Villain | 4–5 | Gralhund Villa, Xanathar's Lair |
| 7 | Autumn: The Cassalanters Villain | 4–5 | Cassalanter Villa, Temple of Asmodeus |
| 8 | Winter: Jarlaxle's Villain | 4–5 | Sea Maidens Faire / Bregan D'aerthe |
| 9 | Volo's Waterdeep Enchiridion | 5 | City gazetteer (appendix) |

> **Discrepancy with D&D Beyond canonical ordering** (see Confidence Notes): the
> canonical villain mapping is Ch5 = Xanathar ("Spring Madness"), Ch6 =
> Cassalanters ("Hell of a Summer"), Ch7 = Jarlaxle ("Maestro's Fall"), Ch8 =
> Manshoon ("Winter Wizardry"). The existing codebase has the villains swapped
> between Spring/Summer and Autumn/Winter. The author should reconcile.

---

## Encounter Plan

### Chapter 1 — A Friend in Need (Yawning Portal)
Set piece: Volo hires the party to rescue Floon Blagmaar from the Xanathar Guild.
- **Zhentarim Hideout Ambush** — 4× Zhentarim thugs ambush the party outside the
  Yawning Portal. (Replaces placeholder "Zhentarim Thugs".) Monsters:
  `cm-zhentarim-thug` (bandit variant, MM p.263) or embed Bandit (4×).
- **Kenku Ambush at the Xanathar Guild Hideout** — 5× Kenku corner the party in a
  warehouse on the dock. Monsters: Kenku (5×) (MM p.194).

### Chapter 2 — Trollskull Alley (North Ward)
Set piece: party acquires and restores the Trollskull Manor tavern.
- **Trollskull Manor Renovation** — non-combat chapter. Faction missions.
- **Faction Mission: Xanathar Guild** — 1× Nothic (MM p.204) acting as spy in a
  neighboring tavern. Encounter: Nothic ambush at midnight.
- **Faction Mission: Zhentarim** — 2× Spy (MM p.349) + 1× Thug (MM p.350) attack
  on a delivery wagon.

### Chapter 3 — Fireball (Trollskull Alley)
Set piece: a fireball destroys Trollskull Alley during the Sea Maidens Faire.
- **After the Fireball** — 6× commoner bystanders, 1× Mephit (smoke mephit, MM
  p.216) feeding on the chaos.
- **Gralhund Villa Infiltration** — 4× Gralhund Guard (veteran, MM p.350), 2×
  Gralhund Servant (spy, MM p.349), 1× Bugbear Chief (MM p.33), 1× Nothic
  (MM p.204) in the cellar.

### Chapter 4 — Dragon Season (City-wide Chase)
Set piece: chain of 10 encounters (Alley, Mistshore, Street Chase, Mausoleum,
Rooftop Chase, Theater, Old Tower, Courthouse, Cellar Complex, Converted Windmill)
leading to the Vault of Dragons. Use representative encounter picks:
- **Chase Through the Mistshore** — 2× Druid (MM p.78), 1× Water Elemental
  Myrmidon (MM p.131) summoned by a fog cloud ambush.
- **Mausoleum Crypt Ambush** — 6× Skeleton (MM p.272), 2× Wight (MM p.300), 1×
  Will-o'-Wisp (MM p.301) guarding a false trail.
- **Vault of Dragons Entry** — 1× Animated Armor (MM p.19), 4× Rug of Smothering
  (MM p.260), 1× Clay Golem (MM p.156) at the vault door.

### Chapter 5 — Spring: The Zhentarim Villain (Manshoon)
Set piece: Manshoon the Manyfaced (clone of Manshoon) seeks the gold. He is a
clone of the Zhentarim founder.
- **Manshoon's Kolat Towers** — 4× Manshoon's clone bodyguards (Veteran, MM
  p.350), 2× Mage (MM p.347), 1× Mind Flayer (MM p.222) psionic ally.
- **Manshoon the Manyfaced** — 1× Manshoon (mage, with shapechange at-will).
  (CR 12 equivalent: mage + polymorph). Consider new `cm-manshoon-manyfaced`.

### Chapter 6 — Summer: The Xanathar Villain
Set piece: the beholder crime lord Xanathar sends hit squads after the party.
- **Xanathar Hit Squad at Gralhund** — 1× Beholder Zombie (MM p.288), 4×
  Gralhund Guard (veteran, MM p.350), 1× Nothic (MM p.204).
- **Xanathar's Lair (Sewers)** — 1× Beholder (MM p.28) + 4× Grimlock (MM p.175)
  + 1× Death Tyrant (beholder zombie, MM p.288).

### Chapter 7 — Autumn: The Cassalanters Villain
Set piece: noble couple Lady Ammalia and Lord Victoro Cassalanter intend to
sacrifice children to Asmodeus using the gold.
- **Cassalanter Villa Guard** — 4× Cassalanter Guard (Veteran, MM p.350), 2×
  Cult Fanatic (MM p.345) of Asmodeus, 1× Imp (MM p.211).
- **Temple of Asmodeus Crypt** — 1× Pit Fiend (MM p.71) bound as the family's
  patron, 6× Cult Fanatic (MM p.345), 1× Erinyes (MM p.65).

### Chapter 8 — Winter: Jarlaxle's Villain
Set piece: the drow mercenary Jarlaxle Baenre plans to use the gold to fund
Bregan D'aerthe.
- **Sea Maidens Faire Drow** — 6× Drow Elite Warrior (MM p.128), 1× Drow
  Mage (MM p.128), 1× Drider (MM p.120).
- **Jarlaxle Baenre** — `cm-jarlaxle-baenre` (drow mage statblock, CR 13 with
  hat of disguise and Jarlaxle's gear). Custom NPC, not full monster.

### Chapter 9 — Volo's Waterdeep Enchiridion
City gazetteer appendix. Non-combat. (Optional: 1× Stone Golem (MM p.170)
guardian of the Yawning Portal well.)

---

## New Monsters Needed (full `cm-` stat blocks required)

| ID | Display name | Approx. CR | Source / rationale |
|---|---|---|---|
| `cm-zhentarim-thug` | Zhentarim Thug | 1/2 | Variant bandit with signet ring; chapter 1 placeholder |
| `cm-manshoon-manyfaced` | Manshoon the Manyfaced | 12 | Zhentarim clone of Manshoon; chapter 5 boss (mage + Shapechange) |
| `cm-jarlaxle-baenre` | Jarlaxle Baenre | 13 | Named drow NPC with iconic gear (hat of disguise, eye of Lhammar) |

> **SRD monsters used** (embed inline, no new entry needed):
> Bandit, Veteran, Thug, Spy, Bugbear Chief, Nothic, Skeleton, Wight,
> Will-o'-Wisp, Animated Armor, Rug of Smothering, Clay Golem, Mage,
> Commoner, Mephit, Druid, Water Elemental Myrmidon, Stone Golem,
> Grimlock, Beholder, Death Tyrant (beholder zombie), Cult Fanatic,
> Imp, Pit Fiend, Erinyes, Kenku, Drow Elite Warrior, Drow Mage,
> Drider, Mind Flayer.

---

## Sources

1. Wikipedia — *Waterdeep: Dragon Heist*:
   <https://en.wikipedia.org/wiki/Waterdeep:_Dragon_Heist>
2. D&D Beyond — *Waterdeep: Dragon Heist* (chapter TOC and appendix lists):
   <https://www.dndbeyond.com/sources/dnd/wdh>
3. Wargamer — review chapter coverage (note: original slug 410'd; alternate
   coverage at Dicebreaker):
   <https://www.dicebreaker.com/categories/rpg/dnd-best-adventures-page/4>
4. Polygon — Charlie Hall review (villain structure overview):
   <https://www.polygon.com/2018/9/11/17845902/dungeons-and-dragons-waterdeep-dragon-heist-review>
5. (Encounter stat-block references) 5e.tools bestiary mirror:
   <https://5e.tools/bestiary.html>

---

## Confidence Notes

- **Villain–chapter ordering discrepancy**: the existing codebase chapter list
  (lines 299–307 of `seedCampaignTemplates.ts`) swaps the canonical Spring/Summer
  and Autumn/Winter villain pairings. Per D&D Beyond's official source page:
  Ch5 = "Spring Madness" (Xanathar), Ch6 = "Hell of a Summer" (Cassalanters),
  Ch7 = "Maestro's Fall" (Jarlaxle), Ch8 = "Winter Wizardry" (Manshoon). The
  codebase currently has Manshoon at Ch5 and Jarlaxle at Ch8. The encounter
  plan above reflects D&D Beyond canonical order; the author should reconcile
  when wiring encounters and may want to file a follow-up to align the chapter
  titles.
- **D&D Beyond body text is paywalled** — exact encounter CRs and monster
  counts per encounter come from public summaries, not the module. Counts in
  this plan are representative picks for the set-piece, not exhaustive.
- **Manshoon the Manyfaced** — appears in the module as a recurring clone
  antagonist; his statblock is not published in the SRD. Recommend modeling
  on a mage with Shapechange cast at will.
- **Beholder (Xanathar)** — canonical Beholder is SRD but Xanathar himself is a
  unique character with the paranoid-eye-gem lair action; modeling as
  standard beholder + flavor is acceptable per the Vecna precedent.
