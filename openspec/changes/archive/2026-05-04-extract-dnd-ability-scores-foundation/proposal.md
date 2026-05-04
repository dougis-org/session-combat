## GitHub Issues

- #150

## Why

- Problem statement: `lib/dndBeyondCharacterImport.ts` is 1,023 lines with 18 tightly-coupled normalizer functions, driving Codacy cognitive complexity well above the project target of ≤150.
- Why now: This is the first and foundation extraction in a planned series (issues 150–159). Subsequent extractions depend on the shared helper files established here.
- Business/user impact: No user-visible change. Improved maintainability and lower cognitive complexity scores reduce the risk of introducing bugs in future character import work.

## Problem Space

- Current behavior: All DnD Beyond normalization logic — ability scores, HP, shared math helpers, and DnD Beyond-specific utilities — lives in a single 1,023-line file with no modular boundaries.
- Desired behavior: Generic D&D math helpers live in `lib/import/utils.ts`, DnD Beyond-shared utilities live in `lib/import/dndBeyond-utils.ts`, and ability score / HP normalizers live in `lib/import/dndBeyond-ability-scores.ts`. The original file imports from these new modules with no behavior change.
- Constraints: This must be a pure no-op refactor. No logic may change. All existing tests must pass without modification.
- Assumptions: `getAbilityModifier` and `getProficiencyBonus` are generic enough to be useful to any future D&D provider (e.g., Open5E). `sumModifierBonusesBySubtype`, `ABILITY_ID_MAP`, `ABILITY_KEYS`, `indexStatValues`, and `resolveAbilityScore` are DnD Beyond-specific and belong in `dndBeyond-utils.ts`.
- Edge cases considered: `sumModifierBonusesBySubtype` is also called by `normalizeArmorClass`, `normalizeSavingThrows`, and `normalizeSkills` — these remain in the original file for now and will import from `dndBeyond-utils.ts`. Similarly `getAbilityModifier` is called by functions not yet extracted; they will import from `utils.ts`.

## Scope

### In Scope

- Create `lib/import/utils.ts` with `getAbilityModifier()` and `getProficiencyBonus()`
- Create `lib/import/dndBeyond-utils.ts` with `ABILITY_ID_MAP`, `ABILITY_KEYS`, `indexStatValues()`, `resolveAbilityScore()`, `sumModifierBonusesBySubtype()`
- Create `lib/import/dndBeyond-ability-scores.ts` with `normalizeAbilityScores()`, `normalizeMaxHp()`, `normalizeCurrentHp()`
- Update `lib/dndBeyondCharacterImport.ts` to import from the three new files (no logic changes)

### Out of Scope

- Extracting any other normalizer functions (issues 151–159)
- Moving `lib/dndBeyondCharacterImport.ts` itself into `lib/import/`
- Any changes to `lib/server/dndBeyondCharacterImport.ts`
- Modifying test files
- Changing function signatures or behavior

## What Changes

- `lib/import/utils.ts` — new file; two generic math helpers extracted from the original
- `lib/import/dndBeyond-utils.ts` — new file; five DnD Beyond shared helpers extracted from the original
- `lib/import/dndBeyond-ability-scores.ts` — new file; three ability score / HP normalizers extracted from the original
- `lib/dndBeyondCharacterImport.ts` — updated imports only; all internal call sites now point to the three new modules

## Risks

- Risk: Import path mistakes cause `lib/server/dndBeyondCharacterImport.ts` to break silently.
  - Impact: Server-side character import fails at runtime.
  - Mitigation: TypeScript compilation catches missing imports. Run `tsc --noEmit` as part of acceptance.
- Risk: A function is duplicated rather than moved, leaving a stale copy in the original.
  - Impact: Future edits to the wrong copy diverge silently.
  - Mitigation: After extraction, the original file must not define the moved functions — only import them.

## Open Questions

No unresolved ambiguity exists. Architecture decisions were made in the preceding exploration session: flat naming (`dndBeyond-*.ts`) at `lib/import/`, two-tier utility split (`utils.ts` generic, `dndBeyond-utils.ts` provider-specific), confirmed no subfolder structure.

## Non-Goals

- Reducing the public API surface of `lib/dndBeyondCharacterImport.ts`
- Performance improvements
- Adding new test coverage beyond what already exists
- Establishing an index/barrel file for `lib/import/`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
