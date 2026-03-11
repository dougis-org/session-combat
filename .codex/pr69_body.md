## Purpose
Address unresolved review threads left on merged PR #68.

## Changes
- align jest-environment-jsdom with Jest 29 (`^29.7.0`)
- make logout client-side cleanup always run in `finally`, even if API logout fails
- make logout cleanup best-effort per step so one failure does not block remaining cleanup
- deduplicate failed-operation retry update logic in `SyncQueue`
- remove `useNetworkStatus` re-export from `lib/offline/index.ts` to reduce coupling
- add integration test coverage for logout-on-network-failure and partial cleanup-failure behavior

## Validation
- pre-commit build passed
- pre-commit integration tests passed (62 tests)
