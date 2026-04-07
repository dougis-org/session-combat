# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/add-character-gender-field` then immediately `git push -u origin feat/add-character-gender-field`

## Execution

### 1. Type definition

- [x] In `lib/types.ts`, add `gender?: string` to the `Character` interface (both occurrences, ~line 290 and ~line 350)

### 2. API — POST route

- [x] In `app/api/characters/route.ts`, destructure `gender` from the request body alongside `race` and `alignment`
- [x] Add inline validation: if `gender` is provided and `gender.length > 50`, return 400 with `{ error: 'Gender must be 50 characters or fewer' }`
- [x] Include `gender: gender || undefined` in the character object passed to the database

### 3. API — PUT route

- [x] In `app/api/characters/[id]/route.ts`, destructure `gender` from the request body
- [x] Add the same inline max-50-char validation (same pattern as POST)
- [x] Include `gender: gender !== undefined ? gender : existingCharacter.gender` in the update object (following the pattern at ~line 185)

### 4. CharacterEditor form

- [x] In `app/characters/page.tsx`, add `const [gender, setGender] = useState(character.gender || '')` inside `CharacterEditor`
- [x] Add the gender input field in the form, alongside race and alignment:
  ```tsx
  <div>
    <label className="block mb-1 text-sm font-bold">Gender</label>
    <input
      type="text"
      value={gender}
      onChange={e => setGender(e.target.value)}
      className="w-full bg-gray-700 rounded px-3 py-2 text-white"
      disabled={saving}
      aria-label="Character gender"
      placeholder="e.g., Female, Male, Non-binary, etc."
    />
  </div>
  ```
- [x] Include `gender: gender || undefined` in the save payload passed to the API

### 5. Character card display

- [x] In `app/characters/page.tsx`, replace the race display on the card (~line 342):
  - Before: `{character.race && ` - ${character.race}`}`
  - After: `{(character.gender || character.race) && ` - ${[character.gender, character.race].filter(Boolean).join(' ')}`}`

### 6. E2E helper

- [x] In `tests/e2e/helpers/actions.ts`, extend the `createCharacter` parameter type to `{ name: string; class: string; race: string; gender?: string }`
- [x] After the race `selectOption` call, add:
  ```ts
  if (character.gender) {
    await page.getByLabel("Character gender").fill(character.gender);
  }
  ```

### 7. E2E tests

- [x] In `tests/e2e/characters.spec.ts`, add a new `describe` block for gender:
  - Test: gender field is present in character creation form (`getByLabel("Character gender")` is visible)
  - Test: gender value persists after save and appears in character list card
  - Test: gender is optional — creating a character without gender still works and displays race normally

## Validation

- [x] Run type checks: `npm run type-check` (or `npx tsc --noEmit`)
- [x] Run build: `npm run build`
- [x] Run E2E tests: `npm run test:e2e` — all existing tests must pass, new gender tests must pass
- [x] Manually verify in browser: create character with gender, edit, confirm card display shows "Female Human" pattern
- [x] All execution tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Type checks** — `npx tsc --noEmit`; must pass with no errors
- **Build** — `npm run build`; must succeed with no errors
- **E2E tests** — `npm run test:e2e`; all tests must pass including new gender tests
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/add-character-gender-field` and push to remote
- [x] Open PR from `feat/add-character-gender-field` to `main`
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address each comment, commit fixes, run remote push validation, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose and fix failures, commit, run remote push validation, push; repeat until all checks pass
- [x] Wait for PR to merge — never force-merge; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: TBD
- Reviewer(s): TBD
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → run remote push validation → push → re-run checks
- Security finding → remediate → commit → run remote push validation → push → re-scan
- Review comment → address → commit → run remote push validation → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required for this change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/add-character-gender-field/` to `openspec/changes/archive/YYYY-MM-DD-add-character-gender-field/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-add-character-gender-field/` exists and `openspec/changes/add-character-gender-field/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d feat/add-character-gender-field`
