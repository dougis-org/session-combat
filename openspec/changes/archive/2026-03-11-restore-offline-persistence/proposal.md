## Why

The offline-first persistence layer (LocalStore / SyncQueue) introduced in PR #37 needs to be restored and hardened: logout currently performs raw `localStorage` prefix cleanup as a defensive workaround (GH-43) because the library classes do not expose stable `clear()` APIs. Restoring and stabilising these classes will let logout (and future consumers) call clean library methods instead of coupling to storage key internals.

## What Changes

- Restore `LocalStore` — versioned `localStorage` wrapper with CRUD operations and a stable `clear()` method
- Restore `SyncQueue` — outbound operation queue with exponential-backoff retry (1 s → 30 s) and a stable `clear()` method
- Restore `NetworkDetector` — browser online/offline detection with a React hook (`useNetworkStatus`)
- Wire logout to call `LocalStore.clear()` and `SyncQueue.clear()` instead of raw prefix cleanup
- Opt-in feature flag: `NEXT_PUBLIC_OFFLINE_MODE_ENABLED` for backward compatibility
- Encounters, parties, and combat sessions read/write through `LocalStore` when the flag is enabled; changes are queued to MongoDB sync via `SyncQueue` when online
- Monster catalog cached in `LocalStore` only when the user explicitly consents

## Capabilities

### New Capabilities

- `offline-persistence`: Versioned `localStorage` wrapper (LocalStore) with full CRUD and `clear()`, covering encounters, parties, combat sessions, and optional monster catalog caching
- `sync-queue`: Outbound sync queue (SyncQueue) with exponential-backoff retry and `clear()`, responsible for pushing local changes to MongoDB when connectivity is restored
- `network-detector`: Online/offline detection utility and `useNetworkStatus` React hook

### Modified Capabilities

- `test-environment-setup`: Tests for the new library classes must integrate with the existing shared integration bootstrap and env-aware test patterns

## Impact

- **New files**: `src/lib/offline/LocalStore.ts`, `src/lib/offline/SyncQueue.ts`, `src/lib/offline/NetworkDetector.ts`, `src/lib/offline/index.ts`
- **Modified**: logout handler (wires `clear()` calls), encounter/party/combat service layer (reads/writes via LocalStore when flag enabled)
- **Tests**: unit tests for LocalStore, SyncQueue, NetworkDetector; integration tests for sync flow; regression test confirming logout clears storage correctly
- **Env**: `NEXT_PUBLIC_OFFLINE_MODE_ENABLED` feature flag added to `.env.example`
- **No breaking changes** — flag defaults to disabled when absent; the app behaves identically whether the variable is missing or set to `false`
