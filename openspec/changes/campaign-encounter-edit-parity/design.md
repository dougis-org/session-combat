## Context

- Relevant architecture:
  - `app/campaigns/[id]/encounters/page.tsx` — client component
    (`EncountersManagementContent`) wrapped in `ProtectedRoute`. Fetches linked
    encounters from `GET /api/campaigns/[id]/encounters`, supports link / create /
    unlink. Already imports `EncounterEditor` from `app/encounters/EncounterEditor`.
  - `app/encounters/page.tsx` — `EncountersContent`, the global list. Renders name
    + description + monster roster + inline `Edit` (`EncounterEditor`,
    `PUT /api/encounters/:id`) + `Delete` (`DELETE /api/encounters/:id`).
  - `lib/hooks/useIsDM.ts` — `useIsDM(campaignId)` returns `{ isDM, loading }` by
    calling `GET /api/campaigns/[id]/members/me` and checking
    `role === 'dm' && status === 'active'`.
  - `lib/hooks/useAuth.ts` — `useAuth()` returns `{ user, loading, ... }` with
    `user.userId`.
  - `app/api/encounters/[id]/route.ts` — `PUT` authorizes by ownership
    (`storage.loadEncounters(auth.userId)` then `find(id)`; 404 otherwise).
  - `app/api/campaigns/[id]/encounters/route.ts` — `GET` authorized by active
    membership (`assertCampaignAccess`), returns
    `storage.loadEncountersByIds(campaign.encounterIds ?? [], campaign.userId)` —
    full `Encounter` objects including `monsters`. `POST` (link) is DM-only.
  - `app/api/campaigns/[id]/encounters/[encounterId]/route.ts` — `DELETE` (unlink),
    DM-only.
- Dependencies:
  - `EncounterEditor` props: `{ encounter, onSave, onCancel, isNew }`.
  - `Encounter` type from `lib/types` (`id`, `_id?`, `userId`, `name`,
    `description`, `monsters[]`, `createdAt`, `updatedAt`).
  - UI primitives `ErrorBanner`, `ValidationError` from `lib/components/ui`.
- Interfaces/contracts touched:
  - No API contract changes. Frontend behavior only.
  - Possible new internal component `lib/components/EncounterCard.tsx`.

## Goals / Non-Goals

### Goals

- The campaign encounters screen offers the same per-encounter interactions as
  the global list (monster roster + inline edit) plus `Unlink`.
- The screen renders management actions only for the campaign DM; non-DM members
  get a read-only list.
- The edit flow reuses `EncounterEditor` and `PUT /api/encounters/:id`, then
  refetches linked encounters (consistent with `handleCreateSave` and decisions
  n090/n094).
- The global and campaign lists visually read as the same component.

### Non-Goals

- Relaxing encounter-edit authorization to non-owners / co-DMs.
- Adding encounter deletion from the campaign screen.
- Per-campaign encounter copies.
- Role-gating campaign nav tabs.
- Modifying `EncounterEditor` / `MonsterEditor`.

## Decisions

### Decision 1: Determine DM status client-side with `useIsDM`

- Chosen: Call `useIsDM(campaignId)` in `EncountersManagementContent`. While
  `loading`, render the linked list read-only (no action buttons, no
  link/create bar). Once resolved, render management UI iff `isDM`.
- Alternatives considered:
  - Compare `campaign.userId` (from `GET /api/campaigns/[id]`) to
    `useAuth().user.userId`. Rejected: adds a second campaign fetch, and only
    identifies the single owner, not `dm`-role members; `useIsDM` is the
    established pattern.
  - Add `role` to the `GET /api/campaigns/[id]/encounters` response and gate on
    it. Rejected for this change: an API contract change for something an
    existing hook already provides; keep the change frontend-only.
  - Server-side redirect for non-DMs. Rejected: the read-only list is useful to
    players and the nav tab is intentionally shown to all members.
- Rationale: Minimal blast radius, reuses a tested hook, no API change.
- Trade-offs: One extra lightweight `/members/me` request per visit. A brief
  read-only render before `isDM` resolves (acceptable; no button flash because
  actions are hidden while loading).

### Decision 2: Reuse `EncounterEditor` + `PUT /api/encounters/:id` for edit

- Chosen: Add `editingEncounter: Encounter | null` state. An `Edit` button sets
  it; render `EncounterEditor` inline (keyed by encounter id) with
  `isNew={false}`. `handleEditSave` does
  `PUT /api/encounters/${id}` with `{ name, description, monsters }`, on success
  clears `editingEncounter` and calls `fetchLinked()`; on failure sets the page
  error via the existing `ErrorBanner`.
- Alternatives considered:
  - A campaign-scoped edit endpoint
    (`PUT /api/campaigns/[id]/encounters/[encounterId]`). Rejected: encounters are
    shared references (n074), not campaign-owned; a parallel endpoint would
    duplicate ownership logic and imply per-campaign copies.
  - Navigate to the global list for editing. Rejected: that is exactly the
    friction #606 removes.
- Rationale: The editor and endpoint already do this job on the global list;
  the campaign create flow already uses the same editor.
- Trade-offs: Edits mutate the shared encounter record (same as the global
  list). Documented in proposal risks.

### Decision 3: Extract a shared presentational `EncounterCard`

- Chosen: Create `lib/components/EncounterCard.tsx` — a pure presentational
  component rendering name, description, monster roster, and an actions slot.
  Callers pass the actions they support: global list passes `Edit` + `Delete`;
  campaign list passes `Edit` + `Unlink` (only when `isDM`). Both
  `app/encounters/EncountersContent` and the campaign page render through it.
- Alternatives considered:
  - Keep card markup duplicated in each page. Rejected: the two have already
    drifted (padding, button colors, missing roster); duplication is what caused
    #606-adjacent inconsistency.
  - A single list component owning fetch + state. Rejected: the two pages have
    different data sources and mutation sets; only the card is genuinely shared.
- Rationale: One card = guaranteed visual/interaction parity, which is the
  explicit ask ("the interaction should be the same as the global encounter
  screen").
- Trade-offs: Touches the stable global list. Mitigated by component tests on
  both pages covering the card before and after. If review deems the global-list
  regression risk too high, fall back to a campaign-local card that mirrors the
  global markup (parity by copy) — noted as the accepted fallback, not a scope
  change.

### Decision 4: `Edit`/`Unlink` gating and the co-DM edge case

- Chosen: Gate `Edit` and `Unlink` visibility on `isDM`. Do not add an extra
  `encounter.userId === user.userId` check for the default implementation; if a
  non-owner co-DM triggers a save, the existing `PUT` 404 surfaces through
  `ErrorBanner`.
- Alternatives considered:
  - Also require `encounter.userId === currentUserId` to show `Edit`. Deferred
    pending the open question; easy to add later without spec change.
- Rationale: Keeps behavior aligned with existing DM-only link/unlink gating
  (n077) and avoids over-building before the co-DM question is answered.
- Trade-offs: A multi-DM campaign could show a co-DM an `Edit` that errors on
  save. Low frequency; error is legible, not silent.

## Proposal to Design Mapping

- Proposal element: Show monster roster on campaign encounter cards.
  - Design decision: Decision 3 (`EncounterCard` renders roster for both lists).
  - Validation approach: Component test asserts roster + count render for a
    linked encounter with monsters.
- Proposal element: Inline `Edit` on campaign encounter cards.
  - Design decision: Decision 2.
  - Validation approach: Component test — click `Edit`, editor mounts with
    encounter data, save issues `PUT /api/encounters/:id`, list refetches.
    Integration test (harness) — edit a linked encounter, reload, change persists.
- Proposal element: Page is DM-aware; non-DM sees read-only list.
  - Design decision: Decision 1.
  - Validation approach: Component tests with `useIsDM` mocked to
    `{isDM:true}` / `{isDM:false}` / `{loading:true}`; assert presence/absence of
    `Link`, `Create`, `Edit`, `Unlink`.
- Proposal element: Campaign list visually matches the global list.
  - Design decision: Decision 3.
  - Validation approach: Both pages render through `EncounterCard`; snapshot /
    DOM-structure test on the shared card. Manual visual check via `openwolf
    designqc` during apply.
- Proposal element: Keep link/unlink DM-only; no `Delete` on campaign screen.
  - Design decision: Decision 4 + Decision 3 (campaign caller omits `onDelete`).
  - Validation approach: Component test asserts no `Delete` control on the
    campaign card; backend DM-only behavior already covered by existing tests.
- Proposal element: No API changes.
  - Design decision: Decisions 1–2 (existing endpoints suffice).
  - Validation approach: Diff review; no files under `app/api/**` changed.

## Functional Requirements Mapping

- Requirement: A campaign DM can edit a linked encounter's name, description, and
  monsters from `app/campaigns/[id]/encounters/page.tsx` without leaving the
  campaign.
  - Design element: Decision 2 (`editingEncounter` state, `handleEditSave`,
    `EncounterEditor`).
  - Acceptance criteria reference: `specs/campaign-encounter-management/spec.md`
    — "DM edits a linked encounter inline".
  - Testability notes: Component test with mocked `fetch`; harness integration
    test asserting persistence via a reload.
- Requirement: After a successful edit, the linked-encounters list reflects the
  updated data.
  - Design element: `handleEditSave` calls `fetchLinked()` on success (n090/n094).
  - Acceptance criteria reference: same spec — "List refreshes after edit".
  - Testability notes: Component test asserts a second `GET
    /api/campaigns/[id]/encounters` after save and updated text in the DOM.
- Requirement: Each linked encounter card shows its monster roster and count.
  - Design element: Decision 3.
  - Acceptance criteria reference: same spec — "Linked encounter card shows
    monster roster".
  - Testability notes: Component test with a fixture encounter containing
    monsters.
- Requirement: Non-DM members see a read-only list with no management actions.
  - Design element: Decision 1.
  - Acceptance criteria reference: same spec — "Non-DM member sees read-only
    encounter list".
  - Testability notes: Component test with `useIsDM` → `{isDM:false}`.
- Requirement: The campaign screen never exposes a `Delete` (destroy) action.
  - Design element: Decision 3/4 (no `onDelete` passed).
  - Acceptance criteria reference: same spec — "No encounter deletion from
    campaign context".
  - Testability notes: Component test asserts absence of a delete control.
- Requirement: Link/create/unlink remain DM-only and unchanged in behavior.
  - Design element: Decision 4; no backend change.
  - Acceptance criteria reference: same spec — "Management actions restricted to
    DM".
  - Testability notes: Existing API tests for `POST`/`DELETE` DM-only still pass;
    component test confirms actions hidden for non-DM.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Editing a linked encounter must not bypass ownership
    authorization; link/unlink stays DM-only.
  - Design element: Reuse `PUT /api/encounters/:id` (ownership-checked) and the
    existing DM-only link/unlink endpoints; frontend gating is convenience only,
    not the security boundary (n077).
  - Acceptance criteria reference: `specs/campaign-encounter-management/spec.md`
    — security scenarios.
  - Testability notes: Existing API route tests; add a test that a non-owner
    `PUT` returns 404 (if not already covered).
- Requirement category: reliability
  - Requirement: A failed edit/unlink surfaces an error and leaves the list in a
    consistent state (refetch authoritative data).
  - Design element: `handleEditSave` / existing `handleUnlink` set
    `ErrorBanner` on failure; `fetchLinked()` re-reads on success.
  - Acceptance criteria reference: same spec — error-handling scenario.
  - Testability notes: Component test with mocked failing `fetch`.
- Requirement category: operability
  - Requirement: No new backend surface, no new env/config, no migration.
  - Design element: Decisions 1–2 (existing endpoints only).
  - Acceptance criteria reference: n/a (verified by diff).
  - Testability notes: Confirm no `app/api/**` or schema changes in the diff.
- Requirement category: performance
  - Requirement: At most one extra lightweight request per page visit.
  - Design element: `useIsDM` uses `/members/me`, not the full roster.
  - Acceptance criteria reference: n/a.
  - Testability notes: Network assertion in component test (one `/members/me`
    call).

## Risks / Trade-offs

- Risk/trade-off: Extracting `EncounterCard` regresses the stable global list.
  - Impact: Visual/behavioral regression on `/encounters`.
  - Mitigation: Purely presentational extraction; component tests on both pages
    before/after; documented fallback to a campaign-local card if review objects.
- Risk/trade-off: Edits mutate the shared encounter record, surprising a DM who
  expected a campaign-local change.
  - Impact: Cross-campaign confusion for encounters linked in multiple places.
  - Mitigation: Identical semantics to the global list and to link behavior
    (n074); optional one-line editor note (open question, non-blocking).
- Risk/trade-off: Co-DM (non-owner) sees an `Edit` that 404s on save.
  - Impact: Broken action in multi-DM campaigns.
  - Mitigation: Legible error via `ErrorBanner`; optional
    `encounter.userId === userId` gate can be added without spec change.
- Risk/trade-off: `useIsDM` `loading` state causes a brief read-only render.
  - Impact: Minor flicker for DMs on slow connections.
  - Mitigation: Hide actions (don't show-then-hide); acceptable.

## Rollback / Mitigation

- Rollback trigger: Regression in the global `/encounters` list, broken edit flow
  on the campaign screen, or non-DM members seeing management actions.
- Rollback steps: Revert the PR (single frontend-only PR on branch
  `campaign-encounter-edit-parity`). If only the shared-card extraction is at
  fault, revert `lib/components/EncounterCard.tsx` and restore the two pages'
  local card markup while keeping the DM-aware edit logic.
- Data migration considerations: None — no schema or data changes.
- Verification after rollback: `/encounters` renders and edits as before; the
  campaign encounters screen returns to link/create/unlink-only; test suite green
  via the project harness.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the branch; do not merge with red CI. Lint /
  type / unit failures block. Do not disable or skip tests to go green.
- If security checks fail: Treat as blocking. This change adds no API surface; a
  security finding most likely indicates an unintended backend edit — investigate
  and remove it rather than suppress.
- If required reviews are blocked/stale: Address every review comment before
  merge (per repo policy). Do not use admin/branch-protection bypass. Re-request
  review after changes.
- Escalation path and timeout: If CI is blocked by unrelated infra for more than
  one working day, note it on the PR and in
  `openspec/changes/campaign-encounter-edit-parity/` feedback, and ask the
  requester (Doug) how to proceed. Never bypass branch protection.

## Open Questions

- Co-DM editing of non-owned encounters — see proposal Open Questions. Default:
  gate on `isDM` only; non-owner save errors via the standard path.
- Optional editor note about shared-record edit semantics — default: omit, keep
  identical to the global editor.
- Both defaults are reversible without spec changes.
