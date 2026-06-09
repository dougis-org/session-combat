# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/issue-311-sse-stream-transport` then immediately `git push -u origin feat/issue-311-sse-stream-transport`

## Execution

### T1 — Add CampaignStreamEvent type to lib/types.ts

- [x] Add `CampaignStreamEvent` discriminated union to `lib/types.ts`:
  ```ts
  export type CampaignStreamEvent =
    | { type: 'heartbeat'; campaignId: string; data: { ts: number } };
  ```
- [x] Verify: `npx tsc --noEmit` passes

### T2 — Export checkAuth and add withStreamAndParams to lib/middleware.ts

- [x] Export `checkAuth` from `lib/middleware.ts` (change `async function checkAuth` to `export async function checkAuth`)
- [x] Add `withStreamAndParams<P>` immediately after `withAuthAndParams`:
  ```ts
  export function withStreamAndParams<P extends Record<string, string>>(
    handler: (request: NextRequest, auth: AuthPayload, params: P) => Promise<Response>
  ) {
    return async (
      request: NextRequest,
      { params }: { params: Promise<P> }
    ): Promise<Response> => {
      const auth = requireAuth(request);
      if (auth instanceof NextResponse) return auth;
      const denied = await checkAuth(auth);
      if (denied) return denied;
      return handler(request, auth, await params);
    };
  }
  ```
- [x] Verify existing middleware tests still pass: `npx jest lib/middleware`
- [x] Verify: `npx tsc --noEmit` passes

### T3 — Implement lib/server/transport.ts

Implement the transport abstraction. Write tests first (T3a), then implementation (T3b).

#### T3a — Unit tests for transport (TDD)

- [x] Create `tests/unit/server/transport.test.ts`
- [x] Test: first `subscribe()` on Atlas path opens exactly one cursor
- [x] Test: second `subscribe()` reuses the existing cursor (watch call count = 1)
- [x] Test: concurrent `subscribe()` calls during lazy open result in one cursor
- [x] Test: teardown removes the subscriber from the registry
- [x] Test: last subscriber teardown closes the cursor and resets open promise
- [x] Test: last subscriber drops while open is in flight — cursor closed after resolve
- [x] Test: change stream event with `campaignId: 'A'` routes only to campaign A handlers
- [x] Test: replica-set detection error selects polling path; `watch()` not called
- [x] Test: detection result cached — `replSetGetStatus` called only once across two subscribes
- [x] Test: polling path emits new events since last timestamp
- [x] Test: polling teardown clears the interval
- [x] Test: cursor invalidation triggers one reconnect attempt
- [x] Test: poll DB error is caught and logged; interval continues

#### T3b — Transport implementation

- [x] Create `lib/server/transport.ts`
- [x] Module-level state:
  - `openPromise: Promise<ChangeStream> | null`
  - `sharedCursor: ChangeStream | null`
  - `subscriberCount: number`
  - `registry: Map<string, Set<(event: CampaignStreamEvent) => void>>`
  - `isReplicaSet: boolean | null` (null = not yet detected)
- [x] Implement `detectReplicaSet(): Promise<boolean>` — calls `db.admin().command({ replSetGetStatus: 1 })`; catches non-replica-set error; caches result
- [x] Implement `openStream(): Promise<ChangeStream>` — calls `connectToDatabase()` to get `client`; opens `client.watch([])` watching all collections; starts async iteration loop calling `demux()`; wraps with Promise-based lock
- [x] Implement `demux(doc)` — extracts `campaignId` from `doc.fullDocument`; calls all registered handlers in `registry.get(campaignId)`
- [x] Implement `closeStream()` — closes cursor, resets `openPromise` and `sharedCursor` to null
- [x] Implement cursor invalidation recovery in the iteration loop — one reconnect attempt via `openStream()`; falls back to polling if reconnect fails
- [x] Implement `subscribe(campaignId, onEvent): () => void`:
  - Detects replica-set if not yet cached
  - Atlas path: increments `subscriberCount`; calls `openStream()` (returns existing promise if open); registers handler
  - Polling path: sets `sinceTimestamp = Date.now()`; starts `setInterval(pollFn, 2000)`
  - Returns teardown: removes handler from registry; decrements count; if count reaches 0 calls `closeStream()`; for polling clears interval
- [x] Implement `pollFn(campaignId, handler, sinceRef)` — calls `getDatabase()`; queries watched collections with `{ campaignId, createdAt: { $gt: sinceRef.value } }`; maps results to `CampaignStreamEvent`; calls handler; advances `sinceRef.value`; wraps in try/catch with `console.error`
- [x] Run T3a tests: `npx jest tests/unit/server/transport`; all must pass

### T4 — Implement app/api/campaigns/[id]/stream/route.ts

Write tests first (T4a), then implementation (T4b).

#### T4a — Integration test for stream endpoint

- [x] Create `tests/integration/campaigns-stream.integration.test.ts`
- [x] Test: `GET /api/campaigns/[id]/stream` with valid auth + active member → 200, `Content-Type: text/event-stream`
- [x] Test: no auth token → 401, no SSE bytes
- [x] Test: expired/invalidated token → 401
- [x] Test: valid auth but not a campaign member → 404
- [x] Test: heartbeat event emitted within interval (use fake timers)
- [x] Test: abort signal fires → teardown called, subscriber removed
- [x] Test: concurrent connections to same campaign share one cursor (assert `client.watch` call count = 1)

#### T4b — Stream route implementation

- [x] Create `app/api/campaigns/[id]/stream/route.ts`
- [x] Use `withStreamAndParams<{ id: string }>` as the handler wrapper
- [x] Inside handler:
  1. Call `assertCampaignAccess(id, auth.userId)`; if result is `NextResponse` return it
  2. Create a `ReadableStream` with a `start(controller)` function:
     - Call `subscribe(id, (event) => controller.enqueue(formatSSE(event)))` to get teardown fn
     - Set heartbeat interval: `setInterval(() => controller.enqueue(formatSSE({ type: 'heartbeat', campaignId: id, data: { ts: Date.now() } })), 25_000)`
     - Register `request.signal` abort listener: call teardown, clear interval, `controller.close()`
  3. Return `new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })`
- [x] Implement `formatSSE(event: CampaignStreamEvent): string` — returns `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
- [x] Run T4a tests: `npx jest tests/integration/campaigns-stream`; all must pass

### T5 — Full validation pass

- [x] `npx tsc --noEmit` — zero errors
- [x] `npx jest` (unit suite) — all pass
- [x] `npx jest --config jest.integration.config.js` (integration suite) — all pass
- [x] `npx next build` — build succeeds

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit tests: `npx jest`
- [x] Run integration tests: `npx jest --config jest.integration.config.js`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npx next build`
- [x] All tasks T1–T5 marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest`; all tests must pass
- **Integration tests** — `npx jest --config jest.integration.config.js`; all tests must pass
- **Build** — `npx next build`; must succeed with no errors
- **Type check** — `npx tsc --noEmit`; zero errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings automatically addressed before final commit
- [ ] Commit all changes to `feat/issue-311-sse-stream-transport` and push to remote
- [ ] Open PR from `feat/issue-311-sse-stream-transport` to `main`. PR body **MUST** include `Closes #311`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address all comments, commit fixes, follow remote push validation, push, wait 180s, repeat until no unresolved threads remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix all required failures, commit, push, wait 180s, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user; never force-merge

Ownership metadata:

- Implementer: assigned agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete
- [ ] Sync approved spec deltas to global specs:
  - Copy `openspec/changes/issue-311-sse-stream-transport/specs/transport/spec.md` → `openspec/specs/transport/spec.md`
  - Copy `openspec/changes/issue-311-sse-stream-transport/specs/sse-stream/spec.md` → `openspec/specs/sse-stream/spec.md`
  - Update relative references in both files to point to archived locations
- [ ] Archive the change in a **single atomic commit**: move `openspec/changes/issue-311-sse-stream-transport/` to `openspec/changes/archive/YYYY-MM-DD-issue-311-sse-stream-transport/` — stage both the new path and deletion of old path together
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-issue-311-sse-stream-transport/` exists and `openspec/changes/issue-311-sse-stream-transport/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-issue-311-sse-stream-transport` then push
- [ ] Open PR from doc branch to `main` with title `docs: archive issue-311-sse-stream-transport (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged (same loop — address comments/CI, push, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/issue-311-sse-stream-transport doc/archive-YYYY-MM-DD-issue-311-sse-stream-transport`
