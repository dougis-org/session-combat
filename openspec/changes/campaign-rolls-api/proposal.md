## GitHub Issues

- dougis-org/session-combat#316

## Why

- Problem statement: Players and DMs have no way to share dice rolls within a campaign session. Rolls happen outside the app and results are communicated informally, breaking immersion and leaving no record.
- Why now: The `activeSessionId` prerequisite (#400) is complete. This is the next unblocked item in Phase 6 (shared rolls), and the roll UI (6b, #317) depends on this API.
- Business/user impact: Enables session-scoped roll sharing with DM-only visibility for secret rolls. Completes the backend half of the shared-rolls feature.

## Problem Space

- Current behavior: No `campaignRolls` collection, no roll API, no roll stream events. Dice rolls are not tracked in the app.
- Desired behavior: Any active campaign member can POST a roll (formula, individual die results, total, optional label, visibility) tied to the campaign's active session. DMs see all rolls including `dm-only`; players only see `group` rolls and their own rolls. Rolls are retrievable per session.
- Constraints:
  - Requires an active session (`activeSessionId` set on campaign); rejects with 409 if none.
  - Client computes dice rolls — server trusts and persists `formula`, `rolls[]`, `total` without re-rolling or validating math.
  - Visibility is limited to `group` and `dm-only` (no `direct` scope for rolls).
  - GET requires explicit `sessionId` query param — no defaulting to active session.
- Assumptions:
  - This is a trusted-table tool; no server-side cheat prevention is needed.
  - `rollerName` is resolved from the user's stored username at POST time, same pattern as `senderName` in messages.
- Edge cases considered:
  - POST with no active session → 409 (client displays a toast prompting DM to open a session).
  - GET without `sessionId` param → 400.
  - `dm-only` roll: invisible to other players in GET query and SSE emission.
  - Member with `status !== 'active'` → 403.

## Scope

### In Scope

- `CampaignRoll` interface and `RollVisibility` type in `lib/types.ts`
- `roll` variant added to `CampaignStreamEvent` union
- `canSeeRoll()` pure function in `lib/utils/campaignRolls.ts`
- `POST /api/campaigns/[id]/rolls` — record a roll
- `GET /api/campaigns/[id]/rolls?sessionId=<id>` — list rolls for a session
- MongoDB `campaignRolls` collection with compound index `{ campaignId, sessionId, createdAt }`
- Storage methods: `saveCampaignRoll()`, `listCampaignRolls()`
- Unit tests for route handlers and `canSeeRoll()`
- Integration tests for POST and GET endpoints

### Out of Scope

- Roll UI / chat dock integration (6b, #317)
- Server-side dice rolling or formula validation
- `direct` visibility scope for rolls
- Session open/close UI (already shipped in #400)
- Rate limiting on the rolls endpoint (can be added later if needed)

## What Changes

- `lib/types.ts`: add `RollVisibility`, `CampaignRoll`, extend `CampaignStreamEvent` with `roll` variant
- `lib/utils/campaignRolls.ts`: new file with `canSeeRoll()` pure function
- `lib/storage.ts`: add `saveCampaignRoll()` and `listCampaignRolls()` methods
- `lib/db.ts` (or init script): ensure `campaignRolls` index `{ campaignId, sessionId, createdAt }` is created at startup
- `app/api/campaigns/[id]/rolls/route.ts`: new file with POST and GET handlers
- `tests/unit/api/campaigns/[id]/rolls.route.test.ts`: unit tests
- `tests/unit/utils/campaignRolls.test.ts`: unit tests for `canSeeRoll()`
- `tests/integration/campaigns/rolls.integration.test.ts`: integration tests

## Risks

- Risk: Visibility bug leaks `dm-only` rolls to players
  - Impact: High — breaks DM trust, potentially ruins secret mechanics
  - Mitigation: Mirror the `canSeeMessage`/`canSeeRoll` pattern exactly; cover all visibility permutations in unit tests
- Risk: Missing index causes slow GET queries on large campaigns
  - Impact: Medium — degraded performance at scale
  - Mitigation: Ensure compound index `{ campaignId, sessionId, createdAt }` is created at DB init time
- Risk: 409 response for no active session is confusing without UI feedback
  - Impact: Low for API; medium for UX (client must show toast)
  - Mitigation: 409 response body includes clear error message; toast is client responsibility (6b)

## Open Questions

No unresolved ambiguity remains. All design decisions were made during explore:
- Visibility scopes: `group` and `dm-only` only (no `direct`)
- GET requires explicit `sessionId` param
- No active session → 409
- Client-side dice rolling; server persists without validation
- Separate `RollVisibility` type (not reusing `MessageVisibility`)

## Non-Goals

- Dice rolling engine or formula parsing on the server
- `direct` visibility for rolls
- Roll editing or deletion
- Roll aggregation/statistics
- Rate limiting (out of scope for this issue)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
