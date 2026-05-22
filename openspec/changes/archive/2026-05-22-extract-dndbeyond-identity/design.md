## Context

- Relevant architecture: This is the final extraction in the 150–159 refactor series establishing provider-agnostic import architecture. Each domain gets a `dndBeyond-<domain>.ts` adapter; generic D&D 5e logic goes to `lib/import/utils.ts` or `lib/types.ts`. Prior extractions: `dndBeyond-ability-scores.ts`, `dndBeyond-armor-class.ts`, `dndBeyond-classes.ts`, `dndBeyond-defenses.ts`, `dndBeyond-skills-senses.ts`, `dndBeyond-abilities.ts`.
- Dependencies: `lib/import/dndBeyond-utils.ts` (for `createValidationError`, `DndBeyondImportError`), `lib/types.ts` (for `DnDAlignment`, `CharacterIdentity` if promoted), `lib/import/utils.ts` (none needed by identity module).
- Interfaces/contracts touched: `parseDndBeyondCharacterUrl` is the only publicly exported function from this group; its signature and behavior are unchanged. `lib/dndBeyondCharacterImport.ts` orchestration imports updated.

## Goals / Non-Goals

### Goals

- Extract five functions and associated private constants into `lib/import/dndBeyond-identity.ts`.
- Rename `normalizeAlignment` (numeric ID variant) to `normalizeAlignmentId` to eliminate the name collision with `lib/types.ts`.
- Keep `parseDndBeyondCharacterUrl` publicly exported; update its export path without breaking callers.
- Zero behavior changes — all tests pass unchanged.

### Non-Goals

- Creating a generic `lib/import/identity.ts`.
- Any changes to test files.
- Changes to `lib/server/dndBeyondCharacterImport.ts`.
- Extracting any additional functions beyond those listed.

## Decisions

### Decision 1: No generic `identity.ts`

- Chosen: Only create `lib/import/dndBeyond-identity.ts`; no generic counterpart.
- Alternatives considered: Creating `lib/import/identity.ts` with a `CharacterIdentitySource` interface and generic `requireCharacterIdentity` (analogous to `ModifierLike` from issue #173).
- Rationale: Generic alignment normalization (`normalizeAlignment(unknown)`) already lives in `lib/types.ts`. URL parsing is irreducibly provider-specific. `requireCharacterIdentity` throws `DndBeyondImportError` — a Roll20 adapter would throw its own error type, so the implementation isn't reusable, only a structural interface would be. That's too thin to justify a new file.
- Trade-offs: Marginally less "ready" for Roll20 identity extraction in the future, but Roll20 will define its own adapter following the same pattern without needing a shared base.

### Decision 2: Rename `normalizeAlignment` → `normalizeAlignmentId`

- Chosen: Rename the numeric-ID variant in the new module to `normalizeAlignmentId`.
- Alternatives considered: Keep the name as-is and rely on different parameter types for disambiguation.
- Rationale: Two exports named `normalizeAlignment` — one taking `unknown` (types.ts) and one taking `number` (dndBeyond-identity.ts) — create confusion for readers and future editors. The rename makes the DnD Beyond coupling and input type explicit.
- Trade-offs: One additional rename in `lib/dndBeyondCharacterImport.ts`; TypeScript compiler catches all missed sites.

### Decision 3: `CharacterIdentity` interface stays in `dndBeyond-identity.ts` (unexported)

- Chosen: Move `CharacterIdentity` into the new module as an unexported interface; it remains internal.
- Alternatives considered: Promote to `lib/types.ts`; keep in `lib/dndBeyondCharacterImport.ts`.
- Rationale: `CharacterIdentity` is the return type of `requireCharacterIdentity`, which lives in the new module. Co-locating the interface with its producer is idiomatic. It is only consumed by `lib/dndBeyondCharacterImport.ts`, which imports the function — not the type directly — so no export is needed.
- Trade-offs: Slightly less discoverable, but avoids polluting `lib/types.ts` with a provider-coupling type.

### Decision 4: Re-export `parseDndBeyondCharacterUrl` from `dndBeyondCharacterImport.ts`

- Chosen: Export `parseDndBeyondCharacterUrl` from `lib/import/dndBeyond-identity.ts`; confirm no other consumer imports it from `lib/dndBeyondCharacterImport.ts` (grep first). If consumers exist, add a re-export from `dndBeyondCharacterImport.ts`.
- Alternatives considered: Move all consumers to import from the new module directly.
- Rationale: Preserve backward compatibility conservatively; a follow-up can migrate consumers if needed.
- Trade-offs: May leave a re-export stub temporarily, but prevents breakage.

### Decision 5: Private constants move with their functions

- Chosen: `ALIGNMENT_ID_MAP`, `CANONICAL_HOST`, `CHARACTER_PATH_PATTERN` move to `dndBeyond-identity.ts` as private module-level constants.
- Alternatives considered: Centralizing constants in `dndBeyond-utils.ts`.
- Rationale: These constants are only used by functions in the identity module. Keeping them co-located avoids unnecessary coupling.
- Trade-offs: None — clean encapsulation.

## Proposal to Design Mapping

- Proposal element: Create `lib/import/dndBeyond-identity.ts` with five functions + constants
  - Design decision: Decision 1, 5
  - Validation approach: TypeScript compilation; grep confirms no function remains in source file

- Proposal element: Rename `normalizeAlignment` → `normalizeAlignmentId`
  - Design decision: Decision 2
  - Validation approach: TypeScript build catches missed renames; spec covers call site correctness

- Proposal element: Move `CharacterIdentity` interface
  - Design decision: Decision 3
  - Validation approach: TypeScript compilation verifies no broken type references

- Proposal element: Preserve `parseDndBeyondCharacterUrl` public export
  - Design decision: Decision 4
  - Validation approach: Grep for all import sites before moving; build confirms no broken imports

- Proposal element: No generic `identity.ts`
  - Design decision: Decision 1
  - Validation approach: File must not exist after implementation

## Functional Requirements Mapping

- Requirement: All five functions operate identically after move
  - Design element: Pure move — no logic changes
  - Acceptance criteria reference: specs/dndBeyond-identity-extraction/spec.md — behavioral scenarios
  - Testability notes: Existing unit tests cover function behavior; all must pass unchanged

- Requirement: `normalizeAlignmentId` maps DnD Beyond numeric IDs 1–9 to `DnDAlignment` strings
  - Design element: Decision 2 (rename only, logic unchanged)
  - Acceptance criteria reference: specs/dndBeyond-identity-extraction/spec.md
  - Testability notes: Existing alignment tests continue to pass; rename is the only change

- Requirement: `parseDndBeyondCharacterUrl` remains importable by existing consumers
  - Design element: Decision 4
  - Acceptance criteria reference: TypeScript build success
  - Testability notes: `grep -r "parseDndBeyondCharacterUrl"` to identify all import sites

- Requirement: `lib/dndBeyondCharacterImport.ts` contains no definitions of moved functions
  - Design element: Decisions 1–5
  - Acceptance criteria reference: Code review / grep verification
  - Testability notes: `grep -n "function parseUrlOrThrow\|function isSupportedDndBeyondHostname\|function requireCharacterIdentity\|function buildNormalizationWarnings\|function normalizeAlignment\|function normalizeAlignmentId" lib/dndBeyondCharacterImport.ts` returns empty

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No runtime behavior changes
  - Design element: Pure move with rename; zero logic modifications
  - Acceptance criteria reference: All existing tests pass
  - Testability notes: Run full test suite; no test file modifications permitted

- Requirement category: operability
  - Requirement: TypeScript strict mode compliance maintained
  - Design element: All moved functions retain their original signatures and types
  - Acceptance criteria reference: `tsc --noEmit` passes
  - Testability notes: CI TypeScript check

## Risks / Trade-offs

- Risk/trade-off: Missed import site for `parseDndBeyondCharacterUrl`
  - Impact: Build failure in consumer file
  - Mitigation: Grep all import sites before moving; verify build after

- Risk/trade-off: Stale re-export stub in `dndBeyondCharacterImport.ts`
  - Impact: Cosmetic — minor confusion but no breakage
  - Mitigation: Document in tasks; remove in follow-up if no consumers found

## Rollback / Mitigation

- Rollback trigger: TypeScript build failure or test regression after implementation.
- Rollback steps: Revert the new file creation and the edits to `lib/dndBeyondCharacterImport.ts`; restore original function definitions in place.
- Data migration considerations: None — pure code move, no data or schema changes.
- Verification after rollback: `tsc --noEmit` passes; full test suite passes.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Diagnose TypeScript or test failures; fix in the same branch.
- If security checks fail: Not applicable — this is a pure internal refactor with no security surface.
- If required reviews are blocked/stale: Request re-review after 24 hours; escalate to project owner if blocked >48 hours.
- Escalation path and timeout: Revert and re-scope if unblocked after 72 hours.

## Open Questions

No open questions. All design decisions are resolved.
