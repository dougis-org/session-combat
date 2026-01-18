# Offline Mode - Architecture & Guide

## Overview

The Session Combat application now supports offline-first persistence. Users can:
- Create and manage encounters, parties, and characters without internet connectivity
- Continue active combat sessions while offline
- Automatically sync changes to MongoDB when connectivity is restored

## Architecture

### Local Storage Schema

All offline data is stored in browser `localStorage` under the `sessionCombat:v1` namespace:

```
sessionCombat:v1:encounters:<uuid>
sessionCombat:v1:parties:<uuid>
sessionCombat:v1:characters:<uuid>
sessionCombat:v1:combatState:<userId>
sessionCombat:v1:syncQueue        [Array of pending operations]
sessionCombat:v1:config           [Configuration]
```

Each entity includes:
- `_version`: Incrementing version number
- `_lastModified`: Timestamp of last modification
- `_deleted`: Soft-delete flag (for deletion sync)
- `_syncId`: Sync operation ID (for tracking)

### Data Flow

**Creating/Updating Data (Offline):**
1. Write optimistically to localStorage
2. Queue sync operation to `syncQueue`
3. Return success immediately

**Reading Data:**
1. Load from localStorage (if available)
2. If online: fetch remote data
3. Merge with local (local takes precedence by default)
4. Return merged result

**Syncing to Remote:**
1. Process queue every 30s (or when online detected)
2. Send each operation to corresponding API endpoint
3. Retry with exponential backoff (1s, 2s, 4s, ... capped at 30s)
4. Remove operation from queue on success

### Conflict Resolution

**Last-Write-Wins (LWW):**
- If same entity exists locally and remotely, the one with later `_lastModified` wins
- Default: local changes take precedence for immediate availability

**Future Enhancements:**
- Three-way merge for collaborative editing
- User-selectable merge strategies

## Configuration

### Environment Variables

```bash
# Enable offline mode (default: true)
NEXT_PUBLIC_OFFLINE_MODE_ENABLED=true

# Sync interval in milliseconds (default: 30000 = 30 seconds)
NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL=30000
```

### Monster Catalog Caching

Users can opt-in to cache the full SRD monster catalog:
1. In user profile settings, toggle "Cache Monster Catalog"
2. Catalog downloads to IndexedDB for offline reference
3. Takes ~2-5 MB of IndexedDB storage
4. Defaults to OFF (per-user opt-in required)

## Storage Limits

### Browser Limits

- **Chrome/Firefox**: ~10 MB per origin
- **Safari**: ~5 MB per origin
- **Edge**: ~10 MB per origin

### Application Limits

- **Sync queue max size**: ~1000 operations
- **Encounter/party/character storage**: Limited by quota
- **Combat state**: 1 per user (auto-replaced)

### Quota Management

If storage quota is exceeded:
1. App logs warning: "Local storage quota exceeded"
2. Sync queue may drop oldest operations (logged)
3. User can:
   - Delete old encounters/parties to free space
   - Clear all offline data (available in settings)
   - Wait for pending syncs to complete

## Troubleshooting

### "Sync queue is full"

**Cause:** Extended offline period with many local changes
**Solution:**
1. Wait for network to stabilize
2. Check browser DevTools Console for errors
3. Manually increase `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` (e.g., to 60s)
4. Clear old offline data if needed

### "No local data available and offline"

**Cause:** Attempting to access data while offline and no local cache exists
**Solution:**
1. Go online and refresh page (data will load)
2. Or start with online connectivity to ensure local cache exists

### Data appears different in two tabs

**Cause:** Last-Write-Wins conflict resolution
**Solution:** This is expected. The version with the later `_lastModified` timestamp wins. Refresh both tabs to resync.

### Storage quota exceeded

**Cause:** Too many offline changes queued or large entities stored
**Solution:**
1. Check sync queue status (DevTools → Application → localStorage)
2. Ensure network is working (`NEXT_PUBLIC_OFFLINE_MODE_ENABLED=true`)
3. Reduce frequency of local changes or delete old data
4. Contact support if issue persists

## Observability

### Console Logs

Enable debug logs by setting localStorage:
```javascript
localStorage.setItem('debug', 'session-combat:*');
```

Logs include:
- `[LocalStore]`: Entity save/load/delete operations
- `[SyncQueue]`: Queue enqueue/dequeue/retry events
- `[SyncService]`: Sync service lifecycle
- `[NetworkDetector]`: Online/offline transitions

### Monitoring Metrics

If integrated with analytics:
- `offline.pending_writes_count`: Gauge of queued operations
- `offline.sync_success_count`: Counter of successful syncs
- `offline.sync_failure_count`: Counter of failed syncs (after max retries)
- `offline.local_storage_usage`: Percentage of quota used

### Alerts

Investigate if:
- Sync queue depth > 100 operations
- Sync failure rate > 10%
- localStorage usage > 90% of quota

## Best Practices

1. **Always go online before critical operations**: Login, account updates, etc.
2. **Sync important changes before closing browser**: Close apps/tabs carefully when offline
3. **Monitor storage quota**: Regularly check settings → offline data size
4. **Use feature flag judiciously**: Offline mode is always on (alpha stage); future versions may add user toggle
5. **Expect eventual consistency**: Don't assume remote updates immediately; they queue for sync

## Future Enhancements

- [ ] User toggle for offline mode (currently always on for alpha)
- [ ] Manual "Sync Now" button with status indicator
- [ ] Conflict resolution UI for LWW collisions
- [ ] Scheduled archival of old encounters/parties
- [ ] Export/import offline data
- [ ] Service Worker for advanced caching
- [ ] IndexedDB for large monster catalog

---

**Last updated:** 2026-01-07
