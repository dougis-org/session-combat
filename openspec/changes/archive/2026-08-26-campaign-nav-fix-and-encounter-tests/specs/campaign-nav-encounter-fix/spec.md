## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign list card offers correctly labeled, correctly routed Encounters and Start Combat actions

The system SHALL replace the single mislabeled "Start Encounter" link on each campaign list card with two links: "Encounters" routing to `/campaigns/{id}/encounters`, and "Start Combat" routing to `/campaigns/{id}/combat`.

#### Scenario: Campaign card shows Encounters and Start Combat links

- **Given** a signed-in user viewing `/campaigns` with at least one campaign
- **When** the page renders a campaign's card
- **Then** the card's action row shows a link labeled "Encounters" with `href="/campaigns/{campaign.id}/encounters"` and a link labeled "Start Combat" with `href="/campaigns/{campaign.id}/combat"`, and no link labeled "Start Encounter" or pointing to `/encounters` remains on that card

#### Scenario: Start Combat routes to campaign combat setup, not the global encounter browser

- **Given** a signed-in user on `/campaigns` with an existing campaign
- **When** the user clicks "Start Combat" on that campaign's card
- **Then** the browser navigates to `/campaigns/{id}/combat` and the campaign-scoped combat setup view (`CombatSetupView`) renders — not `/encounters`

#### Scenario: Encounters link routes to the campaign's encounter management screen

- **Given** a signed-in user on `/campaigns` with an existing campaign
- **When** the user clicks "Encounters" on that campaign's card
- **Then** the browser navigates to `/campaigns/{id}/encounters` and the campaign encounter management screen renders

### Requirement: ADDED E2E coverage confirms linking and unlinking an encounter updates the campaign-scoped combat-setup picker

The system SHALL be covered by an automated end-to-end test verifying that linking/unlinking an encounter via the campaign Encounters tab is reflected in the combat-setup "From Library" picker, without affecting the encounter's presence on the global `/encounters` list.

#### Scenario: Linking an encounter makes it appear in the campaign's combat-setup picker

- **Given** a DM with an existing campaign and an existing unlinked encounter they own
- **When** the DM opens `/campaigns/{id}/encounters`, links the encounter, then navigates to `/campaigns/{id}/combat`
- **Then** the linked encounter appears in the "From Library" panel of the campaign-scoped combat setup view

#### Scenario: Unlinking an encounter removes it from the picker but not from the global list

- **Given** a DM with an encounter currently linked to a campaign
- **When** the DM unlinks the encounter from `/campaigns/{id}/encounters` and returns to `/campaigns/{id}/combat`
- **Then** the encounter no longer appears in the "From Library" panel for that campaign, and it still appears on the global `/encounters` page

### Requirement: ADDED E2E coverage confirms ad hoc combat with zero linked encounters is unaffected by campaign scoping

The system SHALL be covered by an automated end-to-end test verifying the ad hoc `/combat` page's Quick Entry path still starts combat successfully when no encounters are linked to any campaign.

#### Scenario: Ad hoc combat Quick Entry works with zero campaign-linked encounters

- **Given** a signed-in user navigating directly to `/combat` (no `campaignId`)
- **When** the user adds combatants via Quick Entry and starts combat
- **Then** the active combat screen renders successfully, regardless of the state of any campaign's linked encounters

## Traceability

- Proposal element "campaign card two-link fix" -> Requirement: ADDED Campaign list card offers correctly labeled, correctly routed Encounters and Start Combat actions
- Proposal element "E2E: Start Combat reaches campaign combat setup" -> Requirement: ADDED Campaign list card offers correctly labeled, correctly routed Encounters and Start Combat actions (scenario: Start Combat routes to campaign combat setup)
- Proposal element "E2E: Encounters tab link/unlink reflected in picker" -> Requirement: ADDED E2E coverage confirms linking and unlinking an encounter updates the campaign-scoped combat-setup picker
- Proposal element "E2E: ad hoc /combat zero-linked Quick Entry" -> Requirement: ADDED E2E coverage confirms ad hoc combat with zero linked encounters is unaffected by campaign scoping
- Design decision 1 (two links, not a dropdown) -> Requirement: ADDED Campaign list card offers correctly labeled, correctly routed Encounters and Start Combat actions
- Design decision 4 (new E2E spec file) -> Requirement: ADDED E2E coverage confirms linking and unlinking an encounter updates the campaign-scoped combat-setup picker; ADDED E2E coverage confirms ad hoc combat with zero linked encounters is unaffected by campaign scoping
- Requirement: ADDED Campaign list card... -> Task(s): update `app/campaigns/page.tsx`; add/update campaign-list-page unit test
- Requirement: ADDED E2E coverage confirms linking and unlinking... -> Task(s): add `tests/e2e/campaign-combat-linking.spec.ts` scenario(s)
- Requirement: ADDED E2E coverage confirms ad hoc combat... -> Task(s): add `tests/e2e/campaign-combat-linking.spec.ts` scenario

## Non-Functional Acceptance Criteria

> NFAC scenarios below do not duplicate the functional scenarios above; they express reliability and operability properties not otherwise captured.

### Requirement: Performance

Not applicable — this change is presentational (two links) and test-only; it introduces no new runtime code path with a latency budget of its own.

### Requirement: Security

See functional scenarios: this change touches no authentication, authorization, or data-access logic (Non-Goals: no route or data-model changes). No new access-control scenario applies.

### Requirement: Reliability

#### Scenario: New E2E tests do not introduce flakiness

- **Given** the new `tests/e2e/campaign-combat-linking.spec.ts` scenarios, particularly the link/unlink-reflected-in-picker scenario which depends on an API round trip and a client refetch
- **When** the test suite runs repeatedly in CI
- **Then** the scenarios assert on final, settled UI state (e.g. presence/absence of the encounter in the picker list) rather than fixed sleeps or intermediate loading states, so repeated runs pass consistently
