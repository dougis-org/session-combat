jest.mock("server-only", () => ({}), { virtual: true });

import {
  fetchDndBeyondCharacter,
  importDndBeyondCharacter,
} from "@/lib/server/dndBeyondCharacterImport";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";
import {
  DND_BEYOND_CHARACTER_NAME,
  DND_BEYOND_CHARACTER_URL,
} from "@/tests/helpers/dndBeyondImport";

describe("dndBeyondCharacterImport server module", () => {
  const originalBaseUrl = process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowInsecure =
    process.env.ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL;

  afterEach(() => {
    if (typeof originalBaseUrl === "string") {
      process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
    }

    if (typeof originalNodeEnv === "string") {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    if (typeof originalAllowInsecure === "string") {
      process.env.ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL =
        originalAllowInsecure;
    } else {
      delete process.env.ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
    }
  });

  test("fetches the public character-service payload", async () => {
    const fetchImpl = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => sampleDndBeyondCharacterResponse,
    })) as unknown as typeof fetch;

    const result = await fetchDndBeyondCharacter(
      DND_BEYOND_CHARACTER_URL,
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/character/91913267?includeCustomItems=true"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.name).toBe(DND_BEYOND_CHARACTER_NAME);
  });

  test("maps 403 and 404 upstream responses to a public access error", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(DND_BEYOND_CHARACTER_URL, fetchImpl),
    ).rejects.toThrow(/make sure the character is public/i);
  });

  test("rejects malformed upstream payloads", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: false, data: null }),
    })) as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(DND_BEYOND_CHARACTER_URL, fetchImpl),
    ).rejects.toThrow(/missing character data/i);
  });

  test("maps abort errors to a timeout message", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fetchImpl = jest.fn(async () => {
      throw abortError;
    }) as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(DND_BEYOND_CHARACTER_URL, fetchImpl),
    ).rejects.toThrow(/timed out/i);
  });

  test("rejects insecure upstream base URLs outside tests", async () => {
    process.env.NODE_ENV = "production";
    process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL =
      "http://character-service.dndbeyond.test/character/v5";
    const fetchImpl = jest.fn() as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(DND_BEYOND_CHARACTER_URL, fetchImpl),
    ).rejects.toThrow(/must use https/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("allows insecure upstream base URLs during tests", async () => {
    process.env.NODE_ENV = "test";
    process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL =
      "http://character-service.dndbeyond.test/character/v5";
    const fetchImpl = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => sampleDndBeyondCharacterResponse,
    })) as unknown as typeof fetch;

    await fetchDndBeyondCharacter(DND_BEYOND_CHARACTER_URL, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(
        "http://character-service.dndbeyond.test/character/v5/character/91913267?includeCustomItems=true",
      ),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  test("imports and normalizes a character through the server entry point", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => sampleDndBeyondCharacterResponse,
    })) as unknown as typeof fetch;

    const result = await importDndBeyondCharacter(
      DND_BEYOND_CHARACTER_URL,
      fetchImpl,
    );

    expect(result.character.name).toBe(DND_BEYOND_CHARACTER_NAME);
    expect(result.character.classes).toEqual([
      { class: "Rogue", level: 5 },
      { class: "Warlock", level: 7 },
    ]);
  });
});
