# Adventure Import & DM Chapter Guide — Design Spec

Status: **Draft rev 2 — awaiting approval (2026-11-22).** No implementation in this change.
Rev 2 folds in the owner's answers: global template, and a separate DM-only guide route
instead of redacting the campaign routes.
First adventure to ingest: *The Wild Sheep Chase* (DMs Guild PDF, 4th/5th level).

## Context

The owner (DM) buys adventure PDFs in no fixed format and wants them playable in
the tracker. Two gaps block that:

1. **No repeatable way to ingest an adventure.** All 50 campaign templates were
   hand-written TypeScript (`lib/scripts/seedCampaignTemplates.ts`, monsters in
   `lib/data/customMonsters.ts`, ~28k lines). Each campaign touched four files
   (see PRs #615, #697). Nothing helps with the next adventure.
2. **No way for the DM to use chapter text at the table.** `CampaignChapter`
   already stores `description`, `levelRange` and `location`; they are saved and
   copied from templates, but **nothing renders them**. The campaign card shows
   only the current chapter's *title* (`lib/components/CampaignChapterInfo.tsx`);
   `CampaignEditor.tsx` edits titles only; the AI prompt builder uses the title only.

What exists and is reusable:

- **Template → campaign copy**: `POST /api/campaigns/global/[id]/copy` clones a
  global `campaignTemplates` doc into the caller's campaign, spreading each chapter
  (`...ch`, new id) and writing each template encounter as a user-owned `Encounter`
  with embedded full stat blocks.
- **Scene push**: the DM can post `kind: 'scene'` messages (text ≤ 5000 chars,
  optional image ≤ 5 MB) to the group chat (`SceneComposer.tsx`,
  `app/api/campaigns/[id]/messages/route.ts`). `docs/multi-user-campaigns/` still
  says this is "not started"; the code (PRs #436, #441) says otherwise.
- **Monster validation**: `lib/validation/monsterUploadSchema.ts` (`rawMonsterSchema`, zod).
- **Library**: dev DB `session-combat-dev` holds 871 GLOBAL `monsterTemplates`
  (334 SRD incl. Wolf, Brown Bear, Ape, Gibbering Mouther, Pony; 537 `cm-*` custom)
  and 50 GLOBAL `campaignTemplates`. Duplicate names across SRD/custom already
  exist (50 names, e.g. SRD Goblin + `cm-goblin`).

Constraint discovered during recon: **`GET /api/campaigns/[id]` returns the whole
campaign document, chapters included, to every active member** (`assertCampaignAccess`
→ `NextResponse.json(result.campaign)`), and the campaign POST/PATCH sanitizer
(`sanitizeChapters`) whitelists chapter fields, so anything new on a chapter is dropped on
save. DM-only adventure text therefore must not live on the campaign document at all
(see Design 1–2).

## Goals

1. A repeatable pipeline: *any* source → reviewed **adventure bundle** (JSON; commercial
   bundles stay local and gitignored because the repo is public, see Design 4)
   → validated, idempotent **importer** → database.
2. A **Chapter Guide** page so a DM can follow the adventure chapter by chapter, read
   boxed text, see DM notes, and push read-aloud blocks to players.
3. Sheep Chase imported end to end as the proof: chapters with sections, 4 encounters,
   5 new monsters with stat blocks, library monsters reused.
4. DM-only chapter content is served only by a DM-only route. No existing campaign route can
   return it, by construction rather than by filtering.

## Non-Goals

- A UI for importing (explicitly deferred by the owner; the CLI is the interface).
- Auto-parsing PDFs inside the app. Extraction is done by Claude reading the source
  and writing the bundle; the bundle is the standard, not the PDF.
- Importing maps/images. The map PDF is image-only; the DM converts it (JPEG/PNG/WebP/GIF
  ≤ 5 MB) and uses the existing **Push Scene** per campaign. Uploads belong to a campaign,
  so a template cannot carry one.
- Markdown or rich text. Sections are plain text, rendered with preserved line breaks.
- Editing sections in `CampaignEditor` (the DM re-imports or uses the existing campaign
  `notes` field for their own additions).
- Linking encounters to chapters in the data model. Encounter descriptions carry a
  `Scene N —` prefix (precedent: `Sect 4 —` in existing seeds); a link is a natural follow-up.
- Migrating the 50 existing templates to sections.
- Hiding the adventure text from other users of the instance. Templates are global (owner
  decision), so any signed-in user can read an imported template through the template
  endpoints. The guide route keeps the text out of the campaign UI and campaign API; it is
  not an access-control boundary against someone browsing templates.

## Anti-Goals (failure even if it "works")

- Any existing campaign route (GET, list, PATCH echo, SSE stream, `me/*`) returns guide
  content to anyone, DM or not.
- The importer modifies, deletes or overwrites any document it did not create
  (the existing 50 templates, the ~290 code-defined monsters, user data).
- Saving a campaign in the editor drops or overwrites guide content.
- Re-running an import creates duplicates.

## Approaches Considered

| | Approach | Trade-off |
|---|---|---|
| A | Hand-author per adventure in the repo catalog (status quo) | Reviewable, matches 50 existing; hundreds of TS lines per adventure into a 28k-line file; no tooling |
| **B** | **Bundle + importer CLI** | One-time build; each adventure = one data file; dry-run; format-agnostic because extraction is separate from import |
| C | In-app upload UI | Same bundle plus UI/API/admin gating; deferred by owner |

**Chosen: B** (owner, 2026-11-22). Chapter content: owner chose the structured-sections
design **plus a minimal Chapter Guide now** ("the UI deferral is for import; campaigns
need the UI now"), rather than flat `description` text or sections-without-UI.

Where the chapter text lives:

| | Approach | Trade-off |
|---|---|---|
| 1 | Embed in `campaign.chapters[].sections`; redact for non-DMs on every route | Needs an audit of every route and stream path that returns a campaign, a sanitizer change, and the editor's save round-trips the whole payload. Fails open if a future route forgets to redact |
| **2** | **Separate `campaignGuides` collection plus a DM-only child route `GET /api/campaigns/[id]/guide`** | Owner's proposal, with my refinement that the data must also live outside the campaign document (a child route over embedded data still leaves it in the parent response). Nothing existing changes; fails closed. Costs one small repo, one write in the copy route, one cascade-delete line |
| 3 | Resolve at read time from the template via `campaign.templateId` | No copy needed, but the DM can reorder, rename or delete chapters, so mapping back to the template is fragile, and re-importing would change a running campaign |

**Chosen: 2** (owner proposed the child route, 2026-11-22; separate storage is my refinement).

## Design

### 1. Data model — chapter sections (`lib/types.ts`)

```ts
export const CHAPTER_SECTION_KINDS = ['read-aloud', 'dm-notes', 'handout'] as const;
export type ChapterSectionKind = (typeof CHAPTER_SECTION_KINDS)[number];

export interface ChapterSection {
  id: string;
  kind: ChapterSectionKind;
  title?: string;   // ≤ 200 chars
  text: string;     // ≤ 5000 chars (equals the scene-message limit so any block can be pushed)
}

// Template side only (global, written only by the importer):
export type TemplateChapter = CampaignChapter & {
  sections?: ChapterSection[]; // ≤ 60 per chapter, order = display order
};

// Campaign side: CampaignChapter is UNCHANGED (it never carries sections).
// New collection `campaignGuides`, one document per campaign, keyed like the other
// campaign child collections (campaignMessages, savedContent, sessionLogs):
export interface CampaignGuide {
  id: string;
  campaignId: string;
  chapters: { chapterId: string; sections: ChapterSection[] }[];
  createdAt: Date;
  updatedAt: Date;
}
```

- **Unchanged:** `sanitizeChapters`, campaign POST and PATCH, the template create route, the
  campaign GET/list/stream routes, `CampaignEditor`. Nothing existing needs to learn about
  sections, and an editor save cannot touch them.
- **Copy route** (`app/api/campaigns/global/[id]/copy/route.ts`): while mapping template
  chapters to new ids, split sections off (`const { sections, ...chapter } = ch`) so campaign
  chapters never carry them. If any chapter had sections, write one `campaignGuides` document
  keyed by the *new* chapter ids, inside the existing try/rollback. This is a snapshot, the same
  rule as encounters: a copied campaign does not depend on the template afterwards.
- **Cascade delete:** add `campaignGuides` to the child-collection list in
  `campaignRepo.deleteCampaign` (`lib/storage/campaignRepo.ts:108`).
- New `lib/storage/campaignGuideRepo.ts` (load by `campaignId`, save).
- Section validation (kind, lengths, ≤ 60) happens once, in the importer's zod schema, which is
  the only writer. The guide route returns what is stored.
- The chapter `description` stays a **short summary**, see the spoiler rule in Design 4.

### 2. DM-only guide route (replaces redaction)

`GET /api/campaigns/[id]/guide`:

- `assertCampaignAccess`; `role !== 'dm'` → 404 `Campaign not found`, the same pattern as the
  parent route's PATCH/DELETE.
- Returns `{ chapters: [{ chapterId, sections }] }`, only for chapter ids that still exist on the
  campaign (orphans from deleted chapters are skipped). No guide document → `{ chapters: [] }`
  with 200.
- No write endpoints in this change (editing sections is a non-goal).
- Header fields (`description`, `levelRange`, `location`) stay on the campaign chapter and stay
  visible to all members, exactly as for the 50 existing templates. No redaction of existing
  responses is introduced.
- Tests: a player gets 404; a non-member gets 404; the DM gets the sections; after a template
  copy, `GET /api/campaigns/[id]` and the campaign list contain no `sections` anywhere (a
  regression test that locks in the by-construction property); deleting the campaign removes
  its guide document.

### 3. Chapter Guide (new DM tab)

- Route `app/campaigns/[id]/guide/page.tsx`; nav tab **Guide** added in
  `app/campaigns/[id]/layout.tsx`, shown only when `useIsDM(campaignId)`; non-DMs hitting the
  URL get the same not-found/empty treatment other DM pages use.
- Chapter picker: previous/next plus a dropdown; opens on the campaign's current chapter.
  "Make current chapter" PATCHes `currentChapterId` (existing endpoint, DM-only already).
- Data: chapters (titles, current chapter, header fields) come from the campaign fetch the
  layout already makes; sections come from `GET /api/campaigns/[id]/guide`. A non-DM who opens
  the URL gets the guide route's 404 and the page shows the usual not-found state.
- Header: title, `levelRange`, `location`, `description`.
- Sections in order, rendered plain with `whitespace-pre-wrap`:
  - `read-aloud`: visually distinct boxed block with **Push to players**.
  - `handout`: same box and button, labelled as a handout.
  - `dm-notes`: muted panel labelled DM only, no push button.
- **Push to players** posts `{ kind: 'scene', text, visibility: { scope: 'group' } }` to
  `/api/campaigns/[id]/messages`, exactly what Push Scene sends today (extract the existing
  `postSceneMessage` into a shared helper; do not duplicate). Per-block local state:
  sending / sent ✓ / error with retry; sent blocks can be sent again.
- `SceneFeedItem.tsx` gets `whitespace-pre-wrap` on the caption so pushed paragraphs keep
  their breaks (today they collapse into one line).
- Empty state when a chapter has no sections: shows the header and a note that it has no
  guide content (true for all 50 existing templates).

### 4. Adventure bundle (`content/adventures/<slug>/adventure.json`)

**The GitHub repo is public**, so a bundle holding a commercial adventure's prose is never
committed: `content/adventures/*` is gitignored, with only the README and a synthetic
`example-adventure` bundle (used by the tests) committed. The Sheep Chase bundle lives on the
owner's machine; the importer takes any path. (Amended 2026-11-22 while writing the plan.)

```jsonc
{
  "schemaVersion": 1,
  "adventure": {
    "slug": "wild-sheep-chase",
    "name": "The Wild Sheep Chase",
    "moduleName": "WSC",
    "description": "…",
    "levelRange": "4-5",
    "source": { "title": "…", "author": "…", "publisher": "…" }
  },
  "chapters": [
    { "key": "baaaa-d-news", "title": "…", "levelRange": "4-5", "location": "…",
      "description": "…",
      "sections": [ { "kind": "read-aloud", "title": "…", "text": "…" } ] }
  ],
  "monsters": [ { "key": "guz", /* rawMonsterSchema fields */ } ],
  "encounters": [
    { "name": "…", "description": "Scene 1 — …",
      "monsters": [ { "library": "Wolf", "count": 3 }, { "new": "guz", "count": 1 } ] }
  ],
  "notes": [ "reviewer-facing flags: source typos, my calls, ambiguous splits" ]
}
```

- `monsters[]` are **new** stat blocks only; each validated with `rawMonsterSchema`
  (plus the cm-style conventions: `senses["passive Perception"]`, capitalized skill keys).
- Monster refs: `{ "new": key }` or `{ "library": "Name" }` (optionally `"id"` to
  disambiguate). Library resolution: exact case-insensitive name among GLOBAL monsters;
  prefer `source === "SRD"`; **error** if zero or still ambiguous (never guess).
- A bundle has no database ids; the importer derives them.
- **Spoiler rule:** chapter `description` and `location` are visible to every campaign member
  (that is how all templates work today), so they are player-safe teasers. Anything that gives
  away the plot goes in a `dm-notes` section, which only the guide route serves.

### 5. Importer (`lib/scripts/importAdventure.ts`, `npm run import:adventure`)

```
npm run import:adventure -- content/adventures/wild-sheep-chase/adventure.json          # dry run (default)
npm run import:adventure -- content/adventures/wild-sheep-chase/adventure.json --apply  # writes
```

1. Parse + validate the bundle (zod). Report all errors at once with JSON paths.
2. Connect via `lib/db.ts` (`MONGODB_URI`, `MONGODB_DB`). Print target host (credentials
   redacted) and database name before anything else. **Dry run is the default**; only `--apply` writes.
3. Resolve `library` refs against `monsterTemplates` (userId `GLOBAL`).
4. Build: new monsters as GLOBAL `monsterTemplates` with ids `cm-<slug>-<key>`
   (`isGlobal: true`, `source` = adventure name); encounters whose `monsters[]` are
   **embedded full stat blocks** (rollout-doc rule: a copied campaign must be playable
   without the library). Embedded monster = the template with `userId`/`isGlobal`/`source`
   stripped, fresh per-instance `id`, `hp = maxHp`, `templateId` = source doc id (same shape
   as `toEncounterMonster`). Library docs are embedded **verbatim** (they already render today);
   do not re-normalize them. Template = stable id derived from the slug, GLOBAL, `isGlobal: true`,
   with each chapter's `sections` stored on the template chapter (the template create route is
   not used, and no route edits templates, so the importer is the only writer). The importer
   never writes `campaignGuides`; the copy route does, per campaign.
5. Print the plan: per document `create` / `update` / `unchanged`, resolved library refs
   (name → id), field-level diff for updates, warnings.
6. `--apply`: upsert by stable id. Preserve `createdAt` on update. Touch **only** documents
   whose ids it derives. Abort without writing if the template name matches a *different*
   existing id. Idempotent: a second run reports everything `unchanged`.
7. Existing campaigns copied from an earlier import are not changed (copy semantics);
   documented in the script's help text.

Note: `seed` / `seed:monsters` only know the code catalog, so a fresh DB seeded from code does
not contain imported adventures until the importer is run. Acceptable and documented.

### 6. Sheep Chase bundle (first deliverable)

- **Chapters (7, levelRange 4-5):** Baaaa-d News · After the Dust Settles · The House in the
  Woods · Ewe are Very Clever… · Big Choices · Consequences · Not Like This… Boxed text →
  `read-aloud`; tactics/roleplay/rules/the modified wand → `dm-notes`.
- **New monsters (5):** Guz (CR 2), Bed Dragon Wyrmling (CR 4), Ahmed Noke (CR 2),
  Finethir Shinebright in sheep form (Pony stats, INT 18 / WIS 14), Ape (Greatsword) (SRD Ape
  with Fist → Slash 10 (2d6+3) slashing).
- **Reused from library:** Wolf, Brown Bear, Gibbering Mouther.
- **Encounters (4):** *Guz and the Collared Pack* (Guz, 3 Wolf, Brown Bear) · *Noke's
  Compound* (Noke, 3 Ape (Greatsword), Brown Bear) · *The Bed Dragon* (Bed Dragon Wyrmling,
  Noke) · *Noke's Malfunction* (Gibbering Mouther). Shinebright is in the library but in no
  encounter (he is bait, not an opponent).
- **Stat-block rulings (owner-approved where noted):**
  - Noke uses proficiency +3 (7th-level caster): the printed spell DC 14, spell attack +6,
    Arcana +6, WIS save +4 and dagger +5 all agree; the printed INT save +5 does not, so it
    becomes **+6** (owner-approved). All else as printed.
  - Guz CHA printed "8 (+1)" → 8 (−1) (clear typo). Guz Intimidation +2 / AC 14 and the
    Wyrmling's Perception +2 / Stealth +5 do not derive from their ability scores; **kept as printed**,
    flagged in `notes` for the owner.
  - Shinebright passive Perception 12 is derived (10 + WIS 14 mod), not printed.
  - Read-aloud text is verbatim except for obvious typo fixes; each fix is listed in `notes`.

## Constraints

- Node ≥ 24, MongoDB driver 7, zod 4; run scripts with `npx tsx` like the existing seeds.
- Dev database is `session-combat-dev` on Atlas. `lib/db.ts` defaults `MONGODB_DB` to
  `session-combat`, so it **must** be set explicitly. Never commit connection strings.
- On the owner's Windows machine Node's SRV DNS lookup fails (`querySrv ECONNREFUSED`);
  `dns.setServers(['8.8.8.8','1.1.1.1'])` before connecting fixed it in recon. The importer
  should tolerate this (e.g. an optional `DNS_SERVERS` env var) rather than assume it.
- Follow the repo's process (OpenSpec changes, husky/verity/codacy gates, `typecheck`, `lint`,
  unit + integration tests). Existing tests assert `cm-*` monsters carry
  `senses["passive Perception"]`; new monsters must too.

## Decisions (owner, 2026-11-22)

1. **Visibility: global template**, like the other 50. The app is small and personal, so no
   `--owner` private-campaign mode. Consequence, stated plainly: the adventure text (third-party
   DMs Guild content) is readable by any signed-in user through the template endpoints. Revisit if
   the instance ever opens up beyond the owner's group; a private-campaign import mode was designed
   and set aside.
2. **DM-only content is served by a child route** rather than filtered out of the parent route.
   Separate storage is my refinement (see Approaches).

## Left to the Builder

- Exact file/module names, shared-helper extraction, ids derivation (e.g. UUIDv5 vs slug-based),
  CLI argument parsing, dry-run output formatting, exit codes.
- Test design: unit (bundle schema, ref resolution), integration against the Mongo
  testcontainer (importer idempotency; copy route splits sections into `campaignGuides`; guide
  route roles; cascade delete), component tests for the Guide.
- The `campaignGuides` document shape and index (unique on `campaignId`) beyond what Design 1 shows.
- Visual styling of the Guide within the existing dark theme and responsive patterns.
- Whether the Guide's "sent" state is per page session only (design: yes; not persisted).
