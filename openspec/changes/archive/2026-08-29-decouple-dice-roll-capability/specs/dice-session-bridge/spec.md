## REMOVED Requirements

### Requirement: ADDED Typed, scoped roll-request channel from the global dice fab to CampaignChat

**Reason**: `GlobalDiceFab` now submits rolls directly via the shared
`lib/dice/useRollSubmission.ts` capability (see `dice-pool-shared-state` capability)
instead of asking whichever `CampaignChat` instance happens to be mounted to submit on its
behalf. The request/response indirection this channel provided is no longer needed once
submission doesn't require a specific component to be mounted to execute it.

**Migration**: Any code or test importing `requestRoll` or `RollRequestPayload`/
`RollOutcome`-as-request-shape from `lib/dice/diceSessionBridge.ts` must be updated to call
the shared `submitRoll` function from `lib/dice/useRollSubmission.ts` directly instead.
`tests/unit/lib/dice/diceSessionBridge.test.ts` must drop its `requestRoll` coverage;
`tests/unit/components/GlobalDiceFab.test.tsx` must replace its bridge-round-trip
assertions with direct-submission assertions (mocking `fetch` instead of the bridge).

---

### Requirement: ADDED CampaignChat only acts on a roll request matching its own current campaign and session

**Reason**: This requirement described `CampaignChat`'s behavior as the sole executor of
externally-requested rolls received via the bridge. Since roll submission is no longer
routed through `CampaignChat` at all, there is no "externally-requested roll" concept for
it to filter by campaign/session id — the caller (e.g. `GlobalDiceFab`) now supplies the
`campaignId` directly to `submitRoll` itself, scoped by the session context it already
holds via presence.

**Migration**: `tests/unit/components/CampaignChat/CampaignChat.diceSessionBridge.test.tsx`,
which exists solely to cover this requirement and the removed channel above, is deleted in
its entirety. Any assertion that `CampaignChat` subscribes to `onRollRequested` is removed;
`CampaignChat` no longer imports `onRollRequested` from `diceSessionBridge.ts`.

---

## Traceability

- Proposal "Scope" (removal of `requestRoll`/`onRollRequested`) → Requirements: both
  REMOVED requirements in this capability
- Design decision 3 (bridge narrows to presence only) → Requirements: both REMOVED
  requirements in this capability
- Requirement → Task(s): see `tasks.md`, "Narrow diceSessionBridge" task group

## Notes

`announcePresence`, `clearPresence`, and `onPresenceChange` — and the requirements
governing them ("ADDED Typed, scoped presence channel from CampaignChat to the global dice
fab" and "ADDED CampaignChat announces and clears presence in lockstep with its own
active-session lifecycle") in the base `dice-session-bridge` spec — are unchanged by this
change and are not restated here. Presence remains a legitimate cross-cutting signal
(whether a session exists to roll into) independent of who executes submission.
