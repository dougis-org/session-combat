# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b spell-collection-with-admin-import` then immediately `git push -u origin spell-collection-with-admin-import`

## Execution

### 1. Add SpellTemplate Type

- [x] Add `SpellTemplate` interface to `lib/types.ts`:
  - Fields: `id`, `userId`, `isGlobal`, `source`, `name`, `level`, `concentration`, `school`, `description`, `castingTime`, `range`, `duration`, `components: { verbal, somatic, material }`, `higherLevel`, `damageType`, `saveDc`, `saveType`, `attackRoll`, `createdAt`, `updatedAt`
- [x] Add `DnDSpellSchool` type or enum if not existing
- [x] Verify TypeScript compilation passes

### 2. Add Spell Storage Methods

- [x] Add to `lib/storage.ts`:
  - `loadSpells(userId?: string)` — load all global spells if no userId, or load user spells
  - `loadSpellById(id: string)` — load single spell
  - `saveSpellTemplate(spell: SpellTemplate)` — upsert spell
  - `deleteSpellTemplate(id: string)` — delete spell
  - `spellExistsByNameAndSource(name: string, source: string)` — dedupe check

### 3. Create open5e Adapter

- [x] Create `lib/import/open5eAdapter.ts`:
  - `fetchMonsters(page?: number)` — fetch paginated creatures
  - `fetchSpells(page?: number)` — fetch paginated spells
  - `handleRateLimit(response)` — exponential backoff on 429
  - `getAllMonsters()` — iterator yielding all monsters
  - `getAllSpells()` — iterator yielding all spells
- [x] Create `lib/import/transformMonster.ts`:
  - `transformMonster(raw)` — map open5e creature to our MonsterTemplate
  - Validate required fields
- [x] Create `lib/import/transformSpell.ts`:
  - `transformSpell(raw)` — map open5e spell to our SpellTemplate
  - Map `concentration` field correctly
  - Validate required fields

### 4. Create Dedupe Engine

- [x] Create `lib/import/dedupeEngine.ts`:
  - `shouldImport(collection, name, source)` — check if exists
  - `importWithDedup(collection, items)` — batch insert with dedupe check

### 5. Create Import API Endpoint

- [x] Create `app/api/import/open5e/route.ts`:
  - POST handler: accept `{ type: "monsters" | "spells" | ["monsters", "spells"] }`
  - Admin auth check (`requireAuth` + `isUserAdmin`)
  - Call adapter to fetch and transform
  - Call dedupe engine to insert
  - Return sync results (inserted count, skipped count)

### 6. Create Spell CRUD API

- [x] Create `app/api/spells/route.ts`:
  - GET — list all global spell templates
  - GET with `?concentration=true` — filter by concentration
  - POST — create spell (admin only)
- [x] Create `app/api/spells/[id]/route.ts`:
  - GET — get spell by ID
  - PUT — update spell (admin only)
  - DELETE — delete spell (admin only)

### 7. Create Spell Import UI

- [x] Create `app/spells/import/page.tsx`:
  - Admin-only check
  - "Sync from open5e" button
  - Progress/status display
  - Handle success and error states

### 8. Create Spell Library Page

- [x] Create `app/spells/page.tsx`:
  - List global spell templates
  - Filter by concentration, school, level
  - Search by name

### 9. Enhance Monster Import UI

- [x] Modify `app/monsters/import/page.tsx`:
  - Add "Sync from open5e" option alongside file upload
  - When selected, call POST `/api/import/open5e` with `{ type: "monsters" }`

### 10. Replace Seed Endpoint

- [x] Modify `app/api/monsters/global/route.ts` PUT handler:
  - Replace JSON-based seeding with call to open5e adapter
  - Use dedupe engine to insert

### 11. Create Migration Script

- [x] Create `lib/scripts/migrateGlobalMonsters.ts`:
  - Find all monsterTemplates with `isGlobal: true` and no `source`
  - Set `source: "SRD"` on each
- [ ] Run migration to retroactively tag existing global monsters
- [ ] Verify all global monsters have source field

### 12. Delete Static JSON Files

- [x] Delete `lib/data/monsters/*.ts` (14 category files)
- [x] Delete `lib/data/srd-monsters.ts`
- [x] Delete `lib/scripts/seedMonsters.ts`
- [x] Update `lib/data/monsters/index.ts` or remove if empty
- [x] Verify no remaining imports of deleted files

## Validation

- [x] Run `npm run lint` — no linting errors
- [x] Run `npm run typecheck` or `npx tsc --noEmit` — no TypeScript errors
- [x] Run unit tests — all pass
- [ ] Run integration tests — all pass
- [ ] Run build `npm run build` — build succeeds

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `spell-collection-with-admin-import` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): Human reviewer(s)
- Required approvals: 1 (or as per project policy)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (e.g., MONSTER_LIBRARY.md if it references seedMonsters)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/spell-collection-with-admin-import/` to `openspec/changes/archive/YYYY-MM-DD-spell-collection-with-admin-import/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-spell-collection-with-admin-import/` exists and `openspec/changes/spell-collection-with-admin-import/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d spell-collection-with-admin-import`

Required cleanup after archive: `git fetch --prune` and `git branch -d spell-collection-with-admin-import`

(End of file - total 165 lines)