## Context

- Relevant architecture: Next.js App Router client pages under
  `app/campaigns/[id]/**`, wrapped by `ProtectedRoute` and the shared
  `CampaignLayout` (`app/campaigns/[id]/layout.tsx`), which renders a tab
  nav from a `{ label, href }` array and the campaign chat sidebar. Similar
  campaign-scoped list screens already exist as precedent:
  `app/campaigns/[id]/library/page.tsx` (fetch-list + filter tabs +
  expandable cards) and the global `app/encounters/page.tsx` (list +
  inline `EncounterEditor` for create/edit).
- Dependencies: `app/api/campaigns/[id]/encounters/route.ts` (GET list,
  POST link), `app/api/campaigns/[id]/encounters/[encounterId]/route.ts`
  (DELETE unlink), `app/api/encounters/route.ts` (GET all owned, POST
  create with optional `campaignId`), `app/encounters/EncounterEditor.tsx`
  (unmodified), `lib/utils/campaign.ts:assertCampaignAccess` (used
  server-side only, no client-side equivalent needed).
- Interfaces/contracts touched: none changed. This design consumes
  existing, already-tested API contracts as-is. The only touched file
  outside the new page is `app/campaigns/[id]/layout.tsx`'s nav array.

## Goals / Non-Goals

### Goals

- Let a DM view, link, create-and-link, and unlink encounters for a
  specific campaign through a dedicated page.
- Make the new page and the existing orphaned combat page reachable via
  the campaign layout nav.
- Handle every documented API edge case (403/404 on foreign encounter,
  `linkWarning` on partial create-and-link failure, empty states) visibly
  in the UI rather than silently.

### Non-Goals

- Changing `EncounterEditor.tsx`, the global `/encounters` page, or any
  API route.
- Pagination/search on `GET /api/encounters` (client-side filter only).
- Scoping `CombatSetupView`'s picker (#538) or the ad hoc banner (#539).
- The campaign-list "Start Encounter" button split (remainder of #540).

## Decisions

### Decision 1: Page structure — single client component, three sub-views toggled by local state

- Chosen: One `'use client'` page component
  (`app/campaigns/[id]/encounters/page.tsx`) with local `useState` toggles
  between: (a) the default linked-encounters list, (b) the "Link Existing"
  picker panel, (c) the `EncounterEditor` create panel. Modeled directly on
  `app/encounters/page.tsx`'s existing `isAddingEncounter` /
  `editingEncounter` pattern, extended with a third `isLinkingEncounter`
  toggle.
- Alternatives considered: separate routes per sub-view
  (`/encounters/link`, `/encounters/new`); a modal-based picker.
- Rationale: matches the existing `EncountersContent` pattern in the
  codebase exactly (same team, same conventions, lowest cognitive load);
  avoids extra route/layout wiring for what are transient UI states, not
  navigable destinations.
- Trade-offs: state gets slightly more branchy (three mutually exclusive
  panels instead of two) but stays inside one component, consistent with
  existing precedent.

### Decision 2: Linked-encounters state — refetch after mutation, no optimistic updates

- Chosen: After a successful link, unlink, or create-and-link, call
  `fetchLinkedEncounters()` again (re-`GET /api/campaigns/[id]/encounters`)
  rather than mutating local state optimistically.
- Alternatives considered: optimistic local array updates
  (`setLinked(prev => [...prev, newEncounter])`).
- Rationale: matches `app/encounters/page.tsx`'s existing
  `saveEncounter`/`deleteEncounter` pattern (`await fetchEncounters()`
  after every mutation); keeps client state provably consistent with the
  server, which matters here because linking involves a second resource
  (the `Encounter` document itself, fetched by ID) that the client doesn't
  otherwise hold.
- Trade-offs: one extra round trip per mutation vs. optimistic UI; judged
  acceptable since this is a low-frequency DM management screen, not a
  hot path.

### Decision 3: "Link Existing" picker sourcing — client-side filter over `GET /api/encounters`

- Chosen: On opening the picker, fetch all owned encounters once via
  `GET /api/encounters`, then filter out any whose `id` is already in the
  linked-encounters list (by `id`, computed client-side with a `Set`), and
  apply the DM's search text against `encounter.name` (case-insensitive
  substring match), entirely client-side.
- Alternatives considered: new query params on `GET /api/encounters` for
  server-side search/exclude; a dedicated "unlinked encounters" endpoint.
- Rationale: confirmed acceptable scope limitation during proposal review;
  avoids touching the API surface at all, keeping this change UI-only;
  mirrors the global `/encounters` page's own lack of pagination.
- Trade-offs: picker payload and initial render cost grow with the DM's
  total encounter count; explicitly deferred per proposal's Non-Goals.

### Decision 4: `EncounterEditor` reuse for creation — host-page save handler injects `campaignId`

- Chosen: When "Create New Encounter" is active, render `EncounterEditor`
  exactly as `app/encounters/page.tsx` does, but the page's own
  `onSave` handler POSTs to `/api/encounters` with
  `{ name, description, monsters, campaignId: id }` instead of the bare
  payload. No prop or behavior change to `EncounterEditor` itself — it
  already calls `onSave(encounter)` with the full encounter shape; the
  campaign-scoped page's handler is the only thing that differs from the
  global page's handler.
- Alternatives considered: adding an optional `campaignId` prop to
  `EncounterEditor` and having it thread the field through internally.
- Rationale: confirmed during proposal review; keeps `EncounterEditor` a
  campaign-agnostic, reusable component (it's also used, unmodified, by
  the global encounters page); the linking behavior is a concern of the
  page composing it, not the editor itself.
- Trade-offs: none material — this is a strictly smaller diff than
  modifying the shared component.

### Decision 5: Handling `linkWarning` from `POST /api/encounters`

- Chosen: After a create-and-link POST, if the response body includes
  `linkWarning` (encounter saved but the link step failed — see
  `app/api/encounters/route.ts:78-88`), show it as a non-blocking inline
  warning (distinct styling from the hard-error banner) and still refresh
  the linked list and close the create panel, since the encounter record
  itself was created successfully. The DM can then use "Link Existing" to
  retry linking it.
- Alternatives considered: treating `linkWarning` as a hard failure and
  leaving the create panel open.
- Rationale: the encounter *was* created (the API returns 201 either way);
  telling the DM it failed outright would be misleading and could cause a
  duplicate-creation attempt. The design must not silently swallow the
  warning either — hence a visible but non-blocking treatment.
- Trade-offs: introduces a third UI feedback state (success / hard error /
  soft warning) beyond the existing two-state pattern in
  `app/encounters/page.tsx`; justified because the API contract itself has
  three outcomes here.

### Decision 6: Unlink confirmation copy

- Chosen: Confirm dialog reads "Unlink this encounter from the campaign?
  It will not be deleted and will remain available in the global
  Encounters list." (via `window.confirm`, matching the existing
  `deleteEncounter` pattern in `app/encounters/page.tsx`, but with
  unlink-specific wording).
- Alternatives considered: a custom `Modal`-based confirm (the codebase
  has a `Modal` component used elsewhere in `EncounterEditor`).
- Rationale: `window.confirm` is the existing precedent for this exact
  kind of destructive-sounding-but-not-destructive action in this
  codebase; a custom modal is unnecessary weight for a single confirm
  step. The wording is the actual risk-mitigation lever here, not the
  dialog mechanism.
- Trade-offs: `window.confirm` is less stylable/testable than a custom
  modal, but is consistent with existing test patterns
  (`jest.spyOn(window, 'confirm')`) already used elsewhere in this repo.

### Decision 7: Nav tabs — fold #540's array addition into `CampaignLayout`

- Chosen: Add two entries to the existing nav array in
  `app/campaigns/[id]/layout.tsx` (line ~40-45):
  `{ label: 'Encounters', href: `/campaigns/${id}/encounters` }` and
  `{ label: 'Combat', href: `/campaigns/${id}/combat` }`, placed after
  `Library` to match the design spec's suggested nav order.
- Alternatives considered: leaving nav wiring to #540 entirely and
  requiring manual URL navigation to test/use the new page in the interim.
- Rationale: confirmed during proposal review — the new page is otherwise
  unreachable and unverifiable end-to-end without it; the change is a
  ~2-line addition to an existing array literal, well within this change's
  footprint.
- Trade-offs: creates a coordination point with #540 (see Risks) — #540's
  remaining scope (the campaign-list button split) must not re-add these
  same nav entries.

## Proposal to Design Mapping

- Proposal element: "Link Existing Encounter" picker (client-side filter)
  - Design decision: Decision 3
  - Validation approach: unit test asserting already-linked encounter IDs
    are excluded from picker results after fetch; unit test for
    case-insensitive name search filtering.
- Proposal element: "Create New Encounter" via `EncounterEditor`, auto-link
  - Design decision: Decision 4, Decision 5
  - Validation approach: unit test mocking `POST /api/encounters` to
    return both a clean 201 and a 201-with-`linkWarning`, asserting UI
    behavior differs (silent success vs. visible warning) in each case.
- Proposal element: "Unlink" with confirm, no delete
  - Design decision: Decision 2, Decision 6
  - Validation approach: unit test asserting `DELETE
    /api/campaigns/[id]/encounters/[encounterId]` is called only after
    `window.confirm` returns true, and that the linked list is refetched
    afterward; assert the confirm dialog text mentions the encounter is
    not deleted.
- Proposal element: nav tabs reachable from campaign layout
  - Design decision: Decision 7
  - Validation approach: unit test on `CampaignLayout` (or existing test
    file, if any) asserting the nav array/rendered links include
    "Encounters" and "Combat" hrefs.
- Proposal element: refetch-after-mutation consistency
  - Design decision: Decision 2
  - Validation approach: unit test asserting `fetch` is called against
    `GET /api/campaigns/[id]/encounters` again after each successful
    link/unlink/create-and-link action.

## Functional Requirements Mapping

- Requirement: Screen loads and lists only the current campaign's linked
  encounters.
  - Design element: Decision 2 (list state), `GET
    /api/campaigns/[id]/encounters` on mount.
  - Acceptance criteria reference: issue #537 acceptance criteria, item 1.
  - Testability notes: mock fetch to return a fixed encounter array;
    assert rendered list matches; assert no unrelated encounters render.
- Requirement: Linking an existing encounter updates the list without a
  full page reload.
  - Design element: Decision 2, Decision 3.
  - Acceptance criteria reference: issue #537 acceptance criteria, item 2.
  - Testability notes: simulate picker selection + link click; assert
    `POST` call, then assert refetch call, then assert new item appears
    in rendered list — all within one component-level test (jsdom, no
    navigation/reload).
- Requirement: Unlinking prompts for confirmation and does not delete the
  encounter (verify it's still visible on `/encounters` afterward).
  - Design element: Decision 2, Decision 6.
  - Acceptance criteria reference: issue #537 acceptance criteria, item 3.
  - Testability notes: unit-test the confirm-gate and refetch behavior
    (in-scope); cross-page "still visible on /encounters" verification is
    already covered by the API's own unit tests
    (`tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts`
    asserts `$pull`-only semantics) — not re-verified via UI E2E in this
    change (no E2E added; see Tasks/Tests artifacts for exact scope).
- Requirement: Creating a new encounter from this screen links it to the
  campaign automatically.
  - Design element: Decision 4, Decision 5.
  - Acceptance criteria reference: issue #537 acceptance criteria, item 4.
  - Testability notes: assert `EncounterEditor`'s `onSave` payload results
    in a `POST /api/encounters` call including `campaignId`; assert
    subsequent list refetch.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The screen must not silently drop the `linkWarning`
    partial-failure case from `POST /api/encounters`.
  - Design element: Decision 5.
  - Acceptance criteria reference: Problem Space "edge cases considered"
    in proposal.md (double-submit / partial-failure handling).
  - Testability notes: unit test covers the `linkWarning` response
    explicitly (see Proposal to Design Mapping above).
- Requirement category: security
  - Requirement: No client-side trust of ownership/role — all
    authorization already enforced server-side by `assertCampaignAccess`
    and the API's `role !== 'dm'` checks; the UI must surface 403/404
    responses as errors, not attempt its own access logic.
  - Design element: existing API contracts, consumed as-is (no new
    client-side auth logic introduced).
  - Acceptance criteria reference: proposal.md Problem Space, "linking an
    encounter that belongs to another user" edge case.
  - Testability notes: unit test mocking a 404 response from the link
    `POST` and asserting an inline error is shown, not a silent failure.
- Requirement category: operability
  - Requirement: Double-submission of a link action must not create
    duplicate optimistic entries or duplicate in-flight requests.
  - Design element: Decision 2 (no optimistic updates) plus disabling the
    link/unlink/save buttons while a request is in flight (matches
    existing `saving`/`disabled` pattern already used in
    `EncounterEditor.tsx` and `app/encounters/page.tsx`).
  - Acceptance criteria reference: proposal.md Problem Space,
    "double-submitting a link" edge case.
  - Testability notes: unit test asserting the link button is disabled
    (or fetch not called a second time) during an in-flight request.

## Risks / Trade-offs

- Risk/trade-off: Client-side-only filtering of `GET /api/encounters` in
  the picker (Decision 3) doesn't scale to very large encounter counts.
  - Impact: picker becomes slow/long to scroll for power-user DMs.
  - Mitigation: explicitly out of scope; revisit with a dedicated
    pagination/search change if it becomes a reported pain point.
- Risk/trade-off: Folding #540's nav-tab addition into this change
  (Decision 7) creates a coordination dependency with issue #540.
  - Impact: if #540 is worked independently before/after this change
    without awareness, its diff could re-add or conflict with these same
    nav entries.
  - Mitigation: proposal.md flags this explicitly; #540's remaining scope
    (button split on the campaign list) does not touch the nav array, so
    the overlap is narrow and should be a clean no-op diff if #540 is
    updated to skip the already-added tabs.

## Rollback / Mitigation

- Rollback trigger: new page throws a runtime error on load in production,
  or the nav-tab addition breaks existing campaign layout tests/rendering.
- Rollback steps: revert the single commit/PR for this change (it touches
  only `app/campaigns/[id]/encounters/page.tsx` — new file, safe to
  remove — and the two-line nav addition in
  `app/campaigns/[id]/layout.tsx` — trivially revertible). No data
  migration or API changes are part of this change, so rollback has no
  server-side or storage-layer implications.
- Data migration considerations: none — this change adds no new fields,
  collections, or storage methods; it only consumes the already-shipped
  `encounterIds` field and link API from #535/#536.
- Verification after rollback: confirm `app/campaigns/[id]/encounters`
  404s again (route removed) and the campaign layout nav reverts to its
  prior four tabs; run the existing campaign layout and encounters test
  suites to confirm no residual references.

## Operational Blocking Policy

- If CI checks fail: fix forward within this change (no API/schema
  changes involved, so failures are expected to be scoped to the new
  page's own tests or lint/type errors); do not merge with failing CI.
- If security checks fail: this change introduces no new API surface,
  auth logic, or data handling beyond consuming existing endpoints — a
  security-check failure would indicate either a false positive or an
  unexpected issue in `EncounterEditor` reuse; investigate before
  proceeding, do not suppress.
- If required reviews are blocked/stale: follow standard repo PR process
  (see `CONTRIBUTING.md`); do not use admin/branch-protection bypass per
  existing team policy — escalate to the requester if a review stalls
  beyond a normal review cycle.
- Escalation path and timeout: if blocked more than one business day on
  review or CI infrastructure (not on legitimate findings), flag to the
  requester directly rather than silently waiting.

## Open Questions

None — all ambiguity was resolved during the preceding explore-mode
session and carried into proposal.md's "Open Questions" section as
confirmed decisions.
