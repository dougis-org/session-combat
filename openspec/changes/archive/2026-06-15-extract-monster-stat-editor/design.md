## Context

- Relevant architecture: Both `Monster` and `MonsterTemplate` extend `CreatureStats` (lib/types.ts). `CreatureStatsForm` (lib/components/CreatureStatsForm.tsx) accepts `stats: CreatureStats` and `onChange: (stats: CreatureStats) => void` — it is already type-agnostic. `MonsterEditor` (app/encounters/MonsterEditor.tsx) and `MonsterTemplateEditor` (app/monsters/MonsterTemplateEditor.tsx) are extracted standalone components post #377/#378.
- Dependencies: `CreatureStatsForm`, `EditorShell` (lib/components/ui.tsx), `AlignmentSelect`, `lib/types.ts`
- Interfaces/contracts touched: Props of `MonsterEditor`, props of `MonsterTemplateEditor`, new `MonsterStatEditor` props, new `MonsterEditableFields` type

## Goals / Non-Goals

### Goals

- Extract a shared `MonsterStatEditor` form rendering header fields + `CreatureStatsForm`
- Expand `MonsterEditor` to the full stat block (currently 5 fields only)
- Keep save logic, `isGlobal` styling, and `isNew` labeling in their respective wrappers
- Ensure `MonsterEditableFields` does not depend on either concrete type

### Non-Goals

- Merging both wrappers into one component
- Changing `CreatureStatsForm`
- Changing API routes or data models
- Adding expand/collapse UX

## Decisions

### Decision 1: MonsterEditableFields structural type

- Chosen: Define `MonsterEditableFields` as an explicit intersection type covering all editable fields shared by `Monster` and `MonsterTemplate`:
  ```ts
  export type MonsterEditableFields = CreatureStats & {
    name: string;
    size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
    type: string;
    alignment?: DnDAlignment;
    speed: string;
    challengeRating: number;
    source?: string;
    description?: string;
  };
  ```
  Located in `lib/types.ts` alongside `Monster` and `MonsterTemplate`.
- Alternatives considered: (a) Accept `MonsterTemplate | Monster` directly — couples the shared form to both concrete types. (b) Generic `T extends CreatureStats & {...}` — heavier syntax with no practical benefit here.
- Rationale: Explicit intersection is minimal, readable, and decoupled from both concrete types. Wrappers spread changed fields back onto their concrete type before calling `onSave`.
- Trade-offs: If a new editable field is added to `Monster` or `MonsterTemplate`, `MonsterEditableFields` must be updated manually — but this is compile-time visible.

### Decision 2: MonsterStatEditor component interface

- Chosen:
  ```ts
  export function MonsterStatEditor({
    value,
    onChange,
  }: {
    value: MonsterEditableFields;
    onChange: (value: MonsterEditableFields) => void;
  })
  ```
  The component renders: name, size, type, alignment (via `AlignmentSelect`), speed, challengeRating, source, description header fields, plus `CreatureStatsForm` for the stat block. It holds no local state — it is a controlled component. The wrapper owns state.
- Alternatives considered: Uncontrolled with internal state — rejected because wrappers need to merge changes at save time and may need to intercept validation.
- Rationale: Controlled pattern matches `CreatureStatsForm` and is consistent with other form components in the project.
- Trade-offs: Wrappers must manage state, but both wrappers already do this today.

### Decision 3: Location of MonsterStatEditor

- Chosen: `lib/components/MonsterStatEditor.tsx` — shared lib since it's used by components in two separate `app/` directories.
- Alternatives considered: Co-located in `app/encounters/` or `app/monsters/` — rejected because neither owns the other's use case.
- Rationale: `lib/components/` is already the home for shared form components (`CreatureStatsForm`, `EditorShell`).
- Trade-offs: None significant.

### Decision 4: Wrapper save behavior is unchanged

- Chosen: `MonsterEditor` continues to call `onSave(monster)` synchronously (parent handles API). `MonsterTemplateEditor` continues to internalize the `fetch` call (async, manages its own `saving` and `validationError` state).
- Alternatives considered: Standardize both to delegate-upward — deferred; that's a larger refactor outside this scope.
- Rationale: Keeps this change minimal and non-breaking.
- Trade-offs: Asymmetry between wrappers persists.

## Proposal to Design Mapping

- Proposal element: New `lib/components/MonsterStatEditor.tsx`
  - Design decision: Decision 2 (component interface), Decision 3 (location)
  - Validation approach: Unit tests render `MonsterStatEditor` directly; assert all header fields and `CreatureStatsForm` are present
- Proposal element: `MonsterEditableFields` structural type
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation — both `Monster` and `MonsterTemplate` must be assignable to `MonsterEditableFields`
- Proposal element: `MonsterEditor` refactored to thin wrapper
  - Design decision: Decision 4 (save behavior unchanged)
  - Validation approach: Existing `MonsterEditor.test.tsx` updated to assert full stat block rendered; save callback test updated
- Proposal element: `MonsterTemplateEditor` refactored to thin wrapper
  - Design decision: Decision 4 (save behavior unchanged)
  - Validation approach: `MonsterTemplateEditor.test.tsx` updated to assert `MonsterStatEditor` renders header + stat block

## Functional Requirements Mapping

- Requirement: `MonsterStatEditor` renders name, size, type, alignment, speed, challengeRating, source, description fields
  - Design element: Decision 2 (MonsterStatEditor renders header fields)
  - Acceptance criteria reference: specs/monster-stat-editor/spec.md
  - Testability notes: RTL `screen.getBy*` on field labels/inputs
- Requirement: `MonsterStatEditor` renders `CreatureStatsForm` for the stat block
  - Design element: Decision 2
  - Acceptance criteria reference: specs/monster-stat-editor/spec.md
  - Testability notes: Mock `CreatureStatsForm`; assert it is called with `stats` and `onChange`
- Requirement: `MonsterEditor` exposes full stat block (not just 5 fields)
  - Design element: Decision 4 (wrapper delegates to `MonsterStatEditor`)
  - Acceptance criteria reference: specs/monster-stat-editor/spec.md
  - Testability notes: Render `MonsterEditor`; assert fields beyond the original 5 are present
- Requirement: `MonsterTemplateEditor` delegates form rendering to `MonsterStatEditor`
  - Design element: Decision 4
  - Acceptance criteria reference: specs/monster-stat-editor/spec.md
  - Testability notes: Mock `MonsterStatEditor`; assert it receives correct `value` and `onChange`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regression in `MonsterTemplateEditor` save/validation behavior
  - Design element: Decision 4 — save logic stays in wrapper untouched
  - Acceptance criteria reference: existing `MonsterTemplateEditor.test.tsx` save/validation tests must pass
  - Testability notes: Run `npm run test:unit` after refactor; zero failures in MonsterTemplateEditor tests
- Requirement category: operability
  - Requirement: `MonsterEditableFields` type must be compile-clean with `Monster` and `MonsterTemplate`
  - Design element: Decision 1
  - Acceptance criteria reference: TypeScript build passes with no new errors
  - Testability notes: `npm run build` or `tsc --noEmit`

## Risks / Trade-offs

- Risk/trade-off: Expanding `MonsterEditor` from 5 fields to full stat block changes its rendered output
  - Impact: Low — no snapshots; RTL tests check by label
  - Mitigation: Update `MonsterEditor.test.tsx` alongside the implementation
- Risk/trade-off: `MonsterStatEditor` being a controlled component requires wrappers to manage state
  - Impact: Low — wrappers already manage state today
  - Mitigation: None needed

## Rollback / Mitigation

- Rollback trigger: CI failures in `MonsterEditor` or `MonsterTemplateEditor` tests that cannot be resolved within the PR
- Rollback steps: Revert the branch; the existing extracted components remain untouched on main
- Data migration considerations: None — pure UI refactor, no data model changes
- Verification after rollback: `npm run test:unit` green on main

## Operational Blocking Policy

- If CI checks fail: Fix failing tests before merging; do not bypass with `--no-verify`
- If security checks fail: Investigate and resolve; this change has no security surface
- If required reviews are blocked/stale: Re-request review after 24 hours; escalate to repo owner if blocked > 48 hours
- Escalation path and timeout: Repo owner (dougis) after 48 hours of stale review

## Open Questions

No open questions — all design decisions were resolved during exploration.
