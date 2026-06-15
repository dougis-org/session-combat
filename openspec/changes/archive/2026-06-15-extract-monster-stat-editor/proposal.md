## GitHub Issues

- #379

## Why

- Problem statement: `MonsterEditor` and `MonsterTemplateEditor` duplicate the same form fields (name, size, type, alignment, speed, challengeRating, source, description) and the same `CreatureStatsForm` stat block. Any change to the editing surface must be made in two places.
- Why now: Both extraction prerequisites (#377, #378) are closed. The components now live in their own files and are ready to share a common form layer.
- Business/user impact: Reduces future maintenance cost; ensures the encounter-instance editor and the catalog editor always stay in sync on shared fields.

## Problem Space

- Current behavior: `MonsterEditor` (app/encounters/MonsterEditor.tsx) edits only 5 fields (name, hp, maxHp, ac, dexterity). `MonsterTemplateEditor` (app/monsters/MonsterTemplateEditor.tsx) edits the full stat block via `CreatureStatsForm` plus all header fields. There is no shared form layer between them.
- Desired behavior: A shared `MonsterStatEditor` form component in `lib/components/` renders the header fields and `CreatureStatsForm`. Both `MonsterEditor` and `MonsterTemplateEditor` become thin wrappers that supply their type-specific props and handle their own save logic.
- Constraints: `MonsterTemplate` and `Monster` share all editable header fields but differ in metadata-only fields (`createdAt`, `updatedAt`, `isGlobal`, `templateId`, `initiative`). The shared form must not depend on either concrete type.
- Assumptions: The shared form accepts a `MonsterEditableFields` structural type covering the union of editable fields. Each wrapper is responsible for spreading changed fields back onto its concrete type before calling `onSave`.
- Edge cases considered: `isGlobal` styling (header color on MonsterTemplateEditor) remains in the wrapper, not the shared form. `isNew` label ("Create" vs "Save") is also a wrapper concern.

## Scope

### In Scope

- New `lib/components/MonsterStatEditor.tsx` exporting `MonsterStatEditor` and `MonsterEditableFields`
- Refactor `MonsterEditor` to use `MonsterStatEditor` (replace 5-field implementation with full stat block)
- Refactor `MonsterTemplateEditor` to use `MonsterStatEditor` (delegate form rendering, keep save logic)
- Update `MonsterEditor.test.tsx` to cover full stat block fields
- Update `MonsterTemplateEditor.test.tsx` to verify shared form is used

### Out of Scope

- Changes to the `CreatureStatsForm` component
- Changes to API routes or data models
- UX changes to how the editors are opened/closed in their parent pages
- Adding expand/collapse for the stat block within the editors

## What Changes

- `lib/components/MonsterStatEditor.tsx` — new file, shared form component
- `app/encounters/MonsterEditor.tsx` — refactored to thin wrapper using `MonsterStatEditor`
- `app/monsters/MonsterTemplateEditor.tsx` — refactored to thin wrapper using `MonsterStatEditor`
- `tests/unit/components/MonsterEditor.test.tsx` — updated for full stat block coverage
- `tests/unit/components/MonsterTemplateEditor.test.tsx` — updated to verify delegation

## Risks

- Risk: Expanding `MonsterEditor` from 5 fields to the full stat block changes its rendered output and may break snapshot or integration tests.
  - Impact: Low — test suite is RTL-based, not snapshot-based.
  - Mitigation: Update tests alongside the implementation.
- Risk: `MonsterEditableFields` structural type may need to be updated if `Monster` or `MonsterTemplate` gains new editable fields in future.
  - Impact: Low — the type is an explicit intersection, changes are compile-time visible.
  - Mitigation: Keep `MonsterEditableFields` in `lib/types.ts` or co-located with `MonsterStatEditor` so it's easy to find.

## Open Questions

No unresolved ambiguity. The approach was agreed during exploration:
- Shared form with two thin wrappers (not a single unified component with a variant prop).
- `MonsterEditor` will use the full stat block (matching `MonsterTemplateEditor`).
- `isGlobal` styling and `isNew` label remain in their respective wrappers.
- Save behavior remains separate: `MonsterEditor` delegates upward (sync), `MonsterTemplateEditor` internalizes the API call (async).

## Non-Goals

- Merging `MonsterEditor` and `MonsterTemplateEditor` into a single component
- Adding a `variant` prop or discriminated union at the component level
- Changing the persistence model (async vs sync save) of either wrapper

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
