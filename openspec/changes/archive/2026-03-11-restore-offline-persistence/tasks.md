## 1. LocalStore — Core Implementation

- [x] 1.1 Create `lib/offline/LocalStore.ts` with `sessionCombat:v1:` prefix constant, `StorageQuotaError` class, and `get<T>()`, `set<T>()`, `remove()`, `clear()` functions
- [x] 1.2 Wrap all stored values in version envelope `{ v: 1, data: T, updatedAt: ISO }`
- [x] 1.3 Guard every function with `typeof window === 'undefined'` no-op for SSR
- [x] 1.4 Catch `QuotaExceededError` in `set()` and throw `StorageQuotaError`

## 2. SyncQueue — Core Implementation

- [x] 2.1 Create `lib/offline/SyncQueue.ts` with `SyncOperation` type (`id`, `entity`, `action`, `payload`, `createdAt`, `attempts`, `nextRetryAt`)
- [x] 2.2 Implement `enqueue()`, `getAll()`, `remove(id)`, and `clear()` functions using `sessionCombat:v1:syncQueue` key
- [x] 2.3 Implement `markFailed(id)` that increments `attempts` and sets `nextRetryAt` using `Math.min(1000 * 2 ** attempts, 30000)` backoff
- [x] 2.4 Implement `flush(syncFn)` that iterates `getAll()`, calls `syncFn` per operation, and removes successful entries (retries eligible ones on next flush)
- [x] 2.5 Subscribe to `NetworkDetector` on module init: call `flush()` automatically whenever the browser fires an `online` event
- [x] 2.6 Guard all functions with SSR no-op

## 3. NetworkDetector — Core Implementation

- [x] 3.1 Create `lib/offline/NetworkDetector.ts` with `isOnline()` function and `subscribe(listener)` returning an unsubscribe function
- [x] 3.2 Register `window` `online`/`offline` event listeners; call subscribers with new boolean status
- [x] 3.3 Return `true` from `isOnline()` when `typeof window === 'undefined'`
- [x] 3.4 Create `lib/hooks/useNetworkStatus.ts` React hook that initialises with `NetworkDetector.isOnline()` and updates via subscription

## 4. Barrel Export

- [x] 4.1 Create `lib/offline/index.ts` exporting `LocalStore`, `SyncQueue`, `NetworkDetector`, `useNetworkStatus`, and `StorageQuotaError`

## 5. Logout Integration

- [x] 5.1 In `lib/hooks/useAuth.ts`, import `LocalStore` and `SyncQueue` from `@/lib/offline`
- [x] 5.2 Replace the raw `Object.keys(localStorage).filter(key.startsWith(SESSION_COMBAT_PREFIX))` loop with `LocalStore.clear(); SyncQueue.clear(); clientStorage.clear()` — clearing all local data
- [x] 5.3 Remove the `SESSION_COMBAT_PREFIX` constant from `useAuth.ts` (no longer needed)

## 6. Environment Configuration

- [x] 6.1 Add `# NEXT_PUBLIC_OFFLINE_MODE_ENABLED=true` (commented out) to `.env.example` with a comment that the flag defaults to disabled when absent — only set to `true` to enable offline-first data routing
- [x] 6.2 Create `lib/offline/flags.ts` exporting `export const isOfflineModeEnabled = process.env.NEXT_PUBLIC_OFFLINE_MODE_ENABLED === 'true'` — all consumers import from here rather than reading `process.env` directly

## 7. Unit Tests — LocalStore

- [x] 7.1 Create `tests/unit/offline/LocalStore.test.ts`
- [x] 7.2 Test `set()` + `get()` round-trip
- [x] 7.3 Test `get()` returns `null` for missing entity
- [x] 7.4 Test `remove()` deletes a single entity
- [x] 7.5 Test `clear()` removes all `sessionCombat:v1:*` keys but not unrelated keys
- [x] 7.6 Test `clear()` is safe when no keys exist
- [x] 7.7 Test `StorageQuotaError` is thrown on quota exceeded (mock `localStorage.setItem`)
- [x] 7.8 Test SSR no-op — `set()` does not throw without `window`; `get()` returns `null`

## 8. Unit Tests — SyncQueue

- [x] 8.1 Create `tests/unit/offline/SyncQueue.test.ts`
- [x] 8.2 Test `enqueue()` adds an operation with `attempts: 0`
- [x] 8.3 Test queue persists to `sessionCombat:v1:syncQueue` key
- [x] 8.4 Test `markFailed()` sets `nextRetryAt` ~1000 ms out for `attempts: 0`
- [x] 8.5 Test `markFailed()` caps `nextRetryAt` at 30000 ms for high `attempts`
- [x] 8.6 Test `clear()` empties the queue
- [x] 8.7 Test `clear()` is safe when queue is empty
- [x] 8.8 Test `flush()` removes successfully synced operations and retains failed ones
- [x] 8.9 Test that an `online` browser event triggers an automatic `flush()` call
- [x] 8.10 Test SSR no-op — `enqueue()` does not throw without `window`

## 9. Unit Tests — NetworkDetector

- [x] 9.1 Create `tests/unit/offline/NetworkDetector.test.ts`
- [x] 9.2 Test `isOnline()` returns `navigator.onLine` value
- [x] 9.3 Test `isOnline()` returns `true` in SSR (no `window`)
- [x] 9.4 Test `subscribe()` listener fires with `false` on `offline` event
- [x] 9.5 Test `subscribe()` listener fires with `true` on `online` event
- [x] 9.6 Test unsubscribe function prevents further listener calls
- [x] 9.7 Create `tests/unit/offline/useNetworkStatus.test.ts` — test hook initialises with current status, updates on event, cleans up on unmount

## 10. Integration Tests — Logout Clears Storage

- [x] 10.1 Create `tests/integration/offline/logout-clears-storage.test.ts`
- [x] 10.2 Seed `LocalStore`, `SyncQueue`, and `clientStorage` with test data, invoke logout flow, assert all `sessionCombat:v1:*` keys and `sessionData` key are removed
- [x] 10.3 Assert that unrelated localStorage keys survive logout
