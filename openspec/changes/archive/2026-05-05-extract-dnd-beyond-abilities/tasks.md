# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b extract-dnd-beyond-abilities` then immediately `git push -u origin extract-dnd-beyond-abilities`

## Execution

### Task 1: Create lib/import/dndBeyond-abilities.ts with normalized ability functions

Implements: Issue #154 main extraction

- [x] Create file `lib/import/dndBeyond-abilities.ts`
- [x] Export constants:
  - `ACTIONS_BY_ACTIVATION_TYPE` — mapping DnD Beyond activationType IDs to category names
  - `TRAIT_TITLE_MAP` — humanizing trait field names
  - `NOTE_TITLE_MAP` — humanizing note field names
- [x] Implement and export `normalizeAbilities(actions, traits, notes)`:
  - Signature: `function normalizeAbilities(actions: Record<string, DndBeyondActionEntry[] | null> | null | undefined, traits: Record<string, string | null> | null | undefined, notes: Record<string, string | null> | null | undefined): { traits: CreatureAbility[], actions: CreatureAbility[], bonusActions: CreatureAbility[], reactions: CreatureAbility[] }`
  - Collects validation warnings (invalid action entries)
  - Throws `DndBeyondImportError` if warnings.length > 1
  - Returns categorized abilities on success
- [x] Implement (not exported) `normalizeActionEntry(entry: DndBeyondActionEntry): CreatureAbility | null`:
  - Validates name, snippet/description presence
  - Sanitizes HTML from description
  - Returns null if validation fails (collected as warning)
- [x] Implement (not exported) `pushAbilityByActivation(categorizedAbilities, entry, ability): void`:
  - Uses `ACTIONS_BY_ACTIVATION_TYPE` to map activation IDs to category names
  - Defaults to "actions" for unknown activation types
- [x] Import required types and utilities:
  - `import { DndBeyondActionEntry } from "../dndBeyondCharacterImport"`
  - `import { CreatureAbility, ValidationError } from "../types"`
  - `import { DndBeyondImportError } from "./dndBeyond-utils"`
  - `import { sanitizeHtmlSnippet, mapNarrativeEntries, titleize } from "./utils"`

### Task 2: Move generic functions to lib/import/utils.ts

Implements: Generic helper extraction

- [x] Copy `sanitizeHtmlSnippet()` from `lib/dndBeyondCharacterImport.ts` to `lib/import/utils.ts`
  - Signature: `function sanitizeHtmlSnippet(snippet: string): string`
  - Strips HTML tags, normalizes whitespace
  - No provider-specific logic
- [x] Copy `mapNarrativeEntries()` from `lib/dndBeyondCharacterImport.ts` to `lib/import/utils.ts`
  - Signature: `function mapNarrativeEntries(entries: Record<string, string | null> | null | undefined, titleMap: Record<string, string>): CreatureAbility[]`
  - Converts record of strings to ability array with title mapping
  - Uses `titleize()` for unmapped keys
  - Filters null and empty values
- [x] Add both to the exports of `lib/import/utils.ts`
- [x] Verify no DnD Beyond-specific types are imported in utils.ts

### Task 3: Update lib/dndBeyondCharacterImport.ts to use extracted functions

Implements: Integration with main import flow

- [x] Remove the following from `lib/dndBeyondCharacterImport.ts`:
  - Function `normalizeAbilities()`
  - Function `normalizeActionEntry()`
  - Function `pushAbilityByActivation()`
  - Function `sanitizeHtmlSnippet()`
  - Function `mapNarrativeEntries()`
  - Constants: `ACTIONS_BY_ACTIVATION_TYPE`, `TRAIT_TITLE_MAP`, `NOTE_TITLE_MAP`
- [x] Add import: `import { normalizeAbilities } from "./import/dndBeyond-abilities";`
- [x] Find call to `normalizeAbilities()` in `normalizeDndBeyondCharacter()` and verify it now resolves to the imported function
- [x] Verify the call signature matches: `const abilities = normalizeAbilities(data.actions, data.traits, data.notes);`

### Task 4: Write unit tests for dndBeyond-abilities.ts

Implements: Spec acceptance criteria

- [x] Create test file: `tests/unit/import/dndBeyond-abilities.test.ts` (or add to existing test file if preferred)
- [x] Test `normalizeAbilities()`:
  - Scenario: All categories normalize correctly (actions, bonusActions, reactions, traits separated)
  - Scenario: Null/undefined inputs handled gracefully
  - Scenario: Single invalid entry (warning) passes; function succeeds
  - Scenario: Two invalid entries fail with DndBeyondImportError thrown
  - Scenario: HTML sanitized without warnings (expected behavior)
  - Scenario: Empty trait/note values silently filtered
- [x] Test `normalizeActionEntry()` via normalizeAbilities:
  - Scenario: Valid entry converts correctly
  - Scenario: Missing name filtered out (warning)
  - Scenario: Missing description filtered out (warning)
  - Scenario: Sanitized description empty filtered out (warning)
- [x] Test `pushAbilityByActivation()` via normalizeAbilities:
  - Scenario: activationType 3 → bonusActions
  - Scenario: activationType 4 → reactions
  - Scenario: activationType 1 or null → actions (default)
- [x] Test constants:
  - Verify `TRAIT_TITLE_MAP` contains all expected keys (personalityTraits, ideals, bonds, flaws, appearance)
  - Verify `NOTE_TITLE_MAP` contains all expected keys (backstory, allies, enemies, organizations, otherNotes)
  - Verify `ACTIONS_BY_ACTIVATION_TYPE` contains DnD Beyond activation ID mappings

### Task 5: Write unit tests for generic utils functions

Implements: Spec acceptance criteria for generic helpers

- [x] Create or update test file: `tests/unit/import/utils.test.ts`
- [x] Test `sanitizeHtmlSnippet()`:
  - Scenario: Removes HTML tags, preserves content
  - Scenario: Normalizes whitespace (multiple spaces, newlines)
  - Scenario: Empty or whitespace-only input → empty string
- [x] Test `mapNarrativeEntries()`:
  - Scenario: Maps entries with title map correctly
  - Scenario: Falls back to titleize() for unmapped keys
  - Scenario: Filters null values
  - Scenario: Filters empty strings

### Task 6: Update existing dndBeyondCharacterImport.test.ts

Implements: Preservation of existing test coverage

- [x] Run existing tests with refactored code: `npm run test -- tests/unit/dndBeyondCharacterImport.test.ts`
- [x] Verify all tests pass without modification
- [x] If any tests fail due to import paths, update imports to use new modules
- [x] Confirm `normalizeDndBeyondCharacter()` output matches pre-refactor baseline (same NormalizedDndBeyondCharacter structure)

### Task 7: Integration verification

Implements: End-to-end validation

- [x] Test with sample D&D Beyond character data:
  - Import a test character using the refactored flow
  - Verify abilities appear in the correct categories (actions, bonusActions, reactions)
  - Verify traits and notes are mapped with correct titles
  - Verify no functional changes from pre-refactor behavior
- [x] Run full test suite: `npm run test`
- [x] Run build: `npm run build`
- [x] No type errors, no regressions

## Validation

- [x] All unit tests pass: `npm run test -- tests/unit/import/dndBeyond-abilities.test.ts tests/unit/import/utils.test.ts`
- [x] All existing import tests pass: `npm run test -- tests/unit/import/ tests/unit/dndBeyondCharacterImport.test.ts`
- [x] Type checking passes: `npm run build` (includes type check)
- [x] Build succeeds: `npm run build`
- [x] No linting errors: `npm run lint`

## Remote push validation

Verification requirements (all must pass before PR):

- **Unit tests** — `npm run test` must pass all tests
- **Integration tests** — `npm run test:integration` must pass (if applicable to this change)
- **Build** — `npm run build` must succeed
- **Type checks** — `npm run type-check` must pass
- **Linting** — `npm run lint` must pass with no new errors

If ANY fail, diagnose and fix before proceeding to PR.

## PR and Merge

- [ ] Run pre-PR self-review (from `skills/openspec-apply-change/SKILL.md`)
- [ ] Commit all changes: `git add -A && git commit -m "refactor: Extract actions/traits normalization to dndBeyond-abilities.ts (issue #154)"`
- [ ] Push to remote: `git push origin extract-dnd-beyond-abilities`
- [ ] Open PR: `gh pr create --base main --head extract-dnd-beyond-abilities --title "refactor: Extract actions/traits normalization (issue #154)" --body "See openspec/changes/extract-dnd-beyond-abilities/proposal.md for details"`
- [ ] Wait 180 seconds for CI to start and reviewers to post initial feedback
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear:
  - Address each comment by fixing code
  - Follow all steps in [Remote push validation]
  - Commit and push: `git add -A && git commit -m "refactor: Address review comments"` → `git push origin extract-dnd-beyond-abilities`
  - Wait 180 seconds
  - Repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any check fails:
  - Diagnose and fix the failure
  - Follow all steps in [Remote push validation]
  - Commit and push: `git add -A && git commit -m "fix: Address CI failure"` → `git push origin extract-dnd-beyond-abilities`
  - Wait 180 seconds
  - Repeat until all checks pass
- [ ] **Poll for merge** — run `gh pr view --json state` after each iteration; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: (assigned by user)
- Reviewer(s): Code quality, provider-agnostic validation
- Required approvals: 1 approval (code review)

Blocking resolution flow:

- CI failure → diagnose → fix → validate locally → push → re-run checks
- Review comment → address → validate locally → push → confirm resolved
- Type/build errors → fix → validate locally → push

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main branch
- [ ] Mark all remaining tasks as complete
- [ ] Update `CONTRIBUTING.md` if documentation of the multi-provider pattern is needed
- [ ] Sync approved spec deltas into `openspec/specs/dndBeyond-abilities/spec.md` (if specs diverged during review)
- [ ] Archive the change:
  - Create archive directory: `mkdir -p openspec/changes/archive/$(date +%Y-%m-%d)-extract-dnd-beyond-abilities/`
  - Copy all artifacts: `cp -r openspec/changes/extract-dnd-beyond-abilities/* openspec/changes/archive/$(date +%Y-%m-%d)-extract-dnd-beyond-abilities/`
  - Remove original: `rm -rf openspec/changes/extract-dnd-beyond-abilities/`
  - Stage both copy and delete: `git add -A`
  - Commit atomically: `git commit -m "archive: Extract dnd-beyond-abilities change (merged $(date +%Y-%m-%d))"`
  - Push: `git push origin main`
- [ ] Verify archive exists: `ls openspec/changes/archive/$(date +%Y-%m-%d)-extract-dnd-beyond-abilities/`
- [ ] Verify original is deleted: `ls openspec/changes/extract-dnd-beyond-abilities/` should fail
- [ ] Clean up local branches: `git fetch --prune && git branch -d extract-dnd-beyond-abilities`
- [ ] Update `.wolf/memory.md` with session summary (one-line entry with time, description, files, outcome, ~tokens)
