/** @jest-environment jsdom */

import { NetworkDetector } from "@/lib/offline/NetworkDetector";

describe("NetworkDetector", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("isOnline() returns navigator.onLine value", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      configurable: true,
    });
    expect(NetworkDetector.isOnline()).toBe(false);

    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });
    expect(NetworkDetector.isOnline()).toBe(true);
  });

  test("subscribe() listener fires with false on offline event", () => {
    const listener = jest.fn();
    const unsubscribe = NetworkDetector.subscribe(listener);

    window.dispatchEvent(new Event("offline"));

    expect(listener).toHaveBeenCalledWith(false);
    unsubscribe();
  });

  test("subscribe() listener fires with true on online event", () => {
    const listener = jest.fn();
    const unsubscribe = NetworkDetector.subscribe(listener);

    window.dispatchEvent(new Event("online"));

    expect(listener).toHaveBeenCalledWith(true);
    unsubscribe();
  });

  test("unsubscribe prevents further listener calls", () => {
    const listener = jest.fn();
    const unsubscribe = NetworkDetector.subscribe(listener);

    unsubscribe();
    window.dispatchEvent(new Event("offline"));

    expect(listener).not.toHaveBeenCalled();
  });
});
