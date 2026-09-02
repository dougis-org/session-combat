## ADDED Requirements

### Requirement: ADDED Rollout completion marker
The system SHALL maintain a rollout status header in `docs/campaign-encounter-rollout.md` that reflects the current state of the bulk-pass encounter rollout.

#### Scenario: Rollout status transitions to "rollout complete" after G5 lands
- **Given** the bulk-pass encounter rollout (per `docs/campaign-encounter-rollout.md`) has completed G1, G2, G3, G4, and G5
- **When** the G5 PR is merged
- **Then** the rollout status header in `docs/campaign-encounter-rollout.md` transitions from "in progress" to "rollout complete"
- **Then** the status table for all 49 campaigns reflects their final merged state

## Traceability

- Proposal element -> Requirement: Update rollout doc to "rollout complete" -> ADDED Rollout completion marker
- Design decision -> Requirement: Doc status transition to "rollout complete" -> ADDED Rollout completion marker
- Requirement -> Task(s): Will map to `docs/campaign-encounter-rollout.md` status header update in `tasks.md`.
