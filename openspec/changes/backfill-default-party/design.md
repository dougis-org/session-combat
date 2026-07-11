## Context

- Relevant architecture: MongoDB-backed storage accessed via `getDatabase()` (`lib/db.ts` or equivalent) and the `storage` object in `lib/storage.ts`. Collections used directly: `campaigns` and `parties`. Reference precedent for a one-off script: `lib/scripts/seedCampaignTemplates.ts` (uses `getDatabase()` directly, bypasses `storage.*` since it needs to operate across all users, not one).
- Dependencies: `Campaign` and `Party` types from `lib/types.ts`; `crypto.randomUUID()` for new `Party.id`.
- Interfaces/contracts touched: none. This script only inserts new `Party` documents; it does not modify `Campaign` documents, does not call any HTTP route, and does not change `POST /api/campaigns` (#474's logic in `app/api/campaigns/route.ts:64-84` is the shape being replicated, not changed).

## Goals / Non-Goals

### Goals

- Every `Campaign` document ends up with at least one `Party` document where `party.campaignId === campaign.id`.
- Backfilled `Party` documents are structurally identical to what #474 already creates for new campaigns (same field set, same defaults).
- Script is safe to run more than once (idempotent) and safe to abandon/delete after use.

### Non-Goals

- No dry-run flag (per proposal's resolved open question — logging during the real run is sufficient).
- No campaign membership backfill — existing campaigns already have their `dm` member row from whenever they were created; only the `Party` is missing.
- No generalized data-integrity tooling; this script is scoped to the one known gap.
- No automated invocation (deploy hook, CI step, migration runner) — this is a manual, human-run script.

## Decisions

### Decision 1: Find candidate campaigns via a single aggregation, not a per-campaign loop

- Chosen: `db.collection('campaigns').aggregate([{ $lookup: { from: 'parties', localField: 'id', foreignField: 'campaignId', as: 'linkedParties' } }, { $match: { linkedParties: { $size: 0 } } }])`, projecting out `linkedParties` before use.
- Alternatives considered: load all `parties`, build a `Set<campaignId>` in memory, then filter `campaigns` client-side (avoids aggregation syntax, closer to how `seedCampaignTemplates.ts` does its `findOne`-per-item existence check).
- Rationale: campaign volume here is small (hundreds/low-thousands), so either approach performs fine, but the aggregation expresses "campaigns with no party" as a single query with the intent explicit in the pipeline, rather than requiring the reader to infer it from a loop. It also avoids loading the entire `parties` collection into Node memory.
- Trade-offs: aggregation is slightly less copy-paste-similar to `seedCampaignTemplates.ts`'s existing pattern, so a reader familiar with that script has one more construct to parse. Acceptable given the query is small and self-contained.

### Decision 2: Reuse the exact `Party` object shape from `app/api/campaigns/route.ts`

- Chosen: construct each backfilled `Party` as:
  ```ts
  {
    id: crypto.randomUUID(),
    userId: campaign.userId,
    name: 'Main Party',
    description: '',
    members: [],
    campaignId: campaign.id,
    createdAt: now,
    updatedAt: now,
  }
  ```
  where `now` is a single `new Date()` captured once per script run (not per campaign), matching how `campaign.createdAt`/`campaign.updatedAt` are reused for the party's timestamps in the live #474 code path — except here there's no "parent campaign creation" timestamp to inherit, so `now` (backfill time) is used for both `createdAt` and `updatedAt` on the new `Party`.
- Alternatives considered: set `party.createdAt` to the campaign's original `createdAt`, to make it look like the party existed since the campaign was made.
- Rationale: backdating `createdAt` would misrepresent history (the party did not exist until this script ran) and adds complexity for no functional benefit — nothing in the app currently depends on `Party.createdAt` for ordering or auditing relative to `Campaign.createdAt`.
- Trade-offs: backfilled parties will show a `createdAt` from the backfill run, not the original campaign creation date. Acceptable since this is a data-repair action, not a historical replay.

### Decision 3: Direct collection access via `getDatabase()`, not through `storage.*`

- Chosen: script imports `getDatabase()` directly and operates on `db.collection<Campaign>('campaigns')` / `db.collection<Party>('parties')`, same as `seedCampaignTemplates.ts`.
- Alternatives considered: add a new `storage.*` helper (e.g. `storage.findCampaignsMissingParty()`) for reuse.
- Rationale: `storage.*` methods are scoped per-`userId` (e.g. `loadCampaigns(userId)`); this backfill is explicitly cross-user/global, matching why `seedCampaignTemplates.ts` also bypasses `storage.*`. Adding a new cross-user `storage` method for a one-off, deletable script would leave permanent surface area behind after the script itself is deleted.
- Trade-offs: script duplicates a small amount of raw MongoDB query logic instead of reusing `storage`. Acceptable — same trade-off already accepted for `seedCampaignTemplates.ts`.

### Decision 4: Script is deletable, not a permanent fixture — but still gets a lightweight integration test while it exists

- Chosen: the script itself is written to be run zero or more times and then deleted by a human once all target environments are confirmed backfilled; no README/index references it, and it is not kept alongside `seedCampaignTemplates.ts` as a permanent fixture. It does, however, get one small integration test (mirroring the precedent in `openspec/specs/scripts/migrate-global-monsters.md` for `migrateGlobalMonsters.ts`) covering the core query-and-create behavior and idempotency — that test is deleted together with the script when the script itself is removed, not kept independently.
- Alternatives considered: (a) keep the script permanently alongside `seedCampaignTemplates.ts` as a standing idempotent safety net; (b) skip automated tests entirely and rely only on the manual verification pass (T6 in tasks.md).
- Rationale: per proposal Non-Goals, the user explicitly wants the script deletable — #474 already guarantees new campaigns get a party, so there's no ongoing need for it once the historical gap is closed. However, this repo's existing one-off-script precedent (`migrateGlobalMonsters.ts`) pairs its script with a small integration test rather than relying on manual verification alone, and this project's change schema requires TDD-mapped test cases — so a minimal test is included for confidence before running against real data, while still being scoped for deletion alongside the script.
- Trade-offs: if #474's party-auto-create logic ever regresses and silently stops creating parties, there's no ready-made script (or test) to re-run; someone would need to recreate both. Acceptable given the query and test are each only a few lines to reconstruct if ever needed again.

## Proposal to Design Mapping

- Proposal element: "one-off script under `lib/scripts/` that finds campaigns with no party and creates a default one"
  - Design decision: Decision 1 (aggregation query) + Decision 3 (direct `getDatabase()` access)
  - Validation approach: manual run against a seeded local/dev database with a mix of campaigns (some with parties, some without); confirm only the party-less ones get a new `Party` document and counts match expectations.
- Proposal element: "must reuse the exact `Party` shape from `app/api/campaigns/route.ts`"
  - Design decision: Decision 2
  - Validation approach: manual diff/comparison of the script's `Party` object literal against `app/api/campaigns/route.ts:64-73`.
- Proposal element: "safe to re-run (idempotent)"
  - Design decision: Decision 1's `$match: { linkedParties: { $size: 0 } } }` re-evaluates on every run, so campaigns backfilled in a prior run are excluded automatically.
  - Validation approach: manual run the script twice in a row against the same database; confirm the second run logs zero backfilled and inserts nothing.
- Proposal element: "deletable after use, not a permanent fixture"
  - Design decision: Decision 4
  - Validation approach: N/A — this is a documentation/intent decision, not a testable behavior.

## Functional Requirements Mapping

- Requirement: identify all campaigns with zero associated `Party` documents
  - Design element: Decision 1 aggregation pipeline
  - Acceptance criteria reference: proposal "Problem Space > Desired behavior"
  - Testability notes: manually seed a local database with campaigns in both states (with/without party) and confirm the aggregation output matches exactly the party-less set.
- Requirement: create exactly one default "Main Party" per identified campaign, owned by that campaign's `userId`
  - Design element: Decision 2 (`Party` object construction)
  - Acceptance criteria reference: proposal "Task" description, issue #479 body
  - Testability notes: after running, query `parties` collection and confirm each previously party-less campaign now has exactly one party with `userId === campaign.userId` and `name === 'Main Party'`.
- Requirement: do not touch campaigns that already have one or more parties
  - Design element: Decision 1's `$match` filter
  - Acceptance criteria reference: proposal "Edge cases considered"
  - Testability notes: seed a campaign with a pre-existing (possibly non-default-named) party; confirm the script does not add a second party to it and does not modify the existing one.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: script must clearly log what it did (per-campaign line + summary count), so a human can verify results without querying the database directly
  - Design element: console logging pattern mirrored from `seedCampaignTemplates.ts` (`Inserted:` / `Skipping:` / final `Done. Inserted: X, Skipped: Y` lines)
  - Acceptance criteria reference: proposal "Risks" mitigation (verify findings before trusting)
  - Testability notes: manual run; confirm console output lists each backfilled campaign by name/id and ends with an accurate total count.
- Requirement category: reliability
  - Requirement: partial failure (e.g. one insert fails) should not silently corrupt state or crash without explanation
  - Design element: per-campaign try/catch inside the backfill loop, logging the error and continuing to the next campaign rather than aborting the whole run
  - Acceptance criteria reference: proposal Risks
  - Testability notes: manual test by forcing one insert to fail (e.g. temporary unique index violation) and confirming the script logs the failure, continues, and reports the failure in its final summary.

## Risks / Trade-offs

- Risk/trade-off: aggregation approach (Decision 1) requires correct field alignment between `campaigns.id` and `parties.campaignId` (both are UUID strings, not ObjectIds, per `lib/types.ts`).
  - Impact: a type mismatch would make the `$lookup` silently match nothing, causing every campaign to look party-less and the script to create duplicate default parties for campaigns that already have one.
  - Mitigation: verify field types against `lib/types.ts` (`Campaign.id: string`, `Party.campaignId?: string`) before writing the pipeline; do a small manual test run against a handful of known campaigns (some with parties) before trusting the full run.
- Risk/trade-off: no dry-run flag (per resolved open question) means the first execution is also the real write.
  - Impact: if the aggregation logic has a bug, it's discovered by writing bad data rather than by a preview.
  - Mitigation: per-campaign console logging during the real run (Decision 4/NFR-operability) lets the operator watch it in real time and interrupt (Ctrl+C) if the output looks wrong before it processes many campaigns; test against a local/dev database copy first, not production, as the very first run.

## Rollback / Mitigation

- Rollback trigger: script creates incorrect `Party` documents (wrong owner, duplicate parties on campaigns that already had one, or malformed fields).
- Rollback steps: identify the affected `Party` documents by their `createdAt` timestamp (all backfilled parties share the same run timestamp `now`, per Decision 2) and/or by cross-referencing which campaign ids were logged as "backfilled" in the script's console output; delete those specific `Party` documents by `id`.
- Data migration considerations: no `Campaign` documents are modified, so rollback is purely a `Party` collection cleanup — no risk of corrupting campaign data itself.
- Verification after rollback: re-run the (corrected) script and confirm the aggregation once again reports the same original set of party-less campaigns, then confirm new parties are created correctly.

## Operational Blocking Policy

- If CI checks fail: this is a one-off script with only a lightweight integration test (per Decision 4 — one test covering core query-and-create behavior and idempotency, not a full test suite); if lint/typecheck/tests fail on the script file itself, fix it before running — do not merge/run a script that doesn't pass.
- If security checks fail: N/A — script has no new external inputs, network endpoints, or user-facing surface; it only touches the existing database connection already used by the rest of the app.
- If required reviews are blocked/stale: since this is a manually-run, deletable script (not a shipped feature), a human (Doug) reviews and runs it directly; no PR-gate blocking policy applies beyond normal repo review norms for merging the script file itself.
- Escalation path and timeout: N/A — no automated pipeline depends on this script; if something looks wrong during a manual run, stop (Ctrl+C) and re-examine before re-running.

## Open Questions

- None remaining. The dry-run question raised in proposal.md was resolved (no dry-run flag; logging during the real run is sufficient).
