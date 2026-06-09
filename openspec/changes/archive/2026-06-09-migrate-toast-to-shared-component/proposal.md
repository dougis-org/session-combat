## GitHub Issues

- dougis-org/session-combat#389

## Why

- Problem statement: Two components (`useCombat`/`ActiveCombatView` and `QuickCombatantModal`) maintain their own inline toast implementations using duplicated `useState` + `useEffect` patterns. The shared `Toast` component and `useToast()` hook introduced in #308 already provides this behaviour correctly.
- Why now: #308 is merged, making this a straightforward cleanup. The inline patterns are now technical debt — and the `useCombat` toast is currently non-functional (state is declared and exported but `setToast` is never called with a message internally or externally).
- Business/user impact: Consolidating onto the shared component ensures consistent toast styling and timer behaviour across the app, and reduces the surface area for future toast-related bugs.

## Problem Space

- Current behavior:
  - `useCombat.ts` declares `toast` state + a 3-second `useEffect` auto-dismiss timer; exports `setToast` via `UseCombatReturn` but it is never called to show a toast — the feature is non-functional.
  - `ActiveCombatView.tsx` renders the toast as an inline fixed div (slightly different colours/shape from the shared component).
  - `QuickCombatantModal.tsx` has the same inline pattern with a 2-second timer; actively used in 4 places (add monster success/error, add character success/error).
- Desired behavior: All three locations use `useToast()` + `<Toast>` from `lib/components/Toast.tsx`.
- Constraints:
  - `QuickCombatantModal` has a boolean prop named `showToast` (controls whether toasts fire); this collides with the `showToast` function returned by `useToast()`. The prop must be renamed to `enableToast`.
  - The shared `Toast` uses `bg-green-700`/`bg-red-700` + `rounded-full`; inline versions used `bg-green-600`/`bg-red-600` + `rounded-lg`. The shared style wins.
- Assumptions: No external callers set `setToast` on the `UseCombatReturn` object (confirmed by codebase search).
- Edge cases considered:
  - Rapid consecutive toasts: `useToast()` uses a `useRef`-based timer that cancels the previous timeout on each new call, avoiding stacking. The inline `useEffect` approaches did not handle this correctly.
  - `showToast=false` prop on `QuickCombatantModal`: still works after rename to `enableToast`; error toasts fire unconditionally regardless of `enableToast` (preserving existing behaviour).

## Scope

### In Scope

- `lib/hooks/useCombat.ts`: remove inline toast state/timer, adopt `useToast()`, update `UseCombatReturn` (`setToast` → `showToast`)
- `lib/components/ActiveCombatView.tsx`: replace inline toast div with `<Toast toast={toast} />`
- `lib/components/QuickCombatantModal.tsx`: remove inline toast state/timer, adopt `useToast()`, rename `showToast` prop → `enableToast`, update 4 `setToast(...)` call sites to `showToast(...)`
- `tests/unit/fixtures/useCombat.ts`: `setToast` → `showToast`
- Tests that pass `showToast={true/false}` prop: update to `enableToast`

### Out of Scope

- Changes to `lib/components/Toast.tsx` itself
- Any other components not listed above
- Changing toast duration (3s/2s differences are absorbed by the shared hook's 3s default)

## What Changes

- `useCombat.ts`: ~6 lines net removed; `useToast()` replaces manual state + effect; `UseCombatReturn` interface updated
- `ActiveCombatView.tsx`: 7-line inline div replaced with `<Toast toast={toast} />`
- `QuickCombatantModal.tsx`: ~12 lines net removed; 4 `setToast` call sites updated; `showToast` prop renamed `enableToast`
- `tests/unit/fixtures/useCombat.ts`: 1 line changed
- Up to 3 test files: `showToast` prop renamed to `enableToast` at call sites

## Risks

- Risk: Renaming `showToast` prop on `QuickCombatantModal` is a breaking API change for any callers.
  - Impact: Low — only internal call sites exist; no external consumers.
  - Mitigation: Grep all call sites before applying; update all in the same PR.

- Risk: Toast duration changes from 2s (`QuickCombatantModal`) to 3s (shared `useToast`).
  - Impact: Minor UX difference — toasts in the modal linger 1 second longer.
  - Mitigation: Acceptable; the shared hook's 3s is the intended app-wide standard.

- Risk: Visual style change (darker background, pill shape vs rounded box).
  - Impact: Cosmetic only; consistent with the rest of the app.
  - Mitigation: None needed.

## Open Questions

No unresolved ambiguity. All decisions confirmed during exploration:
- Rename strategy for `showToast` prop: `enableToast` ✓
- Timer duration unification to 3s: accepted ✓
- Shared component style wins: accepted ✓

## Non-Goals

- Centralising toast state at a context/provider level (not needed at this scale)
- Adding new toast trigger points to `useCombat` (the hook will expose `showToast` for future use, but no new call sites are added here)
- Changing toast position or animation

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
