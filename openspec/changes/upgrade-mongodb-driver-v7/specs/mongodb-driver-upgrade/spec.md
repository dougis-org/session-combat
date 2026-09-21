## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Application behavior unchanged across the mongodb driver v6→v7 upgrade

The system SHALL exhibit no observable functional change to any existing capability (campaign real-time event stream, GridFS attachments, permissions, auth) after the `mongodb` driver is upgraded from `^6.3.0` to `^7.x`.

#### Scenario: Application behavior unchanged post-upgrade

- **Given** the `mongodb` dependency has been bumped to `^7.x` and the app is running against it
- **When** the full existing test suite (`test:unit`, `test:integration`, `test:e2e`) is run
- **Then** all tests pass without modification to their assertions (only test-setup/infrastructure changes, if any, are permitted — not assertion changes)

#### Scenario: No infrastructure changes required

- **Given** the project's `engines.node` field already requires `>=24.0.0`
- **When** the `mongodb` v7 driver's minimum Node requirement (`>=20.19.0`) is compared against it
- **Then** no change to `engines`, `.nvmrc`, or any Node-version-pinning file is required

### Requirement: ADDED Standalone MongoDB detection continues to correctly select the polling transport under driver v7

The system SHALL continue to detect a non-replica-set (standalone) MongoDB instance via `lib/server/transport.ts`'s `detectReplicaSet()` and fall back to the polling transport, using the same error-matching conditions, under the `mongodb` v7 driver.

#### Scenario: Standalone MongoDB falls back to polling

- **Given** a testcontainers-provisioned standalone (non-replica-set) MongoDB instance running against the `mongodb` v7 driver
- **When** `detectReplicaSet()`'s probe `.watch([], { maxAwaitTimeMS: 100 })` call is triggered
- **Then** the thrown error still satisfies at least one of: message includes `'not running with --replSet'`, message includes `'$changeStream'`, `error.code === 76`, `error.code === 40573`
- **And** `subscribe()` selects the polling transport (`setInterval`-based `pollFn`) rather than attempting to open a change stream

### Requirement: ADDED Change-stream invalidation recovery continues to function under driver v7

The system SHALL continue to detect a `ChangeStreamInvalidatedError` and automatically reopen the shared change-stream cursor via `lib/server/transport.ts`'s `openStream()`, under the `mongodb` v7 driver.

#### Scenario: Change-stream invalidation triggers automatic reopen

- **Given** a testcontainers-provisioned replica-set MongoDB instance with an active change-stream cursor opened via `openStream()`
- **When** the watched collection or database is dropped or renamed, invalidating the change stream
- **Then** the thrown error's `.name` still equals `'ChangeStreamInvalidatedError'`
- **And** `openStream()`'s invalidation branch fires, closing the old cursor and successfully reopening a new one without requiring a process restart

### Requirement: ADDED The campaign event stream's `$changeStream` pipeline continues to open cleanly under driver v7's server-side stage-option validation

The system SHALL continue to successfully open its `Db.watch()` change stream — using the existing pipeline (`{ $match: { 'ns.coll': { $in: WATCHED_COLLECTIONS } } }`, options `{ fullDocument: 'updateLookup' }`) — under the `mongodb` v7 driver, given that stage-option validation has moved from client-side to server-side in v7.

#### Scenario: Existing change-stream pipeline opens without a server-side validation error

- **Given** a testcontainers-provisioned replica-set MongoDB instance running against the `mongodb` v7 driver
- **When** `openStream()` calls `client.db().watch([{ $match: { 'ns.coll': { $in: WATCHED_COLLECTIONS } } }], { fullDocument: 'updateLookup' })`
- **Then** the change stream opens successfully with no server-side stage-option validation error
- **And** documents written to the watched collections (`campaigns`, `campaignMessages`, `campaignRolls`) are observed by the stream as before

### Requirement: ADDED GridFS attachment round-trip continues to work correctly under driver v7

The system SHALL continue to correctly upload, locate, download, and delete GridFS-backed attachments via `lib/gridfs.ts`, under the `mongodb` v7 driver, despite the official v7 changelog not itemizing any GridFSBucket-specific changes.

#### Scenario: GridFS attachment round-trip

- **Given** a testcontainers-provisioned MongoDB instance running against the `mongodb` v7 driver
- **When** a file is uploaded via `uploadAttachment()`, located via `openDownloadStream()`'s internal `bucket.find({ _id })`, downloaded via the returned `GridFSBucketReadStream`, and then deleted via `deleteOrphanedAttachments()`'s `bucket.delete()`
- **Then** the downloaded byte content exactly matches the uploaded content
- **And** the file's `metadata` (`campaignId`, `status`, `uploadedAt`, `contentType`) round-trips correctly through `attachments.files`
- **And** after deletion, `verifyAttachmentCampaign()` returns `false` for the deleted attachment id

## Traceability

- Proposal element: "Bump `mongodb` `^6.3.0` → `^7.x`... No functionality change" -> Requirement: ADDED Application behavior unchanged across the mongodb driver v6→v7 upgrade
- Proposal element: Risk — `detectReplicaSet()` error-matching fragility -> Requirement: ADDED Standalone MongoDB detection continues to correctly select the polling transport under driver v7
- Proposal element: Risk — `ChangeStreamInvalidatedError` recovery -> Requirement: ADDED Change-stream invalidation recovery continues to function under driver v7
- Proposal element: Risk — `$changeStream` server-side validation move -> Requirement: ADDED The campaign event stream's `$changeStream` pipeline continues to open cleanly under driver v7's server-side stage-option validation
- Proposal element: Risk — GridFS undocumented by v7 changelog -> Requirement: ADDED GridFS attachment round-trip continues to work correctly under driver v7
- Design decision 3 (4 targeted integration tests) -> All four "ADDED" requirements above, one test each
- Design decision 4 (no `lib/db.ts` connection-option changes) -> Requirement: ADDED No infrastructure changes required (scenario)
- Requirement: ADDED Application behavior unchanged -> Task(s): full-suite run task (tasks.md)
- Requirement: ADDED Standalone MongoDB detection -> Task(s): detectReplicaSet integration test task (tasks.md)
- Requirement: ADDED Change-stream invalidation recovery -> Task(s): invalidation integration test task (tasks.md)
- Requirement: ADDED `$changeStream` pipeline validation -> Task(s): pipeline-open integration test task (tasks.md)
- Requirement: ADDED GridFS round-trip -> Task(s): GridFS integration test task (tasks.md)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- Not applicable — this change introduces no new latency-sensitive path. The existing polling interval (2000ms) and change-stream delivery timing are unchanged; driver internals are not expected to alter observable latency, and no performance regression testing beyond the existing `test:e2e` suite is in scope.

### Requirement: Security

> Access-control behavior is unaffected by this change — no new access paths are introduced, and existing access control is already covered by each affected capability's own spec (e.g. `session-event`, `sse-stream`, `gridfs-upload`, `gridfs-serve`). See those capabilities' existing functional scenarios; this change adds no new security-relevant scenario.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a driver-version-sensitive fault condition (standalone-mode misdetection, or a stream invalidation whose error shape changed under v7)
- **When** the corresponding integration test (see "ADDED Standalone MongoDB detection..." and "ADDED Change-stream invalidation recovery..." above) is run against the real v7 driver
- **Then** the recovery/fallback path is exercised and asserted directly, rather than inferred from the absence of a crash — this is the distinguishing reliability property this change adds test coverage for, beyond what the pre-existing suite already covers
