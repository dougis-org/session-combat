type NetworkListener = (isOnline: boolean) => void;

const listeners = new Set<NetworkListener>();
let isInitialized = false;

const isBrowser = (): boolean => typeof window !== "undefined";

const notify = (status: boolean): void => {
  listeners.forEach((listener) => listener(status));
};

const init = (): void => {
  if (!isBrowser() || isInitialized) {
    return;
  }

  window.addEventListener("online", () => notify(true));
  window.addEventListener("offline", () => notify(false));
  isInitialized = true;
};

export const NetworkDetector = {
  isOnline(): boolean {
    if (!isBrowser()) {
      return true;
    }

    return navigator.onLine;
  },

  subscribe(listener: NetworkListener): () => void {
    if (!isBrowser()) {
      return () => undefined;
    }

    init();
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export type { NetworkListener };
