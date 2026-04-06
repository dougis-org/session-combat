# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/expand-race-class-support` then immediately `git push -u origin feat/expand-race-class-support`

## Execution

### 1. Update Domain Types
- [x] 1.1 Add "Artificer" and "Blood Hunter" to `DnDClass` and `VALID_CLASSES` in `lib/types.ts`
- [x] 1.2 Add core species (Aasimar, Goliath, Orc) and common subraces (Mountain Dwarf, High Elf, etc.) to `DnDRace` and `VALID_RACES` in `lib/types.ts`

### 2. Enhance Normalization Logic
- [x] 2.1 Update `normalizeRace` in `lib/dndBeyondCharacterImport.ts` to support case-insensitive and trimmed matching
- [x] 2.2 Add substring fallback logic to `normalizeRace` for mapping unknown subraces to base races

### 3. Update Test Fixtures
- [x] 3.1 Update `unsupportedDndBeyondCharacterResponse` in `tests/fixtures/dndBeyondCharacter.ts` to use a truly unsupported race
- [x] 3.2 Add `mountainDwarfCharacterResponse` fixture
- [x] 3.3 Add `aasimarArtificerCharacterResponse` fixture

### 4. Implement Unit Tests
- [x] 4.1 Add test case for "Mountain Dwarf" support in `tests/unit/import/dndBeyondCharacterImport.test.ts`
- [x] 4.2 Add test case for "Aasimar" and "Artificer" support
- [x] 4.3 Add test case for case-insensitive matching (e.g., "dwarf" -> "Dwarf")
- [x] 4.4 Add test case for substring fallback (e.g., "Custom Elf" -> "Elf")

## Validation

- [x] Run unit tests: `npm run test:unit -- tests/unit/import/dndBeyondCharacterImport.test.ts`
- [x] Run integration tests: `npm run test:integration -- --runInBand tests/integration/import`
- [x] Run linting: `npm run lint`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] **Monitor PR comments** — address, validate, and push until resolved
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose and fix any failures until all pass
- [x] Wait for the PR to merge

Ownership metadata:
- Implementer: Gemini CLI
- Reviewer(s): dougis
- Required approvals: 1

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/dnd-beyond-character-import/spec.md`
- [x] Archive the change: move `openspec/changes/expand-race-and-class-support/` to `openspec/archive/2026-04-06-expand-race-and-class-support/`
- [x] Commit and push the archive to the default branch
- [x] Prune merged local feature branches
