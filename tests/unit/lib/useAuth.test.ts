/** @jest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useAuth } from "@/lib/hooks/useAuth";

// Mock next/navigation
const mockRouterReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}));

// Mock offline storage
jest.mock("@/lib/offline", () => ({
  LocalStore: { clear: jest.fn() },
  SyncQueue: { clear: jest.fn() },
}));

jest.mock("@/lib/clientStorage", () => ({
  clientStorage: { clear: jest.fn() },
}));

type HookResult = ReturnType<typeof useAuth>;

function renderHook(): { result: { current: HookResult }; unmount: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const result: { current: HookResult } = { current: undefined as any };

  function Probe() {
    result.current = useAuth();
    return null;
  }

  act(() => {
    root.render(React.createElement(Probe));
  });

  return {
    result,
    unmount: () => {
      act(() => { root.unmount(); });
      container.remove();
    },
  };
}

describe("useAuth", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("starts with loading=true and no user", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userId: "u1", email: "u@example.com", isAdmin: false }),
    });

    const { result, unmount } = renderHook();
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await act(async () => {});
    unmount();
  });

  it("sets user after successful auth check", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userId: "u1", email: "user@example.com", isAdmin: false }),
    });

    const { result, unmount } = renderHook();
    await act(async () => {});

    expect(result.current.user?.email).toBe("user@example.com");
    expect(result.current.loading).toBe(false);
    unmount();
  });

  it("sets user to null on 401 auth check", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ authenticated: false }),
    });

    const { result, unmount } = renderHook();
    await act(async () => {});

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    unmount();
  });

  it("login returns true and sets user on success", async () => {
    (global.fetch as jest.Mock) = jest.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ authenticated: false }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userId: "u2", email: "login@example.com" }),
      });

    const { result, unmount } = renderHook();
    await act(async () => {});

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login("login@example.com", "pass");
    });

    expect(loginResult!).toBe(true);
    expect(result.current.user?.email).toBe("login@example.com");
    unmount();
  });

  it("login returns false and sets error on failure", async () => {
    (global.fetch as jest.Mock) = jest.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid credentials" }),
      });

    const { result, unmount } = renderHook();
    await act(async () => {});

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login("bad@example.com", "wrong");
    });

    expect(loginResult!).toBe(false);
    expect(result.current.error).not.toBeNull();
    unmount();
  });

  it("register returns true and sets user on success", async () => {
    (global.fetch as jest.Mock) = jest.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userId: "u3", email: "new@example.com" }),
      });

    const { result, unmount } = renderHook();
    await act(async () => {});

    let regResult: boolean;
    await act(async () => {
      regResult = await result.current.register("new@example.com", "ValidPass1!");
    });

    expect(regResult!).toBe(true);
    expect(result.current.user?.email).toBe("new@example.com");
    unmount();
  });

  it("logout clears user and redirects to /login", async () => {
    (global.fetch as jest.Mock) = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userId: "u1", email: "user@example.com" }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result, unmount } = renderHook();
    await act(async () => {});

    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(mockRouterReplace).toHaveBeenCalledWith("/login");
    unmount();
  });
});
