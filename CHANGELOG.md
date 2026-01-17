# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-01-07

### Added

- **Offline-First Persistence** (#36)
  - Local storage for encounters, parties, characters, and combat state
  - Sync queue with exponential backoff retry
  - Last-Write-Wins conflict resolution
  - Network online/offline detection
  - Automatic sync on network recovery
  - Combat session ejection on "End Combat"
  - Optional monster catalog caching (per-user opt-in)

- **Core Modules**
  - `LocalStore`: Versioned localStorage abstraction
  - `SyncQueue`: Pending operations queue with persistence
  - `NetworkDetector`: Online/offline status hook
  - `SyncService`: Background sync service
  - `SyncTriggers`: Page visibility and timer-based sync triggers
  - `mergeLocalAndRemote`: Data merge utility with deduplication

- **API Routes**
  - `/api/encounters`: Offline-first CRUD
  - `/api/parties`: Offline-first CRUD
  - `/api/characters`: Offline-first CRUD
  - `/api/combat`: Offline-first CRUD

- **Documentation**
  - `OFFLINE_MODE.md`: Architecture, configuration, troubleshooting
  - `README.md`: Feature overview and setup
  - `.env.local.example`: Configuration template

- **Testing**
  - Unit tests for `LocalStore`, `SyncQueue`, `useNetworkStatus`
  - Integration tests for offline/online transitions
  - Combat session ejection tests
  - Parameterized test data

### Configuration

- `NEXT_PUBLIC_OFFLINE_MODE_ENABLED`: Enable/disable offline mode (default: true)
- `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL`: Sync interval in ms (default: 30000)

### Technical Details

- No breaking changes to existing APIs
- Backward-compatible response format
- Storage quota warnings and management
- Comprehensive logging for debugging
- LocalStore quota exceeded error handling
- Sync queue size limit (~1000 operations)

---

For detailed changes and issue references, see individual pull requests.
