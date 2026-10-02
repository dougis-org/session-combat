## GitHub Issues

- #821 (part 2 of 2 — this change closes it). Depends on change `confirm-dialog-hook-and-focus-order` (part 1) being merged first.

## Why

- Problem statement: nine call sites still use the browser's native `confirm()` (blocking, unstylable, inconsistent with the app, un-testable without `window.confirm` mocks).
- Why now: part 1 delivers `useConfirmDialog` (callback hook with a unique `titleId`), a `danger` variant, and confirm-first focus order, so migration is mechanical.
- Business/user impact: consistent, accessible, keyboard-friendly confirmations; tests stop mocking `window.confirm`.

## Problem Space

- Current behavior: native `confirm(...)` gates deletes/unlinks/removals at these sites:
  - `app/characters/page.tsx` (delete character)
  - `app/characters/[id]/page.tsx` (delete character)
  - `app/monsters/useMonsterTemplates.ts` (delete monster template — a hook, see Decision 3)
  - `app/campaigns/page.tsx` (delete campaign)
  - `app/campaigns/[id]/page.tsx` (remove member)
  - `app/campaigns/[id]/encounters/page.tsx` (unlink encounter; `window.confirm`)
  - `app/campaigns/[id]/sessions/page.tsx` (delete session log)
  - `app/parties/page.tsx` (delete party)
  - `app/encounters/page.tsx` (delete encounter)
- Desired behavior: each uses `useConfirmDialog` with `variant: 'danger'`, an action-naming confirm label ("Delete", "Remove", "Unlink"), and cancel label "Keep" when the cancel avoids a deletion (for non-deleting "Unlink"/"Remove" a plain "Cancel").
- Constraints: existing messages preserved (incl. the unlink wording); the action only runs from `onConfirm`; no behavior change when confirmed.
- Assumptions: the issue's mention of `InitiativeEntry`, `TargetActionModal` and `useCombat` is stale — they only call `alert()` (out of scope); `useCombat`'s End Combat was migrated in #819.
- Edge cases considered: row-level delete buttons rendered in lists (one hook instance per page, target captured in the `onConfirm` closure); the monster-template hook returns its dialog element for the page to render; tests that mock `window.confirm` must be rewritten to click the dialog.

## Scope

### In Scope

- Migrate the nine sites above to `useConfirmDialog`.
- Rewrite affected unit tests (drop `window.confirm`/`global.confirm` mocks, drive the dialog via `confirm-dialog-confirm` / `confirm-dialog-cancel` test ids): `tests/unit/import/charactersPageImport.test.ts`, `tests/unit/campaignEncountersPage.test.tsx`, `tests/unit/components/SessionsPage.test.tsx`, `tests/unit/components/CampaignsPage.test.tsx`, `tests/unit/components/EncountersPage.test.tsx`, `tests/unit/components/CampaignMembersPage.test.tsx`, `tests/unit/app/characters/[id]/page.test.tsx`, `tests/unit/hooks/useCombat.test.ts` (remove stale `global.confirm` mock).
- Update any E2E that handles native dialogs for these flows.

### Out of Scope

- Changes to `ConfirmDialog`, `Modal`, or the hook (part 1).
- `alert()` / `prompt()` replacement.
- New confirmations where none existed.

## What Changes

- Nine call sites swap `if (!confirm(...)) return;` for `confirm({ ..., onConfirm })` plus rendering `{dialog}`.
- Tests assert via the dialog instead of native mocks.

## Risks

- Risk: row-level handlers capture stale ids/names.
  - Impact: wrong item deleted.
  - Mitigation: pass id/name into `confirm()` per click; tests assert the correct DELETE URL is hit for the clicked row.
- Risk: auto-focused destructive confirm (part 1 requirement) + Enter deletes quickly.
  - Impact: accidental deletion.
  - Mitigation: explicit "Delete" labels, danger styling, "Keep" cancel; acknowledged by requester.
- Risk: merge ordering — this change cannot be implemented until part 1 merges.
  - Impact: branch won't compile.
  - Mitigation: rebase onto `main` after part 1 merges; tasks gate on it.

## Open Questions

- Question: Monster templates — migrate via the hook returning its dialog (planned), or skip if the page wiring is awkward?
  - Needed from: requester (pre-approved to skip if needed)
  - Blocker for apply: no
- Question: Cancel label for non-delete actions (unlink, remove member): "Cancel" vs "Keep"?
  - Needed from: requester
  - Blocker for apply: no (default: "Cancel")

## Non-Goals

- Redesigning the dialog or adding a global dialog provider.
- Undo for deletions.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
