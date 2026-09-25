## Context

- Relevant architecture: `lib/storage.ts` exports a single `storage` const facade object whose methods delegate to per-domain repo modules under `lib/storage/` (e.g. `partyRepo.ts`, `membershipRepo.ts`, `shareRepo.ts`, `campaignRepo.ts`). Epic #499 is migrating this god-object facade out domain-by-domain: repo modules get created first (done for Party — `lib/storage/partyRepo.ts` already exists and `storage.ts` already delegates to it for `loadParties`/`saveParty`/`saveParties`/`deleteParty`), then callers get migrated to import the repo module directly (this change, for Party, per #683).
- Dependencies: `lib/storage/partyRepo.ts` (target import), `lib/storage/runOp.ts` (`runStorageOp`, used by the 3 relocated functions), `lib/db.ts` or equivalent (`getDatabase`, used by the 3 relocated functions), `lib/types.ts` (`Party`, `PartyMember`).
- Interfaces/contracts touched: no public API contracts change (route request/response shapes are untouched). Internal module boundaries change: 3 functions move from `lib/storage.ts` to `lib/storage/partyRepo.ts`; 8 route files gain a second import (`partyRepo`) alongside their existing `storage` import.

## Goals / Non-Goals

### Goals

- Every party-domain call site in the 8 identified route files calls `partyRepo.*` directly instead of `storage.*`.
- `addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns` live in `lib/storage/partyRepo.ts`, with `lib/storage.ts` reduced to thin delegating wrappers for these three (mirroring the existing `saveParty`/`deleteParty` delegation pattern).
- Zero behavior change: identical inputs produce identical outputs, identical database operations, identical error handling.
- All existing tests pass; tests that mock `storage.<party-method>` are updated to mock `partyRepo.<party-method>` where production code now calls the latter.

### Non-Goals

- Migrating membershipRepo- or shareRepo-backed calls (`getMember`, `addShare`, etc.) in these same 8 files — they stay on `storage` in this change.
- Removing `storage.loadParties`/`storage.saveParty`/etc. as facade methods — they remain, still delegating to `partyRepo`, since other unmigrated callers (if any exist outside this change's scope) may still reference them.
- Creating a new repo module (e.g. `campaignPartyRepo`) for the 3 relocated functions — they join the existing `partyRepo.ts`.

## Decisions

### Decision 1: Mixed imports per file, not a full `storage` import removal

- Chosen: In each of the 8 caller files, add `import * as partyRepo from '@/lib/storage/partyRepo'` alongside the existing `import { storage } from '@/lib/storage'`. Party-domain calls move to `partyRepo.*`; all other calls stay on `storage.*`.
- Alternatives considered: (a) Fully remove the `storage` import per file and route non-party calls through their own narrow repo imports too — rejected as out of scope for #683, which is scoped to Party only; doing this would silently absorb #712-style follow-up work for membershipRepo/shareRepo into this change. (b) Leave all 8 files on `storage` and only migrate files where a file happens to be Party-only — rejected because no such file exists (verified by grep across all 8 callers), so this alternative accomplishes nothing.
- Rationale: Matches the incremental, domain-at-a-time migration strategy already used for #504 (session-log/share/spell/roll clusters). Confirmed directly with the requester during `/opsx:explore`.
- Trade-offs: Files end up with two storage-layer imports for a transitional period until every domain touching them is migrated. This is accepted as the expected intermediate state of Epic #499, not a defect.

### Decision 2: Relocate the 3 campaign-linking functions into `partyRepo.ts` as part of this change

- Chosen: Move `addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns` out of `lib/storage.ts`'s inline body into named exports in `lib/storage/partyRepo.ts`, verbatim (same `runStorageOp` wrapper, same Mongo queries, same control flow). `storage.ts` keeps `addPartyToCampaign`/etc. as public facade methods but their bodies become one-line delegations to `partyRepo.addPartyToCampaign(...)` etc.
- Alternatives considered: (a) Leave these 3 functions in `storage.ts` untouched, out of scope for #683 since the issue only mentions "callers" not "storage.ts internals" — rejected per explicit user instruction ("2 yes, bring those along") because leaving them behind creates an orphan: they're party-lifecycle logic operating on `campaigns.partyIds`, and every one of their 3 call sites is in a file this change is already touching, so deferring them just creates a second near-identical PR later for no benefit. (b) Create a new `campaignPartyRepo.ts` module since these functions mutate the `campaigns` collection, not `parties` — rejected as unnecessary indirection; `partyRepo.ts` already owns party lifecycle concerns including `LegacyPartyDoc` migration reads against the `parties` collection, and these 3 functions are conceptually "which parties belong to which campaign," matching partyRepo's existing scope.
- Rationale: Keeps the change self-contained — every party-shaped storage operation these 8 files use ends up behind one import (`partyRepo`) by the end of this change, rather than 3 of them staying stranded in `storage.ts` needing a follow-up.
- Trade-offs: Slightly larger diff to `lib/storage.ts` than a pure caller-only change would produce, but bounded to exactly 3 functions with no logic change (pure move + delegate).

## Proposal to Design Mapping

- Proposal element: 8 caller files switch party-method calls to `partyRepo.*` while keeping `storage.*` for non-party calls.
  - Design decision: Decision 1 (mixed imports per file).
  - Validation approach: per-file diff review + existing route test suites (updated per Decision-driven mock changes) passing; final repo-wide grep for `storage\.(loadParties|saveParty|saveParties|deleteParty|loadPartiesByCampaign|buildSharedCharacterEntries|setPartyMemberLeftAt|canAddToCampaignParty|addPartyToCampaign|removePartyFromCampaign|removePartyFromAllCampaigns)` returning zero matches outside `partyRepo.ts`/`storage.ts`'s own delegation lines.
- Proposal element: `addPartyToCampaign`/`removePartyFromCampaign`/`removePartyFromAllCampaigns` move into `partyRepo.ts`; `storage.ts` delegates.
  - Design decision: Decision 2 (relocate campaign-linking functions).
  - Validation approach: `lib/storage.ts` diff shows only delegation one-liners remain for these 3 methods; `lib/storage/partyRepo.ts` diff shows the moved bodies unchanged byte-for-byte apart from import additions; existing tests exercising these 3 functions (via `storage.addPartyToCampaign` etc., since the facade still exposes them) continue passing unmodified, proving the facade's public behavior is unaffected.

## Functional Requirements Mapping

- Requirement: All 8 caller files call `partyRepo.*` for the 8 pre-existing party methods and the 3 relocated campaign-linking methods, with no remaining `storage.*` call for any of these 11 methods anywhere in the repo except inside `storage.ts`'s own delegation bodies.
  - Design element: Decision 1 + Decision 2.
  - Acceptance criteria reference: specs/party-callers-narrow-imports/spec.md — "Callers use partyRepo for party operations."
  - Testability notes: static grep check (deterministic, zero false negatives for this exact method-name set) plus route-level unit tests confirming request/response behavior is unchanged.
- Requirement: `lib/storage.ts`'s public `storage.*` API surface (method names, signatures, return types) is unchanged for every method, including the 3 relocated ones.
  - Design element: Decision 2 (delegation, not removal).
  - Acceptance criteria reference: specs/party-callers-narrow-imports/spec.md — "storage.ts facade remains a stable, complete surface."
  - Testability notes: any existing test that calls `storage.addPartyToCampaign(...)` directly (integration-style, bypassing mocks) continues to pass without modification — this is the regression signal for accidental signature drift.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No behavior change — identical database read/write operations occur for identical inputs before and after this change.
  - Design element: Decision 2's "verbatim move" constraint (no logic edits during relocation, only mechanical cut-paste plus import adjustments).
  - Acceptance criteria reference: specs/party-callers-narrow-imports/spec.md — "No behavior change."
  - Testability notes: full existing test suite (unit + integration) for party/campaign routes passes unmodified in assertions (only mock targets change, not expected values or call counts).
- Requirement category: operability/maintainability
  - Requirement: A future contributor can determine which domain module owns campaign-party linking logic without reading `storage.ts`'s full body.
  - Design element: Decision 2 relocates the logic to `partyRepo.ts`, a domain-named module.
  - Acceptance criteria reference: specs/party-callers-narrow-imports/spec.md — "Campaign-party linking functions live in partyRepo.ts."
  - Testability notes: not automatable; verified by code review at PR time.

## Risks / Trade-offs

- Risk/trade-off: Two storage-layer imports (`storage` + `partyRepo`) per file is visually noisier than a single import, and could look like an unfinished migration to a reviewer unfamiliar with Epic #499's incremental strategy.
  - Impact: Reviewer confusion or an unnecessary review comment asking "why not just use partyRepo for everything in this file?"
  - Mitigation: PR description references #683 and Epic #499 explicitly, and this design doc's Decision 1 rationale can be linked/quoted in the PR description.
- Risk/trade-off: Relocating the 3 campaign-linking functions touches `lib/storage.ts` more than a caller-only change would, slightly increasing the diff surface of a "purely mechanical" issue.
  - Impact: Marginally larger PR to review.
  - Mitigation: The move is verbatim (verified via diff — bodies are byte-identical apart from surrounding import statements), keeping review effort low despite line count.

## Rollback / Mitigation

- Rollback trigger: Any test failure, runtime error, or behavior discrepancy discovered post-merge in party or campaign-party-linking flows (party CRUD, character-to-campaign sharing, party membership leave/rejoin).
- Rollback steps: `git revert` the merge commit for this change's PR — since it is a pure import/location refactor with unchanged method bodies, revert is safe and mechanical (no data migration to undo).
- Data migration considerations: none — no schema or data changes occur in this change.
- Verification after rollback: re-run the affected route test suites and confirm they pass on the pre-change code; confirm `lib/storage.ts` again contains the 3 functions' original inline bodies.

## Operational Blocking Policy

- If CI checks fail: fix the failing test/lint/typecheck in place before proceeding to the next task; do not skip or disable checks. Since this is a zero-behavior-change refactor, a CI failure almost always means a missed call site or a stale mock — both are fixable within this change's scope.
- If security checks fail: not expected to trigger (no new external inputs, no new dependencies, no auth/data-access logic changes) — if one does fire, treat it as a signal the verbatim-move assumption was violated and re-diff the moved functions against their original bodies.
- If required reviews are blocked/stale: follow standard project PR process — main is squash-merge-only per the repo's branch ruleset, no admin bypass.
- Escalation path and timeout: no special timeout for this change; it is small and mechanical enough that a stuck review should be resolved by direct clarification with the reviewer rather than escalation.

## Open Questions

- None — both open items from the exploration phase (mixed-import end state; whether to relocate the 3 campaign-linking functions) were resolved by explicit user decisions before this design was written (see Decisions 1 and 2 above).
