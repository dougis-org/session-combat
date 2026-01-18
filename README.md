# Session Combat

An offline-first combat simulator for D&D and tabletop RPGs.

## Features

- **Offline-First**: Create encounters, manage parties, and conduct combat without internet
- **Automatic Sync**: Changes automatically sync to remote database when online
- **Optimistic UI**: Immediate feedback on user actions
- **Conflict-Free**: Last-Write-Wins strategy for seamless merging
- **Local Storage**: Encounters, parties, and characters persist locally

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Offline Support

The app supports offline-first persistence:

- **localStorage**: User-created entities (encounters, parties, characters) persist locally
- **IndexedDB** (optional): Monster catalog available with opt-in user setting
- **Sync Queue**: Pending changes queue and sync automatically when online
- **Merge Strategy**: Local data takes precedence (Last-Write-Wins by timestamp)

For detailed architecture and troubleshooting, see [docs/OFFLINE_MODE.md](docs/OFFLINE_MODE.md).

### Configuration

```bash
# Enable offline mode (default: true)
NEXT_PUBLIC_OFFLINE_MODE_ENABLED=true

# Sync interval in milliseconds (default: 30 seconds)
NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL=30000
```

### Storage Limits

- **Browser quota**: 5-10 MB per origin
- **Sync queue**: ~1000 pending operations
- **Monster catalog**: Optional, ~2-5 MB with opt-in

## Testing

```bash
npm run test               # Unit tests
npm run test:integration  # Integration tests
npm run test:watch       # Watch mode
```

## Building

```bash
npm run build
npm start
```

## Architecture

### Modules

- `lib/sync/LocalStore.ts`: Versioned localStorage abstraction
- `lib/sync/SyncQueue.ts`: Pending operations queue
- `lib/sync/NetworkDetector.ts`: Online/offline status hook
- `lib/sync/SyncService.ts`: Background sync service
- `lib/sync/SyncTriggers.ts`: Page visibility & timer triggers
- `lib/sync/mergeLocalAndRemote.ts`: Data merge utility
- `app/api/*`: API routes with offline-first logic
- `app/combat/`: Combat page with session ejection

### Data Flow

1. User creates/updates entity → saved to localStorage + queued
2. Immediate feedback to user
3. Sync service processes queue when online (every 30s)
4. Remote database updated on sync success
5. Automatic retry with exponential backoff on network errors

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
