## GitHub Issues

- #343
- #263 (prerequisite — RTL infrastructure)

## Why

- Problem statement: `CampaignEditor.test.tsx` uses the legacy `createRoot`/`act`/`container.querySelector` pattern throughout. It carries 25+ `act()` calls, manual DOM mutation hacks (`element.value = …; dispatchEvent(…)`), positional `querySelectorAll(…)[index]` queries, and broad `container.textContent` assertions — all of which are brittle, opaque, and do not exercise React's synthetic event system correctly.
- Why now: #263 already installed `@testing-library/react` and `@testing-library/user-event`. This is the last and most complex of the page-level RTL migrations — completing it closes out the migration series and removes all remaining legacy test infrastructure from the unit suite.
- Business/user impact: Tests that use manual DOM mutations may pass while masking React state bugs. Completing this migration makes the test suite a reliable indicator of actual component behaviour.

## Problem Space

- Current behavior: Tests render via `createReactRoot`, interact via `element.click()` / `element.value = …; dispatchEvent(…)`, and assert via `container.textContent.includes(…)` and positional `querySelectorAll(…)[index]`.
- Desired behavior: Tests render via RTL `render()`, interact via `userEvent`, and assert via `screen.getBy*` / `screen.queryBy*` — all tied to accessible names rather than DOM position.
- Constraints:
  - All 25 existing test cases must continue to pass (no behaviour changes, no test deletions).
  - `TextInputField` in `lib/components/ui.tsx` must auto-generate a stable `id` from its `label` prop when no explicit `id` is supplied, so that `<label htmlFor>` links correctly and RTL can resolve accessible names without requiring callers to pass `id`.
  - Chapter action buttons (move-up, move-down, remove) must have `aria-label` values that include chapter title when available, falling back to ordinal position (e.g. "Chapter 2") when title is empty. Existing positional `aria-label` patterns on move buttons are acceptable for RTL queries; only the remove button currently lacks an `aria-label` and must gain one.
  - Chapter title inputs must gain an `aria-label` (e.g. `Chapter 1 title`) so they can be queried by accessible name.
- Assumptions:
  - RTL and `user-event` v14 are already installed (confirmed — see `package.json`).
  - `jest-dom` matchers (`toBeInTheDocument`) are already configured in `jest.setup.ts` (confirmed).
  - The `@jest-environment jsdom` docblock and `IS_REACT_ACT_ENVIRONMENT` global are already removed from other migrated files; they must be removed here too.
- Edge cases considered:
  - Chapter with empty title: `aria-label` falls back to ordinal — `Remove Chapter 1`, `Move Chapter 1 up`, `Move Chapter 1 down`.
  - `TextInputField` called with an explicit `id`: explicit `id` takes precedence over the generated one.
  - Auto-generated `id` from label must be deterministic: lowercase, spaces replaced with hyphens, special characters stripped — e.g., "Campaign Name *" → `campaign-name`.

## Scope

### In Scope

- Migrate `tests/unit/components/CampaignEditor.test.tsx` from legacy root/act to RTL.
- Update `lib/components/ui.tsx` — `TextInputField` auto-generates `id` from `label` when none supplied.
- Update `app/campaigns/CampaignEditor.tsx` — add `aria-label` to chapter title inputs and remove button; verify move buttons retain usable `aria-label` values.
- Remove `@jest-environment jsdom` docblock and `IS_REACT_ACT_ENVIRONMENT` assignment from the test file.
- Replace all `act()`, `createReactRoot`, `unmountReactRoot`, `findButton`, `getInput` usages.
- Replace `openChapters()` helper with an RTL-based version.

### Out of Scope

- Other test files (already migrated under #263).
- Any changes to the `createReactRoot` / `unmountReactRoot` helper themselves (they remain for any non-migrated tests).
- Adding new test cases beyond the existing 25.
- Changing the visual design or functional behaviour of `CampaignEditor`.

## What Changes

- `lib/components/ui.tsx`: `TextInputField` generates a stable `id` from `label` when `id` prop is absent.
- `app/campaigns/CampaignEditor.tsx`: chapter title inputs gain `aria-label`; remove button gains `aria-label`; move button `aria-label` values verified to be RTL-queryable.
- `tests/unit/components/CampaignEditor.test.tsx`: full rewrite to RTL — render, screen, userEvent; all legacy imports and helpers removed; all 26 tests ported.

## Risks

- Risk: Auto-generated `id` from label could collide if two `TextInputField`s on the same page share a label string.
  - Impact: Low — label text is generally unique per form; collision would be a pre-existing design problem.
  - Mitigation: Document the convention; callers can always pass an explicit `id` to override.
- Risk: `userEvent.selectOptions` behaves differently from `dispatchEvent('change')` for the `<select>` elements.
  - Impact: Medium — could surface latent React event-handling bugs.
  - Mitigation: This is the desired outcome; if a test fails it indicates a real bug to investigate before patching around.
- Risk: `userEvent.type` into an input clears the existing value differently than `input.value = …`.
  - Impact: Low — `userEvent.clear` + `userEvent.type` is the idiomatic replacement.
  - Mitigation: Use `userEvent.clear` before `userEvent.type` for inputs that have a pre-populated value.

## Open Questions

No unresolved ambiguity. Decisions confirmed during exploration:
- `TextInputField` generates `id` from `label` (auto, callers need not change).
- Empty-title fallback for `aria-label`: ordinal position ("Chapter 2"), not blank.
- Move button `aria-label` strategy: keep existing position-based labels; they are RTL-queryable and the remove button gap is the only accessibility fix needed.

## Non-Goals

- Replacing `data-testid` on `<select>` and `<textarea>` elements (they already work and are not the source of fragility).
- Converting the file to Vitest or any other test runner.
- Adding snapshot tests.
- Achieving 100% branch coverage beyond what the existing 26 tests exercise.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
