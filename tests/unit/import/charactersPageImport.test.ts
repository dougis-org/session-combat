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
import { Response as FetchResponse } from "node-fetch";
import { CharactersContent } from "@/app/characters/page";
import {
  CONFLICT_WARNING,
  createDuplicateNameConflictPayload,
  createImportedCharacterApiPayload,
  DND_BEYOND_CHARACTER_URL,
  IMPORT_WARNING,
} from "@/tests/helpers/dndBeyondImport";

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }) as unknown as Response;
}

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
          return jsonResponse([], 200);
        }

        if (url === "/api/characters/import") {
          const body = JSON.parse(String(init?.body || "{}"));

          if (!body.overwrite) {
            return jsonResponse(createDuplicateNameConflictPayload(), 409);
          }

          return jsonResponse(createImportedCharacterApiPayload(), 200);
        }

        if (url.startsWith("/api/characters/") && init?.method === "DELETE") {
          return jsonResponse({}, 200);
        }

        return jsonResponse({ error: "not found" }, 404);
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
          return jsonResponse([], 200);
        }

        if (url === "/api/characters/import") {
          return new FetchResponse("gateway timeout", {
            status: 502,
            headers: { "Content-Type": "text/plain" },
          }) as unknown as Response;
        }

        return jsonResponse({ error: "not found" }, 404);
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
