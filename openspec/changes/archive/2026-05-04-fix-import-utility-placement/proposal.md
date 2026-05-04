## GitHub Issues

- #173
- #176
- #159 (partial — `flattenModifiers` placement)

## Why

- **Problem statement:** Three corrections are needed to the import utility split established in the extract-generic-import-helpers change. `utils.ts` carries a DnD Beyond type dependency it should not have; `dndBeyond-utils.ts` contains fully generic helpers that belong in `utils.ts`; and `flattenModifiers` is planned for `dndBeyond-identity.ts` but is a shared utility needed by multiple extraction modules.
- **Why now:** Issues 153–159 are the next implementation wave. Each depends on a clean `utils.ts` / `dndBeyond-utils.ts` boundary. Fixing the boundary now costs ~1 hour; fixing it after 5–7 domain modules are written costs much more.
- **Business/user impact:** No user-visible behavior change. Enables import tooling reuse for future providers (Open5E adapters, other character import sites).

## Problem Space

- **Current behavior:**
  - `lib/import/utils.ts` imports `DndBeyondModifier` from `lib/dndBeyondCharacterImport.ts`, making the supposedly-generic file depend on a provider-specific type.
  - `lib/import/dndBeyond-utils.ts` exports `isPresent<T>()`, `escapeRegExp()`, and `ABILITY_KEYS` — three utilities with zero DnD Beyond dependency.
  - Issue 159 plans `flattenModifiers()` to live in `dndBeyond-identity.ts`, but skills, defenses, and armor-class modules all need it, creating awkward cross-domain imports.
- **Desired behavior:**
  - `utils.ts` is fully provider-agnostic: no imports from `dndBeyondCharacterImport` or any `dndBeyond-*` file.
  - `dndBeyond-utils.ts` contains only DnD Beyond-specific code.
  - `flattenModifiers()` lives in `dndBeyond-utils.ts` as a shared DnD Beyond helper.
- **Constraints:** Zero behavior change — all functions remain identical; only type signatures and file locations change.
- **Assumptions:** `DndBeyondModifier` already structurally satisfies the proposed `ModifierLike` interface, so no call-site casts are needed.
- **Edge cases considered:** `ABILITY_KEYS` is currently derived from `ABILITY_ID_MAP` via `Object.values`. Defining it independently in `utils.ts` must produce the same six values in consistent order (`strength → charisma`).

## Scope

### In Scope

- Define `ModifierLike` interface in `utils.ts`; change `isDamageTypeModifier` parameter from `DndBeyondModifier` to `ModifierLike`; remove the `DndBeyondModifier` import from `utils.ts`
- Move `isPresent<T>()` and `escapeRegExp()` from `dndBeyond-utils.ts` to `utils.ts`
- Define `ABILITY_KEYS` independently in `utils.ts`; remove it from `dndBeyond-utils.ts`; update any internal `dndBeyond-utils.ts` usages to import from `utils.ts`
- Move `flattenModifiers()` from `lib/dndBeyondCharacterImport.ts` into `lib/import/dndBeyond-utils.ts` (ahead of issue 159's extraction)
- Update all import sites affected by the above moves

### Out of Scope

- Any domain normalization extraction (issues 153–159 remain separate)
- Moving `ABILITY_ID_MAP` (it is DnD Beyond-specific and stays in `dndBeyond-utils.ts`)
- Changes to `lib/server/dndBeyondCharacterImport.ts`
- Open5E adapter changes
- Test file behavior changes (imports in test files may need updating but no logic changes)

## What Changes

- `lib/import/utils.ts` — new `ModifierLike` interface; updated `isDamageTypeModifier` signature; added `isPresent`, `escapeRegExp`, `ABILITY_KEYS`; removed `DndBeyondModifier` import
- `lib/import/dndBeyond-utils.ts` — removed `isPresent`, `escapeRegExp`, `ABILITY_KEYS`; added `flattenModifiers`; imports `ABILITY_KEYS` from `utils.ts` if needed internally
- `lib/dndBeyondCharacterImport.ts` — removes `flattenModifiers` (moved); updates import references for moved symbols
- Any test files that import `isPresent`, `escapeRegExp`, or `ABILITY_KEYS` from `dndBeyond-utils.ts` — update import paths

## Risks

- Risk: A test file imports `isPresent` or `escapeRegExp` directly from `dndBeyond-utils.ts` and is not updated.
  - Impact: TypeScript compile error (caught before merge).
  - Mitigation: Run `tsc --noEmit` and full test suite as part of implementation verification.
- Risk: `ABILITY_KEYS` defined independently in `utils.ts` differs in order or content from the `Object.values(ABILITY_ID_MAP)` derivation.
  - Impact: Any code iterating `ABILITY_KEYS` produces wrong results.
  - Mitigation: Explicitly define as `["strength","dexterity","constitution","intelligence","wisdom","charisma"]` (same order as `ABILITY_ID_MAP` entries 1–6). Add a type annotation `ReadonlyArray<keyof AbilityScores>` so TypeScript catches any typos.

## Open Questions

No unresolved ambiguity. The changes are mechanical moves with well-defined source and destination files. The `ModifierLike` interface shape is directly derivable from the existing `isDamageTypeModifier` body.

## Non-Goals

- Do not create a new layer of abstraction (no "provider interface" or adapter pattern — that is future work).
- Do not rename existing functions.
- Do not change any runtime behavior.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
