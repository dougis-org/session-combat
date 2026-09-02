## GitHub Issues

- #564

## Why

- Problem statement: The `activeSessionId` on a campaign can be claimed and saved, but if the subsequent database operation to save the `SessionLog` fails, the active session is locked with no corresponding log document.
- Why now: Flagged by a quality gate, leaves the system in a locked state requiring manual intervention to clear.
- Business/user impact: DMs can be permanently blocked from starting new sessions if a transient failure occurs during session creation.

## Problem Space

- Current behavior: `storage.claimActiveCampaignSession` updates the DB before `storage.saveSessionLog` executes. If the latter fails, the claim persists.
- Desired behavior: If `storage.saveSessionLog` fails, the claim should be rolled back to `null`.
- Constraints: The system does not currently use MongoDB transactions for these two operations.
- Assumptions: The database connection will generally remain available to perform the rollback even if the `saveSessionLog` operation fails (e.g., due to schema validation or transient timeout).
- Edge cases considered: If the database is completely unreachable during the save, the rollback may also fail. This will still leave a dangling pointer, but this is acceptable per the non-goals.

## Scope

### In Scope

- Adding a try/catch block around `storage.saveSessionLog` in the `POST /api/campaigns/[id]/sessions/active` route.
- Rolling back the `activeSessionId` claim if the save fails.

### Out of Scope

- Implementing MongoDB replica set transactions.
- Preventing database outages.

## What Changes

- `app/api/campaigns/[id]/sessions/active/route.ts` will catch failures during `storage.saveSessionLog(log)` and call `storage.setActiveCampaignSession(campaignId, campaign.userId, null)`.

## Risks

- Risk: Rollback failure
  - Impact: The system remains in a locked state, requiring manual intervention.
  - Mitigation: Escalate error correctly (return 500) and rely on the existing manual escape hatch (`DELETE ?force=true`).

## Open Questions

- None. (We resolved this during the explore workflow and decided on the rollback approach).

## Non-Goals

- Preventing DB outages or adding resilience beyond correct error propagation.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
