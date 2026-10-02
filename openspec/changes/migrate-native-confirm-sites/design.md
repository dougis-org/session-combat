## Context

- Relevant architecture: part 1 adds `lib/hooks/useConfirmDialog.tsx` (`{ confirm, dialog }`), `ConfirmDialog` `variant`, confirm-first focus. Each target page/hook owns its delete handler calling `fetch(... DELETE)`.
- Dependencies: `confirm-dialog-hook-and-focus-order` merged to `main`.
- Interfaces/contracts touched: handler bodies in nine files; one hook (`useMonsterTemplates`) gains a returned `deleteDialog` element. No API/data changes.

## Goals / Non-Goals

### Goals

- Replace every native `confirm()` listed in #821 with the shared dialog.
- Keep messages and post-confirm behavior identical.

### Non-Goals

- Changing the dialog component; touching `alert()`.

## Decisions

### Decision 1: One `useConfirmDialog` per page, target in closure

- Chosen: `const { confirm, dialog } = useConfirmDialog();` once per component; handler becomes `confirm({ title, message, confirmLabel, cancelLabel, variant: 'danger', onConfirm: () => performDelete(id) })`; render `{dialog}` once.
- Alternatives considered: per-row dialogs (heavy); global provider (out of scope).
- Rationale: matches part 1's API; one dialog at a time per page.
- Trade-offs: handler split into request + perform functions.

### Decision 2: Labels

- Chosen: delete sites → confirm "Delete", cancel "Keep"; remove member → "Remove"/"Cancel"; unlink → "Unlink"/"Cancel"; titles name the action (e.g. "Delete character?"). Messages reuse existing strings (unlink wording unchanged).
- Alternatives considered: generic "OK/Cancel" (less clear, regressions in a11y naming).
- Rationale: requester asked for "Keep" where cancel avoids a delete.
- Trade-offs: slightly more copy to maintain.

### Decision 3: `useMonsterTemplates` returns its dialog

- Chosen: the hook calls `useConfirmDialog()` internally and returns `deleteDialog` for `app/monsters/page.tsx` to render; `deleteTemplate` calls `confirm({...})`.
- Alternatives considered: skip this site (allowed by requester if wiring is awkward); lift state into the page.
- Rationale: keeps the page API small; hooks may return elements.
- Trade-offs: a hook returning JSX is slightly unconventional — fall back to skipping and documenting if it proves awkward.

### Decision 4: Tests drive the dialog

- Chosen: remove all `window.confirm`/`global.confirm` mocks; tests click the delete button, then `confirm-dialog-confirm` (or `-cancel`), asserting fetch calls accordingly.
- Alternatives considered: keep mocks (would not exercise the dialog).
- Rationale: mocks no longer have any effect once `confirm()` is gone.

## Proposal to Design Mapping

- Proposal element: migrate nine sites
  - Design decision: Decisions 1–3
  - Validation approach: per-site unit tests (confirm → DELETE called once with the right URL; cancel → no fetch)
- Proposal element: label wording
  - Design decision: Decision 2
  - Validation approach: assert dialog title and button text per site
- Proposal element: test rewrite
  - Design decision: Decision 4
  - Validation approach: `rg "window.confirm|global.confirm|spyOn\(window, 'confirm'\)" tests app lib` returns nothing

## Functional Requirements Mapping

- Requirement: destructive actions use the dialog
  - Design element: Decisions 1–3
  - Acceptance criteria reference: `specs/confirm-dialog/spec.md` — "Destructive actions use ConfirmDialog"
  - Testability notes: RTL per page

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: no native `confirm()` remains in `app/` or `lib/`
  - Design element: Decision 4 grep check
  - Acceptance criteria reference: spec NFAC
  - Testability notes: grep in validation

## Risks / Trade-offs

- Risk/trade-off: stale closure on row actions
  - Impact: wrong item deleted
  - Mitigation: capture id at click time; assert URL in tests

## Rollback / Mitigation

- Rollback trigger: regression in any delete/unlink flow found post-merge.
- Rollback steps: revert the PR; native `confirm()` returns.
- Data migration considerations: none.
- Verification after rollback: affected unit suites green.

## Operational Blocking Policy

- If CI checks fail: fix, validate locally, push; do not merge red.
- If security checks fail: remediate before merge.
- If required reviews are blocked/stale: re-request; escalate to the requester after 24h.
- Escalation path and timeout: report stall after three no-progress iterations; if part 1 is not yet merged, stop and wait.

## Open Questions

- Monster-template site may be skipped; "Cancel" vs "Keep" for non-delete actions (default "Cancel").
