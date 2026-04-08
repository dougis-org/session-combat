## Context

- Relevant architecture: Next.js App Router project. UI components live in `lib/components/`. Type definitions are centralized in `lib/types.ts`. API routes follow a consistent destructure-then-validate pattern (see `app/api/characters/route.ts` for the existing `gender` validation as a model).
- Dependencies: `VALID_ALIGNMENTS`, `DnDAlignment`, `isValidAlignment()` — all exported from `lib/types.ts`, stable and tested via D&D Beyond import flow.
- Interfaces/contracts touched: `Character`, `MonsterTemplate`, `Monster` (type narrowing only), REST write endpoints for characters and monsters (new 400 response on invalid alignment).

## Goals / Non-Goals

### Goals

- Single `AlignmentSelect` component replaces two near-identical inline selects
- Consistent `aria-label="Alignment"` on the select element in both editors
- `Character.alignment`, `MonsterTemplate.alignment`, `Monster.alignment` typed as `DnDAlignment` (not `string`)
- All six write endpoints validate alignment with `isValidAlignment()` and return 400 for invalid values

### Non-Goals

- Changing the valid alignment set
- Zod/schema validation library adoption
- Migrating historical data
- Any form-level validation beyond the alignment field

## Decisions

### Decision 1: Component owns label + select, not the grid wrapper

- Chosen: `AlignmentSelect` renders a `<label>` and a `<select>` with no outer wrapper element.
- Alternatives considered: Component owns outer `<div>` with grid class; component renders select only (caller owns label).
- Rationale: Characters use `md:col-span-2` on the wrapper; monsters use a plain `<div>`. Owning the wrapper would force either a prop to control span or two different components. Owning the label avoids callers repeating the label text and keeps the accessible label/control pairing encapsulated.
- Trade-offs: Caller is responsible for the layout wrapper. This is the standard React pattern for form field components.

### Decision 2: `onChange` typed as `(value: string) => void`

- Chosen: `onChange` accepts `string` matching the native `HTMLSelectElement.value` type.
- Alternatives considered: Type as `(value: DnDAlignment) => void`, requiring a type assertion in the component.
- Rationale: React's `onChange` event yields `e.target.value` as `string`. Asserting `as DnDAlignment` inside the component would be an unchecked cast — the actual validation happens at the API boundary. The component's job is selection UX, not type narrowing.
- Trade-offs: Callers' state (`alignment`) remains `string` at the UI layer, consistent with existing `useState('')` usage. This is correct: the UI allows "no selection" (empty string), which is not a `DnDAlignment`.

### Decision 3: API validation pattern follows existing `gender` validation

- Chosen: Add alignment validation immediately after destructuring from body, before DB write, returning `NextResponse.json({ error: 'Invalid alignment' }, { status: 400 })`.
- Alternatives considered: Middleware; shared validation utility.
- Rationale: The codebase already has an inline `gender` validation at this exact location in `app/api/characters/route.ts`. Consistency trumps abstraction for a two-line guard.
- Trade-offs: Six routes each get their own guard. Acceptable given small surface area and clear pattern.

### Decision 4: Type tightening order — types first, then UI, then API

- Chosen: Change `lib/types.ts` interfaces first, then verify with `tsc --noEmit`, then proceed to UI and API changes.
- Alternatives considered: All changes in one commit.
- Rationale: TypeScript errors from the type change are easy to catch early and guide any missed call sites. Starting with types makes the subsequent changes type-safe from the start.
- Trade-offs: Slight sequencing constraint in tasks.

## Proposal to Design Mapping

- Proposal element: New `AlignmentSelect` component
  - Design decision: Decision 1 (no wrapper), Decision 2 (string onChange)
  - Validation approach: Render tests confirm label + select rendered; props passed through correctly

- Proposal element: Tighten interface types to `DnDAlignment`
  - Design decision: Decision 4 (types first)
  - Validation approach: `tsc --noEmit` passes with no new errors after change

- Proposal element: API validation on 6 write endpoints
  - Design decision: Decision 3 (inline guard pattern)
  - Validation approach: Integration tests POST/PUT with invalid alignment → 400; valid alignment → 200/201

- Proposal element: Consistent `aria-label="Alignment"`
  - Design decision: Decision 1 (component owns label)
  - Validation approach: Render test checks `aria-label` attribute; manual verification in both editors

## Functional Requirements Mapping

- Requirement: Component renders accessible label and select for all 9 alignments + empty option
  - Design element: `AlignmentSelect.tsx` — maps `VALID_ALIGNMENTS`
  - Acceptance criteria reference: Issue #20 AC §1
  - Testability notes: RTL render test; assert option count = 10 (9 + placeholder)

- Requirement: Character editor uses `AlignmentSelect`
  - Design element: `app/characters/page.tsx` import + usage
  - Acceptance criteria reference: Issue #20 AC §2
  - Testability notes: Smoke test that alignment select renders in character form

- Requirement: Monster editor uses `AlignmentSelect`
  - Design element: `app/monsters/page.tsx` import + usage
  - Acceptance criteria reference: Issue #20 AC §3
  - Testability notes: Smoke test that alignment select renders in monster form

- Requirement: Invalid alignment rejected at API
  - Design element: `isValidAlignment()` guard in each of 6 routes
  - Acceptance criteria reference: Issue #20 AC §5
  - Testability notes: Integration test per route: POST/PUT `{ alignment: "chaotic pancake" }` → 400

## Non-Functional Requirements Mapping

- Requirement category: Type safety
  - Requirement: No `string` assignments to alignment fields that bypass `DnDAlignment`
  - Design element: Interface type narrowing + `tsc --noEmit`
  - Acceptance criteria reference: Issue #20 AC §4
  - Testability notes: CI TypeScript build step

- Requirement category: Accessibility
  - Requirement: `aria-label="Alignment"` present on select in both editors
  - Design element: Hardcoded in `AlignmentSelect` component
  - Acceptance criteria reference: Issue #20 AC §1
  - Testability notes: RTL `getByRole('combobox', { name: 'Alignment' })` in component test

## Risks / Trade-offs

- Risk/trade-off: Inline validation in 6 routes is repetitive
  - Impact: Minor maintenance overhead if validation logic ever changes
  - Mitigation: `isValidAlignment()` is the single source of truth; only the call site is repeated, not the logic

- Risk/trade-off: `string` onChange prop allows theoretically invalid values at the UI layer
  - Impact: None — the API is the enforcement boundary; the select physically limits choices
  - Mitigation: API validation provides the hard guard

## Rollback / Mitigation

- Rollback trigger: TypeScript build failure after type changes; regression in character/monster editor rendering
- Rollback steps: Revert `lib/types.ts` interface changes; revert component import in both pages; revert API route guards
- Data migration considerations: None — no schema changes, no stored data modified
- Verification after rollback: `tsc --noEmit` passes; both editors render alignment select; existing tests pass

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix failing checks before requesting re-review
- If security checks fail: Treat as blocking; escalate to repo owner
- If required reviews are blocked/stale: Ping reviewer after 48 hours; escalate to repo owner after 96 hours
- Escalation path and timeout: Repo owner (dougis) is the escalation point; no automated merge without passing CI

## Open Questions

No open questions. All design decisions resolved during exploration session.
