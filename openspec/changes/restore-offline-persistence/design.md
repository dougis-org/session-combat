## Context

The app already uses `localStorage` via `lib/clientStorage.ts` (single `sessionData` key) and partially via `lib/hooks/useAuth.ts`. PR #37 introduced a more principled offline-first layer — `LocalStore`, `SyncQueue`, `NetworkDetector` — but those classes are absent from the current codebase. Logout (`lib/hooks/useAuth.ts:128-130`) compensates with a raw prefix scan over all `sessionCombat:v1:*` keys. This couples the logout path to storage key internals rather than library contracts.

The prefix `sessionCombat:v1:` is already embedded in `useAuth.ts` as `SESSION_COMBAT_PREFIX`. Any new library classes must use this same prefix to ensure the raw cleanup would catch them even if called before migration is complete.

## Goals / Non-Goals

**Goals:**
- Restore `LocalStore` — owns all `sessionCombat:v1:` prefixed keys; exposes typed CRUD + `clear()`
- Restore `SyncQueue` — queues outbound MongoDB operations; exposes `clear()`
- Restore `NetworkDetector` + `useNetworkStatus` hook
- Replace the raw prefix loop in logout with `LocalStore.clear()` and `SyncQueue.clear()`
- Gate offline-mode behaviour behind `NEXT_PUBLIC_OFFLINE_MODE_ENABLED` env flag
- Comprehensive tests for all three classes

**Non-Goals:**
- Migrating existing `clientStorage` users to `LocalStore` (separate concern)
- Full conflict-resolution strategy beyond Last-Write-Wins
- Service Worker / background sync (future enhancement)
- Fully offline auth (authentication still requires network)

## Decisions

### D1: Storage key schema — `sessionCombat:v1:<entity>`

Use `sessionCombat:v1:` as the namespace prefix (already established in the codebase).

Entity sub-keys:
- `sessionCombat:v1:encounters`
- `sessionCombat:v1:parties`
- `sessionCombat:v1:combat`
- `sessionCombat:v1:monsters` (opt-in)
- `sessionCombat:v1:syncQueue`

`LocalStore.clear()` deletes all keys matching the prefix. `SyncQueue.clear()` deletes its own key only. This lets each class be independently responsible.

**Alternative considered**: separate prefix per class (e.g. `sc:sync:`). Rejected — a shared prefix makes single-pass cleanup trivial and the key schema was already established.

### D2: `LocalStore` as a typed, versioned wrapper

`LocalStore` is a singleton-style class (or plain module) with:
- `get<T>(entity: string): T | null`
- `set<T>(entity: string, value: T): void`
- `remove(entity: string): void`
- `clear(): void` — removes **all** `sessionCombat:v1:*` keys

Version stamping: each stored value is wrapped as `{ v: 1, data: T, updatedAt: ISO }` to enable future schema migrations.

**Alternative considered**: storing raw values without wrapper. Rejected — version metadata is cheap and avoids needing a migration flag later.

### D3: `SyncQueue` — array-based queue, exponential backoff

`SyncQueue` stores an array of pending operations in `sessionCombat:v1:syncQueue`. Each entry: `{ id, entity, action, payload, createdAt, attempts, nextRetryAt }`.

Backoff: `Math.min(1000 * 2^attempts, 30_000)` ms (1 s → 2 s → 4 s → … → 30 s cap).

`SyncQueue.clear()` removes the queue key entirely.

**Alternative considered**: IndexedDB for the queue (more capacity, transactional). Rejected — localStorage is sufficient for the queue sizes expected; IndexedDB adds complexity and async surface area.

### D4: `NetworkDetector` — navigator.onLine + event listeners

`NetworkDetector` wraps `navigator.onLine` and registers `window` `online`/`offline` events. The `useNetworkStatus()` React hook subscribes to changes.

**Alternative considered**: polling a health endpoint. Rejected — browser events are sufficient for the UX goal (show offline banner, pause sync); endpoint polling is higher cost and introduces latency.

### D5: Logout integration — replace raw prefix loop

In `lib/hooks/useAuth.ts`, replace the raw `Object.keys(localStorage).filter(…)` block with:

```ts
LocalStore.clear();
SyncQueue.clear();
```

The `SESSION_COMBAT_PREFIX` constant and raw loop are removed once the library classes are confirmed to cover all keys.

### D6: Feature flag

`NEXT_PUBLIC_OFFLINE_MODE_ENABLED=true` gates whether the app layer routes reads/writes through `LocalStore`. The flag is evaluated as:

```ts
const offlineModeEnabled = process.env.NEXT_PUBLIC_OFFLINE_MODE_ENABLED === 'true';
```

Any value other than the string `'true'` — including `undefined` (flag absent), `''`, `'false'` — resolves to `false`. This means the flag is **safe to omit**: the app behaves identically whether the variable is absent or explicitly set to `false`. The classes still exist and `clear()` is always safe to call — it simply finds no keys to delete when the flag is off.

## Risks / Trade-offs

- **localStorage quota (5 MB)**: Monster catalog caching is opt-in precisely because the catalog can be large. `LocalStore.set()` should catch `QuotaExceededError` and surface it to the caller rather than swallowing it.
  → Mitigation: wrap all `localStorage.setItem` calls in try/catch; throw a typed `StorageQuotaError`.

- **SSR / Next.js server context**: `localStorage` is not available server-side. All three classes must guard with `typeof window !== 'undefined'`.
  → Mitigation: early-return / no-op on the server; `useNetworkStatus` returns `true` (assumed online) during SSR.

- **Stale queue on tab refresh**: If the user refreshes mid-sync, queued items survive in localStorage and resume on next load. This is the desired behaviour but could cause duplicate writes if the server already processed a request.
  → Mitigation: server-side idempotency keys (future work); for now, document as a known limitation.

## Migration Plan

1. Add `lib/offline/LocalStore.ts`, `SyncQueue.ts`, `NetworkDetector.ts`, `index.ts`
2. Add unit + integration tests
3. Update `lib/hooks/useAuth.ts` logout to call `LocalStore.clear(); SyncQueue.clear()`
4. Remove the raw prefix loop and `SESSION_COMBAT_PREFIX` constant from `useAuth.ts`
5. Add `NEXT_PUBLIC_OFFLINE_MODE_ENABLED=false` to `.env.example`
6. Rollback: revert steps 3-4; the raw loop can be restored trivially since it is self-contained

## Open Questions

~~Should `LocalStore.clear()` also remove the legacy `sessionData` key owned by `clientStorage`?~~
**Resolved**: All local data is cleared on logout. Logout orchestrates the full cleanup sequence: `LocalStore.clear()` → `SyncQueue.clear()` → `clientStorage.clear()`. `LocalStore` itself remains focused on `sessionCombat:v1:*` keys (single responsibility); the logout handler is the coordinator.

~~Should `SyncQueue` auto-flush on `online` event without explicit app-layer coordination?~~
**Resolved**: Yes — `SyncQueue` subscribes to `NetworkDetector` internally and triggers a flush attempt whenever the browser comes back online. No app-layer wiring required beyond initialisation.
