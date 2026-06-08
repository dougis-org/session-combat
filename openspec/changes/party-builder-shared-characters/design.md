## Context

- **Relevant architecture:**
  - `lib/storage.ts` — all MongoDB access; existing methods `addShare`, `removeShare`, `listSharesForCampaign`, `loadParties`, `saveParty`
  - `lib/types.ts` — `Party`, `PartyMember`, `CampaignCharacterShare`, `Character`, `CampaignMember`
  - `app/api/parties/` — POST (create) and PUT (update) routes; currently accept any `characterId` with no ownership check
  - `app/api/campaigns/[id]/characters/` — POST (share), GET (list caller's shares), DELETE (unshare)
  - `app/api/campaigns/[id]/members/[userId]/` — DELETE (remove member from campaign)
  - `app/parties/page.tsx` — `PartyEditor` component; currently fetches `GET /api/characters` only
  - `lib/utils/campaignContext.ts` — `fetchCampaignContext`; fetches DM-owned characters only

- **Dependencies:**
  - 3a (issue #309) is complete: `campaignCharacterShares` collection exists with unique `{campaignId, characterId}` index; `addShare`, `removeShare`, `listSharesForCampaign` storage methods exist; `CampaignCharacterShare` type exists
  - `storage.getMember(campaignId, userId)` exists — used to check member role/status
  - `storage.loadCharacterById(id)` exists

- **Interfaces/contracts touched:**
  - `GET /api/campaigns/[id]/characters` — response shape extended for DM callers
  - `POST /api/parties`, `PUT /api/parties/[id]` — new 403 response path when access rule fails
  - `DELETE /api/campaigns/[id]/characters/[cid]` — side-effect: party cleanup
  - `DELETE /api/campaigns/[id]/members/[userId]` — side-effect: cascaded party cleanup
  - `fetchCampaignContext` — now fetches shared characters and applies reactive filter

## Goals / Non-Goals

### Goals

- DM can select shared player characters in the party builder when a campaign is selected
- Party access rule enforced at POST and PUT: shared-or-owned per campaign context
- Proactive cleanup: unshare and member-removal set `leftAt` on affected party entries
- Reactive guard in `fetchCampaignContext` filters stale shared characters as defense-in-depth
- Observability: timing logged for full-scan storage queries

### Non-Goals

- `campaignId` index on `parties` collection
- Player-facing UI changes
- Real-time revocation notifications

## Decisions

### Decision 1: Enriched DM GET response for shared characters

- **Chosen:** `GET /api/campaigns/[id]/characters` returns `SharedCharacterEntry[]` when caller is DM: `{ share: CampaignCharacterShare, character: Pick<Character, 'id'|'name'|'characterType'|'userId'|'deletedAt'> }`. When caller is a player, existing behavior (bare shares for the caller) is preserved.
- **Alternatives considered:** Separate endpoint `GET /api/campaigns/[id]/shared-characters`; client-side second round-trip to resolve character metadata.
- **Rationale:** Role-aware response on the existing route avoids adding a new route; the character metadata required by the UI (name, type, owner, soft-delete flag) is compact and safe to include given DM ownership of the campaign.
- **Trade-offs:** Response shape is polymorphic based on caller role. Documented in spec. The caller must know to check their role or parse the response shape.

### Decision 2: Access rule in `canAddToCampaignParty` storage helper

- **Chosen:** A new `storage.canAddToCampaignParty(campaignId, characterId, dmUserId): Promise<boolean>` helper checks: (1) character is owned by `dmUserId`, OR (2) an active share exists in `campaignCharacterShares` where `characterId` matches AND `userId` resolves to a campaign member with `status === 'active'`. This requires a two-collection join: `campaignCharacterShares` → `campaignMembers`.
- **Alternatives considered:** Inline the check in each route; a separate service layer.
- **Rationale:** Storage helper is the established pattern in this codebase for cross-collection reads. Testable in isolation. Reused by both POST and PUT party routes.
- **Trade-offs:** Two DB reads per validated character (share lookup + member status check). Acceptable given party sizes are small.

### Decision 3: `listAllSharesForCampaign` — no userId filter

- **Chosen:** New `storage.listAllSharesForCampaign(campaignId): Promise<CampaignCharacterShare[]>` queries `campaignCharacterShares` with `{ campaignId }` only, returning all shares regardless of which player created them.
- **Alternatives considered:** Extend `listSharesForCampaign` with an optional `userId` parameter.
- **Rationale:** Separate method name is explicit about intent and avoids a conditional signature on the existing method.
- **Trade-offs:** Small duplication of query logic. Acceptable.

### Decision 4: `loadPartiesByCampaign` with timing observability

- **Chosen:** New `storage.loadPartiesByCampaign(campaignId: string): Promise<Party[]>` queries all parties documents with `{ campaignId }` (full collection scan, no index). Wraps the query in `Date.now()` timing and logs `[perf] loadPartiesByCampaign <campaignId>: <ms>ms` when duration exceeds 10ms. Includes a `// TODO: add campaignId index if >50ms becomes common` comment.
- **Alternatives considered:** Extend `loadParties(userId)` with an optional `campaignId` filter.
- **Rationale:** Separate method avoids coupling the DM's party-list query with the campaign-scoped cleanup query. Timing log establishes a baseline.
- **Trade-offs:** Full scan acceptable at current scale; log provides data to justify an index later.

### Decision 5: `setPartyMemberLeftAt` as a fire-and-forget cleanup path

- **Chosen:** `storage.setPartyMemberLeftAt(campaignId, characterId, timestamp)` calls `loadPartiesByCampaign`, iterates parties, sets `leftAt` on matching active members, and calls `saveParty` for each modified party. Errors are caught and logged, not re-thrown. Callers (unshare route, member-removal route) do not fail if cleanup errors.
- **Alternatives considered:** Fail the primary operation if cleanup fails; a MongoDB aggregation pipeline update.
- **Rationale:** Cleanup is secondary to the primary operation (unshare / remove member). The reactive guard in `fetchCampaignContext` is the safety net. A simple iterative approach is easy to test and understand.
- **Trade-offs:** Non-atomic; a crash mid-cleanup leaves partial state. The reactive guard handles this.

### Decision 6: Reactive guard in `fetchCampaignContext`

- **Chosen:** After merging DM-owned and shared characters, filter out shared characters (those with `userId !== dmUserId`) whose `characterId` is not in the current `campaignCharacterShares` set for the campaign. The shares are fetched as part of the same `Promise.all` that already fetches parties and characters.
- **Alternatives considered:** Trust `leftAt` exclusively; no reactive guard.
- **Rationale:** Defense-in-depth; the proactive `leftAt` path is best-effort (fire-and-forget). The reactive filter is cheap — it's a set membership check on data already fetched.
- **Trade-offs:** One additional fetch (`GET /api/campaigns/[id]/characters` with DM role) on every context load. Acceptable given it returns a compact JSON list.

### Decision 7: `SharedCharacterEntry` type in `lib/types.ts`

- **Chosen:** Export `interface SharedCharacterEntry { share: CampaignCharacterShare; character: Pick<Character, 'id' | 'name' | 'characterType' | 'userId' | 'deletedAt'> }` from `lib/types.ts`. Used as the response type for the DM-facing GET.
- **Alternatives considered:** Inline type in the route; extend `CampaignCharacterShare` with character fields.
- **Rationale:** Exported type is usable in both the API route and the `PartyEditor` client component without duplication.
- **Trade-offs:** Adds a type to `lib/types.ts`; acceptable given the file already owns all domain types.

## Proposal to Design Mapping

- Proposal element: Enriched DM GET for shared characters
  - Design decision: Decision 1
  - Validation approach: Route test — DM caller receives `SharedCharacterEntry[]`; player caller receives bare shares

- Proposal element: `canAddToCampaignParty` access rule helper
  - Design decision: Decision 2
  - Validation approach: Unit test — owns char → true; active share → true; inactive member → false; no share → false; no campaignId → true (DM-owned pass)

- Proposal element: `listAllSharesForCampaign` (no userId filter)
  - Design decision: Decision 3
  - Validation approach: Unit test — returns shares from multiple players in campaign

- Proposal element: `loadPartiesByCampaign` with timing log
  - Design decision: Decision 4
  - Validation approach: Unit test confirms filtering; integration/log test confirms timing line emitted

- Proposal element: `setPartyMemberLeftAt` proactive cleanup
  - Design decision: Decision 5
  - Validation approach: Unit test — active member gets `leftAt`; already-left member unchanged; errors don't throw

- Proposal element: Reactive guard in `fetchCampaignContext`
  - Design decision: Decision 6
  - Validation approach: Unit test — character with revoked share excluded from context characters list

- Proposal element: `SharedCharacterEntry` type
  - Design decision: Decision 7
  - Validation approach: TypeScript compilation

## Functional Requirements Mapping

- Requirement: DM can add a shared character to a campaign party
  - Design element: Decision 2 (`canAddToCampaignParty`), Decision 1 (UI fetch)
  - Acceptance criteria reference: specs/party-access-rule
  - Testability notes: Route test POST/PUT with shared char → 201/200; unshared char → 403

- Requirement: DM cannot add an unshared character (not owned and not shared)
  - Design element: Decision 2
  - Acceptance criteria reference: specs/party-access-rule
  - Testability notes: Route test with foreign characterId not in shares → 403

- Requirement: Party builder surfaces shared characters grouped by owner
  - Design element: Decision 1, Decision 7
  - Acceptance criteria reference: specs/party-builder-ui
  - Testability notes: Component test — renders shared character section when campaignId set; absent when no campaignId

- Requirement: Unshare triggers proactive `leftAt` on party entries
  - Design element: Decision 5
  - Acceptance criteria reference: specs/party-cleanup
  - Testability notes: Route test DELETE `/campaigns/[id]/characters/[cid]` → party member has `leftAt`

- Requirement: Member removal cascades `leftAt` across all their shared characters
  - Design element: Decision 5
  - Acceptance criteria reference: specs/party-cleanup
  - Testability notes: Route test DELETE `/campaigns/[id]/members/[userId]` → all party members for that user's shares have `leftAt`

- Requirement: Shared characters appear in campaign context (prompts)
  - Design element: Decision 6
  - Acceptance criteria reference: specs/campaign-context-shared-chars
  - Testability notes: Unit test `fetchCampaignContext` — shared character in party appears in `context.characters`

- Requirement: Revoked-share characters excluded from campaign context
  - Design element: Decision 6
  - Acceptance criteria reference: specs/campaign-context-shared-chars
  - Testability notes: Unit test — character with no active share not in `context.characters` even if in `party.members`

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Full-scan `loadPartiesByCampaign` query must be observable
  - Design element: Decision 4 — timing log at >10ms
  - Acceptance criteria reference: Log line present in cleanup paths
  - Testability notes: Manual verification; or spy on `console.log` in storage test

- Requirement category: reliability
  - Requirement: Party cleanup failure must not fail primary operations (unshare / remove member)
  - Design element: Decision 5 — errors caught and logged, not re-thrown
  - Acceptance criteria reference: specs/party-cleanup error scenario
  - Testability notes: Unit test — mock `saveParty` to throw; cleanup function does not throw; primary route returns success

- Requirement category: security
  - Requirement: DM-enriched GET must not be accessible by non-members
  - Design element: Decision 1 — existing `getMember` check gates the route; DM role check for enriched path
  - Acceptance criteria reference: specs/campaign-character-shares DM GET scenarios
  - Testability notes: Route test — non-member gets 403; player gets bare shares; DM gets enriched list

## Risks / Trade-offs

- Risk/trade-off: Polymorphic GET response shape (role-dependent)
  - Impact: Client code must handle two shapes; easy to accidentally use player-shape in DM context
  - Mitigation: `SharedCharacterEntry` export makes the DM shape explicit; party builder imports it

- Risk/trade-off: Fire-and-forget cleanup leaves window for stale party data
  - Impact: A party could briefly show a revoked character as active between unshare and next context load
  - Mitigation: Reactive guard in `fetchCampaignContext` closes the gap; `leftAt` is set before response returns in the happy path

## Rollback / Mitigation

- Rollback trigger: POST/PUT party returns unexpected 403 for DM-owned characters; or cascade cleanup breaks unshare/remove-member response
- Rollback steps: Revert the 5 modified route files and `lib/storage.ts` additions. New `SharedCharacterEntry` type and `lib/utils/campaignContext.ts` changes can be reverted independently. No schema migrations — no new collections or indexes.
- Data migration considerations: None. `leftAt` on existing party members was already a valid state before this change.
- Verification after rollback: Existing party CRUD tests pass; party builder shows DM-owned characters only (prior behavior).

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check or open a tracked issue before proceeding.
- If security checks fail: Do not merge. Escalate to repo owner.
- If required reviews are blocked/stale: Wait 48 hours, then re-request review. After 72 hours, escalate to repo owner.
- Escalation path and timeout: Tag `@dougis` in the PR after 72-hour stale review timeout.

## Open Questions

No open questions. All design decisions resolved during exploration and proposal phases.
