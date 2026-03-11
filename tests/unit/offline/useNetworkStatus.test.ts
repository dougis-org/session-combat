/** @jest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

describe("useNetworkStatus", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("initializes with current status and updates on event", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });

    const seen: boolean[] = [];

    function Probe() {
      const online = useNetworkStatus();
      React.useEffect(() => {
        seen.push(online);
      }, [online]);
      return null;
    }

    act(() => {
      root.render(React.createElement(Probe));
    });

    expect(seen[seen.length - 1]).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(seen[seen.length - 1]).toBe(false);
  });

  test("cleans up on unmount", () => {
    const seen: boolean[] = [];

    function Probe() {
      const online = useNetworkStatus();
      React.useEffect(() => {
        seen.push(online);
      }, [online]);
      return null;
    }

    act(() => {
      root.render(React.createElement(Probe));
    });

    const countBeforeUnmount = seen.length;

    act(() => {
      root.unmount();
    });

    act(() => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    });

    expect(seen.length).toBe(countBeforeUnmount);
  });
});
