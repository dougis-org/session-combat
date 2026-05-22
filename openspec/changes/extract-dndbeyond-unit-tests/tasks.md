# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/extract-dndbeyond-unit-tests` then immediately `git push -u origin test/extract-dndbeyond-unit-tests`

## Execution

### T1 — Create `dndBeyond-identity.test.ts` (6 tests)

Migrate these tests from `tests/unit/import/dndBeyondCharacterImport.test.ts`, rewriting to call `parseDndBeyondCharacterUrl` and `requireCharacterIdentity` from `lib/import/dndBeyond-identity` directly:

- L46 — rejects a non-URL string
- L52 — rejects unsupported D&D Beyond hosts
- L60 — parses URL with share code
- L72 — URL without share code
- L84 — trims whitespace around URL
- L189 — fails when required character identity is missing (rewrite to call `requireCharacterIdentity` directly)

Verify: `npx jest tests/unit/import/dndBeyond-identity.test.ts` — 6 tests pass

### T2 — Create `dndBeyond-classes.test.ts` (6 tests)

Migrate from monolith, rewriting to call `normalizeClasses`, `normalizeClassEntry`, and `normalizeRace` from `lib/import/dndBeyond-classes` directly:

- L205 — fails when no supported classes remain (rewrite to call `normalizeClasses` with unsupported-only input)
- L230 — merges duplicate supported classes and warns about unsupported ones
- L676 — normalizes Mountain Dwarf successfully (use `mountainDwarfCharacterResponse.data.race` as input to `normalizeRace`)
- L685 — normalizes Aasimar and Artificer successfully
- L695 — normalizes race names with mixed casing and whitespace
- L707 — falls back to base race via substring matching

Verify: `npx jest tests/unit/import/dndBeyond-classes.test.ts` — 6 tests pass

### T3 — Create `dndBeyond-ability-scores.test.ts` (8 tests)

Migrate from monolith, rewriting to call `normalizeAbilityScores`, `normalizeCurrentHp`, and `normalizeMaxHp` from `lib/import/dndBeyond-ability-scores` directly:

- L221 — fails when a required ability score is missing (call `normalizeAbilityScores` with stat ID 6 removed)
- L270 — prefers override values for hit points and ability scores
- L294 — clamps explicit current hit points to the normalized range
- L305 — falls back to removed hit points and clamps health at zero
- L580 — adds hit-points-per-level modifier times total level to max HP
- L602 — adds flat hit-points modifier to max HP
- L623 — adds both per-level and flat HP modifiers to max HP
- L654 — overrideHitPoints ignores HP modifier contributions

Verify: `npx jest tests/unit/import/dndBeyond-ability-scores.test.ts` — 8 tests pass

### T4 — Extend `dndBeyond-armor-class.test.ts` (+5 tests)

Append to the existing file, calling `normalizeArmorClass` and `getUnarmoredAcBonus` from `lib/import/dndBeyond-armor-class`:

- L154 — uses armor type rules when calculating armor class (medium/heavy/no armor cases)
- L488 — applies set unarmored-armor-class modifier to unarmored AC
- L509 — applies bonus unarmored-armor-class modifier to unarmored AC
- L530 — combines set and bonus unarmored-armor-class modifiers in unarmored AC
- L558 — uses maximum of multiple set unarmored-armor-class modifiers regardless of order

Verify: `npx jest tests/unit/import/dndBeyond-armor-class.test.ts` — all pre-existing + 5 new tests pass

### T5 — Create `dndBeyond-skills-senses.test.ts` (1 test)

Migrate from monolith, calling `normalizeSenses` from `lib/import/dndBeyond-skills-senses`:

- L440 — omits speed when missing and defaults passive senses from abilities

Verify: `npx jest tests/unit/import/dndBeyond-skills-senses.test.ts` — 1 test passes

### T6 — Create `dndBeyond-defenses.test.ts` (new tests from scratch)

Read `lib/import/dndBeyond-defenses.ts` source in full. Write new tests covering all 3 exports:

**`normalizeImmunities`:**
- separates damage immunities (e.g., "poison") from condition immunities (e.g., "poisoned")
- deduplicates repeated immunity entries
- returns empty arrays when no immunity modifiers present
- uses `friendlySubtypeName` when available, falls back to titleized `subType`

**`normalizeByModifierType`:**
- returns only modifiers of the specified type
- deduplicates and titleizes results
- returns empty array when no matching modifiers

**`normalizeLanguages`:**
- extracts language modifiers and titleizes them
- returns empty array when no language modifiers present

Verify: `npx jest tests/unit/import/dndBeyond-defenses.test.ts` — all new tests pass

### T7 — Check and extend `dndBeyond-abilities.test.ts` if needed (1 test)

Read `tests/unit/import/dndBeyond-abilities.test.ts`. Check if "omits actions whose sanitized descriptions are empty" (L464) behavior is already covered. If not, migrate the test, calling `normalizeAbilities` directly.

Verify: `npx jest tests/unit/import/dndBeyond-abilities.test.ts` — all tests pass

### T8 — Shrink `dndBeyondCharacterImport.test.ts` to 3 orchestration tests

Remove the 27 migrated single-domain tests from the monolith. Keep exactly:
- L96 — normalizes a public D&D Beyond character into the local model (full snapshot)
- L136 — coerces unsupported optional values to safe defaults and reports warnings
- L315 — normalizes languages, senses, defenses, and narrative abilities

Also remove the module-level setup variables (`sampleStats`, `sampleBonusStats`, `sampleOverrideStats`, `sampleModifiers`, `sampleClassModifiers`) if they are no longer needed by the remaining 3 tests.

Verify: `npx jest tests/unit/import/dndBeyondCharacterImport.test.ts` — exactly 3 tests pass

## Validation

- [x] `npx jest tests/unit/import/` — all tests pass, total count ≥ pre-migration count
- [x] `npx tsc --noEmit` — no TypeScript errors
- [x] Confirm no new test file imports from `lib/dndBeyondCharacterImport` (grep check): `grep -r "dndBeyondCharacterImport" tests/unit/import/dndBeyond-*.test.ts` → should return nothing
- [x] Confirm monolith has exactly 3 tests remaining
- [x] Confirm all 7 module test files exist: `ls tests/unit/import/dndBeyond-*.test.ts`
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest tests/unit/`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Commit all changes to `test/extract-dndbeyond-unit-tests` and push to remote
- [ ] Open PR from `test/extract-dndbeyond-unit-tests` to `main`
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each one, commit fixes, validate locally, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose and fix any failure, commit, validate locally, push; repeat until all checks pass
- [ ] Wait for PR to merge — never force-merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated PR review
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks as complete
- [ ] No documentation changes required (test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [ ] Archive the change: move `openspec/changes/extract-dndbeyond-unit-tests/` to `openspec/changes/archive/YYYY-MM-DD-extract-dndbeyond-unit-tests/` — stage both the copy and deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-dndbeyond-unit-tests/` exists and `openspec/changes/extract-dndbeyond-unit-tests/` is gone
- [ ] Commit and push the archive commit to main
- [ ] `git fetch --prune` and `git branch -d test/extract-dndbeyond-unit-tests`
