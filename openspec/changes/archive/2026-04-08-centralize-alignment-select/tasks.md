# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/centralize-alignment-select` then immediately `git push -u origin feat/centralize-alignment-select`

## Execution

### Phase 1 — Type safety (lib/types.ts)

- [x] **1a. Write failing type test:** Add a TypeScript test or `tsc --noEmit` baseline confirming current `string` types compile
- [x] **1b. Tighten interface types:** In `lib/types.ts`, change `alignment?: string` to `alignment?: DnDAlignment` on `Character` (line ~290), `MonsterTemplate` (line ~318), and `Monster` (line ~353)
- [x] **1c. Verify:** Run `npx tsc --noEmit` — zero new errors expected (D&D Beyond import is already compatible)

### Phase 2 — AlignmentSelect component (TDD)

- [x] **2a. Write failing tests first:** Create `lib/components/__tests__/AlignmentSelect.test.tsx` covering:
  - Renders label "Alignment" and select with `aria-label="Alignment"`
  - Renders 10 options (placeholder + 9 alignments)
  - Reflects controlled `value` prop
  - Calls `onChange` with selected string value
  - Renders disabled select when `disabled={true}`
- [x] **2b. Implement component:** Create `lib/components/AlignmentSelect.tsx` — owns `<label>` and `<select>`, maps `VALID_ALIGNMENTS`, `aria-label="Alignment"`
- [x] **2c. Verify tests pass:** Run `npm test -- --testPathPattern=AlignmentSelect`

### Phase 3 — Update character editor

- [x] **3a. Write/update test:** Confirm character editor renders `AlignmentSelect` (select with `aria-label="Alignment"`)
- [x] **3b. Update `app/characters/page.tsx`:**
  - Import `AlignmentSelect` from `lib/components/AlignmentSelect`
  - Replace inline `<select>` block (lines ~548–561) with `<AlignmentSelect value={alignment} onChange={setAlignment} disabled={saving} />`
  - Remove unused `AbilityScores` import
- [x] **3c. Verify:** ESLint passes, no unused import warnings

### Phase 4 — Update monster editor

- [x] **4a. Write/update test:** Confirm monster editor renders select with `aria-label="Alignment"`
- [x] **4b. Update `app/monsters/page.tsx`:**
  - Import `AlignmentSelect` from `lib/components/AlignmentSelect`
  - Replace inline `<select>` block (lines ~566–578) with `<AlignmentSelect value={alignment} onChange={setAlignment} disabled={saving} />`
- [x] **4c. Verify:** ESLint passes

### Phase 5 — API validation (TDD, 6 routes)

Write tests first for each route, then add the guard.

- [x] **5a. Tests — POST /api/characters:** Invalid alignment → 400; valid → 201; omitted → 201
- [x] **5b. Guard — `app/api/characters/route.ts`:** Add after gender validation:
  ```
  if (alignment !== undefined && alignment !== '' && !isValidAlignment(alignment)) {
    return NextResponse.json({ error: 'Invalid alignment' }, { status: 400 });
  }
  ```
  Import `isValidAlignment` from `lib/types`.

- [x] **5c. Tests — PUT /api/characters/[id]:** Same three scenarios
- [x] **5d. Guard — `app/api/characters/[id]/route.ts`:** Same pattern

- [x] **5e. Tests — POST /api/monsters:** Same three scenarios
- [x] **5f. Guard — `app/api/monsters/route.ts`:** Same pattern

- [x] **5g. Tests — PUT /api/monsters/[id]:** Same three scenarios
- [x] **5h. Guard — `app/api/monsters/[id]/route.ts`:** Same pattern

- [x] **5i. Tests — POST /api/monsters/global:** Same three scenarios
- [x] **5j. Guard — `app/api/monsters/global/route.ts`:** Same pattern

- [x] **5k. Tests — PUT /api/monsters/global/[id]:** Same three scenarios
- [x] **5l. Guard — `app/api/monsters/global/[id]/route.ts`:** Same pattern

## Validation

- [x] Run full test suite: `npm test`
- [x] Run TypeScript check: `npx tsc --noEmit`
- [x] Run ESLint: `npm run lint`
- [x] Run build: `npm run build`
- [x] Manually verify character editor shows alignment select with label "Alignment"
- [x] Manually verify monster editor shows alignment select with label "Alignment"
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — included in `npm test` suite; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- **Lint** — `npm run lint`; no errors

If **ANY** of the above fail, diagnose and fix before pushing.

## PR and Merge

- [x] Run pre-PR self-review per `openspec/skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/centralize-alignment-select` and push to remote
- [ ] Open PR from `feat/centralize-alignment-select` to `main`; reference `#20` in PR body
- [x] Wait 120 seconds for automated reviewer comments
- [x] **Monitor PR comments** — address, commit, validate locally, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose failures, fix, validate locally, push; repeat until all checks pass
- [x] Wait for PR to merge — **never force-merge**; if human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated (Gemini Code Assist, CodeRabbit) + human
- Required approvals: 1 human

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required for this change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/centralize-alignment-select/` to `openspec/changes/archive/YYYY-MM-DD-centralize-alignment-select/` — **stage both the copy and the deletion in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-centralize-alignment-select/` exists and `openspec/changes/centralize-alignment-select/` is gone
- [x] Commit and push the archive commit to `main`
- [x] `git fetch --prune` and `git branch -d feat/centralize-alignment-select`
