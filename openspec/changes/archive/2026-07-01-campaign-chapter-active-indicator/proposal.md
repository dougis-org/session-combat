## GitHub Issues

- #446

## Why

- Problem statement: The "Current Chapter" field in the Campaign edit screen is a dropdown `<select>`, which requires users to scroll to the top of the chapter list to change the active chapter. There is no visual indicator on the chapter rows themselves showing which is active.
- Why now: Issue #446 raised by product owner; the pattern is confusing — users must mentally map the dropdown selection back to the chapter row they are looking at.
- Business/user impact: DMs managing multi-chapter campaigns must context-switch between the top control and the chapter list. Making activation inline reduces friction and makes the active state immediately visible.

## Problem Space

- Current behavior: A `<select>` dropdown above the chapter list lets the user pick the active chapter. Chapter rows have no active-state indicator.
- Desired behavior: The top section becomes display-only (shows the active chapter name, or dimmed "-- No active chapter --" when unset). Each chapter row has a green "ACTIVE" pill when it is the active chapter, or a 🚩 activate button (tooltip: "Mark as current chapter") when it is not.
- Constraints: No new state is needed — `currentChapterId` / `setCurrentChapterId` already exist. No icon library available; inline emoji/Unicode only (consistent with existing ▲▼ and 📖 usage).
- Assumptions: The `<select>` test (`data-testid="current-chapter-select"`) will be removed and replaced with a display element and per-row activate buttons. Existing unit tests that target the select must be updated.
- Edge cases considered:
  - No chapters defined: display-only section is hidden (same as today — the select is only shown when `chapters.length > 0`).
  - Active chapter is deleted: existing `handleRemoveChapter` already clears `currentChapterId` when the removed chapter was active — no change needed.
  - All chapters are unnamed: display shows "Ch. N: Untitled Chapter" (mirrors current select option text).

## Scope

### In Scope

- Replace `<select>` with a display-only block in `app/campaigns/CampaignEditor.tsx`
- Add green "ACTIVE" pill to the active chapter row
- Add 🚩 activate button (tooltip: "Mark as current chapter") to each inactive chapter row
- Update/add unit tests in `tests/unit/components/CampaignEditor.test.tsx`

### Out of Scope

- Drag-and-drop reordering (deferred to #462)
- Any changes to the data model, API, or persistence layer
- Changes to how `currentChapterId` is displayed elsewhere (campaign cards, combat view)

## What Changes

- `app/campaigns/CampaignEditor.tsx`: Remove `<select>` control; add display-only chapter name block; add conditional pill/button per chapter row
- `tests/unit/components/CampaignEditor.test.tsx`: Remove tests targeting `current-chapter-select`; add tests for display block, ACTIVE pill, and activate button

## Risks

- Risk: Removing `data-testid="current-chapter-select"` breaks existing tests that query it.
  - Impact: Test suite failures if tests are not updated alongside the JSX change.
  - Mitigation: Update tests in the same PR; the tasks artifact calls this out explicitly.

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
1. Display-only block: dimmed text when no active chapter. ✓
2. Active indicator: green "ACTIVE" pill. ✓
3. Activate button: 🚩 emoji, tooltip "Mark as current chapter". ✓
4. Button position: after move buttons, before Remove. ✓
5. ▲/▼ buttons: unchanged (drag/drop deferred to #462). ✓

## Non-Goals

- Keyboard-accessible drag-and-drop (out of scope for this change; tracked in #462)
- Changing any server-side or API behavior
- Modifying how active chapter is displayed on the campaign card or in the combat view

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
