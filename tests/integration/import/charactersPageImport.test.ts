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

describe("Characters import UI", () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    originalFetch = global.fetch;
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
              json: async () => ({
                conflict: "duplicate-name",
                error: "Character already exists",
                existingCharacter: {
                  id: "existing-character-id",
                  name: "Dolor Vagarpie",
                },
              }),
            } as Response;
          }

          return {
            ok: true,
            status: 200,
            json: async () => ({
              character: {
                id: "existing-character-id",
                userId: "user-1",
                name: "Dolor Vagarpie",
                hp: 92,
                maxHp: 92,
                ac: 18,
                abilityScores: {
                  strength: 10,
                  dexterity: 17,
                  constitution: 14,
                  intelligence: 16,
                  wisdom: 10,
                  charisma: 21,
                },
                classes: [
                  { class: "Rogue", level: 5 },
                  { class: "Warlock", level: 7 },
                ],
              },
              warnings: ["Alignment was not supported and was omitted."],
            }),
          } as Response;
        }

        return {
          ok: false,
          status: 404,
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
    jest.restoreAllMocks();
  });

  test("shows duplicate-name confirmation and surfaces warnings after overwrite", async () => {
    await act(async () => {
      root.render(React.createElement(CharactersContent));
    });

    const importButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/import/i),
    );
    expect(importButton).toBeTruthy();

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const urlInput = container.querySelector(
      'input[type="url"]',
    ) as HTMLInputElement | null;
    expect(urlInput).not.toBeNull();

    await act(async () => {
      if (!urlInput) return;
      const setNativeValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setNativeValue?.call(
        urlInput,
        "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      );
      urlInput.dispatchEvent(new Event("input", { bubbles: true }));
      urlInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const submitButton = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.textContent?.match(/import from d&d beyond/i))
      .at(-1);
    expect(submitButton).toBeTruthy();

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("already exists");

    const overwriteButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.match(/overwrite/i));
    expect(overwriteButton).toBeTruthy();

    await act(async () => {
      overwriteButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(container.textContent).toContain(
      "Alignment was not supported and was omitted.",
    );
  });
});
