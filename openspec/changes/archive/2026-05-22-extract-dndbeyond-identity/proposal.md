## GitHub Issues

- #159

## Why

- Problem statement: `lib/dndBeyondCharacterImport.ts` contains alignment and character identity helpers (`parseUrlOrThrow`, `isSupportedDndBeyondHostname`, `parseDndBeyondCharacterUrl`, `requireCharacterIdentity`, `buildNormalizationWarnings`, `normalizeAlignment`) mixed in with the top-level orchestration logic, increasing file size and coupling.
- Why now: Issue #159 is the final extraction in the 150–159 refactor series. Its blocker (issue #173, `ModifierLike` / `isDamageTypeModifier` decoupling) is closed. All prerequisites are met.
- Business/user impact: No user-facing behavior changes. Improves maintainability, reduces `lib/dndBeyondCharacterImport.ts` surface area, and establishes a clean module boundary for identity/URL logic consistent with the provider-agnostic architecture pattern.

## Problem Space

- Current behavior: Five identity-related functions and one URL helper live directly in `lib/dndBeyondCharacterImport.ts` alongside orchestration code. `flattenModifiers` has already been moved to `dndBeyond-utils.ts`.
- Desired behavior: All alignment and character identity helpers live in `lib/import/dndBeyond-identity.ts`, imported by `lib/dndBeyondCharacterImport.ts` as needed.
- Constraints:
  - `flattenModifiers` is already in `dndBeyond-utils.ts` — do not move it again.
  - Generic alignment normalization (`normalizeAlignment(alignment: unknown)`) already exists in `lib/types.ts` — no generic `identity.ts` should be created.
  - `normalizeAlignment(alignmentId: number)` in the source file must be renamed to `normalizeAlignmentId` to avoid a name collision with the `lib/types.ts` export.
  - The `CharacterIdentity` interface is internal to the orchestrator; evaluate whether it belongs in the new module or stays local.
  - All existing tests must continue to pass without modification.
- Assumptions:
  - `parseDndBeyondCharacterUrl` is exported from `dndBeyondCharacterImport.ts`; it must remain exported (from the new module, re-exported if needed).
  - No other files outside `lib/dndBeyondCharacterImport.ts` import the functions being moved.
- Edge cases considered:
  - `ALIGNMENT_ID_MAP` and `CANONICAL_HOST` / `CHARACTER_PATH_PATTERN` constants are private to the moved functions — they move with them.
  - `requireCharacterIdentity` depends on `createValidationError` from `dndBeyond-utils.ts`; that import moves to the new file.

## Scope

### In Scope

- Create `lib/import/dndBeyond-identity.ts` with: `parseUrlOrThrow`, `isSupportedDndBeyondHostname`, `parseDndBeyondCharacterUrl`, `requireCharacterIdentity`, `buildNormalizationWarnings`, `normalizeAlignmentId` (renamed from `normalizeAlignment`).
- Move associated private constants: `ALIGNMENT_ID_MAP`, `CANONICAL_HOST`, `CHARACTER_PATH_PATTERN`.
- Move `CharacterIdentity` interface into the new module (or keep it co-located if only used internally — evaluate during design).
- Update `lib/dndBeyondCharacterImport.ts` to import from `lib/import/dndBeyond-identity.ts` and remove the moved code.
- Rename `normalizeAlignment` → `normalizeAlignmentId` at definition and all call sites.
- Ensure `parseDndBeyondCharacterUrl` remains publicly accessible (exported from the new module).

### Out of Scope

- Creating a generic `lib/import/identity.ts` — the generic alignment logic already lives in `lib/types.ts`.
- Moving `flattenModifiers` — already done in a prior issue.
- Changes to `lib/server/dndBeyondCharacterImport.ts`.
- Modifying test files (tests should pass unchanged).
- Any other extraction from `lib/dndBeyondCharacterImport.ts` beyond the functions listed above.

## What Changes

- New file: `lib/import/dndBeyond-identity.ts`
- Modified file: `lib/dndBeyondCharacterImport.ts` — functions removed, replaced with imports
- `normalizeAlignment` (numeric) renamed to `normalizeAlignmentId` everywhere it is referenced

## Risks

- Risk: `parseDndBeyondCharacterUrl` is currently exported from `lib/dndBeyondCharacterImport.ts`; consumers outside this file could break if the export path changes.
  - Impact: Build failure or runtime error for any file importing this function.
  - Mitigation: Grep all import sites before moving; re-export from `dndBeyondCharacterImport.ts` if necessary to preserve the public API.

- Risk: Renaming `normalizeAlignment` → `normalizeAlignmentId` could be missed at a call site.
  - Impact: TypeScript compile error (safe — caught at build time).
  - Mitigation: TypeScript compiler will surface all missed call sites; no manual search required.

- Risk: `CharacterIdentity` interface is currently private; if moved to the new module it becomes part of a wider surface.
  - Impact: Low — interface is simple and stable.
  - Mitigation: Keep as unexported if only used within `dndBeyondCharacterImport.ts`; export only if consumed by the new module's public API.

## Open Questions

No unresolved ambiguity exists. All decisions are confirmed:
- No generic `identity.ts` (generic alignment is in `lib/types.ts`).
- `flattenModifiers` stays in `dndBeyond-utils.ts`.
- Rename confirmed: `normalizeAlignmentId`.
- This is a pure refactor — no behavior changes.

## Non-Goals

- Introducing any new functionality.
- Changing the public behavior of any moved function.
- Supporting providers other than DnD Beyond in this module (Roll20 etc. will get their own adapter modules).
- Performance optimization.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
