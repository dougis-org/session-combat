## GitHub Issues

- #537
- #540 (nav-tab piece folded into this change — see "What Changes")

## Why

- Problem statement: DMs have no UI to associate existing `Encounter` records
  with a `Campaign`, or to create campaign-scoped encounters directly. The
  many-to-many link (`Campaign.encounterIds`) and its API
  (`GET/POST /api/campaigns/[id]/encounters`,
  `DELETE /api/campaigns/[id]/encounters/[encounterId]`) already exist and
  are tested (issues #535, #536 — merged), but nothing in the app calls them.
- Why now: this is the next unblocked issue in the campaign-aware combat
  start sequence (see
  `docs/superpowers/specs/2026-08-23-campaign-encounter-linking-design.md`
  and its companion plan doc). #538 (scoping the combat-setup encounter
  picker) and #539 (ad hoc banner) are independent and can proceed in
  parallel, but the picker in #538 is only useful once a campaign actually
  has linked encounters — which requires this screen.
- Business/user impact: DMs currently cannot reuse encounters across
  campaigns from within a campaign's own UI, and campaign-scoped combat
  start (later work) has no linked encounters to show until this exists.

## Problem Space

- Current behavior: `Encounter` records are only manageable from the global
  `/encounters` browser, which has no notion of campaign scope. The
  campaign detail layout (`app/campaigns/[id]/layout.tsx`) has tabs for
  Members/Sessions/Prompts/Library only — no Encounters or Combat tab, so
  even the already-existing (orphaned) `app/campaigns/[id]/combat/page.tsx`
  is unreachable from the UI today.
- Desired behavior: a new `app/campaigns/[id]/encounters/page.tsx` where a
  DM can see linked encounters, link an existing owned encounter, create a
  new encounter that auto-links, and unlink (without deleting) an
  encounter. The campaign layout nav gains Encounters and Combat tabs so
  both this new page and the existing orphaned combat page become
  reachable.
- Constraints:
  - Must reuse `app/encounters/EncounterEditor.tsx` as-is for creation (no
    prop changes to that component) — campaign linkage is achieved by the
    host page's save handler passing `campaignId` in the `POST
    /api/encounters` body, which the API already supports.
  - Must reuse the existing link API exactly as built: `POST` body is
    `{ encounterId }`, `DELETE` takes `encounterId` as a path segment, and
    `POST` requires the caller to be the campaign's `dm` (403/404 checks
    already enforced server-side).
  - Unlinking must never delete the underlying `Encounter` document —
    already guaranteed by the API (`$pull`, not delete); the UI must only
    make this legible to the DM (confirm dialog language, no delete icon).
- Assumptions:
  - The "Link Existing Encounter" picker sources from `GET /api/encounters`
    (all of the caller's owned encounters, unfiltered/unpaginated) and
    excludes already-linked ones **client-side** — no new query params or
    pagination on that endpoint. This is a deliberate scope-limiting choice
    (see Non-Goals): the endpoint has no pagination today, so a DM with a
    very large encounter library will page through a long unfiltered list
    in the picker. Acceptable for now since it mirrors the existing
    `/encounters` browser's own lack of pagination.
  - Only campaign DMs can link/unlink (matches API's `role !== 'dm'` check,
    which returns 404 rather than 403 to avoid revealing campaign
    existence to non-members).
- Edge cases considered:
  - Campaign has zero linked encounters (empty state with a hint to link
    or create one).
  - DM has zero owned encounters to link (picker shows an empty state,
    "Create New Encounter" still available).
  - All of a DM's owned encounters are already linked (picker shows "all
    your encounters are already linked" rather than an empty list).
  - Linking an encounter that belongs to another user — 404 from API,
    surfaced as an inline error, not a silent no-op.
  - Double-submitting a link (double-click) — API's `$addToSet` is
    idempotent server-side; client should still disable the button while
    the request is in flight to avoid duplicate optimistic list entries.
  - Unlink confirmation must state clearly that the encounter itself is
    not deleted, to prevent the DM assuming data loss.

## Scope

### In Scope

- New `app/campaigns/[id]/encounters/page.tsx`:
  - List currently-linked encounters (`GET /api/campaigns/[id]/encounters`).
  - "Link Existing Encounter" picker over `GET /api/encounters`, filtered
    client-side to exclude already-linked encounters, with a text search
    input over encounter name.
  - "Create New Encounter" using `EncounterEditor`, saving via
    `POST /api/encounters` with `campaignId` in the body.
  - "Unlink" per row with a confirm dialog that does not delete the
    `Encounter` record.
- `app/campaigns/[id]/layout.tsx`: add `Encounters` and `Combat` tabs to the
  nav array (folding in issue #540's scope), pointing at
  `/campaigns/${id}/encounters` (new) and `/campaigns/${id}/combat`
  (existing, currently-orphaned page).
- Unit tests for the new page (list/link/create/unlink flows, empty states,
  error states).

### Out of Scope

- Any change to `EncounterEditor.tsx` itself, `app/encounters/page.tsx`, or
  the link API routes (`app/api/campaigns/[id]/encounters/**`) — all
  already implemented and tested under #535/#536.
- The mislabeled "Start Encounter" button on `app/campaigns/page.tsx`
  (campaign list card) — that split (into "Encounters" + "Start Combat"
  actions) is the remainder of #540's original scope not folded in here;
  only the layout nav tabs are pulled forward.
- Scoping `CombatSetupView`'s "From Library" picker to campaign-linked
  encounters (#538).
- The ad hoc `/combat` in-progress-campaign banner (#539).
- Pagination or server-side filtering of `GET /api/encounters`.
- Bidirectional reverse lookup ("which campaigns use this encounter") from
  the global `/encounters` screen.

## What Changes

- Add `app/campaigns/[id]/encounters/page.tsx` (new client page).
- Add `Encounters` and `Combat` entries to the nav array in
  `app/campaigns/[id]/layout.tsx` (one-line-scale addition to the existing
  `{ label, href }` tuple list).
- Add unit tests covering the new page's link/unlink/create flows.

## Risks

- Risk: Reusing `GET /api/encounters` unfiltered for the picker could be
  slow or unwieldy for DMs with large encounter libraries.
  - Impact: Picker UX degrades (long scroll, client-side filter lag) but
    functionality still works.
  - Mitigation: Explicitly deferred — matches existing `/encounters`
    browser behavior; flagged in Non-Goals for a future pagination pass if
    it becomes a real pain point.
- Risk: Folding #540's nav-tab change into this change could create merge
  conflicts if #540 is worked independently before this change lands.
  - Impact: Duplicate/conflicting edits to `app/campaigns/[id]/layout.tsx`.
  - Mitigation: Confirm with the user/team that #540's remaining scope
    (the campaign-list button split) is tracked separately and that #540
    itself should be closed or narrowed once this change merges the nav
    tabs, to avoid double work.
- Risk: DM confusion between "unlink" and "delete" if confirm-dialog
  copy is unclear.
  - Impact: DM may believe unlinking destroys the encounter.
  - Mitigation: Explicit confirm-dialog wording plus acceptance criteria
    requiring the encounter to remain visible on `/encounters` after
    unlink (already specified in issue #537).

## Open Questions

None — resolved during the preceding explore-mode session:

- Picker scaling approach: client-side filter over `GET /api/encounters`
  (confirmed).
- `EncounterEditor` reuse: no component changes; host page wires
  `campaignId` into the save request (confirmed).
- Nav wiring: fold #540's tab-array addition into this change so the new
  page is reachable and testable (confirmed).
- Delete-vs-unlink UI treatment: confirm dialog, "unlink" language, no
  delete affordance (confirmed).

## Non-Goals

- Pagination, sorting, or server-side search on `GET /api/encounters`.
- Any visual redesign of the campaign layout shell beyond adding two nav
  entries.
- Closing or editing issue #540 itself (tracked separately; only its
  nav-tab sub-scope is absorbed here).

## Change Control

If scope changes after proposal approval, update `proposal.md`,
`design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
