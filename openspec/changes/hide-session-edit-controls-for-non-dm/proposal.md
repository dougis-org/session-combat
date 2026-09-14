## GitHub Issues

- #719

Assignee: dougis (proposal author/requester)

## Why

- Problem statement: The Session Journal page (`app/campaigns/[id]/sessions/page.tsx`) renders "+ New Session", "Edit", and "Delete" controls for every campaign member, regardless of role. A non-DM player who clicks any of these gets a form/confirm dialog that appears to work locally, then silently fails when the API responds `404 Campaign not found` (the actual error the DM-only server checks return) — a confusing, misleading UI experience.
- Why now: Filed as GitHub issue #719 by the product owner; it's a small, well-understood, currently-reproducible bug with no dependencies on other in-flight work.
- Business/user impact: Players get an incorrect signal that they can create/edit/delete session logs. At best it's a wasted round trip and a confusing error; at worst it erodes trust that the app's permission model works as expected.

## Problem Space

- Current behavior:
  - Server: `POST /api/campaigns/[id]/sessions`, `PATCH /api/campaigns/[id]/sessions/[sessionId]`, and `DELETE /api/campaigns/[id]/sessions/[sessionId]` all already enforce `role !== 'dm' → 404`. This is correct and requires no change.
  - Client: `app/campaigns/[id]/sessions/page.tsx` has no DM/role check at all. `SessionEntryCard` always renders "Edit" and "Delete" buttons; `SessionsContent` always renders the "+ New Session" button. Every member sees full write UI and can attempt writes that the server then rejects.
- Desired behavior: Non-DM members see the Session Journal as view-only — they can still expand a session card to read its summary/events, but see no "+ New Session" button and no "Edit"/"Delete" controls on any session card. DM members see the page exactly as it works today, unchanged.
- Constraints:
  - No API/server changes — the DM-only write enforcement already exists and is correct.
  - No new data model or session status field — this is strictly a UI-gating fix (that idea was explored and explicitly descoped by the requester; see Non-Goals).
  - Must reuse the existing `useIsDM(campaignId)` hook (`lib/hooks/useIsDM.ts`), already used the same way in `lib/components/SessionControl.tsx`, rather than introducing a new role-check mechanism.
- Assumptions:
  - `useIsDM` correctly reflects the current user's role for the campaign in view (it's already trusted for this purpose elsewhere in the codebase).
  - Read access to session logs (`GET /api/campaigns/[id]/sessions`) is already open to all campaign members and is not role-gated; this proposal does not change read behavior.
- Edge cases considered:
  - Loading state: while `useIsDM` is resolving (before the member-role fetch completes), controls should not flash visibly for a player before disappearing — default to hidden/non-DM until the hook confirms DM status.
  - A DM viewing their own campaign must see no behavior change at all.
  - A user who is a member of multiple campaigns with different roles (DM in one, player in another) must get the correct per-campaign gating — `useIsDM` is already scoped by `campaignId`, so this falls out naturally.

## Scope

### In Scope

- Gate the "+ New Session" button in `SessionsContent` behind DM status.
- Gate the "Edit" and "Delete" buttons in `SessionEntryCard` behind DM status.
- Leave the expand/read (summary, events) behavior of `SessionEntryCard` unchanged for all roles.
- Add/update unit tests for `app/campaigns/[id]/sessions/page.tsx` covering DM vs. non-DM rendering of these controls.

### Out of Scope

- Any server/API route changes (already correctly DM-gated).
- Any new "active"/"complete" session status field, model change, or DM toggle UI (see Non-Goals — this was raised during exploration of #719 and explicitly deferred).
- Any change to who can read session logs.
- Any change to `SessionControl.tsx` (the start/stop live-session control), which already correctly uses `useIsDM`.

## What Changes

- `app/campaigns/[id]/sessions/page.tsx`:
  - `SessionsContent` calls `useIsDM(campaignId)` and only renders the "+ New Session" button when `isDM` is true.
  - `SessionEntryCard` receives an `isDM` prop; it renders "Edit"/"Delete" buttons only when `isDM` is true, and otherwise renders no action buttons (the card remains expandable/readable for everyone).
- Test file for the sessions page updated/extended to assert control visibility for both DM and non-DM member roles.

## Risks

- Risk: `useIsDM` introduces an extra network fetch (`GET /api/campaigns/[id]/members/me`) on a page that didn't previously make that call.
  - Impact: Low — the same hook and endpoint are already used on this same route family (`SessionControl`, rendered on this very page), so the marginal cost is small and may already be warmed by that component's fetch.
  - Mitigation: None needed beyond noting it; if `SessionControl` and the page-level `useIsDM` call both fire, consider (during implementation) whether `SessionControl`'s existing DM-detection can be lifted/shared instead of duplicated — an implementation detail, not a scope change.
- Risk: Hiding controls only client-side could be seen as "security by UI" if someone assumes the API is unprotected.
  - Impact: None — the API is already independently DM-gated (verified in the current codebase); this change only fixes the UI to match already-correct server behavior.
  - Mitigation: N/A.

## Open Questions

No unresolved ambiguity remains. This was explored in an `/opsx:explore` session against issue #719: the requester confirmed the scope is a UI-only fix ("it is a UI failure... the button should show view and only allow display"), explicitly ruling out the larger "active/complete" session-status feature that the issue text could otherwise have implied.

## Non-Goals

- Introducing a per-session `active`/`complete` status field on `SessionLog`.
- Introducing a DM-facing status toggle UI.
- Any player write-access model for "active" sessions — players have no session-log write access today, before or after this change.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
