/**
 * LocalStore - Abstraction for versioned browser localStorage
 * 
 * Provides a key-value interface for storing user-created entities
 * (encounters, parties, characters, combat state) with automatic
 * versioning and timestamping.
 */

export interface StoredEntity {
  id?: string;
  userId?: string;
  _id?: string;
  _version: number;
  _lastModified: number;
  _deleted?: boolean;
  _syncId?: string;
  [key: string]: any;
}

export class LocalStore {
  private readonly VERSION_PREFIX = 'sessionCombat:v1';
  private readonly OLD_FORMAT_KEY = 'sessionData';

  /**
   * Save or update an entity in localStorage
   */
  async saveEntity(
    type: string,
    id: string | undefined,
    data: any
  ): Promise<StoredEntity> {
    // Validation
    if (!id) {
      throw new Error(`Cannot save ${type}: id is required`);
    }

    if (!data || typeof data !== 'object') {
      throw new Error(`Cannot save ${type}: data must be an object`);
    }

    if (!data.userId) {
      throw new Error(`Cannot save ${type}: userId is required`);
    }

    // Entity name validation
    if (data.name !== undefined && data.name === '') {
      throw new Error(`Cannot save ${type}: name cannot be empty`);
    }

    const key = `${this.VERSION_PREFIX}:${type}:${id}`;

    try {
      // Load existing entity to increment version
      let storedData: StoredEntity;
      const existing = localStorage.getItem(key);

      if (existing && !JSON.parse(existing)._deleted) {
        try {
          storedData = JSON.parse(existing);
          storedData._version = (storedData._version || 0) + 1;
          // Merge new data with existing
          storedData = { ...storedData, ...data };
        } catch (e) {
          // Parse error, reset version
          storedData = {
            ...data,
            _version: 1,
            _lastModified: Date.now()
          };
        }
      } else {
        // Create new entity (either doesn't exist or was deleted)
        storedData = {
          ...data,
          _version: 1,
          _lastModified: Date.now()
        };
        // Clear _deleted flag if it exists
        delete storedData._deleted;
      }

      // Ensure _lastModified is current
      storedData._lastModified = Date.now();

      // Persist to localStorage
      localStorage.setItem(key, JSON.stringify(storedData));
      return storedData;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          console.warn('[LocalStore] Quota exceeded:', error.message);
          throw new Error('localStorage quota exceeded');
        }
      }
      throw error;
    }
  }

  /**
   * Load a single entity by id
   */
  async loadEntity(type: string, id: string): Promise<StoredEntity | null> {
    const key = `${this.VERSION_PREFIX}:${type}:${id}`;

    try {
      const data = localStorage.getItem(key);
      if (!data) {
        return null;
      }

      return JSON.parse(data) as StoredEntity;
    } catch (error) {
      console.warn(`[LocalStore] Failed to parse entity ${type}:${id}:`, error);
      return null;
    }
  }

  /**
   * Load all entities of a given type
   */
  async loadAllEntities(type: string): Promise<StoredEntity[]> {
    const prefix = `${this.VERSION_PREFIX}:${type}:`;
    const result: { [key: string]: StoredEntity } = {}; // Deduplicate by id

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            const entity = JSON.parse(data) as StoredEntity;
            // Only include non-deleted entities
            if (!entity._deleted) {
              const id = entity.id || entity._id;
              if (id) {
                result[id] = entity;
              }
            }
          }
        }
      }

      return Object.values(result);
    } catch (error) {
      console.warn(`[LocalStore] Failed to load all ${type}:`, error);
      return [];
    }
  }

  /**
   * Soft-delete an entity (mark as deleted)
   */
  async deleteEntity(type: string, id: string): Promise<StoredEntity> {
    const key = `${this.VERSION_PREFIX}:${type}:${id}`;

    try {
      const data = localStorage.getItem(key);
      if (!data) {
        throw new Error(`Entity not found: ${type}:${id}`);
      }

      const entity = JSON.parse(data) as StoredEntity;
      entity._deleted = true;
      entity._lastModified = Date.now();

      localStorage.setItem(key, JSON.stringify(entity));
      console.debug(`[LocalStore] Deleted entity: ${type}:${id}`);
      return entity;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      console.warn(`[LocalStore] Failed to delete entity ${type}:${id}:`, error);
      throw error;
    }
  }

  /**
   * Migrate from old localStorage format to new schema
   */
  async migrateOldFormat(): Promise<void> {
    const oldData = localStorage.getItem(this.OLD_FORMAT_KEY);
    if (!oldData) {
      return; // No old format data to migrate
    }

    try {
      const parsed = JSON.parse(oldData);

      // Migrate each entity type
      for (const [type, entities] of Object.entries(parsed)) {
        if (Array.isArray(entities)) {
          for (const entity of entities) {
            if (entity.id) {
              // Old format doesn't have userId, add a placeholder
              const entityWithUserId = {
                ...entity,
                userId: entity.userId || 'migrated-user'
              };
              try {
                await this.saveEntity(type, entity.id, entityWithUserId);
              } catch (error) {
                // Log but continue migrating other entities
                console.warn(`[LocalStore] Failed to migrate ${type}:${entity.id}:`, error);
              }
            }
          }
        }
      }

      // Remove old key after migration
      localStorage.removeItem(this.OLD_FORMAT_KEY);
      console.debug('[LocalStore] Migrated from old format');
    } catch (error) {
      console.warn('[LocalStore] Failed to migrate old format:', error);
    }
  }

  /**
   * Clear all sessionCombat data from localStorage
   */
  async clear(): Promise<void> {
    const prefix = `${this.VERSION_PREFIX}:`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.debug('[LocalStore] Cleared all sessionCombat data');
  }
}

// Singleton instance
let instance: LocalStore;

export function getLocalStore(): LocalStore {
  if (!instance) {
    instance = new LocalStore();
  }
  return instance;
}
