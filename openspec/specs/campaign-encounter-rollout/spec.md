# campaign-encounter-rollout Specification

## Purpose
Track the state of the bulk-pass campaign encounter rollout in
`docs/campaign-encounter-rollout.md` — the per-group status table and the
top-level status header — so the doc always reflects which campaigns ship
with populated encounters.

## Requirements
### Requirement: Rollout completion marker
The system SHALL maintain a rollout status header in `docs/campaign-encounter-rollout.md` that reflects the current state of the bulk-pass encounter rollout.

#### Scenario: Rollout status transitions to "rollout complete" after G5 lands
- **Given** the bulk-pass encounter rollout (per `docs/campaign-encounter-rollout.md`) has completed G1, G2, G3, G4, and G5
- **When** the G5 PR is merged
- **Then** the rollout status header in `docs/campaign-encounter-rollout.md` transitions from "in progress" to "rollout complete"
- **Then** the status table for all 49 campaigns reflects their final merged state

