# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/travelling-npcs-character-type` then immediately `git push -u origin feature/travelling-npcs-character-type`

## Execution

### Step 1 — Extend the Character type and Mongoose model

- [x] Add `characterType?: 'character' | 'npc' | 'companion'` to `Character` interface in `lib/types.ts`
- [x] Add `characterType` to `CharacterInput` / create/update DTOs in `lib/types.ts`
- [x] Add `characterType: { type: String, enum: ['character', 'npc', 'companion'], default: 'character' }` to Mongoose schema in `lib/server/models/Character.ts`
- [x] Verify: `tsc --noEmit` passes

### Step 2 — Write tests first (TDD)

- [x] Write unit test: `characterType` defaults to `'character'` when field is omitted on create
- [x] Write unit test: all three values (`character`, `npc`, `companion`) are accepted as valid
- [x] Write unit test: invalid value (e.g. `'villain'`) is rejected with a validation error
- [x] Write integration test: `POST /api/characters` with `characterType: 'npc'` → GET returns `characterType: 'npc'`
- [x] Write integration test: `PUT /api/characters/[id]` updates `characterType` from `'character'` to `'companion'`
- [x] Write integration test: existing document with no `characterType` at BSON level → API response coerces to `'character'`
- [x] Write integration test: `GET /api/characters?characterType=npc` returns only NPCs
- [x] Write integration test: `GET /api/characters?characterType=all` and bare `GET /api/characters` both return all characters
- [x] Write integration test: `GET /api/characters?characterType=npc` returns empty array when no NPCs exist
- [x] Write integration test: unauthenticated request to `GET /api/characters?characterType=npc` returns `401`
- [x] Confirm all new tests fail (expected — implementation not yet done)

### Step 3 — Update the Characters API

- [x] Update `app/api/characters/route.ts` GET handler to read `?characterType` query param; branch on `all` / omitted before constructing Mongoose query
- [x] Update GET response serializer to coerce missing `characterType` to `'character'` (`document.characterType ?? 'character'`)
- [x] Update `app/api/characters/route.ts` POST handler to accept and persist `characterType`
- [x] Update `app/api/characters/[id]/route.ts` PUT handler to accept and persist `characterType`
- [x] Verify: all API unit and integration tests from Step 2 pass

### Step 4 — Update the Characters UI

- [x] Add Type selector (Player Character / Travelling NPC / Companion) to `CharacterEditor` in `app/characters/page.tsx`; default to `'character'` for new characters
- [x] Update `CharacterEditor` save handler to include `characterType` in the submitted payload
- [x] Update the character list in `CharactersContent` to group characters into labelled sections by `characterType`; hide sections with no members
- [x] Add filter control (All / Player Characters / Travelling NPCs / Companions) that narrows visible sections
- [x] Write integration test: characters page renders three sections when all types present
- [x] Write integration test: empty section is not rendered
- [x] Write integration test: filter control shows correct section
- [x] Write integration test: Type selector defaults to "Player Character" for new character; shows current value when editing
- [x] Verify: all UI integration tests pass

### Step 5 — Update the Parties UI

- [x] Update `PartyEditor` in `app/parties/page.tsx` to split the displayed party member list into sections: Player Characters, Travelling NPCs, Companions; hide empty sections
- [x] Write integration test: party with all three types renders three sections
- [x] Write integration test: party with only PCs renders one section, no empty NPC or Companion sections
- [x] Verify: all party integration tests pass

### Step 6 — Final review and cleanup

- [x] Review all changed files for duplication or unnecessary complexity
- [x] Confirm every acceptance scenario in `openspec/changes/travelling-npcs-character-type/specs/character-type/spec.md` is covered by a test
- [x] `tsc --noEmit` passes
- [x] ESLint passes: `npm run lint`

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run lint: `npm run lint`
- [x] All completed tasks marked complete
- [x] All steps in Remote push validation below pass

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — must produce no errors

If **ANY** of the above fail, diagnose and fix the failure before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from `.agent/skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feature/travelling-npcs-character-type` to `main`; reference issue #183 in the PR description
- [x] Wait 120 seconds for Agentic reviewers to post comments
- [x] **Monitor PR comments** — address each, commit fixes, run Remote push validation, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — for any failure: diagnose, fix, commit, run Remote push validation, push; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address → validate locally → push → sleep 120 s → re-check → repeat until PR is fully clean.

Ownership metadata:

- Implementer: @dougis
- Reviewer(s): Agentic reviewers + @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → run Remote push validation → push → re-run checks
- Security finding → remediate → commit → run Remote push validation → push → re-scan
- Review comment → address → commit → run Remote push validation → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas: copy `openspec/changes/travelling-npcs-character-type/specs/character-type/spec.md` to `openspec/specs/character-type/spec.md`
- [x] Archive the change: move `openspec/changes/travelling-npcs-character-type/` to `openspec/changes/archive/YYYY-MM-DD-travelling-npcs-character-type/` — stage both the new location and the deletion of the old location in a **single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-travelling-npcs-character-type/` exists and `openspec/changes/travelling-npcs-character-type/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d feature/travelling-npcs-character-type`
