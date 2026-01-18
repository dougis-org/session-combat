/**
 * Utility for merging local and remote data
 * 
 * Deduplicates entries and applies Last-Write-Wins (LWW) strategy
 * based on _lastModified timestamps.
 */

export interface Mergeable {
  id?: string;
  _id?: string;
  _lastModified?: number;
  _deleted?: boolean;
  [key: string]: any;
}

/**
 * Merge local and remote data with deduplication
 * Local data takes precedence by default.
 */
export function mergeLocalAndRemote<T extends Mergeable>(
  local: T[],
  remote: T[],
  options?: {
    useLWW?: boolean; // Use Last-Write-Wins strategy
    excludeDeleted?: boolean; // Exclude soft-deleted items
  }
): T[] {
  const { useLWW = true, excludeDeleted = true } = options || {};

  // Create map for deduplication and conflict resolution
  const merged = new Map<string, T>();

  // Process local items first
  for (const item of local) {
    if (excludeDeleted && item._deleted) {
      continue;
    }
    const id = item.id || item._id;
    if (id) {
      merged.set(id, item);
    }
  }

  // Process remote items
  for (const item of remote) {
    if (excludeDeleted && item._deleted) {
      continue;
    }
    const id = item.id || item._id;
    if (id) {
      const existing = merged.get(id);
      if (!existing) {
        // New remote item
        merged.set(id, item);
      } else if (useLWW) {
        // Apply Last-Write-Wins: use item with later _lastModified
        const existingTime = existing._lastModified || 0;
        const itemTime = item._lastModified || 0;
        if (itemTime > existingTime) {
          merged.set(id, item);
        }
      }
      // Otherwise, local item wins (no action needed)
    }
  }

  return Array.from(merged.values());
}

/**
 * Deduplicate array of items by id, keeping first occurrence
 */
export function deduplicateById<T extends Mergeable>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const id = item.id || item._id;
    if (id && seen.has(id)) {
      return false;
    }
    if (id) {
      seen.add(id);
    }
    return true;
  });
}

/**
 * Filter out soft-deleted items
 */
export function filterDeleted<T extends Mergeable>(items: T[]): T[] {
  return items.filter(item => !item._deleted);
}
