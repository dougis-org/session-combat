## GitHub Issues

- #540
- #541

## Why

- Problem statement: The campaigns list card (`app/campaigns/page.tsx` ~line 275) still shows a single "Start Encounter" button linking to `/encounters` (the global, campaign-agnostic encounter browser). This label and destination are both wrong: it should offer campaign-scoped actions, one to manage the campaign's linked encounters and one to start campaign-aware combat. The campaign-scoped combat page (`app/campaigns/[id]/combat/page.tsx`) already exists and works but has no entry point from the list view. Separately, the campaign-encounter linking feature set (issues #535, #536, #537, #538) has shipped its API routes, data model, management screen, and scoped picker, but issue #541's test coverage for that surface has not been written.
- Why now: #540 is the last unblocked UI-wiring issue in the campaign-encounter linking set (its dependency, the encounters management screen, shipped in #537). Closing it now removes an orphaned route and a misleading button. Bundling in #541's applicable test scope closes out verification debt on already-shipped API/UI surface area while the design is still fresh.
- Business/user impact: DMs get a correctly labeled, correctly routed path from the campaign list straight into campaign-scoped combat setup, instead of landing on the wrong page. The linked-encounter API and picker gain regression coverage, reducing risk of silent breakage as the feature set continues to grow (e.g. the still-open banner work in #539).

## Problem Space

- Current behavior: `app/campaigns/page.tsx` renders one `Link href="/encounters"` labeled "Start Encounter" per campaign card. It sends the DM to the global encounter browser, not to combat, and does not reflect that campaign-scoped encounters/combat pages exist. `app/campaigns/[id]/layout.tsx` already has working "Encounters" and "Combat" nav tabs (shipped in #537 — verified in the current codebase, no change needed here). The `/api/campaigns/[id]/encounters` (GET/POST) and `/api/campaigns/[id]/encounters/[encounterId]` (DELETE) routes exist and are wired into `useCombat`'s campaign-scoped fetch and the encounters management screen, but have no dedicated automated test coverage.
- Desired behavior: Each campaign card shows two actions — "Encounters" (→ `/campaigns/{id}/encounters`) and "Start Combat" (→ `/campaigns/{id}/combat`) — styled consistently with the card's existing action buttons (Members/Prompt Builder/Library/Session Log). The campaign-encounter link API and the two E2E flows it powers (Start Combat routing, and link/unlink reflected in the combat-setup picker) are covered by automated tests, as is the ad hoc `/combat` page's unaffected zero-linked-encounters path.
- Constraints: Must not touch `app/campaigns/[id]/layout.tsx` nav (already correct) or introduce any new API routes — the routes this change tests already exist and are in scope only for test coverage, not modification, unless a test surfaces a genuine defect.
- Assumptions: The existing `/api/campaigns/[id]/encounters` and `/api/campaigns/[id]/encounters/[encounterId]` route implementations are correct as shipped; this change adds coverage rather than fixing behavior. If tests reveal a defect, fixing it is in scope but must be called out explicitly (not silently patched).
- Edge cases considered:
  - Linking an encounter that belongs to another user must fail (ownership check).
  - Re-linking an already-linked encounter must be idempotent (no duplicate entries, no error).
  - Unlinking must remove the campaign association without deleting the underlying `Encounter` record.
  - A campaign with zero linked encounters must show the existing empty state in the combat-setup "From Library" picker (already implemented in `CombatSetupView.tsx`), not an error.
  - Ad hoc `/combat` (no `campaignId`) must remain fully functional via "Quick Entry" with zero campaign encounters linked anywhere.

## Scope

### In Scope

- `app/campaigns/page.tsx`: replace the single "Start Encounter" link with "Encounters" and "Start Combat" links per campaign card.
- Unit/integration tests for `/api/campaigns/[id]/encounters` (GET, POST) and `/api/campaigns/[id]/encounters/[encounterId]` (DELETE): link, unlink, list, ownership checks, idempotent linking.
- E2E test: campaign list "Start Combat" reaches the campaign-scoped combat setup view (not the add-encounter screen).
- E2E test: campaign "Encounters" tab — link an existing encounter, confirm it's reflected in the combat-setup "From Library" picker; unlink, confirm it disappears from the picker but still exists on the global `/encounters` list.
- E2E test: ad hoc `/combat` still starts combat successfully with zero campaign encounters linked (Quick Entry path).

### Out of Scope

- The "in-progress campaign" banner on `/combat` and its E2E test — this is issue #539, which is still open (banner not implemented). That scenario from #541's original checklist is deliberately excluded here; #539's own change is responsible for adding it when the banner ships.
- Any change to `app/campaigns/[id]/layout.tsx` nav — already correct.
- Any change to the `/api/campaigns/[id]/encounters*` route implementations, the `Campaign.encounterIds` data model, or `CombatSetupView`/`useCombat` scoping logic — all already shipped (#535, #536, #538). This change tests that surface, it does not modify it, unless testing surfaces a genuine defect (see Risks).
- Pagination/filtering changes to the global `/encounters` list — explicitly out of scope per the original design doc.

## What Changes

- `app/campaigns/page.tsx`: the campaign card's action row gains two links ("Encounters", "Start Combat") in place of the single mislabeled "Start Encounter" link.
- New unit/integration test file(s) covering `/api/campaigns/[id]/encounters` and `/api/campaigns/[id]/encounters/[encounterId]`.
- New E2E test(s) covering: Start Combat routing from the campaign list, Encounters tab link/unlink reflected in the combat-setup picker, and ad hoc `/combat` zero-linked-encounters Quick Entry flow.

## Risks

- Risk: Testing the existing `/api/campaigns/[id]/encounters*` routes surfaces a real defect (e.g. an ownership check gap or non-idempotent link).
  - Impact: Scope would grow beyond "add tests" to "add tests + fix defect," and could affect data integrity for existing campaigns.
  - Mitigation: If a defect is found, stop and report it explicitly rather than silently patching; treat it as a Change Control scope change requiring proposal/design/tasks updates before fixing.
- Risk: E2E tests for the "Encounters" tab / combat-setup picker interaction are flaky if they depend on timing between link/unlink API calls and picker refetch.
  - Impact: Intermittent CI failures unrelated to real regressions.
  - Mitigation: Assert on explicit UI state changes (list membership) rather than fixed waits; follow existing E2E patterns in the repo for similar async flows.
- Risk: Styling the two new campaign-card buttons inconsistently with the existing action row (colors, spacing) creates visual noise.
  - Impact: Minor UX inconsistency.
  - Mitigation: Reuse the existing Tailwind button classes pattern already used by the four sibling links in the same row (Members/Prompt Builder/Library/Session Log), picking colors not already used in that row.

## Open Questions

- Question: Should "Encounters" and "Start Combat" reuse two of the currently-unused-in-this-row Tailwind color classes, or is there a preferred convention (e.g. always orange for anything encounter/combat-related, since "Start Encounter" was orange)?
  - Needed from: requester (or defer to implementer's judgment during apply, matching sibling button style)
  - Blocker for apply: no — reasonable default (keep orange for "Start Combat" as the primary action, since it was orange before; pick an unused color, e.g. teal/cyan, for "Encounters") can be applied and adjusted in review.
- Question: Do the E2E tests for this change belong in the existing E2E suite file for campaigns, or a new file scoped to campaign-encounter linking?
  - Needed from: implementer's judgment during apply, following existing repo conventions (e.g. co-locating with `app/campaigns/[id]/encounters` or campaign combat E2E specs if they exist)
  - Blocker for apply: no

## Non-Goals

- Implementing the in-progress campaign banner (#539).
- Any redesign of the campaign card layout beyond the two-link swap.
- Adding pagination, search, or filtering to the global `/encounters` browser.
- Modifying the `Campaign` or `Encounter` data models.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
