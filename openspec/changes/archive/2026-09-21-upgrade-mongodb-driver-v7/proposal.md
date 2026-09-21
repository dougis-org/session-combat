## GitHub Issues

- #638
- Part of #594 (dependency modernization epic, D3)

## Why

- Problem statement: The project depends on `mongodb` driver `^6.3.0`. As part of the D3 dependency-modernization effort (#594), this dependency needs to move to the `^7.x` major line to stay on a supported driver version.
- Why now: Scheduled as the next tranche of #594's dependency modernization; no functional feature depends on this, but staying on an unsupported major eventually blocks security patches and newer MongoDB server feature support.
- Business/user impact: None expected if the upgrade is clean — this is a no-functionality-change dependency bump. Impact only materializes if a v7 behavior change breaks the campaign real-time event stream (`lib/server/transport.ts`) or attachment uploads (`lib/gridfs.ts`), which are user-facing.

## Problem Space

- Current behavior: App runs on `mongodb` driver v6.3.0. Five files import the `mongodb` package directly: `app/api/auth/password/reset/route.ts`, `app/api/campaigns/[id]/members/route.ts`, `lib/gridfs.ts`, `lib/permissions.ts`, `lib/server/transport.ts`. Many additional files (`lib/storage/*Repo.ts`, `lib/storage.ts`) call `.find()`/`.toArray()` etc. against `Db`/`Collection` types obtained via `lib/db.ts`'s `getDatabase()`, without importing the driver package directly.
- Desired behavior: Same functional behavior, running on `mongodb` `^7.x`, with `@testcontainers/mongodb` confirmed compatible with whatever server version the v7 driver is tested against.
- Constraints:
  - No functionality change — this is a driver upgrade with API-compatibility review, not a feature or refactor.
  - `engines.node` is already `>=24.0.0`, which already exceeds v7's minimum (`>=20.19.0`) — no Node version bump needed.
  - Integration suite is testcontainers-backed and must be run via the project harness, not raw `jest`.
- Assumptions:
  - `@testcontainers/mongodb` `^12.1.0` (current devDependency) already provisions a MongoDB server version compatible with driver v7; this must be confirmed, not assumed, during implementation.
  - No other package in the dependency tree pins a `mongodb` v6-specific range that would create a peer-dependency conflict (e.g. a session-store or ODM helper, if any) — none identified in `package.json`'s current dependencies, but not exhaustively verified in this proposal.
- Edge cases considered:
  - Standalone (non-replica-set) local/dev MongoDB, where `lib/server/transport.ts` falls back from change streams to polling — the fallback detection is error-string/code based and could silently break under a driver major bump without a runtime test surfacing it (see Risks).
  - Change-stream invalidation (e.g. underlying collection/database dropped or renamed) — the auto-reopen recovery path also depends on a specific driver-thrown error name.
  - GridFS upload/download/delete round-trip — the official v7 driver changelog does not itemize any GridFSBucket-specific changes, so silence must not be treated as confirmation of safety.

## Scope

### In Scope

- Bump `mongodb` from `^6.3.0` to `^7.x` in `package.json` (and lockfile).
- Verify `@testcontainers/mongodb` compatibility with the v7 driver; bump if needed.
- Review and, if necessary, adapt the 5 direct call sites for v7 API-compatibility:
  - `app/api/auth/password/reset/route.ts`
  - `app/api/campaigns/[id]/members/route.ts`
  - `lib/gridfs.ts`
  - `lib/permissions.ts`
  - `lib/server/transport.ts`
- Add targeted integration-test coverage (testcontainers-backed, folded into the existing integration suite) for the driver-version-sensitive behaviors identified in this proposal's risk analysis: replica-set detection, change-stream invalidation recovery, `$changeStream` pipeline validation, and GridFS round-trip correctness.
- Confirm `tsc --noEmit` is clean against any `Db`/`Collection` generic typing changes surfaced by the v7 type definitions, across all files that use these types (including the `lib/storage/*Repo.ts` files that don't import `mongodb` directly but consume its types).
- Run the full gate from issue #638: `npm run lint && npm run typecheck && npm run test:unit && npm run test:integration && npm run test:e2e`.

### Out of Scope

- Any change to `lib/db.ts` connection option shape beyond what v7 strictly requires (current options — `{ maxPoolSize: 10 }` — are already v7-compatible; no removed/renamed `MongoClientOptions` fields are in use).
- AWS IAM authentication changes (v7 rewrote `MONGODB-AWS` credential handling) — not applicable, the app uses a plain `mongodb://`/`mongodb+srv://` URI with no AWS auth mechanism.
- Adopting the new `cursor.stream().map()` pattern that replaces the removed `transform` option — not applicable, no code in `lib/` or `app/` uses `.stream({ transform })`.
- Setting explicit `batchSize` on `.find()` calls to restore the old default-1000 behavior — all call sites end in `.toArray()`, which drains the cursor regardless of batch size; this is a network round-trip/perf characteristic, not a correctness concern, and is not being addressed as part of this change.
- Any broader refactor of `lib/server/transport.ts`'s replica-set-detection or change-stream-recovery design — this change only adds test coverage to confirm the existing design still holds under v7; it does not redesign that logic.
- The rest of the #594 dependency-modernization epic (other dependencies) — tracked as separate issues/PRs per #594's "one dependency concern, one PR" policy.

## What Changes

- `package.json` / lockfile: `mongodb` `^6.3.0` → `^7.x`; `@testcontainers/mongodb` bumped if required for v7 compatibility.
- `lib/gridfs.ts`, `lib/permissions.ts`, `lib/server/transport.ts`, and the two `app/api/**/route.ts` call sites: adapted only where v7 requires it (expected to be minimal-to-none based on API surface reviewed, confirmed by the integration tests below).
- New/extended integration tests (testcontainers-backed) covering:
  1. `detectReplicaSet()`'s standalone-mode error detection (`lib/server/transport.ts`) still matches under v7.
  2. `ChangeStreamInvalidatedError`-driven auto-reopen recovery still fires under v7.
  3. The existing `$changeStream` `.watch()` pipeline (with `$match` on `ns.coll` and `fullDocument: 'updateLookup'`) still opens cleanly now that stage-option validation has moved server-side in v7.
  4. GridFS upload → find → download → delete round-trip correctness (byte and metadata level, not just type-checks) under v7.

## Risks

- Risk: `lib/server/transport.ts`'s `detectReplicaSet()` (lines ~32-63) pattern-matches thrown errors by message substring (`'not running with --replSet'`, `'$changeStream'`) and numeric code (`76`, `40573`) to fall back to polling on non-replica-set MongoDB. A driver major bump can change error messages, names, or codes even without a wire-protocol change.
  - Impact: If detection silently breaks, the "transient error, retry" branch in `detectReplicaSet()` catches it instead, and `isReplicaSet` is never cached as `false` — every `subscribe()` call would keep attempting (and failing) to open a change stream against a standalone dev/local MongoDB instead of correctly falling back to polling. This would break the campaign real-time event stream in any non-replica-set environment (notably local dev).
  - Mitigation: Add a testcontainers-backed integration test that forces a standalone (non-replset) MongoDB instance, triggers the probe watch, and asserts the error still satisfies at least one of the four existing detection conditions under driver v7.
- Risk: The official v7 changelog does not document any GridFSBucket API changes at all — this silence is not evidence of safety, only absence of a documented change.
  - Impact: `lib/gridfs.ts`'s `openUploadStreamWithId`, `bucket.find().toArray()`, `openDownloadStream`, and `bucket.delete()` could have a subtle behavioral or shape change that satisfies TypeScript's structural typing (so `tsc --noEmit` would pass) while still failing at runtime — e.g. a changed `find()` cursor shape, different stream-completion timing, or altered file-document metadata shape. This is user-facing (attachment upload/download).
  - Mitigation: Add a testcontainers-backed integration test performing a full upload → find → download → delete round-trip against the real v7 driver, asserting actual byte content and metadata correctness.
- Risk: v7 moves `$changeStream` pipeline stage-option validation from driver-side (client) to server-side, per the official changelog ("If an option is invalid for the `$changeStream` stage of the pipeline, the server returns an error").
  - Impact: `openStream()`'s `.watch()` call (with a `$match` stage plus `fullDocument: 'updateLookup'`) and `detectReplicaSet()`'s probe `.watch([], { maxAwaitTimeMS: 100 })` could, in principle, now surface a different error shape/timing if any option was previously silently accepted or normalized client-side. No evidence this specific pipeline is affected, but the changelog explicitly flags this as a validation-boundary change.
  - Mitigation: Add an integration test confirming the existing pipeline still opens cleanly against a real v7 driver + testcontainers MongoDB.
- Risk: `ChangeStreamInvalidatedError`'s exact error `.name` (used at `lib/server/transport.ts` ~lines 240-242 to trigger auto-reopen) is undocumented by the official v7 changelog in either direction.
  - Impact: If the name changed, a stream invalidation (e.g. underlying collection/DB dropped or renamed) would fall through to the generic "non-invalidation" branch, and the shared change-stream cursor would stay closed with no auto-recovery — silently killing real-time delivery for every campaign on that instance until the next process restart.
  - Mitigation: Add an integration test that forces a genuine invalidation against a replica-set testcontainer and asserts `err.name === 'ChangeStreamInvalidatedError'` still holds and the reopen path fires.
- Risk: `@testcontainers/mongodb` `^12.1.0`'s provisioned MongoDB server version may not be validated against/by MongoDB as compatible with driver v7 (driver major bumps sometimes also bump the minimum supported server version).
  - Impact: Integration tests could fail for reasons unrelated to application code — a testcontainers/server-version mismatch rather than a real driver-compatibility bug — creating false signal during implementation.
  - Mitigation: Check `@testcontainers/mongodb`'s changelog/compatibility notes for the driver v7 timeframe as an early implementation task, before writing the other integration tests, and bump it first if needed.
- Risk: The two `app/api/**/route.ts` call sites (`password/reset/route.ts`, `campaigns/[id]/members/route.ts`) were not read in detail during exploration.
  - Impact: Low — likely straightforward `Collection`/`findOne`/`updateOne` usage consistent with `lib/permissions.ts`'s style, but unconfirmed.
  - Mitigation: Explicit review task before/during implementation (see tasks.md), not assumed safe by omission.

## Open Questions

- None blocking. This proposal originated from an explore-mode session (see conversation history) in which the driver v7 changelog was reviewed against every call site and codebase usage pattern (connection options, AWS auth, `.stream()` transform usage, `batchSize` usage, GridFS, change-stream error handling). All ambiguities raised during that exploration were resolved before this proposal was requested, and the user explicitly instructed proceeding directly to proposal generation.
- One non-blocking follow-up is tracked as an implementation task rather than an open question: detailed review of the two `app/api/**/route.ts` call sites, since they were not read during exploration.

## Non-Goals

- Not upgrading any other dependency from the #594 epic in this change.
- Not redesigning `lib/server/transport.ts`'s replica-set-detection or change-stream-recovery architecture — only validating it still holds under v7.
- Not changing `lib/db.ts`'s connection-option shape beyond what v7 strictly requires (none needed, per Scope).
- Not restoring the pre-v7 default `batchSize` behavior.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
