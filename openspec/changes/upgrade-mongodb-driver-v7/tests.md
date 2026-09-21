---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `upgrade-mongodb-driver-v7` change. All work should follow a strict TDD (Test-Driven Development) process. Because this is a "no functionality change" dependency upgrade, most of the existing suite is expected to pass unmodified against the new driver — the TDD cycle here applies specifically to the 4 new risk-driven integration tests, which must be written and confirmed to fail meaningfully (i.e., fail for the right reason, ideally first authored/run against the pre-upgrade v6 driver where applicable, or as a red/no-op state before the upgrade lands) before the upgrade makes them pass.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task: Pre-work — confirm `@testcontainers/mongodb` v7-compatibility

- [ ] Test case: Provision a testcontainers MongoDB instance using the current (or bumped) `@testcontainers/mongodb` version and confirm the driver v7 client can successfully `connect()` and `ping()` against it. (Maps to tasks.md "Pre-work" task; no dedicated spec scenario — this is an infrastructure precondition for all four spec-driven tests below.)

### Task: Bump `mongodb` dependency

- [ ] Test case: Run `npm ls mongodb` and confirm the resolved version satisfies `^7.x`. (Maps to tasks.md "Bump `mongodb` dependency" task; supports spec scenario "Application behavior unchanged post-upgrade".)
- [ ] Test case: Run the full pre-existing unit suite (`test:unit`) unmodified against the bumped driver; confirm 100% pass with zero assertion changes. (Maps to spec scenario "Application behavior unchanged post-upgrade".)

### Task: Review the 2 previously-unread call sites

- [ ] Test case: After reading `app/api/auth/password/reset/route.ts` and `app/api/campaigns/[id]/members/route.ts`, run their existing route-level tests (unit/integration, whichever cover them) unmodified; confirm pass. If no dedicated test exists for either route, note this as a gap and add minimal coverage before proceeding — do not treat "no test found" as passing. (Maps to tasks.md "Review the 2 previously-unread call sites"; supports spec scenario "Application behavior unchanged post-upgrade".)

### Task: Review and adapt the 3 remaining direct call sites

- [ ] Test case: Existing unit tests for `lib/permissions.ts` (e.g. `getUserById`, `isUserAdmin`) pass unmodified against v7.
- [ ] Test case: Existing unit/integration tests for `lib/gridfs.ts` pass unmodified against v7 (superseded in depth by the new GridFS round-trip integration test below, but the pre-existing suite must still pass first).
- [ ] Test case: Existing unit/integration tests for `lib/server/transport.ts` pass unmodified against v7 (superseded in depth by the 3 new transport-focused integration tests below).

### Task: `tsc --noEmit` project-wide

- [ ] Test case: `npm run typecheck` (`tsc --noEmit`) exits 0 with no errors across the full project, including every `lib/storage/*Repo.ts` file. (Maps to spec scenario "No infrastructure changes required" indirectly — confirms no type-level breakage anywhere `Db`/`Collection` generics are consumed.)

### Task: Write integration test 1 — standalone-mode detection

- [ ] Test case (write first, confirm it fails/is meaningful before the driver bump lands, or against a deliberately-broken error-matcher as a red-state sanity check): Provision a standalone (non-replica-set) MongoDB testcontainer; call `detectReplicaSet()`; assert the thrown error satisfies at least one of the four conditions (`message.includes('not running with --replSet')`, `message.includes('$changeStream')`, `code === 76`, `code === 40573`).
- [ ] Test case: Call `subscribe()` against the same standalone instance; assert it registers via `setInterval`-based polling (e.g. by observing `pollFn` invocation or the absence of a change-stream `openPromise`), not an attempted change-stream open.
- (Maps to tasks.md "Write integration test 1"; maps to spec.md "ADDED Standalone MongoDB detection continues to correctly select the polling transport under driver v7" — scenario "Standalone MongoDB falls back to polling".)

### Task: Write integration test 2 — change-stream invalidation recovery

- [ ] Test case: Provision a replica-set MongoDB testcontainer; call `openStream()` to establish a change-stream cursor; drop the watched collection (or the database) to force invalidation; assert the stream's terminal error has `.name === 'ChangeStreamInvalidatedError'`.
- [ ] Test case: After the forced invalidation, assert `openStream()`'s recovery branch successfully reopens a new cursor (e.g. by writing a fresh document to a watched collection afterward and confirming it is observed), without requiring a process restart.
- (Maps to tasks.md "Write integration test 2"; maps to spec.md "ADDED Change-stream invalidation recovery continues to function under driver v7" — scenario "Change-stream invalidation triggers automatic reopen".)

### Task: Write integration test 3 — `$changeStream` pipeline validation

- [ ] Test case: Provision a replica-set MongoDB testcontainer; call `openStream()` with the existing pipeline (`$match` on `ns.coll` restricted to `WATCHED_COLLECTIONS`, `fullDocument: 'updateLookup'`); assert the stream opens without a server-side stage-option validation error.
- [ ] Test case: Write a document to each of `campaigns`, `campaignMessages`, and `campaignRolls`; assert each is observed by the open stream (i.e. `demux()` is invoked with the corresponding `ns.coll`).
- [ ] Test case: Write a document to an unrelated collection; assert it is filtered out server-side and never reaches `demux()`.
- (Maps to tasks.md "Write integration test 3"; maps to spec.md "ADDED The campaign event stream's `$changeStream` pipeline continues to open cleanly under driver v7's server-side stage-option validation" — scenario "Existing change-stream pipeline opens without a server-side validation error".)

### Task: Write integration test 4 — GridFS round-trip

- [ ] Test case: Upload a file via `uploadAttachment()` against a testcontainers MongoDB v7 instance; assert the returned id is a valid hex ObjectId string.
- [ ] Test case: Locate the uploaded file via `openDownloadStream()`; assert `contentType` and `campaignId` match what was uploaded.
- [ ] Test case: Consume the returned `GridFSBucketReadStream`; assert the downloaded bytes exactly match the originally-uploaded buffer.
- [ ] Test case: Call `updateAttachmentStatus()` to mark the attachment `'complete'`; re-fetch via a direct `find()` on `attachments.files` and assert `metadata.status === 'complete'`.
- [ ] Test case: Call `deleteOrphanedAttachments()` (or a direct `bucket.delete()`) for the uploaded attachment; assert `verifyAttachmentCampaign()` subsequently returns `false` for that attachment id.
- [ ] Test case: Attempt `openDownloadStream()`/`verifyAttachmentCampaign()` with a malformed (non-hex) attachment id; assert the existing `INVALID_ID`-coded error behavior is unchanged under v7.
- (Maps to tasks.md "Write integration test 4"; maps to spec.md "ADDED GridFS attachment round-trip continues to work correctly under driver v7" — scenario "GridFS attachment round-trip".)

### Task: Confirm acceptance criteria are covered

- [ ] Test case: Cross-check that all 5 "ADDED Requirement" scenarios in `specs/mongodb-driver-upgrade/spec.md` have at least one corresponding test case above with a passing result before this checklist item is marked complete.

### Cross-cutting: Full gate (per issue #638)

- [ ] Test case: `npm run lint && npm run typecheck && npm run test:unit && npm run test:integration && npm run test:e2e` — full command chain exits 0.
