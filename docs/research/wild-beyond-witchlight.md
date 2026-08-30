# The Wild Beyond the Witchlight — Research

Source: Wikipedia + Polygon + ScreenRant + BoingBoing + GeekDad. Researched 2026-08-30.

## Adventure structure

Wizards of the Coast hardcover (Sept 2021), levels 1–8, Feywild setting
(setting-neutral hook). Written by Chris Perkins with Stacey Allan, Will
Doyle, and Ari Levitch. 256 pages. The first 5e adventure set primarily in
the Feywild; combat is fully optional for almost every encounter.

| Chapter | Title                          | Level | Location                          |
|---------|--------------------------------|-------|-----------------------------------|
| 1       | The Witchlight Carnival        | 1–2   | Witchlight Carnival (Material)    |
| 2       | Hither                         | 2–4   | Hither, Prismeer (Feywild)        |
| 3       | Thither                        | 4–6   | Thither, Prismeer (Feywild)       |
| 4       | Yon                            | 6–7   | Yon, Prismeer (Feywild)           |
| 5       | Palace of Heart's Desire       | 7–8   | Palace of Heart's Desire (Feywild)|

The Feywild domain of Prismeer was fractured into three realms (Hither,
Thither, Yon) and is ruled by a coven of three night hags who overthrew
the archfey Zybilna. Each hag rules one realm; each chapter confronts one
hag.

Source: Wikipedia + `seedCampaignTemplates.ts:411–415`.

## Coven of hags (bosses)

Each hag is the boss of her respective chapter.

| Chapter | Hag                  | Role                                  |
|---------|----------------------|---------------------------------------|
| 2 Hither | Bavlorna Blightstraw | Hag of the East / sorrow / bureaucracy|
| 3 Thither | Skabatha Nightshade  | Hag of the South / children / toys    |
| 4 Yon   | Endelyn Moongrave    | Hag of the West / beasts / moonlight  |
| 5 Palace| Tasha/Iggwilv (NPC)  | Hidden final-act antagonist           |

Use the SRD **night hag** stat block for all three coven members (the book
also gives them unique lair actions and the coven spellcasting mechanic).

## Encounter plan

Like *Curse of Strahd*, the book is RP-heavy. The combat encounters below
are the **mandatory set-pieces** (carnival toll, hag lairs, palace) where
stat blocks are still needed. Many other scenes resolve via skill checks
or roleplay and are intentionally omitted.

### Chapter 1 — The Witchlight Carnival (1–2)

- **Harengon Brigands** *(existing placeholder)* — Agdon Longscarf and his
  bandit crew demand a toll at the entrance to the Carnival. Pure social
  encounter by default; if combat, use:
  - 1 × **harengon brigand** *(no SRD)* — see *New monsters needed*
  - 3 × **harengon** *(no SRD base)* — common rabbit-folk race stat block
  - Optional: 1 × **will-o'-wisp** (SRD) ambush
- **Witchlight Carnival itself** — entirely RP; no combat by design.
- **Mr. Witch / Mr. Light** (carnival owners) — NPC; SRD commoner.

### Chapter 2 — Hither (2–4)

- **Bavlorna Blightstraw's Cottage** — Forest hag lair.
  - 1 × **night hag** (SRD) — Bavlorna herself
  - 4 × **quickling** (SRD) servants
  - 1 × **green hag** (SRD) handmaiden
  - 2 × **will-o'-wisp** (SRD) guarding the bog
- **Lost Castle (Hither)** — Castle at the bottom of the forest lake.
  - 1 × **skulk** (SRD) — elven thief hunting the party
  - 3 × **pixie** (SRD) — friendly, can be recruited
  - 1 × **frost giant skeleton** (use SRD **giant skeleton**) trapped
    in the dungeon

### Chapter 3 — Thither (4–6)

- **Skabatha's Toy Factory** — Animated toys everywhere.
  - 1 × **night hag** (SRD) — Skabatha
  - 6 × **animated toy** *(no SRD)* — see *New monsters needed*
  - 2 × **scarecrow** (SRD) on patrol
  - 1 × **coven of hags** (Skabatha + Bavlorna + Endelyn) joined when
    alarm is raised (multi-creature with coven spellcasting)
- **The Jabberwock** *(existing placeholder, deferred to Chapter 4)*
- **Witchlight thieves** — Displacer beast pack roams Thither.
  - 4 × **displacer beast** (SRD)

### Chapter 4 — Yon (6–7)

- **The Jabberwock** *(existing placeholder)* — A burbling, fearsome
  dragon-like fey creature in the heart of Yon. SRD equivalent:
  - 1 × **jabberwock** *(no SRD)* — see *New monsters needed*
  - 2 × **blink dog** (SRD) attendants
- **Endelyn Moongrave's Moonlit Grove** — Endelyn's lair.
  - 1 × **night hag** (SRD) — Endelyn
  - 3 × **wereboar** (SRD) lycanthropes
  - 1 × **owlbear** (SRD) companion
  - 1 × **unicorn** (SRD) — bound by Endelyn

### Chapter 5 — Palace of Heart's Desire (7–8)

- **Palace of Heart's Desire — Zybilna's Court** — Final-act assault.
  - 1 × **Tasha / Iggwilv** *(no SRD, unique AP boss)* — see *New monsters*
  - 3 × **night hag** (SRD) — full coven re-formed
  - 1 × **pit fiend** (SRD) bound by the hags
  - 2 × **erinyes** (SRD) heralds
- **Zybilna's Room (final boss lair)** — Decisive battle.
  - 1 × **Tasha's Other Self** *(no SRD)* — see *New monsters*
  - 6 × **pixie** (SRD) servants
  - 2 × **sword wraith commander** *(no SRD)* — see *New monsters*

## New monsters needed

| ID                    | Display Name              | CR | Source |
|-----------------------|---------------------------|----|--------|
| `cm-harengon-brigand` | Harengon Brigand (Agdon)  | 2  | WBtW   |
| `cm-harengon`         | Harengon (commoner)       | 1/8| WBtW   |
| `cm-animated-toy`     | Animated Toy              | 1  | WBtW   |
| `cm-jabberwock`       | Jabberwock                 | 13 | WBtW   |
| `cm-tasha-other-self` | Tasha's Other Self         | 15 | WBtW   |
| `cm-sword-wraith-commander` | Sword Wraith Commander | 8  | WBtW   |

Notes:

- *Harengon* and *Fairy* are player races — only their monstrous forms
  need stat blocks if used in encounters.
- *Jabberwock* is the iconic boss of Yon. No direct SRD analogue; the
  closest is **adult black dragon** with a Vorpal-like bite and lightning-
  breath replaced with thunder damage.
- *Tasha's Other Self* is a CR ~15 archfey / lich hybrid; the published
  stat block uses unique spellcasting. Lair actions required.

## Sources

1. Wikipedia — *The Wild Beyond the Witchlight*
   <https://en.wikipedia.org/wiki/The_Wild_Beyond_the_Witchlight>
2. Polygon — *The Wild Beyond the Witchlight campaign is Dungeons & Dragons
   for theater kids*
   <https://www.polygon.com/22683845/dungeons-dragons-the-wild-beyond-the-witchlight-review>
3. GeekDad — *The Wild Beyond the Witchlight - Dungeons & Dragons*
   <https://geekdad.com/2021/09/the-wild-beyond-the-witchlight-simply-has-to-be-my-next-dd-adventure-heres-why/>
4. ScreenRant — *D&D: Wild Beyond the Witchlight's Two New Races Are...*
   <https://screenrant.com/dungeons-dragons-wild-beyond-witchlight-new-races-harengon/>
5. Boing Boing — *Princes of the Apocalypse is D&D's killer app* (background
   on WotC adventure design philosophy)
   <https://boingboing.net/2015/05/15/princes-of-the-apocalypse-is-d.html>

## Confidence notes

- Wikipedia confirms chapter structure (1–8 levels, 5 chapters, hag coven,
  Tasha finale); matches `seedCampaignTemplates.ts` exactly.
- The book has 18 unique monsters (per Wikipedia) — only the most-used
  ones are listed above; the rest are minor NPCs (ringed spore servant,
  bullywug aristocrat, etc.) which can be re-skinned from SRD.
- The carnival and several Thither encounters resolve without combat;
  combat stat blocks for those are optional.
- CR for *Jabberwock* and *Tasha* are best-effort from Polygon review
  coverage; author must verify against the published stat blocks.
- The D&D Beyond body text is paywalled; the hag names and final-act Tasha
  reveal are confirmed by multiple reviews and Polygon interviews with
  Chris Perkins.