const SESSION_COMBAT_PREFIX = "sessionCombat:v1:";
const STORAGE_VERSION = 1;

interface VersionEnvelope<T> {
  v: number;
  data: T;
  updatedAt: string;
}

export class StorageQuotaError extends Error {
  constructor(message = "Storage quota exceeded") {
    super(message);
    this.name = "StorageQuotaError";
  }
}

const isBrowser = (): boolean => typeof window !== "undefined";

const getKey = (entity: string): string => `${SESSION_COMBAT_PREFIX}${entity}`;

const isQuotaExceeded = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
};

export const LocalStore = {
  get<T>(entity: string): T | null {
    if (!isBrowser()) {
      return null;
    }

    const raw = localStorage.getItem(getKey(entity));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as VersionEnvelope<T>;
      if (!parsed || parsed.v !== STORAGE_VERSION) {
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  },

  set<T>(entity: string, value: T): void {
    if (!isBrowser()) {
      return;
    }

    const payload: VersionEnvelope<T> = {
      v: STORAGE_VERSION,
      data: value,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(getKey(entity), JSON.stringify(payload));
    } catch (error) {
      if (isQuotaExceeded(error)) {
        throw new StorageQuotaError();
      }
      throw error;
    }
  },

  remove(entity: string): void {
    if (!isBrowser()) {
      return;
    }

    localStorage.removeItem(getKey(entity));
  },

  clear(): void {
    if (!isBrowser()) {
      return;
    }

    Object.keys(localStorage)
      .filter((key) => key.startsWith(SESSION_COMBAT_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  },
};

export { SESSION_COMBAT_PREFIX };
