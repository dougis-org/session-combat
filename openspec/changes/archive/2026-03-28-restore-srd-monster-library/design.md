## Context

`lib/data/monsters/index.ts` currently exports `ALL_SRD_MONSTERS = []`. The 14 category files (aberrations through undead) were deleted in commit `064c546` because their data used a "raw D&D 5e API format" incompatible with the current `MonsterTemplate` type. The data exists in git history at commit `1743fd4` and needs to be recovered and transformed.

The `MonsterTemplate` type (in `lib/types.ts`) requires:
- `speed: string` (e.g. `"30 ft., swim 40 ft."`)
- `abilityScores: AbilityScores` with keys `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`
- `savingThrows?: Partial<Record<keyof AbilityScores, number>>` (full names)
- `senses?: Record<string, string>` (object, not string)
- `maxHp: number` (required)
- `size`: lowercase union `"tiny" | "small" | "medium" | "large" | "huge" | "gargantuan"`
- No extra fields (`armorType`, `hitDice`, `hitPoints`)

## Goals / Non-Goals

**Goals:**
- Restore all 14 category files with data that compiles cleanly against `MonsterTemplate`
- Re-enable `lib/data/monsters/index.ts` imports so `ALL_SRD_MONSTERS` exports 334 monsters
- Add a unit test that permanently guards against the empty-array and type-mismatch regressions

**Non-Goals:**
- Changing the `MonsterTemplate` type or the seeding API
- Modifying any UI code
- Adding monsters beyond the 334 in git history

## Decisions

### D1: One-time transformation script over manual editing

**Decision:** Write a Node.js script (`scripts/transform-monster-data.mjs`) that reads each category file from git history, applies all field transformations, and writes the new TypeScript source files. Delete the script after use.

**Why:** 334 monsters across 14 files = thousands of lines. Manual editing is error-prone and slow. A script applies transformations consistently and can be re-run if the target type changes again.

**Alternative considered:** Patch the files with `sed`/`awk`. Rejected — the nested structure (speed objects, senses strings) requires structural awareness, not line-level text substitution.

**Alternative considered:** Runtime normalization in the API route. The PUT handler already has partial normalization (`abilities → abilityScores`, `hp → maxHp`), but this doesn't fix the TypeScript compile errors in the data files themselves, and leaves the type contract broken.

### D2: Transform data at source (in the files), not at consumption

**Decision:** The category files export correctly-typed `MonsterTemplate` data. Consumers (`index.ts`, `seedMonsters.ts`, the API route) import without any runtime conversion.

**Why:** The type contract is enforced at compile time. If data ever drifts from `MonsterTemplate` again, TypeScript catches it immediately rather than at runtime.

**Alternative considered:** Add a normalization step in `index.ts`. Rejected — it hides the type contract and means the category files are always subtly wrong.

### D3: Transformation rules (all confirmed from git history analysis)

**Speed** (object → string):
- `{walk: "30 ft."}` → `"30 ft."` (walk key omitted, just value)
- `{walk: "30 ft.", fly: "60 ft."}` → `"30 ft., fly 60 ft."` (non-walk keys prefixed)
- `{speed: "30 ft."}` → `"30 ft."` (self-referential `speed` key treated as walk)
- Key order: walk first, then alphabetical remainder

**abilities → abilityScores**: Simple rename. Inner keys are already full names (`strength`, `dexterity`, etc.) — no inner-key changes needed.

**savingThrows** (abbreviations → full names):
- `str→strength`, `dex→dexterity`, `con→constitution`
- `int→intelligence`, `wis→wisdom`, `cha→charisma`

**senses** (string → `Record<string, string>`):
- Split on `", "` (comma-space) to get individual sense entries
- Each entry: first token = key, remaining tokens = value
- Example: `"darkvision 120 ft., passive_perception 20"` → `{ darkvision: "120 ft.", passive_perception: "20" }`
- Edge case: `"blindsight 30 ft. (blind beyond this radius)"` → key: `blindsight`, value: `"30 ft. (blind beyond this radius)"` — splitting on first space handles parenthesized text correctly

**maxHp**: Add `maxHp: hp` (all monsters in the data have only `hp`)

**size**: `.toLowerCase()` — all 6 valid values are lowercase in the MonsterTemplate union

**Extra fields**: Delete `armorType`, `hitDice`, `hitPoints` from each monster object

### D4: Script implementation approach (AST-free)

**Decision:** The transformation script operates on the parsed JavaScript data, not on the TypeScript AST. It uses `eval`-safe extraction: strip the TypeScript type annotation and import lines, eval the array literal, transform each object, then serialize to TypeScript source.

**Why:** TypeScript AST tools (ts-morph, ts-node) add dev dependencies and complexity. Since all 14 files follow identical structure (import + typed const export of array literal), regex stripping of the header + JSON serialization of the body is sufficient and dependency-free.

**Serialization format:** Each monster object is written as a plain TypeScript object literal with consistent 2-space indentation, matching the existing code style.

### D5: Test placement

**Decision:** New test at `tests/unit/monsterLibrary.test.ts` using the existing Jest/Vitest framework already in use.

**Why:** This is a pure unit test — no database, no server. The test imports `ALL_SRD_MONSTERS` directly and validates shape. It will catch both the empty-array regression (if someone zeroes the index again) and the type regression (if a field transformation is missed).

## Risks / Trade-offs

**[Risk] Senses parsing edge cases** → The regex `split(" ")[0]` for the sense key is safe because all 5 sense types (`blindsight`, `darkvision`, `passive_perception`, `tremorsense`, `truesight`) are single underscore-joined words with no spaces. Parenthetical suffixes appear only in the value portion.

**[Risk] TypeScript `Omit<MonsterTemplate, ...>` type in category files** → The files will continue to use `Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[]` as their type (matching pre-deletion state). The `index.ts` spread into `ALL_SRD_MONSTERS: MonsterTemplate[]` is technically a widening — the route's `insertMany` assigns `id`, `userId`, `createdAt`, `updatedAt`.

**[Risk] Script eval of git history content** → The script uses Node.js `vm.runInNewContext` (not naked `eval`) to safely extract the array literal from each TypeScript source string. The git content is trusted (our own repo history), but VM sandboxing is used defensively.

**[Risk] 334-entry TypeScript files may slow Turbopack/build** → This was already the case before deletion (`064c546` notes "Fix block comment parsing in monsters/index.ts (Turbopack issue)"). The Turbopack issue was a comment syntax problem, not a file size problem. If build performance regresses, files can be split further or lazy-loaded.

## Rollback / Mitigation

If the restoration introduces TypeScript errors or build failures:
- The change is entirely additive (restoring deleted files + new test)
- Rollback = delete the 14 category files + revert `index.ts` to empty export
- No database migrations, no API changes, no user-visible state to undo

If CI remains blocked: fix TypeScript errors in the specific file before merging. The new unit test must pass as a gate.

## Open Questions

None. All transformation rules are confirmed from exhaustive analysis of the git history data.

## Proposal → Design Mapping

| Proposal element | Design decision |
|-----------------|----------------|
| Restore 14 category files | D1: transformation script; D4: script approach |
| Fix type mismatches | D2: transform at source; D3: transformation rules |
| Re-enable index.ts imports | D2 (consequence of correct types) |
| Add regression test | D5: test placement and scope |
| Delete transformation script | D1 |
