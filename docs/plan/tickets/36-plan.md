### 1) Summary

- Ticket: #36  
- One-liner: Implement local-first offline-capable data persistence layer that allows encounters, combat sessions, and parties to work without internet connectivity while progressively syncing to MongoDB when online; reduce network lag and enable intermittent-offline workflows.  
- Related milestone(s): NA  
- Out of scope: Fully offline authentication (login still requires connectivity); changing MongoDB schema; UI offline indicators (covered by separate feature); implementing conflict resolution for concurrent edits

---

### 2) Assumptions & Open Questions

- Assumptions:
  - Authentication check remains a prerequisite (user must be authenticated once; stored token/session can persist in localStorage).
  - "Local storage" means browser `localStorage` for user-created entities (encounters, parties, characters, combat state). IndexedDB for monster catalog is deferred to future ticket.
  - API routes currently fetch from MongoDB directly; they will be augmented to **check local storage first**, then remote, and provide a **sync queue** mechanism for writes.
  - Existing clientStorage.ts provides basic localStorage interface and should be extended to support versioning, soft-delete flag, and conflict detection.
  - All user-facing data (encounters, parties, characters, combat state) should persist to local storage **on every successful change**; combat state takes priority for data loss prevention.
  - App is in alpha; breaking changes are acceptable. **Offline-first is always enabled (no global feature flag).** Sync behavior is controlled by `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` env var: 0 = on-demand sync (manual or visibility/online events only), N > 0 = auto-sync every N seconds when online.
  - Integration tests will use Testcontainers (MongoDB) and mocked network conditions to verify sync retry and conflict resolution.
  - Combat session state is most time-sensitive; it persists to local storage immediately and syncs asynchronously with exponential backoff on network retry.
  - LWW (Last-Write-Wins) based on `_lastModified` timestamp is the conflict resolution strategy; conflicts are logged and user is notified via toast.
  - Sync triggers on page visibility change (resume on tab focus), on `online` event (resume immediately), and on a configurable timer (default 30s if online; 0 = disabled, on-demand only).
  - Sync queue has max size ~1000 operations; quota warnings at 80% full localStorage. Quota limit enforcement (rejecting writes when full) deferred to future ticket.
- Open questions (resolved; no blocking items):
  1. **Conflict resolution strategy**: ✅ Resolved. LWW (Last-Write-Wins) by `_lastModified` timestamp. Conflicts logged; user notified via toast. Three-way merge deferred to future ticket.
  2. **Sync trigger strategy**: ✅ Resolved. Sync on page visibility change (resume on tab focus), on `online` event (resume immediately), and on configurable timer (interval from `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` env var; 0 = on-demand only).
  3. **Storage limits & retention**: ✅ Resolved. Rely on browser localStorage defaults (~10MB). Warn at 80% full. Active eviction/quota enforcement deferred to future ticket.

---

### 3) Acceptance Criteria (normalized)

1. Encounters, parties, characters, and combat state are persisted to `localStorage` (under a versioned `sessionCombat:v1` key) whenever created, updated, or deleted locally. Soft-deleted items (marked `_deleted: true`) are hidden from GET responses but retained in localStorage until sync confirms remote deletion.
2. API GET routes (`/api/encounters`, `/api/parties`, `/api/characters`, `/api/combat`) return merged local + remote data (local takes precedence if both exist with same ID).
3. API POST/PUT routes (`/api/encounters`, `/api/parties`, etc.) write to local storage immediately (optimistic write) and queue a sync task to MongoDB; if network succeeds, queue is cleared and local copies are hard-deleted; if network fails, queue persists and retries on next network availability.
4. A sync service (`lib/sync/SyncQueue.ts`) manages pending writes: retries with exponential backoff (1s, 2s, 4s, up to 30s), detects online/offline transitions, and logs outcomes.
5. When merge conflicts occur (same entity edited offline in two tabs), last-write-wins by `_lastModified` timestamp; app logs conflict and shows toast "Changes from another session applied".
6. When combat session ends via "End Combat" button, the combat state is ejected (deleted) from local storage; remote MongoDB record remains for history/audit.
7. Existing E2E tests pass; new integration tests validate: optimistic writes, sync queue retry, offline/online transitions, merge of local and remote data, and deduplication.
8. API contracts remain backward-compatible; new response fields are optional.

**Note:** Monster catalog persistence (IndexedDB opt-in) is deferred to future ticket #XX; not included in this ticket.

---

### 4) Approach & Design Brief

**Current state:**
- App currently uses direct API calls to MongoDB via Next.js API routes (`/api/characters`, `/api/encounters`, `/api/parties`, `/api/combat`).
- Client-side `clientStorage.ts` provides basic localStorage getters/setters but does not sync or version data.
- No offline support; network failures cause data loss (user sees error but change is lost).
- Authentication (login/register) requires network connectivity; token stored in memory/cookies.

**Proposed changes (high-level architecture & data flow):**
- **Tiered data access layer**:
  - New: `lib/sync/LocalStore.ts` — abstraction for versioned localStorage (key schema: `sessionCombat:v1:<entityType>:<id>`, supports read/write/delete/list operations).
  - New: `lib/sync/SyncQueue.ts` — manages pending API writes (POST/PUT/DELETE to remote); tracks operation ID, type, payload, retry count, timestamp; persists in `sessionCombat:v1:syncQueue` (JSON array).
  - New: `lib/sync/NetworkDetector.ts` — listens to `online`/`offline` events and `navigator.onLine`; exposes hook `useNetworkStatus()` for React components.
  - Updated: API routes become **sync gateways**:
    - `GET /api/encounters` → query local store first, then fetch remote (if online), merge + deduplicate, return merged result.
    - `POST /api/encounters` → create locally (optimistic), push to sync queue, return local copy immediately; queue processes async.
    - `PUT /api/encounters/:id` → update locally (optimistic), push to sync queue, return updated copy immediately.
    - `DELETE /api/encounters/:id` → mark as deleted locally (soft delete or flag), queue deletion task, return success.
  - Updated: `clientStorage.ts` → extend with versioning and sync integration; backward-compatible (reads old keys, migrates on first write).
  - New: Periodic sync worker (settable via feature flag interval, default 30s if online) that processes the sync queue.

**Data model / schema:**
- LocalStore key schema:
  ```
  sessionCombat:v1:encounters:<uuid> = { id, userId, name, ...encounter fields, _syncId, _version, _lastModified, _deleted?: bool }
  sessionCombat:v1:parties:<uuid> = { id, userId, name, ...party fields, _syncId, _version, _lastModified, _deleted?: bool }
  sessionCombat:v1:characters:<uuid> = { id, userId, name, ...character fields, _syncId, _version, _lastModified, _deleted?: bool }
  sessionCombat:v1:combatState = { userId, ...combat fields, _syncId, _version, _lastModified }
  sessionCombat:v1:syncQueue = [
    { _id, type: 'POST'|'PUT'|'DELETE', resource: 'encounters'|'parties'|..., payload, retries: 0, nextRetry: timestamp }
  ]
  sessionCombat:v1:config = { lastSync: timestamp }
  ```
  
  **Delete semantics:** On DELETE request, set `_deleted: true` locally (soft delete, hidden from GET). Queue DELETE task to server. On sync success, hard-delete local record after remote confirms.
- IndexedDB (optional, requires opt-in): store full monster catalog under `session-combat-db` / `monsters` object store.
- No MongoDB schema changes; all remote documents remain unchanged.

**APIs & contracts:**
- New internal hooks:
  - `useLocalStore()` — React hook for reading/writing local data.
  - `useNetworkStatus()` — React hook for online/offline state.
  - `useSyncQueue()` — React hook for monitoring pending sync tasks (e.g., badge showing "3 pending writes").
- Existing API routes enhanced (no breaking changes):
  - `GET /api/encounters` — returns `{ data: Encounter[], source: 'local' | 'remote' | 'merged', syncStatus: 'synced' | 'pending' }` (optional fields for backward compat).
  - Error responses: if offline and local cache miss, return `{ error: 'No local data available and offline', status: 503 }`.

**Configuration (no feature flags; offline-first is always enabled):**
- `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` (environment variable, default: 30) — how often (in seconds) to automatically retry/process sync queue when online. Set to 0 to disable automatic sync (manual sync only via page visibility change or `online` event).

**Config:**
- Environment variables (in `.env.local`):
  ```
  NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL=30   # Seconds; auto-sync interval when online (0 = on-demand only)
  ```
- Runtime config: load from env vars on app startup (read in SyncService).

**External deps:**
- No new production dependencies required.
- Dev: `@testcontainers/mongodb` (already present) for integration tests simulating offline/online transitions.

**Backward compatibility strategy:**
- When feature flag is OFF (default), app uses current remote-first behavior.
- When flag is ON, local-first kicks in but API responses are backward-compatible (optional new fields in response).
- Old localStorage format (simple `sessionData` key) is detected and migrated on first write (transparent to user).
- No breaking changes to existing API contracts.

**Observability (metrics/logs/traces/alerts):**
- Log entries (console.debug by default, can be toggled):
  - `[SyncQueue] Pending write queued: <resource>/<id>`
  - `[SyncQueue] Sync attempt #<n>: <resource>/<id> → <result>`
  - `[SyncQueue] Offline detected; pausing sync.`
  - `[SyncQueue] Online detected; resuming sync.`
  - `[SyncQueue] Combat session ejected from localStorage: <sessionId>`
- Optional metrics (if analytics exists; otherwise skip):
  - `app.offline.pending_writes_count` — gauge of queued operations.
  - `app.offline.sync_success_count` — counter of successfully synced writes.
  - `app.offline.sync_failure_count` — counter of failed sync attempts (after max retries).
- No database-level alerts required for this ticket; app-level logging is sufficient.

**Security & privacy:**
- LocalStorage is **per-origin** (user-scoped by browser isolation); no cross-origin leakage.
- Sensitive data (JWT tokens, passwords): **NOT stored in localStorage** (existing pattern continues).
- Authentication: login/register still require network; token from JWT stored in memory (as today).
- Input validation: all writes to local storage go through existing validators (no new validation layer needed; reuse `validateMonster`, `validateCharacter`, etc.).
- Rate limiting: sync queue respects backoff strategy; no additional rate-limiting config needed.
- Conflict resolution: LWW (last-write-wins) by default; future tickets can implement merge strategies (not this ticket).

**Alternatives considered:**
- **ServiceWorker caching**: Rejected (more complex, harder to test, adds build complexity). Local-first is simpler and sufficient for this use case.
- **Firestore Offline Persistence**: Rejected (app uses MongoDB, not Firestore).
- **SQLite with sync layer (e.g., WatermelonDB)**: Rejected (overkill for current data volume; localStorage + IndexedDB sufficient).
- **Always-sync model (no queue, every write goes to remote)**: Rejected (defeats offline goal; increases latency and battery drain on mobile).

---

### 5) Step-by-Step Implementation Plan (TDD)

**Phases: RED → GREEN → REFACTOR**

#### Phase 1: Prep & Branch
1. Ensure clean workspace:
   ```bash
   git checkout main && git pull --ff-only
   ```
2. Create feature branch:
   ```bash
   git checkout -b feature/36-local-first-offline-sync
   ```
3. Confirm: **"Planning issue #36 on branch feature/36-local-first-offline-sync"**

#### Phase 2: Tests First (RED)

**2.1: Unit Tests — LocalStore Abstraction**
- **File (NEW):** `tests/unit/sync/LocalStore.test.ts`
  - **Test data:** `tests/unit/data/local-store-test-cases.json` (parameterized cases: valid encounter, party, character, combat state, edge cases like empty name, Unicode, max size).
  - **Data schema example:**
    ```json
    [
      { "testName": "save valid encounter", "entityType": "encounters", "input": { "id": "uuid-1", "name": "Goblin Ambush", ... }, "expectedOutput": { "...input": true, "_version": 1, "_lastModified": "<timestamp>" }, "isErrorCase": false },
      { "testName": "load nonexistent", "entityType": "encounters", "input": { "id": "nonexistent" }, "expectedOutput": null, "isErrorCase": false }
    ]
    ```
  - **Provider class (NEW):** `tests/unit/helpers/LocalStoreTestDataProvider.ts` — reuses factory pattern from [tests/integration/helpers/monsterTestData.ts](tests/integration/helpers/monsterTestData.ts) (cite existing pattern).
  - **Tests (RED state):**
    - `saveEncounter()` persists to versioned key and increments version.
    - `loadEncounter(id)` retrieves by id and returns `null` if not found.
    - `loadAllEncounters()` returns all encounters as array, deduplicates.
    - `deleteEncounter(id)` soft-deletes (marks `_deleted: true`).
    - `migrateOldFormat()` reads old `sessionData` key, transforms to new schema.
    - All operations throw/handle errors gracefully (quota exceeded, parse errors).

**2.2: Unit Tests — SyncQueue Abstraction**
- **File (NEW):** `tests/unit/sync/SyncQueue.test.ts`
  - **Test data:** `tests/unit/data/sync-queue-test-cases.json` (parameterized: POST encounter, PUT party, DELETE character, retries, backoff timing).
  - **Data schema example:**
    ```json
    [
      { "testName": "enqueue POST and persist", "operation": { "type": "POST", "resource": "encounters", "payload": { ... } }, "expectedQueue": { "length": 1, "first": { "...operation": true } }, "isErrorCase": false },
      { "testName": "backoff 1s → 2s → 4s → 30s", "retryCount": [0, 1, 2, 3, 4], "expectedMs": [1000, 2000, 4000, 8000, 30000], "isErrorCase": false }
    ]
    ```
  - **Provider class (NEW):** `tests/unit/helpers/SyncQueueTestDataProvider.ts` — reuses factory pattern from [tests/integration/helpers/monsterTestData.ts](tests/integration/helpers/monsterTestData.ts).
  - **Tests (RED state):**
    - `enqueue(operation)` adds to queue, persists to localStorage.
    - `dequeue()` returns next pending operation.
    - `markSuccess(operationId)` removes from queue.
    - `markFailure(operationId)` increments retry count, calculates next retry timestamp (1s, 2s, 4s, …).
    - `getNextRetryTime()` returns correct backoff value.
    - `clear()` wipes queue.

**2.3: Unit Tests — NetworkDetector Hook**
- **File (NEW):** `tests/unit/hooks/useNetworkStatus.test.tsx`
  - **Tests (RED state):**
    - Hook initializes with `navigator.onLine` value.
    - Hook subscribes to `online` event; state updates when network comes online.
    - Hook subscribes to `offline` event; state updates when network goes offline.
    - Hook unsubscribes on unmount.
    - Mocked event simulation to trigger state changes.

**2.4: Integration Tests — Local + Remote Merge**
- **File (NEW):** `tests/integration/local-remote-sync.integration.test.ts`
  - **Setup:** Testcontainers MongoDB + Next.js test server (as in existing [api.integration.test.ts](tests/integration/api.integration.test.ts)).
  - **Tests (RED state):**
    - `GET /api/encounters` returns local data when offline; remote + local merged when online.
    - `POST /api/encounters` writes locally, queues sync, returns immediately with `_syncPending: true` flag; sync happens asynchronously.
    - `PUT /api/encounters/:id` updates locally, queues sync; soft-deleted items hidden from GET.
    - `DELETE /api/encounters/:id` sets `_deleted: true` locally, queues deletion task; after sync success, hard-deletes local record.
    - Offline → online transition triggers sync queue processing.
    - Network errors (500, timeout) trigger retry with backoff (verify cap at 30s).
    - Deduplication: if local id matches remote id (same encounter), merge correctly (not create duplicate).
    - Conflict resolution: two edits offline with different timestamps; merge uses LWW; log entry created; toast shown.

**2.5: Integration Tests — Backward Compatibility & Old Format Migration**
- **File (NEW):** `tests/integration/backward-compat.integration.test.ts`
  - **Tests (RED state):**
    - Old localStorage format (`sessionData` key) is detected on first read and migrated to new schema.
    - Migrated data is available in GET requests after migration.
    - New writes use versioned keys (`sessionCombat:v1:*`); old key is removed after successful migration.

#### Phase 3: Implementation (GREEN)

**3.1: Implement LocalStore (`lib/sync/LocalStore.ts`)**
- Export functions:
  - `saveEntity(type, id, data)` — write to `sessionCombat:v1:<type>:<id>`, add `_version`, `_lastModified`.
  - `loadEntity(type, id)` — read from key, return parsed object or null.
  - `loadAllEntities(type)` — read all keys matching `sessionCombat:v1:<type>:*`, return array.
  - `deleteEntity(type, id)` — remove key or set `_deleted` flag.
  - `migrateOldFormat()` — detect old `sessionData` key, transform to new schema, delete old key.
  - Error handling: catch `QuotaExceededError`, log warnings, gracefully degrade.

**3.2: Implement SyncQueue (`lib/sync/SyncQueue.ts`)**
- Export class:
  - Constructor: load pending queue from localStorage.
  - `enqueue(operation: SyncOperation)` — add to queue, persist.
  - `dequeue(): SyncOperation | null` — return oldest pending op.
  - `markSuccess(operationId)` — remove from queue.
  - `markFailure(operationId)` — increment retry, set next retry time.
  - `process(fetch)` — async method to process queue: dequeue → call fetch → mark success/failure → reschedule on failure.
  - `getRetryBackoffMs(retryCount): number` — 1000, 2000, 4000, ... (capped at 30000).
  - Persistence: all state saved to `sessionCombat:v1:syncQueue` localStorage key.

**3.3: Implement NetworkDetector (`lib/sync/NetworkDetector.ts`)**
- Export:
  - `useNetworkStatus(): { isOnline: boolean }` — React hook.
  - Listens to `online` / `offline` events and `navigator.onLine`.
  - Internal: create global event listener (singleton) to avoid duplicate listeners.

**3.4: Implement Sync Triggers (Visibility + Timer)**
- File: `lib/sync/SyncTriggers.ts`
  - Listen to page visibility change: pause sync on hidden, resume on visible.
  - Use `setInterval` for periodic sync (interval from env var, default 30s).
  - Manual sync button: only enabled if sync queue has pending operations.

**3.5: Implement Combat Session Ejection on End**
- File: `app/combat/page.tsx` (update `handleEndCombat()`)
  - On "End Combat" button click, after completing remote sync/save:
    - Call `localStore.deleteEntity('combatState', userId)` to eject from localStorage.
    - Log: `[SyncQueue] Combat session ejected from localStorage`.
    - Show success toast.

**3.6: Update API Routes to Use Local-First + Sync**
- **Files to modify:**
  - `app/api/encounters/route.ts` (GET, POST, PUT, DELETE)
  - `app/api/parties/route.ts` (GET, POST, PUT, DELETE)
  - `app/api/characters/route.ts` (GET, POST, PUT, DELETE)
  - `app/api/combat/route.ts` (GET, POST, PUT)
- **Pattern for each route:**
  ```typescript
  // GET: merge local + remote
  if (FLAG_OFFLINE_ENABLED) {
    const local = await localStore.loadAll(type);
    const remote = await storage.load(type); // existing MongoDB fetch
    const merged = mergeAndDeduplicate(local, remote);
    return merged;
  } else {
    // Current behavior: fetch remote only
    return await storage.load(type);
  }

  // POST/PUT: optimistic local write + queue sync
  if (FLAG_OFFLINE_ENABLED) {
    await localStore.save(type, id, payload);
    syncQueue.enqueue({ type: 'POST'|'PUT', resource: type, payload });
    return { ...payload, id, _syncPending: true };
  } else {
    // Current behavior: direct remote write
    return await storage.save(type, payload);
  }
  ```

**3.5: Create Sync Service (`lib/sync/SyncService.ts`)**
- Manages background sync loop:
  - Polling interval (default 30s, configurable via env).
  - Triggered on page visibility change (pause on hidden, resume on visible).
  - Triggered on `online` event (resume immediately).
  - Triggered on `offline` event (pause).
  - Processes queue using `SyncQueue.process()`.
  - Logs outcomes.
  - Singleton pattern (initialize once on app startup).

**3.6: Integrate Sync Service into App Layout**
- File: `app/layout.tsx`
  - On mount (or in a top-level effect hook), initialize `SyncService`.
  - Ensure it only initializes once (check global flag).

**3.7: Update `lib/clientStorage.ts` to Support New LocalStore**
- Backward-compatible wrapper:
  - Existing methods (`saveEncounters()`, `loadEncounters()`) now call `LocalStore`.
  - Migration: on first call, detect old key format, migrate transparently.

**3.8: Add Monster Catalog Caching to User Profile**
- Update user profile schema/table to include `cacheMonsterCatalog: boolean` (default false).
- Add UI toggle on user settings/profile page: "Cache Monster Catalog for Offline Use".
- When enabled, download full SRD catalog to IndexedDB on background sync.

#### Phase 4: Refactor

**4.1: Code Review for Duplication**
- Check for repeated merge/deduplicate logic; extract to utility function `lib/sync/mergeLocalAndRemote.ts`.
- Ensure all API routes follow the same pattern; consolidate via shared middleware if appropriate.
- Verify test data factories reuse pattern from [tests/integration/helpers/monsterTestData.ts](tests/integration/helpers/monsterTestData.ts); consolidate into `tests/unit/helpers/testDataFactories.ts` if needed.

**4.2: Simplify and Clean Up**
- Keep methods <= 25 lines (single responsibility).
- Remove dead code, commented blocks.
- Ensure error messages are clear and actionable.
- Verify soft-delete flag (`_deleted`) is handled consistently across LocalStore, SyncQueue, and API merge logic.

**4.3: Linting & Formatting**
- Run `npm run lint` and fix any violations.
- Run formatter if applicable.

#### Phase 5: Pre-PR Duplication & Complexity Review (MANDATORY)

**5.1: Codacy Static Analysis**
- **Immediately after each file edit:** Run `codacy_cli_analyze` (Codacy MCP tool) for each modified file (tool parameter: empty/unset).
- **After integration tests pass:** Run `codacy_cli_analyze` with `tool: "trivy"` for security vulnerability scan of new dependencies.
- **Acceptance thresholds:**
  - Duplication: <10% (within module)
  - Complexity (McCabe): <15 per function
  - Security: No HIGH or CRITICAL vulnerabilities
  - Unused variables: Zero
- **Address violations:** Fix any HIGH-severity issues before moving to 5.2. Log issue details with Codacy IDs in commit message.

**5.2: Test Coverage & Completion**
- Ensure all new modules (`LocalStore.ts`, `SyncQueue.ts`, `NetworkDetector.ts`, etc.) have unit tests with >80% line coverage.
- Integration tests cover happy path, error cases, offline/online transitions, soft-delete lifecycle, conflict resolution logging.
- Run full test suite: `npm run test:integration` (all pass).

**5.3: Manual Testing**
- Locally test offline scenario:
  - Open DevTools Network tab, select "Offline" profile.
  - Create encounter, verify it saves locally and shows in list (check localStorage keys `sessionCombat:v1:encounters:*`).
  - Go online, verify sync completes (check browser console logs `[SyncQueue] Sync attempt`, localStorage cleared, MongoDB record created).
  - Delete encounter offline; verify `_deleted: true` flag set; sync on reconnect; verify hard-deleted from localStorage.
- Test old format migration:
  - Manually create old `sessionData` key in localStorage; reload app.
  - Verify migration log in console; old key removed; new `sessionCombat:v1:*` keys created.
  - Verify data accessible in GET requests.

**5.4: Build & Run Tests**
```bash
npm run build
npm run test:integration
npm run test:e2e
npm run lint
```

---

### 6) Effort, Risks, Mitigations

**Effort:** M (Medium) - Rationale:
- Core logic (LocalStore, SyncQueue, NetworkDetector) is straightforward (3-4 files, ~200-300 LOC each).
- Integration into API routes is a templated change (copy pattern 4-5 times).
- Test suite is parameterized (moderate effort for setup, tests themselves are simple).
- Feature flag logic is simple conditional.
- **Total estimate: 3-4 working days for a single engineer (1 for design/tests, 2-3 for implementation, 0.5 for review/polish).**

**Risks (ranked by severity):**

1. **Risk: Data loss due to incomplete sync before browser close or crash.**
   - **Mitigation:** 
     - Implement persistent sync queue in localStorage; queue survives page reload.
     - Before navigation away, show warning if pending syncs exist (optional, can be a separate ticket).
     - Combat state gets highest priority (synced first, retried most aggressively).
   - **Fallback:** If sync queue is lost (rare, e.g., localStorage cleared), user sees "offline but no local data" error; can re-enter data or refresh page to fetch remote.

2. **Risk: Merge conflicts if same entity is edited offline in two tabs and synced sequentially.**
   - **Mitigation:** 
     - Use LWW strategy based on `_lastModified` timestamp.
     - Document trade-off (eventual consistency, not strong consistency).
     - Future ticket can implement three-way merge if needed.
   - **Fallback:** Log conflict occurrence; show toast to user "Changes from another session were merged (LWW)"; user can manually check/override.

3. **Risk: Sync queue grows unbounded if network is down for extended period.**
   - **Mitigation:** 
     - Implement a max queue size (~1000 operations) and log warning if exceeded.
     - Document that extended offline periods may require manual cleanup (can be a separate feature).
   - **Fallback:** If queue is full, reject new local writes with error "Sync queue is full; wait for network or clear offline data."

4. **Risk: Feature flag accidentally enabled in production, exposing half-baked offline support.**
   - **Mitigation:** 
     - Default flag to OFF (verified in code review).
     - Require explicit env var to enable (not auto-enabled by any logic).
     - Integration tests verify flag defaults to OFF.
   - **Fallback:** If enabled by accident, revert flag and deploy hotfix.

5. **Risk: localStorage quota exceeded on low-end devices or after extended offline use.**
   - **Mitigation:** 
     - Implement quota check on each write; log warning if > 80% used.
     - Document storage limits in README.
     - Future ticket can implement auto-cleanup of old encounters.
   - **Fallback:** If quota is exceeded, show error "Local storage is full. Please delete old encounters or clear data." User can manually clean up.

---

### 7) File-Level Change List

**Tests (new, added first):**
- (NEW) `tests/unit/sync/LocalStore.test.ts` — LocalStore unit tests (parameterized).
- (NEW) `tests/unit/data/local-store-test-cases.json` — test data for LocalStore.
- (NEW) `tests/unit/sync/SyncQueue.test.ts` — SyncQueue unit tests.
- (NEW) `tests/unit/data/sync-queue-test-cases.json` — test data for SyncQueue.
- (NEW) `tests/unit/hooks/useNetworkStatus.test.tsx` — NetworkDetector hook tests.
- (NEW) `tests/integration/local-remote-sync.integration.test.ts` — integration tests for offline/online transitions and sync.
- (NEW) `tests/integration/combat-session-ejection.integration.test.ts` — tests for combat session ejection on end.

**Production Code (implementation):**
- (NEW) `lib/sync/LocalStore.ts` — localStorage abstraction with versioning.
- (NEW) `lib/sync/SyncQueue.ts` — pending sync operations queue.
- (NEW) `lib/sync/NetworkDetector.ts` — network online/offline detection hook.
- (NEW) `lib/sync/SyncService.ts` — background sync service.
- (NEW) `lib/sync/SyncTriggers.ts` — visibility + timer sync triggers.
- (NEW) `lib/sync/mergeLocalAndRemote.ts` — deduplication and merge utility.
- Updated: `app/api/encounters/route.ts` — add local-first logic to GET/POST/PUT/DELETE.
- Updated: `app/api/parties/route.ts` — add local-first logic to GET/POST/PUT/DELETE.
- Updated: `app/api/characters/route.ts` — add local-first logic to GET/POST/PUT/DELETE.
- Updated: `app/api/combat/route.ts` — add local-first logic to GET/POST/PUT.
- Updated: `app/combat/page.tsx` — eject combat state on end combat button.
- Updated: `app/layout.tsx` — initialize SyncService on app mount.
- Updated: `lib/clientStorage.ts` — integrate with new LocalStore (backward-compatible wrapper); implement `migrateOldFormat()` to detect and transform old `sessionData` key.

**Documentation & Config:**
- Updated: `README.md` — add "Offline Support" section with storage details (localStorage ~10MB limit), sync interval config, and limitations (LWW conflict resolution, soft-delete behavior).
- Updated: `.env.local.example` — add `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL=30` (0 = on-demand only).
- (NEW) `docs/OFFLINE_MODE.md` — detailed guide on offline architecture, storage schema (`sessionCombat:v1:*` keys), soft-delete and sync lifecycle, conflict resolution (LWW + logging), troubleshooting, and browser storage limits.

---

### 8) Test Plan

**Parameterized Test Strategy:**

- **Data providers** (complex objects/domain-specific fixtures):
  - `tests/unit/data/local-store-test-cases.json` — Encounter, Party, Character, CombatState with various edge cases (empty name, Unicode, large payloads).
  - `tests/unit/data/sync-queue-test-cases.json` — SyncOperations (POST/PUT/DELETE) with retry scenarios and backoff expectations.
  - Provider classes: `LocalStoreTestDataProvider.ts` and `SyncQueueTestDataProvider.ts` for generating test fixtures.

**Test Coverage by Category:**

| Category | Approach | Source |
|----------|----------|--------|
| **Happy paths (LocalStore)** | Parameterized: valid save/load/delete for each entity type. | `local-store-test-cases.json` |
| **Happy paths (SyncQueue)** | Parameterized: enqueue/dequeue/markSuccess for POST/PUT/DELETE ops. | `sync-queue-test-cases.json` |
| **Happy paths (NetworkDetector)** | Parameterized: online → offline → online transitions. | Mocked window events |
| **Edge cases (LocalStore)** | Parameterized: quota exceeded, parse error, missing key, migration from old format. | `local-store-test-cases.json` |
| **Edge cases (SyncQueue)** | Parameterized: retry backoff, max retries (capped at 30s), queue overflow. | `sync-queue-test-cases.json` |
| **Error handling** | Unit: localStorage unavailable, network timeout, 500 response. | Mocked fetch/localStorage |
| **Integration: Offline → Online** | Integration: create data offline, go online, verify sync completes. | TestContainers + Next.js |
| **Integration: Deduplication** | Integration: local + remote same id, verify merge (not duplicate). | TestContainers + Next.js |
| **Backward compat (flag OFF)** | Integration: when flag is OFF, verify remote-first behavior (no local caching). | TestContainers + Next.js |
| **Contract (API responses)** | Integration: verify API responses include optional new fields and remain backward-compatible. | TestContainers + Next.js |
| **Performance (optional)** | Benchmark: queue processing time with 100 pending ops; should complete in <5s. | Jest benchmark |
| **Security** | Unit: verify no sensitive data (tokens, passwords) stored in localStorage. | Code review + grep |
| **Manual QA checklist** | N/A (handled by E2E) | — |

---

### 9) Rollout & Monitoring Plan

**Feature Flag(s) & Default State:**
- `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` (environment variable, default: 30 seconds)
  - Controls sync retry interval when online.
  - No global on/off flag; offline-first is always enabled (app is in alpha).

**Deployment Steps (Progressive Enable):**
1. Deploy with default sync interval (30s). Verify app works with local-first behavior.
2. In staging: run full test suite, manual QA (offline/online transitions).
3. In production: deploy; monitor for 24 hours.
4. If stable, consider adjusting sync interval based on UX feedback.

**Dashboards & Key Metrics:**
- localStorage quota usage (gauge): `navigator.storage.estimate()`.
- Sync queue depth (gauge): number of pending operations.
- Sync success rate (counter): successfully synced ops / total queued.
- Sync failure rate (counter): failed ops (after max retries).
- Offline duration (histogram): time spent in offline state per session.
- API response time (histogram): compare remote-only vs. local-first latency.

**Alerts (Conditions + Thresholds):**
- `offline.sync_queue_depth > 100` (warning): "Sync queue has >100 pending ops; user may be offline for extended period."
- `offline.sync_failure_rate > 10%` (critical): "Sync failures exceed 10%; possible server issue or widespread network instability."
- `offline.local_storage_usage > 90%` (warning): "localStorage is >90% full; user may lose data."

**Success Metrics / KPIs:**
- Sync queue clears within 60s of network recovery (P95).
- No data loss in offline scenarios (tested via integration tests).
- API response time with flag ON is within 5% of flag OFF (acceptable cache overhead).
- Zero increase in bug reports related to data loss or duplication.

**Rollback Procedure:**
1. **If critical issue**: set `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` to a very large value (e.g., 3600) to effectively disable syncing, deploy hotfix.
2. **Data cleanup**: if duplicates or corrupted localStorage detected, provide admin script to clear `sessionCombat:v1:*` keys (documented in `OFFLINE_MODE.md`).
3. **Communication**: notify users of rollback and any manual cleanup steps.
4. **Post-mortem**: log issue and prioritize fix for next iteration.

---

### 10) Handoff Package

- **GitHub Issue:** https://github.com/dougis-org/session-combat/issues/36
- **Branch:** `feature/36-local-first-offline-sync`
- **Plan File:** [docs/plan/tickets/36-plan.md](docs/plan/tickets/36-plan.md)
- **Key Commands:**
  ```bash
  # Build & test
  npm run build
  npm run test:integration
  npm run test:e2e
  npm run lint
  
  # Local testing (simulate offline)
  # 1. Open DevTools Network tab, select "Offline"
  # 2. Create encounter (verify saved to localStorage)
  # 3. Go online, verify sync completes
  # 4. End combat session, verify ejected from localStorage
  
  # Verify offline-first behavior
  NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL=30 npm run dev
  ```
- **Known Gotchas / Watchpoints:**
  - localStorage is cleared by user (e.g., "Clear Browsing Data"); app shows "No local data available and offline" on next load. Expected behavior.
  - Safari has a 5MB localStorage limit (vs. 10MB on Chrome); document this in README.
  - SyncQueue may not process if user closes browser immediately after a write; data is safe in localStorage, will sync on next open.
  - Conflict resolution is LWW; if user edits in two tabs, last-modified timestamp wins (not necessarily the last action).

---

### 11) Traceability Map

| AC # | Requirement | Milestone | Task(s) | Config | Test(s) |
|------|-------------|-----------|---------|---------|----------|
| 1 | Persist encounters/parties/characters/combat to localStorage (soft-delete flag) | NA | Impl LocalStore, update API routes, soft-delete lifecycle | `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` | Unit: LocalStore, Integration: API write + delete |
| 2 | GET routes return merged local+remote (local precedence) | NA | Impl merge utility, update API GET routes | `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` | Integration: local-remote merge |
| 3 | POST/PUT routes optimistic write + sync queue | NA | Impl SyncQueue, update API POST/PUT routes | `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` | Unit: SyncQueue, Integration: optimistic write |
| 4 | Sync service retries with exponential backoff (capped 30s) | NA | Impl SyncService, SyncQueue backoff logic | `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` | Unit: backoff timing, Integration: retry behavior |
| 5 | Conflict resolution (LWW by timestamp), log and notify user | NA | Impl `_lastModified` comparison, add logging + toast | N/A | Unit: LWW logic, Integration: conflict scenario |
| 6 | Combat session ejected from localStorage on "End Combat" | NA | Update app/combat/page.tsx, call deleteEntity() | N/A | Integration: combat ejection test |
| 7 | E2E tests pass; new integration tests validate sync, conflicts, migration | NA | Write parameterized tests (JSON data sources) | N/A | E2E: existing, Integration: new (7 test files) |
| 8 | API backward-compatible; old `sessionData` key migrated | NA | Verify response schema, implement migration in clientStorage | N/A | Integration: API contract + migration |

**Note:** Monster catalog caching (IndexedDB, user profile opt-in) deferred to future ticket.

---

**Plan created by planning agent on 2026-01-02 for issue #36.**
