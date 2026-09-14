## Context

- Relevant architecture:
  - `app/campaigns/[id]/sessions/page.tsx` — client component (`SessionsContent`) rendering the Session Journal: a "+ New Session" button, a list of `SessionEntryCard`s (each with "Edit"/"Delete"), and an inline `SessionForm` for create/edit.
  - `lib/hooks/useIsDM.ts` — existing hook, `useIsDM(campaignId): { isDM: boolean; loading: boolean }`. Fetches `GET /api/campaigns/[id]/members/me` and resolves `isDM` to `true` only when `role === 'dm' && status === 'active'`. Defaults `isDM` to `false` until resolved (fail-closed).
  - `lib/components/SessionControl.tsx` — already consumes `useIsDM(campaignId)` the same way, rendered on this same page, to gate the start/stop-session control.
  - Server routes `app/api/campaigns/[id]/sessions/route.ts` (POST) and `app/api/campaigns/[id]/sessions/[sessionId]/route.ts` (PATCH, DELETE) already independently enforce `role !== 'dm' → 404`. No changes needed there; this design only concerns the client.
- Dependencies: none new. Reuses `useIsDM` already in the codebase.
- Interfaces/contracts touched: `SessionEntryCard` component props (add `isDM: boolean`); no API contracts change.

## Goals / Non-Goals

### Goals

- Non-DM campaign members see no "+ New Session" button and no "Edit"/"Delete" buttons anywhere in the Session Journal.
- DM campaign members see the page exactly as it behaves today — zero behavior change for the DM path.
- Reads (expand-to-view summary/events) remain available to all members regardless of role.
- Fail closed: while DM status is still loading, treat the viewer as non-DM (hide controls) rather than briefly flashing them.

### Non-Goals

- No server/API changes (already correctly enforced).
- No new session status field, no DM completion toggle, no player write-access model — explicitly deferred per proposal Non-Goals.
- No change to `SessionControl.tsx`'s own DM check.

## Decisions

### Decision 1: Gate controls with the existing `useIsDM` hook, called once in `SessionsContent`

- Chosen: Call `const { isDM } = useIsDM(campaignId);` once in `SessionsContent`. Use it directly to conditionally render the "+ New Session" button, and pass it down as a prop (`isDM`) to `SessionEntryCard`.
- Alternatives considered: (a) Call `useIsDM` separately inside each `SessionEntryCard` instance. Rejected — would fire one member-fetch per rendered card instead of one per page, wasteful and inconsistent with how `SessionControl` already does it once. (b) Introduce a new dedicated hook/context for this page. Rejected — `useIsDM` already exists, is already proven on this exact page (via `SessionControl`), and introducing a second mechanism would fragment the DM-detection pattern for no benefit.
- Rationale: One fetch per page load, consistent with existing precedent, minimal surface area.
- Trade-offs: `SessionsContent` and `SessionControl` (rendered inside the same page tree) each independently call `useIsDM(campaignId)`, so the member-fetch may run twice per page load. Acceptable — see Risks; no proposal-level requirement to deduplicate, and doing so would touch `SessionControl`, which is out of scope.

### Decision 2: `SessionEntryCard` takes `isDM` as a required prop rather than calling the hook itself

- Chosen: Extend `SessionEntryCardProps` (currently inline object type) with `isDM: boolean`. `SessionsContent` passes `isDM` at the existing call site (`app/campaigns/[id]/sessions/page.tsx` map over `logs`).
- Alternatives considered: Have `SessionEntryCard` call `useIsDM` itself. Rejected per Decision 1 rationale — cards are rendered in a list; one hook call per card multiplies fetches by session count.
- Rationale: Keeps `SessionEntryCard` a simple, prop-driven presentational component; role resolution stays a page-level concern.
- Trade-offs: None material — this is a one-line prop addition to an existing component.

### Decision 3: Render nothing in place of the action buttons for non-DM, not disabled buttons

- Chosen: When `isDM` is `false`, `SessionEntryCard` renders no action buttons at all (the `<div className="flex gap-2 ml-2">...</div>` block is conditionally omitted). The "+ New Session" button in `SessionsContent` is likewise omitted (not rendered, not disabled) when `isDM` is `false`.
- Alternatives considered: Render disabled/greyed-out buttons with a tooltip explaining "DM only". Rejected — the requester's explicit direction was "the button should show view and only allow display," i.e., no edit affordance should be visible at all for players, not a disabled one. Omitting is simpler and matches the request directly.
- Rationale: Matches user-confirmed scope exactly; simplest implementation; no new UI copy/tooltip needed.
- Trade-offs: A player has no in-UI explanation for *why* there's no edit button — acceptable, since the goal is that players shouldn't expect to edit sessions at all (it's DM-owned content), not that they need an explanation.

### Decision 4: Fail-closed default while `useIsDM` is loading

- Chosen: Rely on `useIsDM`'s existing default (`isDM: false` until resolved) — no additional loading-state handling needed in `SessionsContent`/`SessionEntryCard` beyond passing through the hook's current `isDM` value each render.
- Alternatives considered: Explicitly branch on `useIsDM`'s `loading` flag and render a skeleton/placeholder for the button row until resolved. Rejected as unnecessary complexity — `isDM` already defaults to `false` during loading, so the existing behavior (hide until proven DM) is correct with zero extra code, and `SessionControl` on the same page already accepts this same latency without special-casing it.
- Rationale: Simplicity; consistent with existing precedent on the same page; avoids a flash-of-editable-controls for players and, for DMs, is a one-tick delay identical to what `SessionControl` already exhibits.
- Trade-offs: A DM will see the "+ New Session"/"Edit"/"Delete" controls appear a moment after page load rather than instantly (same as `SessionControl`'s existing behavior for its own controls) — acceptable, already true elsewhere on this page.

## Proposal to Design Mapping

- Proposal element: Gate "+ New Session" button behind DM status
  - Design decision: Decision 1
  - Validation approach: Render `SessionsContent` with `useIsDM` mocked to `{ isDM: false, loading: false }` → assert button absent; mocked to `{ isDM: true, loading: false }` → assert button present.
- Proposal element: Gate "Edit"/"Delete" buttons on each session card behind DM status
  - Design decision: Decisions 2 and 3
  - Validation approach: Render `SessionEntryCard` with `isDM={false}` → assert neither button present; `isDM={true}` → assert both present and still functional (existing `onEdit`/`onDelete` callback tests continue to pass).
- Proposal element: Leave read/expand behavior unchanged for all roles
  - Design decision: Decision 3 (only the action-button block is conditional; expand/collapse logic is untouched)
  - Validation approach: Existing expand/collapse tests (if any) continue passing unmodified; add a case confirming expand works with `isDM={false}`.
- Proposal element: No flash of editable controls before DM status resolves
  - Design decision: Decision 4
  - Validation approach: Test with `useIsDM` mocked to `{ isDM: false, loading: true }` → assert controls absent (same as fully-resolved non-DM).

## Functional Requirements Mapping

- Requirement: Non-DM members do not see "+ New Session"
  - Design element: Decision 1, 3
  - Acceptance criteria reference: specs/session-journal-access/spec.md
  - Testability notes: Unit test on `SessionsContent`/page component, `useIsDM` mocked non-DM.
- Requirement: Non-DM members do not see "Edit"/"Delete" on any session card
  - Design element: Decision 2, 3
  - Acceptance criteria reference: specs/session-journal-access/spec.md
  - Testability notes: Unit test on `SessionEntryCard` with `isDM={false}`.
- Requirement: DM members retain full existing create/edit/delete UI, unchanged
  - Design element: Decision 1, 2, 3
  - Acceptance criteria reference: specs/session-journal-access/spec.md
  - Testability notes: Unit test on both components with `isDM={true}`, asserting parity with current (pre-change) rendered output.
- Requirement: All members retain the ability to expand and read a session's summary/events
  - Design element: Decision 3
  - Acceptance criteria reference: specs/session-journal-access/spec.md
  - Testability notes: Unit test expand/collapse with `isDM={false}`.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Client-side UI gating must not be the sole enforcement of write access.
  - Design element: N/A — already satisfied by existing server routes (POST/PATCH/DELETE role checks), unchanged by this design.
  - Acceptance criteria reference: N/A (pre-existing, verified in proposal's Problem Space)
  - Testability notes: No new test needed; existing API-level tests for these routes already cover DM-only enforcement.
- Requirement category: reliability
  - Requirement: DM-detection failure (network error, non-DM default) must fail closed (hide controls), never fail open (show controls to a non-DM user).
  - Design element: Decision 4 (relies on `useIsDM`'s existing fail-closed default)
  - Acceptance criteria reference: specs/session-journal-access/spec.md
  - Testability notes: Test with `useIsDM` mocked to its error-path default (`{ isDM: false, loading: false }`) → assert controls hidden.

## Risks / Trade-offs

- Risk/trade-off: Duplicate `useIsDM(campaignId)` calls (`SessionControl` and `SessionsContent` on the same page) mean two `/members/me` fetches per page load instead of one.
  - Impact: Low — small, cached-by-browser GET request; no functional issue, only a minor efficiency note.
  - Mitigation: Not addressed in this change (would require refactoring `SessionControl`'s prop contract or introducing shared page-level state, both out of scope). Could be raised as a follow-up cleanup if it becomes a measured concern.

## Rollback / Mitigation

- Rollback trigger: If DMs report losing access to create/edit/delete controls (regression in the `isDM === true` path), or if the change is found to hide controls incorrectly for legitimate DMs.
- Rollback steps: Revert the single commit/PR for this change (`app/campaigns/[id]/sessions/page.tsx` + its test file) — no data migration, no API changes, no schema changes are involved, so revert is a plain code revert.
- Data migration considerations: None — no persisted data or schema is touched.
- Verification after rollback: Confirm DM and player views both return to pre-change behavior (all sessions show Edit/Delete/New Session buttons for all roles, matching the state before this change).

## Operational Blocking Policy

- If CI checks fail: Fix the failing unit tests or implementation before merge; this is a small, isolated frontend change with no external dependencies, so CI failures should be resolved directly rather than waived.
- If security checks fail: Not expected — no new API surface, no new data handling. If a security/lint check flags something unrelated, treat as pre-existing and file separately rather than blocking this change.
- If required reviews are blocked/stale: Ping the reviewer once; if unresolved after a reasonable interval, escalate to the requester (dougis) directly since they are both the issue filer and available reviewer for this repo.
- Escalation path and timeout: Requester (dougis) is the escalation point; given the small scope, escalate after 1 business day of no review activity.

## Open Questions

None. All ambiguity was resolved in the preceding `/opsx:explore` session on issue #719.
