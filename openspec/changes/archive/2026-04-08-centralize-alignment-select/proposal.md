## GitHub Issues

- #20

## Why

- Problem statement: The alignment `<select>` UI element is duplicated verbatim in both `app/characters/page.tsx` and `app/monsters/page.tsx`. Additionally, the three core entity interfaces (`Character`, `MonsterTemplate`, `Monster`) type the `alignment` field as `string` rather than the stricter `DnDAlignment` type already defined in `lib/types.ts`. Finally, all six character and monster API routes accept arbitrary alignment values with no server-side validation.
- Why now: A recent PR (referenced in issue #20) identified the UI duplication as a code-quality issue. The `DnDAlignment` type and `isValidAlignment()` helper already exist — tightening their usage is a low-risk, high-value cleanup.
- Business/user impact: Reduces maintenance surface for the alignment dropdown, closes a data-integrity gap (invalid alignments could be stored via direct API calls), and makes the TypeScript types self-documenting.

## Problem Space

- Current behavior: Two near-identical `<select>` blocks exist in the codebase. `alignment` is typed as `string` on all entity interfaces. No API route validates that an alignment value is one of the nine D&D 5e alignments.
- Desired behavior: A single `AlignmentSelect` component (owning its label and select) is used in both editors. Entity interfaces use `DnDAlignment`. All write endpoints reject invalid alignment values with HTTP 400.
- Constraints: The component must be layout-agnostic — callers control the wrapping `<div>` and grid span. The `aria-label` should be consistent ("Alignment") across both usages.
- Assumptions: The existing `VALID_ALIGNMENTS`, `DnDAlignment`, and `isValidAlignment()` exports in `lib/types.ts` are correct and stable.
- Edge cases considered: Empty string alignment (user hasn't selected one) must remain valid at the UI layer and be stored as `undefined` — only non-empty, non-valid strings should be rejected by the API.

## Scope

### In Scope

- New `lib/components/AlignmentSelect.tsx` component with `value`, `onChange`, `disabled` props; owns `<label>` and `<select>`; `aria-label="Alignment"` on the select
- Replace manual alignment select in `app/characters/page.tsx` with `<AlignmentSelect />`
- Replace manual alignment select in `app/monsters/page.tsx` with `<AlignmentSelect />`
- Tighten `Character.alignment`, `MonsterTemplate.alignment`, and `Monster.alignment` from `string` to `DnDAlignment` in `lib/types.ts`
- Add `isValidAlignment()` validation to all six write endpoints: `POST /api/characters`, `PUT /api/characters/[id]`, `POST /api/monsters`, `PUT /api/monsters/[id]`, `POST /api/monsters/global`, `PUT /api/monsters/global/[id]`

### Out of Scope

- Migrating existing stored data that may contain invalid or legacy alignment strings
- Changing the set of valid alignments
- UI changes beyond swapping the select element
- Any changes to the D&D Beyond import flow (already correctly typed)

## What Changes

- New file: `lib/components/AlignmentSelect.tsx`
- Modified: `app/characters/page.tsx` — import and use `AlignmentSelect`, remove unused `AbilityScores` import
- Modified: `app/monsters/page.tsx` — import and use `AlignmentSelect`
- Modified: `lib/types.ts` — tighten alignment field types on three interfaces
- Modified: `app/api/characters/route.ts` — add alignment validation to POST
- Modified: `app/api/characters/[id]/route.ts` — add alignment validation to PUT
- Modified: `app/api/monsters/route.ts` — add alignment validation to POST
- Modified: `app/api/monsters/[id]/route.ts` — add alignment validation to PUT
- Modified: `app/api/monsters/global/route.ts` — add alignment validation to POST
- Modified: `app/api/monsters/global/[id]/route.ts` — add alignment validation to PUT

## Risks

- Risk: Tightening interface types may surface latent TypeScript errors elsewhere in the codebase
  - Impact: Low — D&D Beyond import already returns `DnDAlignment | undefined`; all other assignment paths flow from the validated select or from API body (untyped `unknown`)
  - Mitigation: Run `tsc --noEmit` after type changes before proceeding to API/UI work

- Risk: API validation rejects values that were previously accepted (breaking change for API consumers)
  - Impact: Very low — the only consumer is the UI, which already constrains to valid values
  - Mitigation: Confirm no external consumers; document the new 400 response in PR description

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- `aria-label="Alignment"` on the select (consistent, not role-prefixed)
- Component owns `<label>` and `<select>`, not the grid wrapper
- `onChange` prop typed as `(value: string) => void` for React `select` compatibility (caller casts to `DnDAlignment` after API validation guards the database)

## Non-Goals

- Full form validation framework
- API schema validation library (e.g., Zod) — out of scope for this change
- Accessibility audit beyond the `aria-label` fix

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
