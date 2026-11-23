# Adventure Import & DM Chapter Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a campaign DM a Chapter Guide (read-aloud, DM notes, push-to-players) and a repeatable, safe way to import an adventure bundle, proven on *The Wild Sheep Chase*.

**Architecture:** A campaign's chapter text lives in a new `campaignGuides` collection, served only by the DM-only `GET /api/campaigns/[id]/guide`; templates carry `sections` on their chapters and the copy route splits them off into the guide document, so no existing campaign route can leak them. Adventures are authored as a JSON bundle; a dry-run-by-default CLI validates it, resolves library monsters, and idempotently upserts only the documents it derives ids for.

**Tech Stack:** Next.js 16 app router, React 19, TypeScript, MongoDB driver 7, zod 4, Jest (jsdom unit, Testcontainers integration), React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-22-adventure-import-and-chapter-guide-design.md`

**Delivery:** two OpenSpec changes, two PRs. **Part A** (Tasks 1-7, change `campaign-chapter-guide`) is the Guide. **Part B** (Tasks 8-13, change `adventure-importer`) starts from `main` after A merges, because it consumes A's types. **Issues:** Part A is #846, Part B is #847. **Task 13 is owner-run** (it needs the source PDF and database credentials, and produces only gitignored files); the Part B PR covers Tasks 8-12. See the handoff runbook `docs/superpowers/plans/2026-11-22-adventure-import-handoff.md`.

## Global Constraints

- Node >= 24, MongoDB driver 7, zod 4; scripts run with `npx tsx` like the existing seeds.
- Section limits: `title` <= 200 chars, `text` <= 5000 chars (equals the scene-message limit), <= 60 sections per chapter.
- Dev database is `session-combat-dev`. `lib/db.ts` defaults `MONGODB_DB` to `session-combat`, so it must be set explicitly. Never commit or echo connection strings.
- On the owner's Windows machine Node's SRV DNS lookup fails (`querySrv ECONNREFUSED`); the importer honors an optional `DNS_SERVERS` env var (e.g. `8.8.8.8,1.1.1.1`).
- Existing tests assert `cm-*` monsters carry `senses["passive Perception"]` as a string; new monsters must too.
- Repo process (AGENTS.md): GitHub issue, then an OpenSpec change (worktree `.worktrees/<change>`, branch `opsx/<change>`), TDD, PR. Prefer integration tests over mocks; data-driven (`it.each`) where natural; lines 80-120 chars. Before writing route or page code, skim the relevant guide under `node_modules/next/dist/docs/` (AGENTS.md: this Next.js has breaking changes) and mirror sibling files.
- Checks: `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:ci` (integration, needs Docker). The pre-commit hook runs `npm run build` and `npm run test:unit`, so each commit is slow; keep one commit per task.
- **The repo is public.** Commercial adventure bundles are never committed (Task 9 gitignores them); only a synthetic example bundle is. Never put adventure prose in issues, PRs or commit messages.
- The importer writes only with `--apply`, only documents whose ids it derives, and never deletes.

## Review Focus

Failure modes the spec implies but a happy-path test would miss (each pinned in the named task):

1. A template with no sections (all 50 existing ones) copied: no guide document, guide route returns `{ chapters: [] }`, page shows an empty state. (Tasks 3, 4, 6)
2. A chapter deleted in the editor after copy: its orphaned guide entry is not returned. (Task 4)
3. `MONGODB_URI` or `MONGODB_DB` unset when importing: refuse before connecting rather than fall back to `session-combat`. (Task 12)
4. Library names that exist twice (50 SRD/custom duplicates exist, e.g. Goblin): SRD wins, true ambiguity is an error, a missing name is an error. (Task 10)
5. An invited, declined, removed or player member, or a non-member, asking for the guide: all get 404. (Task 4)

---

# Part A — `campaign-chapter-guide`

### Task 1: Issue, OpenSpec change and worktree

**Files:** no product code. Adds the spec and this plan to the change branch.

- [ ] **Step 1: Check the OpenSpec tooling works on this checkout.** `core.symlinks` is `false` here, so `scripts/init-change.sh` and `openspec/config.yaml` are one-line text files (git mode 120000). Run `openspec list`. Expected: lists the active changes. If it errors on the config, fix with `git config core.symlinks true` then `git checkout -- scripts/init-change.sh openspec/config.yaml` (needs Windows Developer Mode), or work from WSL.
- [ ] **Step 2: The GitHub issue already exists: #846** ("Chapter Guide: DM-only chapter content for campaigns"; body = Goals and Design 1-3, no adventure text). Do not create another. Assign it to yourself (`gh issue edit 846 --add-assignee @me`) and cite it in the proposal.
- [ ] **Step 3: Run the `opsx:propose` skill** for change `campaign-chapter-guide`, capability `chapter-guide`, citing the issue. Seed `proposal.md` and `design.md` from the spec (Goals, Approaches table "Where the chapter text lives", Design 1-3, Decisions); `tasks.md` mirrors Tasks 2-7 below. Work in `.worktrees/campaign-chapter-guide`; run `npm install` there (postinstall runs patch-package).
- [ ] **Step 4: Copy the spec and this plan into the worktree under `docs/superpowers/`.** Run `openspec validate campaign-chapter-guide`; expected: valid. Commit: `docs: add adventure import and chapter guide spec and plan`.

### Task 2: Guide types, repo, index and cascade delete

**Files:**
- Modify: `lib/types.ts` (after `CampaignChapter`, ~line 614; `CampaignTemplate.chapters`, ~line 631)
- Create: `lib/storage/campaignGuideRepo.ts`
- Modify: `lib/db.ts` (`initializeDatabase`, after the `campaignMessages` index block, ~line 125)
- Modify: `lib/storage/campaignRepo.ts` (`deleteCampaign` cascade list, ~line 108)
- Test: `tests/integration/campaignGuides.integration.test.ts`; also update `tests/unit/lib/storage/campaignRepo.test.ts` if it enumerates the cascade collections

**Interfaces:**
- Produces in `lib/types.ts`, exactly as spec Design 1: `CHAPTER_SECTION_KINDS = ['read-aloud','dm-notes','handout'] as const`, `ChapterSectionKind`, `ChapterSection { id; kind; title?; text }`, `TemplateChapter = CampaignChapter & { sections?: ChapterSection[] }`, `CampaignGuide { id; campaignId; chapters: { chapterId: string; sections: ChapterSection[] }[]; createdAt: Date; updatedAt: Date }`. `CampaignTemplate.chapters` becomes `TemplateChapter[]`; `CampaignChapter` and `Campaign` are unchanged.
- Produces in `campaignGuideRepo.ts`: `loadCampaignGuide(campaignId: string): Promise<CampaignGuide | null>`; `saveCampaignGuide(guide: CampaignGuide): Promise<void>` (upsert keyed by `campaignId`, never writes `_id`). Collection name `"campaignGuides"`. Use `runStorageOp` like the sibling repos.

- [ ] **Step 1: Write the failing integration test** (`@jest-environment node`; `getDatabase`/`closeDatabase` pattern of `tests/integration/scripts/migrateGlobalMonsters.integration.test.ts`):

```ts
it('round-trips a guide by campaignId')
it('returns null when no guide exists')
it('saving twice for one campaignId leaves a single document')        // countDocuments === 1
it('deleteCampaign removes the campaign guide document')  // seed campaign + guide, delete, loadCampaignGuide → null
```

- [ ] **Step 2: Run** `npm run test:integration -- tests/integration/campaignGuides`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement the types, the repo, a unique index on `{ campaignId: 1 }`** (copy the try/catch "already exists" pattern of the neighbouring index blocks), **and add `campaignGuides` to the cascade `Promise.all`.**
- [ ] **Step 4: Run** the integration test, `npm run test:unit -- tests/unit/lib/storage`, and `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(guide): campaignGuides collection, repo and cascade delete`.

### Task 3: Copy route splits sections into the guide document

**Files:**
- Modify: `app/api/campaigns/global/[id]/copy/route.ts` (chapter mapping ~lines 25-28; guide write inside the existing `try`, after `addMember`, ~line 48)
- Test: `tests/unit/api/campaigns/global.id.copy.route.test.ts` (add `jest.mock("@/lib/storage/campaignGuideRepo", () => ({ saveCampaignGuide: jest.fn() }))`; the file mocks every repo and `crypto.randomUUID` with a counter)

**Interfaces:**
- Consumes: `TemplateChapter`, `saveCampaignGuide` (Task 2).
- Produces: campaign chapters never carry `sections`. When any template chapter has non-empty sections, exactly one `saveCampaignGuide` call with `{ id: randomUUID(), campaignId, chapters: [{ chapterId: <the NEW chapter id>, sections }], createdAt, updatedAt }`, listing only chapters that had sections. A failure in that save triggers the existing rollback (`deleteCampaign`) and a 500.

- [ ] **Step 1: Write the failing tests:**

```ts
it('moves template sections into one guide document keyed by the new chapter ids')
it('leaves sections off the campaign chapters in the 201 response')
it('omits chapters without sections from the guide document')
it('does not call saveCampaignGuide when no chapter has sections')      // Review Focus 1
it('rolls the campaign back and returns 500 when the guide save fails')
```

- [ ] **Step 2: Run** `npm run test:unit -- global.id.copy.route`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.** Destructure `sections` off each template chapter while assigning the new id (`const { sections, ...chapter } = ch`), collect `{ chapterId, sections }` for non-empty ones, save after `addMember`. Keep the file's `istanbul ignore file` header as is.
- [ ] **Step 4: Run** the unit tests; expected PASS. Commit: `feat(guide): copy route moves template sections into the campaign guide`.

### Task 4: DM-only guide route

**Files:**
- Create: `app/api/campaigns/[id]/guide/route.ts`
- Create: `tests/integration/helpers/campaigns.ts` (`createCampaign(cookie, body?)` and `addActiveMember(campaignId, dmCookie, userId)`, lifted from the inline helpers in `tests/integration/campaigns/messages.integration.test.ts`; leave that file alone)
- Test: `tests/integration/campaigns/guide.integration.test.ts`

**Interfaces:**
- Consumes: `assertCampaignAccess(campaignId, userId): Promise<{ campaign: Campaign; role: MemberRole } | NextResponse>` (`lib/utils/campaign.ts`), `loadCampaignGuide`, `withAuthAndParams` (`lib/middleware`).
- Produces: `GET /api/campaigns/[id]/guide` returns 200 `{ chapters: { chapterId: string; sections: ChapterSection[] }[] }` for the DM, only for chapter ids still on the campaign, `{ chapters: [] }` when no guide exists; 404 `{ error: 'Campaign not found' }` for everyone else; 401 unauthenticated; 500 `{ error: 'Failed to fetch campaign guide' }`. Mirror `GET` in `app/campaigns/[id]/route.ts`.

- [ ] **Step 1: Write the failing integration tests** (register a DM, a player, an outsider; create a campaign with two chapters via `POST /api/campaigns`; write the guide with `saveCampaignGuide`):

```ts
it.each([
  ['unauthenticated', undefined, 401],
  ['non-member', 'outsider', 404],
  ['invited member', 'invited', 404],          // Review Focus 5
  ['removed member', 'removed', 404],
  ['active player', 'player', 404],
  ['the DM', 'dm', 200],
])('%s asks for the guide → %i')
it('returns the sections for the DM in the stored order')
it('returns { chapters: [] } when the campaign has no guide')           // Review Focus 1
it('omits entries for chapters deleted after the guide was written')   // Review Focus 2: PATCH chapters to drop one
it('keeps sections out of GET /api/campaigns/[id] and the campaign list after a template copy')
```

The last test inserts a GLOBAL template with sections directly into `campaignTemplates`, copies it as the DM through `POST /api/campaigns/global/[id]/copy`, then asserts neither JSON body contains the string `sections` and that the guide route returns them for the new chapter ids.

- [ ] **Step 2: Run** `npm run test:integration -- tests/integration/campaigns/guide`. Expected: FAIL (404 for the DM, route missing).
- [ ] **Step 3: Implement the route** (`role !== 'dm'` returns the same 404 body as the parent route's PATCH).
- [ ] **Step 4: Run** the integration test. Expected: PASS. Commit: `feat(guide): DM-only GET /api/campaigns/[id]/guide`.

### Task 5: Shared scene-post helper and preserved line breaks

**Files:**
- Create: `lib/utils/sceneMessages.ts`
- Modify: `lib/components/SceneComposer.tsx` (remove local `postSceneMessage`, lines 43-64, and import it)
- Modify: `lib/components/SceneFeedItem.tsx` (caption `<p>`, line 47)
- Test: `tests/unit/utils/sceneMessages.test.ts`, `tests/unit/components/SceneFeedItem.test.tsx` (existing `SceneComposer.test.tsx` guards the refactor)

**Interfaces:**
- Produces: `postSceneMessage(campaignId: string, attachmentId: string | null, caption: string): Promise<{ message: CampaignMessage } | { error: string }>`, moved unchanged: POSTs `{ kind: 'scene', text: caption, visibility: { scope: 'group' }, ...(attachmentId ? { attachmentId } : {}) }` to `/api/campaigns/${encodeURIComponent(campaignId)}/messages`; on a non-OK response returns `{ error: data.error ?? 'Failed to post scene. Please try again.' }`.

- [ ] **Step 1: Write the failing tests:**

```ts
it('POSTs a group-visible scene with the caption and no attachmentId when none is given')
it('includes attachmentId when given')
it('returns the server error message on a non-OK response, else the default message')
it('renders the scene caption with whitespace-pre-wrap so paragraph breaks survive')  // SceneFeedItem
```

- [ ] **Step 2: Run** `npm run test:unit -- sceneMessages SceneFeedItem`. Expected: FAIL.
- [ ] **Step 3: Move the helper, import it in `SceneComposer`, add `whitespace-pre-wrap` to the caption class.**
- [ ] **Step 4: Run** `npm run test:unit -- sceneMessages SceneFeedItem SceneComposer`. Expected: PASS. Commit: `refactor(scene): share postSceneMessage; keep caption line breaks`.

### Task 6: Chapter Guide page and nav tab

**Files:**
- Create: `app/campaigns/[id]/guide/page.tsx` (thin client page: `ProtectedRoute`, `useParams`, renders `ChapterGuide`; mirror `app/campaigns/[id]/encounters/page.tsx`)
- Create: `lib/components/ChapterGuide/ChapterGuide.tsx`, `lib/components/ChapterGuide/GuideSectionBlock.tsx`
- Modify: `app/campaigns/[id]/layout.tsx` (nav array, ~line 38; add `useIsDM(id)`)
- Test: `tests/unit/components/ChapterGuide.test.tsx`; update `tests/unit/campaignLayoutNav.test.tsx`

**Interfaces:**
- Consumes: `GET /api/campaigns/[id]` (campaign: `chapters`, `currentChapterId`), `GET /api/campaigns/[id]/guide` (Task 4), `PATCH /api/campaigns/[id]` with `{ currentChapterId }` (DM-only, exists), `postSceneMessage` (Task 5), `useIsDM(campaignId): { isDM; loading; error }`.
- Produces: `ChapterGuide({ campaignId }: { campaignId: string })`; nav tab labelled `Guide` linking to `/campaigns/${id}/guide`, rendered only when `isDM`.
- UI contract the tests rely on: chapter `<select aria-label="Chapter">`; buttons `Previous chapter` / `Next chapter` (disabled at the ends); button `Make current chapter` (replaced by a "Current chapter" badge when already current); each block is `data-testid="guide-section"` with `data-kind`; `read-aloud` and `handout` blocks have a `Push to players` button (states `Sending…`, `Sent ✓`, then clickable again; on error a `role="alert"` message and a `Retry` button); `dm-notes` blocks are labelled "DM only" and have no push button; section text has class `whitespace-pre-wrap`; a 404 from the guide route renders "Guide not available." and no sections.

- [ ] **Step 1: Write the failing component tests** (RTL; mock `global.fetch` with per-URL responses; assert the POST body):

```ts
it('opens on the current chapter')
it('falls back to the first chapter when currentChapterId is missing or unknown')
it('moves between chapters with Next/Previous and the dropdown')
it('shows title, levelRange, location and description in the header')
it('renders read-aloud and handout blocks with Push to players and dm-notes without')
it('pushes a block as { kind:"scene", text, visibility:{scope:"group"} } to /api/campaigns/<id>/messages')
it('shows Sending… then Sent ✓, and a sent block can be pushed again')   // second POST
it('shows the error and a working Retry when the push fails')
it('PATCHes { currentChapterId } when Make current chapter is clicked')
it('shows an empty-state note for a chapter with no sections')            // Review Focus 1
it('shows "Guide not available." and no sections when the guide route returns 404')
it('keeps paragraph breaks: section text has whitespace-pre-wrap')
```

Layout (`campaignLayoutNav.test.tsx`: mock `@/lib/hooks/useIsDM`; the existing test would otherwise need an auth provider):

```ts
it('shows the Guide tab for a DM')
it('hides the Guide tab for a non-DM')
```

- [ ] **Step 2: Run** `npm run test:unit -- ChapterGuide campaignLayoutNav`. Expected: FAIL.
- [ ] **Step 3: Implement** the page, the two components (styling within the existing dark theme; push state is local per block, not persisted) and the layout change.
- [ ] **Step 4: Run** the unit tests, `npm run typecheck`, `npm run lint`. Expected: PASS. Commit: `feat(guide): Chapter Guide page and DM-only nav tab`.

### Task 7: Verify Part A and open the PR

**Files:** `openspec/changes/campaign-chapter-guide/specs/chapter-guide/spec.md` (requirements and scenarios from Tasks 2-6), `tasks.md` ticked.

- [ ] **Step 1:** Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:ci`. Expected: all green; paste the evidence into the PR (AGENTS.md: never skip).
- [ ] **Step 2:** Run `openspec validate campaign-chapter-guide`. Open the PR (title: "Chapter Guide: DM-only chapter content"; body: summary, rationale, the by-construction no-leak property, "closes #<issue>"). Address review comments; after merge run `opsx:apply` to archive the change.

---

# Part B — `adventure-importer` (start from `main` after Part A merges)

### Task 8: Issue, OpenSpec change and worktree

- [ ] **Step 1:** The GitHub issue already exists: **#847** ("Adventure importer CLI: bundle format and idempotent import", blocked by #846). Do not create another. Confirm #846 is merged and your checkout is on current `main`, then assign #847 to yourself (`gh issue edit 847 --add-assignee @me`).
- [ ] **Step 2:** Run `opsx:propose` for change `adventure-importer`, capability `adventure-import`; work in its worktree; `npm install`. Run `openspec validate adventure-importer`; expected valid.

### Task 9: Bundle schema, example bundle and gitignore

**Files:**
- Create: `lib/adventures/bundleSchema.ts`
- Create: `content/adventures/example-adventure/adventure.json` (synthetic and original: 2 chapters with sections, 1 new monster with `senses["passive Perception"]`, 1 `library: "Wolf"` ref, 1 encounter mixing both)
- Create: `content/adventures/README.md` (bundle format, the spoiler rule: chapter `description` and `location` are player-visible teasers and plot detail goes in `dm-notes` sections, and the split-long-blocks rule; usage is added in Task 12)
- Modify: `.gitignore` (add `content/adventures/*`, `!content/adventures/README.md`, `!content/adventures/example-adventure/`)
- Test: `tests/unit/adventures/bundleSchema.test.ts` and `tests/unit/adventures/localBundles.test.ts` (both `@jest-environment node`)

**Interfaces:**
- Consumes: `rawMonsterSchema` (`lib/validation/monsterUploadSchema.ts`). It ends in `superRefine`, so split `key` off each monster entry and validate the rest with it, reporting issues under `monsters[i]...`.
- Produces: `BUNDLE_LIMITS = { sectionText: 5000, sectionTitle: 200, sectionsPerChapter: 60 } as const`; `MonsterRef = { library: string; id?: string; count: number } | { new: string; count: number }`; `AdventureBundle` as spec Design 4 (`schemaVersion: 1`; `adventure{slug,name,moduleName,description,levelRange,source{title,author,publisher}}`; `chapters[{key,title,levelRange?,location?,description?,sections[{kind,title?,text}]}]`; `monsters[{key,...raw}]`; `encounters[{name,description,monsters:MonsterRef[]}]`; `notes: string[]`); `BundleIssue { path: string; message: string }`; `parseAdventureBundle(input: unknown): { ok: true; bundle: AdventureBundle } | { ok: false; issues: BundleIssue[] }`. Keys and slug are kebab-case; `count` is an integer 1-20.

- [ ] **Step 1: Write the failing tests:**

```ts
it('accepts the committed example bundle')
it.each([
  ['wrong schemaVersion', ...], ['non-kebab slug', ...], ['duplicate chapter keys', ...],
  ['duplicate monster keys', ...], ['unknown section kind', ...],
  ['section text of 5001 chars', ...], ['61 sections in a chapter', ...],
  ['encounter references an unknown new monster key', ...],
  ['new monster without senses["passive Perception"]', ...],
  ['monster size "huge-ish"', ...],            // issue path starts "monsters[0].size"
  ['encounter count 0', ...],
])('rejects %s with an issue path')
it('accepts section text of exactly 5000 chars')
it('reports every issue at once, not just the first')             // two defects → two issues
it('leaves section text untouched, including blank lines and curly quotes')
// localBundles.test.ts
describe.each(<every dir in content/adventures holding adventure.json>)('%s', () => {
  it('passes parseAdventureBundle')
})
```

- [ ] **Step 2: Run** `npm run test:unit -- tests/unit/adventures`. Expected: FAIL.
- [ ] **Step 3: Implement** the zod schema, the cross-checks (unique keys, `new` refs exist, passive Perception string) and `parseAdventureBundle`, which maps zod issues to `path` strings like `chapters[2].sections[0].text`. Write the example bundle and README; update `.gitignore`.
- [ ] **Step 4: Run** the tests; expected PASS. Run `git check-ignore -v content/adventures/wild-sheep-chase/adventure.json`; expected: matched by the new rule. Commit: `feat(import): adventure bundle schema and example bundle`.

### Task 10: Planner — resolve refs, derive ids, build documents, classify

**Files:**
- Create: `lib/adventures/plan.ts`
- Test: `tests/unit/adventures/plan.test.ts` (`@jest-environment node`)

**Interfaces:**
- Consumes: `AdventureBundle` (Task 9); `transformMonsterData(raw, { userId, isGlobal }): MonsterTemplate` (`lib/validation/monsterUploadTransform.ts`); `toEncounterMonster(template, instanceId?)` (`lib/data/customMonsters.ts`; strips `isGlobal`, `userId`, `source`, `legendaryActionCount`, sets `hp = maxHp` and `templateId`); `GLOBAL_USER_ID`.
- Produces:

```ts
export class LibraryRefError extends Error {}
export const adventureIds: {
  template(slug: string): string;                       // "adv-<slug>"
  chapter(slug: string, key: string): string;           // "adv-<slug>-<key>"
  section(chapterId: string, index: number): string;    // "<chapterId>-s<index+1>"
  monster(slug: string, key: string): string;           // "cm-<slug>-<key>"
  instance(slug: string, encounterIndex: number, seq: number): string; // "adv-<slug>-e<i>-m<seq>"
};
export function resolveLibraryRef(ref: { library: string; id?: string }, library: MonsterTemplate[]): MonsterTemplate;
export interface AdventurePlan {
  monsters: Omit<MonsterTemplate, 'createdAt' | 'updatedAt'>[];       // new GLOBAL monsters
  template: Omit<CampaignTemplate, 'createdAt' | 'updatedAt'>;
  resolved: { name: string; id: string; source?: string }[];
  warnings: string[];
}
export function buildAdventurePlan(bundle: AdventureBundle, library: MonsterTemplate[]): AdventurePlan;
export type DocAction = 'create' | 'update' | 'unchanged';
export function classifyDoc(existing: Record<string, unknown> | null, desired: Record<string, unknown>): { action: DocAction; changed: string[] };
```

Deterministic ids are deliberate: a fresh UUID per embedded monster would make every re-run an `update`. After `toEncounterMonster`, delete the `_id` key (it sets `_id: undefined`, which the driver stores as `null`, so a stored doc would never compare equal to a rebuilt one).

- [ ] **Step 1: Write the failing tests:**

```ts
it.each([
  ['exact case-insensitive match', ...], ['two matches, one SRD → the SRD one', ...],
  ['an explicit id disambiguates two non-SRD matches', ...],
])('resolveLibraryRef: %s')
it('throws LibraryRefError naming both ids when two non-SRD docs match')      // Review Focus 4
it('throws LibraryRefError when nothing matches')                             // Review Focus 4
it('ignores library docs whose userId is not GLOBAL')
it('builds new monsters as GLOBAL cm-<slug>-<key> docs with source = adventure name')
it('keeps senses["passive Perception"] on new monsters')
it('expands count:3 into 3 embedded monsters with distinct deterministic ids, hp === maxHp, templateId set')
it('embeds library monsters verbatim apart from the toEncounterMonster stripping, with no _id key')
it('builds chapters with stable ids, order = index, stable section ids and untouched text')
it('is deterministic: building twice gives deep-equal plans')
it.each([
  ['null → create', ...], ['equal apart from _id/createdAt/updatedAt → unchanged', ...],
  ['changed section text → update with changed ["chapters"]', ...],
])('classifyDoc: %s')
```

- [ ] **Step 2: Run** `npm run test:unit -- tests/unit/adventures/plan`. Expected: FAIL.
- [ ] **Step 3: Implement.** `resolveLibraryRef`: restrict to `userId === GLOBAL_USER_ID`, case-insensitive exact name, prefer `source === 'SRD'`, error on zero or still-ambiguous, honor `id`. `classifyDoc`: deep-compare, ignoring `_id`, `createdAt`, `updatedAt`; `changed` lists the differing top-level field names.
- [ ] **Step 4: Run** the tests; expected PASS. Commit: `feat(import): adventure planner with library resolution and stable ids`.

### Task 11: Apply — read-only report and idempotent upsert

**Files:**
- Create: `lib/adventures/apply.ts`
- Test: `tests/integration/adventures/apply.integration.test.ts` (`@jest-environment node`; `getDatabase`/`closeDatabase`; use a unique slug per test so tests do not collide)

**Interfaces:**
- Consumes: `AdventurePlan`, `classifyDoc`, `DocAction` (Task 10); `monsterTemplates` and `campaignTemplates` collections.
- Produces:

```ts
export class TemplateNameCollisionError extends Error {}
export interface PlanReport {
  docs: { collection: 'monsterTemplates' | 'campaignTemplates'; id: string; name: string; action: DocAction; changed: string[] }[];
}
export function loadLibrary(db: Db): Promise<MonsterTemplate[]>;                 // GLOBAL monsterTemplates
export function reportPlan(db: Db, plan: AdventurePlan): Promise<PlanReport>;    // read-only
export function applyAdventurePlan(db: Db, plan: AdventurePlan, now?: Date): Promise<PlanReport>;
```

`reportPlan` and `applyAdventurePlan` first check that no GLOBAL template with the same `name` exists under a different id; if one does they throw `TemplateNameCollisionError` before any write. Writes are `updateOne({ id, userId: GLOBAL }, { $set: {...doc, updatedAt: now}, $setOnInsert: { createdAt: now } }, { upsert: true })`, skipped for `unchanged` docs. Nothing is ever deleted.

- [ ] **Step 1: Write the failing tests:**

```ts
it('creates the template and the new monsters on an empty database')
it('a second apply reports every doc unchanged and writes nothing')        // updatedAt untouched
it('after editing one section only the template is updated; createdAt kept, updatedAt newer')
it('throws TemplateNameCollisionError and writes nothing when the name belongs to another id')
it('leaves unrelated GLOBAL templates and monsters byte-identical')        // seed, apply, deep-equal incl. updatedAt
it('reportPlan writes nothing')                                            // counts unchanged
it('an imported template copied through POST /api/campaigns/global/[id]/copy gives the DM encounters with embedded monsters and guide sections for the new chapter ids')
```

The last test registers a user, copies the imported template over HTTP, then reads `GET /api/campaigns/[id]/guide`.

- [ ] **Step 2: Run** `npm run test:integration -- tests/integration/adventures`. Expected: FAIL.
- [ ] **Step 3: Implement** the three functions.
- [ ] **Step 4: Run** the integration tests; expected PASS. Commit: `feat(import): idempotent adventure apply that touches only its own ids`.

### Task 12: CLI and docs

**Files:**
- Create: `lib/scripts/importAdventure.ts`
- Modify: `package.json` (add `"import:adventure": "npx tsx lib/scripts/importAdventure.ts"`)
- Modify: `content/adventures/README.md` (usage; dry run is the default; existing copied campaigns are not changed; `MONGODB_URI`/`MONGODB_DB`/`DNS_SERVERS`; `--validate-only`)
- Test: `tests/unit/scripts/importAdventure.test.ts` and `tests/integration/scripts/importAdventure.integration.test.ts`

**Interfaces:**
- Consumes: `parseAdventureBundle`, `buildAdventurePlan`, `LibraryRefError`, `loadLibrary`, `reportPlan`, `applyAdventurePlan`, `TemplateNameCollisionError`, `getDatabase` (`lib/db.ts`).
- Produces:

```ts
export class UsageError extends Error {}
export interface CliArgs { bundlePath: string; apply: boolean; validateOnly: boolean; help: boolean }
export function parseArgs(argv: string[]): CliArgs;          // throws UsageError
export function redactMongoUri(uri: string): string;          // host only, never credentials
export function runCli(argv: string[], env?: NodeJS.ProcessEnv, io?: { log(m: string): void; error(m: string): void }): Promise<number>;  // exit code
```

`runCli` order: parse args, read and validate the bundle (print every issue with its path, return 1), `--validate-only` returns 0 (no env needed), refuse unless both `MONGODB_URI` and `MONGODB_DB` are set (error names the missing var, return 1 **before connecting**), apply `DNS_SERVERS` via `dns.setServers`, print `Target: <redacted host>, database <name>` first, load the library, build the plan (`LibraryRefError` returns 1), print each doc's action, resolved refs, field-level `changed`, warnings and the bundle `notes`; without `--apply` print "Dry run: nothing written" and return 0; with it apply. The `--help` text states that existing campaigns copied earlier are unaffected. A `require.main === module` block calls `process.exit(await runCli(...))`.

- [ ] **Step 1: Write the failing tests:**

```ts
it.each([['bundle path only'], ['--apply'], ['--validate-only'], ['--help']])('parseArgs accepts %s')
it.each([['no path'], ['unknown flag'], ['two paths']])('parseArgs throws UsageError for %s')
it('redactMongoUri hides user and password for mongodb+srv and mongodb URIs and keeps the host')
it('--validate-only needs no environment and returns 0 for the example bundle')
it('refuses with exit 1, naming MONGODB_DB, before connecting when it is unset')        // Review Focus 3; mock @/lib/db and assert getDatabase not called
it('refuses with exit 1, naming MONGODB_URI, when it is unset')
// integration, seeded minimal GLOBAL Wolf in the test database
it('dry run on the example bundle returns 0 and writes nothing')
it('--apply creates the docs, and a second --apply reports nothing changed')
it('an unresolved library ref returns 1 and writes nothing')
```

- [ ] **Step 2: Run** `npm run test:unit -- importAdventure` and `npm run test:integration -- tests/integration/scripts/importAdventure`. Expected: FAIL.
- [ ] **Step 3: Implement** the CLI, the npm script and the README usage section.
- [ ] **Step 4: Run** both suites, `npm run typecheck`, `npm run lint`. Expected: PASS. Commit: `feat(import): npm run import:adventure CLI (dry run by default)`.

### Task 13: Sheep Chase bundle (local only) and owner-gated import

**Files:**
- Create (gitignored, never committed): `content/adventures/wild-sheep-chase/adventure.json`

**Interfaces:**
- Consumes: the bundle format (Task 9) and the CLI (Task 12). Source text: the owner's local copy of `892902-The_Wild_Sheep_Chase_V2.pdf` (it has a text layer; the companion map PDF is image-only). The PDFs are never committed; extract the text locally (for example `pdftotext -layout`).

- [ ] **Step 1: Author the bundle per spec Design 6.** Slug `wild-sheep-chase`, `moduleName` WSC, levelRange 4-5.
  - Chapter keys: `baaaa-d-news`, `after-the-dust-settles`, `the-house-in-the-woods`, `ewe-are-very-clever`, `big-choices`, `consequences`, `not-like-this`.
  - Boxed text becomes `read-aloud` verbatim (typo fixes allowed, each listed in `notes`). Tactics, roleplay, rules and the modified wand become `dm-notes`.
  - Chapter `description` and `location` are spoiler-free teasers.
  - Split any block over 5000 chars at a paragraph boundary into consecutive sections titled "(part 1 of 2)" and so on.
  - New monsters, keys `guz`, `bed-dragon-wyrmling`, `ahmed-noke`, `finethir-shinebright`, `ape-greatsword`, as printed except the rulings. Noke INT save +6 (proficiency +3). Guz CHA 8, so −1. Guz Intimidation +2 / AC 14 and the Wyrmling's Perception +2 / Stealth +5 kept as printed and flagged in `notes`. Shinebright is Pony stats with INT 18 / WIS 14 and passive Perception 12 (derived). Ape (Greatsword) is the SRD Ape's fields (read-only query of the dev DB) with Fist replaced by Slash, 10 (2d6+3) slashing (attack bonus as printed in the source). Every monster gets `senses["passive Perception"]` as a string.
  - Library refs: Wolf, Brown Bear, Gibbering Mouther.
  - Encounters (descriptions prefixed `Scene N —` with N from the source): *Guz and the Collared Pack* (Guz, 3 Wolf, Brown Bear); *Noke's Compound* (Noke, 3 Ape (Greatsword), Brown Bear); *The Bed Dragon* (Bed Dragon Wyrmling, Noke); *Noke's Malfunction* (Gibbering Mouther).
- [ ] **Step 2: Validate offline:** `npx tsx lib/scripts/importAdventure.ts content/adventures/wild-sheep-chase/adventure.json --validate-only`. Expected: exit 0. Run `npm run test:unit -- localBundles`; expected PASS (it now includes this bundle). Run `git status`; expected: nothing under `content/adventures/wild-sheep-chase`.
- [ ] **Step 3: Dry run against the dev database.** Ask the owner for `MONGODB_URI` (the `session-combat-dev` string), then run with `MONGODB_DB=session-combat-dev` and `DNS_SERVERS=8.8.8.8,1.1.1.1`. Expected: the first line shows the redacted target and `session-combat-dev`; 5 monsters and 1 template `create`; Wolf, Brown Bear and Gibbering Mouther resolve to SRD ids; the flagged `notes` are printed. Show the output to the owner.
- [ ] **Step 4: Stop for owner review.** Only on the owner's explicit go-ahead run the same command with `--apply` (it writes to the shared dev database). Run it once more; expected: every doc `unchanged`.
- [ ] **Step 5: Smoke test with the owner** (or via the `run` skill): copy "The Wild Sheep Chase" from the template list, open the Guide tab on chapter 1, push one read-aloud block and check that its paragraph breaks show in the chat. Add a second account as a player: it must get 404 from `/api/campaigns/<id>/guide` and see no Guide tab. The owner converts the map PDF to an image and pushes it with Push Scene (not part of the importer).

---

## Self-Review

- **Spec coverage:** Design 1 → Task 2; Design 2 (guide route, header fields unchanged, tests) → Task 4; copy and cascade → Tasks 2-3; Design 3 → Tasks 5-6; Design 4 → Task 9; Design 5 → Tasks 10-12; Design 6 → Task 13. Non-Goals respected: no sanitizer, editor or campaign-route changes, no section editing, no encounter-chapter link, no importing UI, no map import.
- **Deliberate additions to the spec:** gitignored commercial bundles with a committed example (public repo); `--validate-only`; refusing to run without `MONGODB_URI` and `MONGODB_DB`; deterministic embedded-monster ids (required for "second run reports unchanged"); a local-bundles validation test.
- **Type consistency:** `ChapterSection`, `TemplateChapter`, `CampaignGuide` (Task 2) are used unchanged in Tasks 3, 4, 6, 10; `postSceneMessage` (Task 5) in Task 6; `AdventurePlan`/`classifyDoc` (Task 10) in Tasks 11-12; ids from `adventureIds` only.
