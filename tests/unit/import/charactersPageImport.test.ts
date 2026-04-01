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
import { CharactersContent } from "@/app/characters/page";
import {
  CONFLICT_WARNING,
  createDuplicateNameConflictPayload,
  createImportedCharacterApiPayload,
  DND_BEYOND_CHARACTER_URL,
  IMPORT_WARNING,
} from "@/tests/helpers/dndBeyondImport";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
}));

jest.mock("@/lib/components/CreatureStatBlock", () => ({
  CreatureStatBlock: () => null,
}));

jest.mock("@/lib/components/CreatureStatsForm", () => ({
  CreatureStatsForm: () => null,
}));

describe("Characters page import UI", () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalFetch: typeof global.fetch;
  let confirmSpy: jest.SpiedFunction<typeof window.confirm>;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    originalFetch = global.fetch;
    confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();

        if (url === "/api/characters" && (!init || init.method === undefined)) {
          return {
            ok: true,
            status: 200,
            json: async () => [],
          } as Response;
        }

        if (url === "/api/characters/import") {
          const body = JSON.parse(String(init?.body || "{}"));

          if (!body.overwrite) {
            return {
              ok: false,
              status: 409,
              headers: new Headers({ "Content-Type": "application/json" }),
              json: async () => createDuplicateNameConflictPayload(),
            } as Response;
          }

          return {
            ok: true,
            status: 200,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => createImportedCharacterApiPayload(),
          } as Response;
        }

        if (url.startsWith("/api/characters/") && init?.method === "DELETE") {
          return {
            ok: true,
            status: 200,
            json: async () => ({}),
          } as Response;
        }

        return {
          ok: false,
          status: 404,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: async () => ({ error: "not found" }),
        } as Response;
      },
    ) as typeof fetch;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    global.fetch = originalFetch;
    confirmSpy.mockRestore();
    jest.restoreAllMocks();
  });

  async function renderPage() {
    await act(async () => {
      root.render(React.createElement(CharactersContent));
    });
  }

  async function openImportPanel() {
    const importButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/import from d&d beyond/i),
    );

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }

  async function setImportUrl(value: string) {
    const urlInput = container.querySelector(
      'input[type="url"]',
    ) as HTMLInputElement | null;

    await act(async () => {
      if (!urlInput) {
        return;
      }

      const setNativeValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setNativeValue?.call(urlInput, value);
      urlInput.dispatchEvent(new Event("input", { bubbles: true }));
      urlInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  test("import form instructs users to enter a publicly available URL", async () => {
    await renderPage();
    await openImportPanel();

    expect(container.textContent).toMatch(/publicly available/i);
    const urlInput = container.querySelector(
      'input[type="url"]',
    ) as HTMLInputElement | null;
    expect(urlInput?.placeholder).toMatch(/dndbeyond\.com\/characters\/<id>/i);
  });

  test("the entered URL is preserved verbatim in the input after a conflict", async () => {
    await renderPage();
    await openImportPanel();
    await setImportUrl(DND_BEYOND_CHARACTER_URL);

    const urlInput = container.querySelector(
      'input[type="url"]',
    ) as HTMLInputElement | null;

    const submitButton = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.textContent?.match(/import from d&d beyond/i))
      .at(-1);

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("already exists");
    expect(urlInput?.value).toBe(DND_BEYOND_CHARACTER_URL);
  });

  test("shows duplicate-name confirmation and surfaces warnings after overwrite", async () => {
    await renderPage();
    await openImportPanel();
    await setImportUrl(DND_BEYOND_CHARACTER_URL);

    const submitButton = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.textContent?.match(/import from d&d beyond/i))
      .at(-1);

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("already exists");
    expect(container.textContent).toContain(CONFLICT_WARNING);

    const overwriteButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.match(/overwrite/i));

    await act(async () => {
      overwriteButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(container.textContent).toContain(IMPORT_WARNING);
  });

  test("aborts import conflict state when the user cancels overwrite", async () => {
    await renderPage();
    await openImportPanel();
    await setImportUrl(DND_BEYOND_CHARACTER_URL);

    const submitButton = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.textContent?.match(/import from d&d beyond/i))
      .at(-1);

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const abortButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/^abort$/i),
    );

    await act(async () => {
      abortButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).not.toContain("already exists");
    expect(container.textContent).not.toContain(CONFLICT_WARNING);
  });

  test("uses plain-text error bodies when import responses are not JSON", async () => {
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();

        if (url === "/api/characters" && (!init || init.method === undefined)) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => [],
          } as Response;
        }

        if (url === "/api/characters/import") {
          return {
            ok: false,
            status: 502,
            headers: new Headers({ "Content-Type": "text/plain" }),
            text: async () => "gateway timeout",
            json: async () => {
              throw new Error("not json");
            },
          } as Response;
        }

        return {
          ok: false,
          status: 404,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: async () => ({ error: "not found" }),
        } as Response;
      },
    ) as typeof fetch;

    await renderPage();
    await openImportPanel();
    await setImportUrl(DND_BEYOND_CHARACTER_URL);

    const submitButton = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.textContent?.match(/import from d&d beyond/i))
      .at(-1);

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("gateway timeout");
  });
});
