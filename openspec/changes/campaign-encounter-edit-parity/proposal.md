## GitHub Issues

- dougis-org/session-combat#606

## Why

- Problem statement: The campaign encounters screen (`app/campaigns/[id]/encounters/page.tsx`)
  only lets a DM link, create, and unlink encounters. It cannot edit a linked
  encounter or even show what monsters the encounter contains. To change an
  encounter's name, description, or monster roster, the DM must leave the
  campaign, open the global `/encounters` list, locate the same encounter, and
  edit it there.
- Why now: Campaign encounters are becoming the primary place a DM prepares for a
  session (linked from the Combat setup view). The round-trip to the global list
  is friction on the most common prep workflow, and the screen looks broken next
  to the global list it is meant to mirror.
- Business/user impact: DMs manage encounters entirely from within the campaign
  without context switching. The two encounter surfaces behave consistently, so
  there is one interaction model to learn.

## Problem Space

- Current behavior:
  - `GET /api/campaigns/[id]/encounters` returns the linked `Encounter[]` for any
    active member (reads authorized by membership per decision n077).
  - The page renders each linked encounter as name + optional description + an
    `Unlink` button only. No monster roster, no edit affordance.
  - The global list (`app/encounters/EncountersContent`) renders each encounter as
    name + description + monster roster + `Edit` (inline `EncounterEditor`,
    `PUT /api/encounters/:id`) + `Delete`.
  - The page never learns the caller's role; the `Link` / `Create` / `Unlink`
    actions it offers are DM-only on the backend (`role !== 'dm'` → 404), so a
    non-DM member who reaches the page via the campaign nav tab sees buttons that
    always error.
  - `EncounterEditor` is already imported by the campaign page and wired for the
    create flow (`handleCreateSave`), so the editor plumbing is half-present.
- Desired behavior:
  - Each linked encounter card offers the same interactions as a global
    encounter card — monster roster visible, inline `Edit` — **plus** the
    campaign-scoped `Unlink`. No `Delete` on this screen.
  - The page knows whether the current user is the campaign DM and only renders
    the management actions (`Link`, `Create`, `Edit`, `Unlink`) for a DM. A
    non-DM member sees a read-only list (name, description, roster).
- Constraints:
  - A linked encounter is a reference to the single global encounter record, not
    a per-campaign copy (decision n074). Editing it from the campaign screen
    edits that shared record — the same as editing it from the global list.
  - `PUT /api/encounters/:id` authorizes by ownership: it loads
    `storage.loadEncounters(auth.userId)` and 404s if the caller does not own the
    encounter. Campaign encounters are always loaded with `campaign.userId`, so
    the encounters are owned by the campaign owner.
  - Link/unlink mutations stay DM-only (decision n077); this change must not relax
    that.
  - Integration tests run only through the project harness, never Jest directly
    (decision n102).
- Assumptions:
  - "The page should already know it is the DM" — the campaign already exposes
    enough for the client to determine DM status. `lib/hooks/useIsDM.ts` already
    does exactly this via `GET /api/campaigns/[id]/members/me`.
  - The campaign owner (`campaign.userId`) is the DM who owns the linked
    encounters and is the user editing them in the normal case.
- Edge cases considered:
  - A campaign with more than one `dm`-role member: a co-DM whose `userId` is not
    `campaign.userId` does not own the linked encounters, so `PUT /api/encounters/:id`
    would 404 for them. See Open Questions.
  - Non-DM member navigates directly to `/campaigns/[id]/encounters`: must see a
    read-only list, never a broken button.
  - `useIsDM` still loading: management actions hidden until role resolves, to
    avoid a flash of buttons that then disappear.
  - Editing an encounter that is linked to multiple campaigns: the edit applies
    to the shared record everywhere it is linked (expected, consistent with the
    global list).
  - POST/SSE-style races do not apply here; the page refetches with `fetchLinked()`
    after every mutation (decision n090/n094).

## Scope

### In Scope

- Show the monster roster on each linked encounter card on
  `app/campaigns/[id]/encounters/page.tsx`, matching the global list.
- Add an inline `Edit` action to each linked encounter card that opens
  `EncounterEditor` and saves via `PUT /api/encounters/:id`, then refetches.
- Make the campaign encounters page DM-aware: render `Link`, `Create`, `Edit`,
  and `Unlink` only for the campaign DM; render a read-only list otherwise.
- Align the card layout / button styling of the campaign list with the global
  list so the two read as the same component.
- Optionally extract a shared presentational `EncounterCard` used by both the
  global and campaign lists (design decision — see `design.md`).
- Unit/component tests for the DM and non-DM rendering paths and the edit-save
  flow; integration test (via harness) for editing a linked encounter and seeing
  the change reflected.

### Out of Scope

- Changing the encounter authorization model so co-DMs (or any non-owner) can
  edit encounters they do not own.
- Adding a `Delete` (destroy the encounter) action to the campaign screen.
- Per-campaign encounter copies / overrides.
- Redesigning the global `/encounters` page beyond what a shared card requires.
- Changes to `EncounterEditor` / `MonsterEditor` internals.
- Hiding or role-gating the `Encounters` tab in `app/campaigns/[id]/layout.tsx`
  (the page handles read-only rendering itself).

## What Changes

- `app/campaigns/[id]/encounters/page.tsx`:
  - Consume `useIsDM(campaignId)` (or equivalent) to gate management UI.
  - Add `editingEncounter` state and a `handleEditSave` that calls
    `PUT /api/encounters/:id` then `fetchLinked()`, mirroring the global page and
    the existing `handleCreateSave`.
  - Add an `Edit` button and the monster roster to each linked card.
  - Non-DM path: read-only list, no action buttons, no `Link`/`Create` bar.
- New (design-dependent): `lib/components/EncounterCard.tsx` shared by
  `app/encounters/EncountersContent` and the campaign page, parameterized by which
  actions it exposes (`onEdit`, `onDelete`, `onUnlink`).
- Tests: component tests for both pages' new branches; harness integration test
  for the campaign edit flow.
- No API changes. `GET /api/campaigns/[id]/encounters` already returns full
  encounter objects including `monsters`; `PUT /api/encounters/:id` already
  supports the edit.

## Risks

- Risk: A DM edits a linked encounter expecting a campaign-local change, but the
  edit mutates the shared global record.
  - Impact: Confusing if the same encounter is linked to another campaign or used
    standalone.
  - Mitigation: This is already the semantics of links (n074) and of editing from
    the global list. Keep the editor identical to the global one; no new UI copy
    implying a copy. If desired, a short helper line ("Edits apply to this
    encounter everywhere it is used") can be added — flagged, not required.
- Risk: Co-DM (role `dm`, not `campaign.userId`) sees an `Edit` button that 404s
  on save.
  - Impact: Broken action for multi-DM campaigns.
  - Mitigation: See Open Questions. Simplest resolution: gate `Edit`/`Unlink` on
    `isDM` only (accepting the co-DM edge case as a known limitation), or
    additionally require the encounter's `userId` to match the current user.
- Risk: Extracting a shared `EncounterCard` touches the stable global list and
  could regress it.
  - Impact: Visual or behavioral regression on `/encounters`.
  - Mitigation: Keep extraction purely presentational; cover the global list with
    the existing/added component tests before and after. If risk outweighs
    benefit, keep the card local to each page and accept minor duplication
    (design decision).
- Risk: `useIsDM` adds a second membership fetch on a page that already may fetch
  campaign data via the layout.
  - Impact: Minor extra request.
  - Mitigation: `useIsDM` uses the lightweight `/members/me` endpoint by design;
    acceptable. Reuse any existing context if one is introduced later.

## Open Questions

- Question: For a campaign with multiple `dm`-role members, should a co-DM who
  does not own the linked encounters be able to edit them?
  - Needed from: Requester (Doug)
  - Blocker for apply: no — default is to gate management UI on `isDM` and accept
    that only the encounter owner's edits succeed; non-owner DMs get the standard
    error path if they somehow reach save. Can be revisited without reopening the
    spec if the answer is "no co-DM editing".
- Question: Do we want a one-line note in the editor clarifying that edits apply
  to the shared encounter record?
  - Needed from: Requester (Doug)
  - Blocker for apply: no — omitted by default to stay identical to the global
    editor.

If neither open question is answered before apply, implement the defaults stated
above; both are reversible without spec changes.

## Non-Goals

- Introducing per-campaign encounter customization or duplication.
- Reworking encounter ownership / co-DM permissions.
- Adding encounter deletion from the campaign context.
- Role-gating the campaign navigation tabs.

## Change Control

If scope changes after proposal approval, update `openspec/changes/campaign-encounter-edit-parity/proposal.md`,
`openspec/changes/campaign-encounter-edit-parity/design.md`,
`openspec/changes/campaign-encounter-edit-parity/specs/**/*.md`, and
`openspec/changes/campaign-encounter-edit-parity/tasks.md` before implementation
starts.
