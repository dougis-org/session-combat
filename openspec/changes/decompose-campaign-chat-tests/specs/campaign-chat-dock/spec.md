## MODIFIED Requirements

### Requirement: MODIFIED Test suite location for CampaignChat dock shell

The unit tests verifying the `CampaignChat` dock shell behavior (drawer visibility, collapse/expand toggle, pin state persistence, and keyboard accessibility) SHALL be located in a dedicated test file under the `tests/unit/components/CampaignChat/` folder.

#### Scenario: Dock shell unit tests run and pass in drawer suite

- **Given** the `CampaignChat.test.tsx` file is decomposed
- **When** `npm run test:unit` is executed
- **Then** all 13 dock shell tests in [`tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx) pass without modification to their original assertions.

## Traceability

- Proposal element: Decomposing tests into focused files -> Requirement: MODIFIED Test suite location
- Design decision: Centralized helpers.ts File -> Requirement: MODIFIED Test suite location
- Requirement -> Task(s): Decompose CampaignChat dock shell tests to CampaignChat.drawer.test.tsx
