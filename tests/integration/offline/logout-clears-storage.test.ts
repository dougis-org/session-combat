/** @jest-environment jsdom */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { LocalStore, SESSION_COMBAT_PREFIX } from "@/lib/offline/LocalStore";
import { SyncQueue } from "@/lib/offline/SyncQueue";
import { clientStorage } from "@/lib/clientStorage";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe("logout clears storage integration", () => {
  let container: HTMLDivElement;
  let root: Root;
  let logoutFn: (() => Promise<void>) | null = null;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    replaceMock.mockReset();

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/auth/logout")) {
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      return {
        ok: false,
        json: async () => ({}),
      } as Response;
    }) as typeof fetch;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.restoreAllMocks();
  });

  test("logout removes sessionCombat:v1:* keys and sessionData but keeps unrelated keys", async () => {
    function Harness() {
      const auth = useAuth();
      React.useEffect(() => {
        logoutFn = auth.logout;
      }, [auth.logout]);
      return null;
    }

    await act(async () => {
      root.render(React.createElement(Harness));
    });

    LocalStore.set("encounters", [{ id: "enc-1" }]);
    SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });
    clientStorage.saveEncounters([]);
    localStorage.setItem("unrelated", "keep-me");

    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}encounters`),
    ).not.toBeNull();
    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}syncQueue`),
    ).not.toBeNull();
    expect(localStorage.getItem("sessionData")).not.toBeNull();

    await act(async () => {
      await logoutFn?.();
    });

    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}encounters`),
    ).toBeNull();
    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}syncQueue`),
    ).toBeNull();
    expect(localStorage.getItem("sessionData")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep-me");
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  test("logout still clears client-side data when API logout request fails", async () => {
    function Harness() {
      const auth = useAuth();
      React.useEffect(() => {
        logoutFn = auth.logout;
      }, [auth.logout]);
      return null;
    }

    global.fetch = jest.fn(async () => {
      throw new Error("network down");
    }) as typeof fetch;

    await act(async () => {
      root.render(React.createElement(Harness));
    });

    LocalStore.set("encounters", [{ id: "enc-1" }]);
    SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });
    clientStorage.saveEncounters([]);

    await act(async () => {
      await logoutFn?.();
    });

    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}encounters`),
    ).toBeNull();
    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}syncQueue`),
    ).toBeNull();
    expect(localStorage.getItem("sessionData")).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  test("logout runs remaining cleanup steps when one cleanup step throws", async () => {
    function Harness() {
      const auth = useAuth();
      React.useEffect(() => {
        logoutFn = auth.logout;
      }, [auth.logout]);
      return null;
    }

    await act(async () => {
      root.render(React.createElement(Harness));
    });

    LocalStore.set("encounters", [{ id: "enc-1" }]);
    SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });
    clientStorage.saveEncounters([]);

    jest.spyOn(LocalStore, "clear").mockImplementation(() => {
      throw new Error("LocalStore clear failed");
    });

    await act(async () => {
      await logoutFn?.();
    });

    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}encounters`),
    ).not.toBeNull();
    expect(
      localStorage.getItem(`${SESSION_COMBAT_PREFIX}syncQueue`),
    ).toBeNull();
    expect(localStorage.getItem("sessionData")).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
