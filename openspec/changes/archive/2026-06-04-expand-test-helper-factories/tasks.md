# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/expand-helper-factories` then immediately `git push -u origin test/expand-helper-factories`

## Execution

### task-01 — Rename `importTestHelpers.ts` → `open5eTestHelpers.ts`

- [x] `git mv tests/helpers/importTestHelpers.ts tests/helpers/open5eTestHelpers.ts`
- [x] Add scope-defining header comment at top of `tests/helpers/open5eTestHelpers.ts`:
  ```
  // Open5E-specific test helpers.
  // Contains mock fetch utilities, Open5ECreature/Open5ESpell factories, and mock clients.
  // Only put Open5E raw API shapes here. Generic 5e character shapes go in characterTestHelpers.ts.
  ```
- [x] Search for all imports referencing `importTestHelpers` and update to `open5eTestHelpers`:
  `grep -rn "importTestHelpers" tests/ --include="*.ts"`
- [x] Verify no stale references: `grep -rn "importTestHelpers" tests/` returns zero results

### task-02 — Create `tests/helpers/dndBeyondTestHelpers.ts`

- [x] Create `tests/helpers/dndBeyondTestHelpers.ts` with scope header comment:
  ```
  // DnD Beyond-specific test helpers.
  // Contains factories for raw DnD Beyond API shapes (modifiers, inventory entries, stat blocks).
  // Do NOT put normalized 5e output shapes here — those go in characterTestHelpers.ts.
  ```
- [x] Implement `createModifier(type, subType, value?)` — returns a `DndBeyondModifier`-shaped object; set-type modifiers put value in `fixedValue`, bonus-type in `value`
- [x] Implement `createModifierList(...modifiers)` — variadic, returns the array

### task-03 — Create `tests/helpers/characterTestHelpers.ts`

- [x] Create `tests/helpers/characterTestHelpers.ts` with scope header comment:
  ```
  // Generic D&D 5e character shape factories.
  // Use this file for normalized output shapes shared across all import sources
  // (DnD Beyond, Roll20, Pathbuilder, etc.).
  // Raw source-specific API shapes belong in the source's own helper file.
  ```
- [x] Implement `createAbilityScores(partial?: Partial<AbilityScores>): AbilityScores` — defaults all six stats to 10
- [x] Implement `createClassEntry(className: string, level: number): CharacterClass`
- [x] Move `createImportedCharacterDraft` from `tests/helpers/dndBeyondImport.ts` verbatim, rename to `createCharacterData`
- [x] Import `AbilityScores`, `CharacterClass`, `ImportedCharacterDraft` from `@/lib/types` (or appropriate paths)

### task-04 — Update `tests/helpers/dndBeyondImport.ts`

- [x] Remove `createImportedCharacterDraft` function body (moved to `characterTestHelpers.ts`)
- [x] Add import: `import { createCharacterData } from "@/tests/helpers/characterTestHelpers"`
- [x] Add re-export alias for backward compatibility: `export { createCharacterData as createImportedCharacterDraft }`
  — keeps existing callers working while establishing the new canonical name
- [x] Verify `createNormalizedImportResult`, `createPersistedImportedCharacter`, `createDuplicateNameConflictPayload`, `createImportedCharacterApiPayload` still function correctly (they call `createImportedCharacterDraft` internally)

### task-05 — Update `tests/unit/import/testFactories.ts`

- [x] Replace current content with re-exports from all three helpers:
  - From `open5eTestHelpers.ts`: `createBaseCreature` (alias for `createTestCreature`), `createBaseSpell` (alias for `createTestSpell`)
  - From `characterTestHelpers.ts`: `createAbilityScores`, `createClassEntry`, `createCharacterData`
  - From `dndBeyondTestHelpers.ts`: `createModifier`, `createModifierList`

### task-06 — Replace inline modifier arrays in `dndBeyond-armor-class.test.ts`

- [x] Import `createModifier`, `createModifierList` from `@/tests/helpers/dndBeyondTestHelpers`
- [x] Replace all inline `MockDndBeyondModifier[]` array declarations with `createModifierList(createModifier(...), ...)`
- [x] Remove the local `MockDndBeyondModifier` interface (now provided by the helper)
- [x] Verify: `grep "MockDndBeyondModifier\[\]" tests/unit/import/dndBeyond-armor-class.test.ts` returns zero results

### task-07 — Replace inline `baseAbilityScores` objects across test files

- [x] Identify all files: `grep -rn "baseAbilityScores\s*=" tests/unit/import/ --include="*.ts" -l`
- [x] For each file, import `createAbilityScores` from the appropriate helper and replace the inline object
- [x] Confirm: `grep -rn "baseAbilityScores\s*=" tests/unit/import/` returns zero results

### task-08 — Copy ADR to `openspec/specs/`

- [x] Copy `openspec/changes/expand-test-helper-factories/specs/adr-test-helper-layers.md` to `openspec/specs/adr-test-helper-layers.md`
- [x] Verify the file exists at `openspec/specs/adr-test-helper-layers.md`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `tsc --noEmit` — zero type errors
- [x] `grep -rn "importTestHelpers" tests/` — zero results
- [x] `grep -rn "MockDndBeyondModifier\[\]" tests/unit/import/dndBeyond-armor-class.test.ts` — zero results
- [x] `grep -rn "baseAbilityScores\s*=" tests/unit/import/` — zero results
- [x] `npm run test:unit` — zero failures
- [x] Each helper file opens with a scope-defining header comment
- [x] `openspec/specs/adr-test-helper-layers.md` exists

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `test/expand-helper-factories` to `main`. **PR body must include "Closes #171".**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address them, commit fixes, follow Remote push validation, push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, follow Remote push validation, push; wait 180 seconds then repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user — never force-merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` — copy `specs/character-test-helpers.md`, `specs/dndbeyond-test-helpers.md` to `openspec/specs/` under an appropriate capability folder
- [x] Archive the change: move `openspec/changes/expand-test-helper-factories/` to `openspec/changes/archive/2026-06-04-expand-test-helper-factories/` **in a single commit** (stage copy + deletion together)
- [x] Confirm `openspec/changes/archive/2026-06-04-expand-test-helper-factories/` exists and `openspec/changes/expand-test-helper-factories/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-2026-06-04-expand-test-helper-factories` then `git push -u origin doc/archive-2026-06-04-expand-test-helper-factories`
- [x] Open PR from doc branch to `main` with title `docs: archive expand-test-helper-factories (2026-06-04)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR
- [x] Monitor the doc PR until it merges (same loop as implementation PR)
- [x] Prune merged local branches: `git fetch --prune` && `git branch -d test/expand-helper-factories doc/archive-2026-06-04-expand-test-helper-factories`
