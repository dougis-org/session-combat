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
  const originalEnv = { ...process.env };

  function setEnv(overrides: Partial<NodeJS.ProcessEnv>): void {
    Object.assign(process.env, overrides);
  }

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }

    Object.assign(process.env, originalEnv);
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
    setEnv({
      NODE_ENV: "production",
      DND_BEYOND_CHARACTER_SERVICE_BASE_URL:
        "http://character-service.dndbeyond.test/character/v5",
    });
    const fetchImpl = jest.fn() as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(DND_BEYOND_CHARACTER_URL, fetchImpl),
    ).rejects.toThrow(/must use https/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("allows insecure upstream base URLs during tests", async () => {
    setEnv({
      NODE_ENV: "test",
      DND_BEYOND_CHARACTER_SERVICE_BASE_URL:
        "http://character-service.dndbeyond.test/character/v5",
    });
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
    expect(result.sourceUrl).toBe(DND_BEYOND_CHARACTER_URL);
  });

  test("accepts a publicly available URL without a share code and preserves it as sourceUrl", async () => {
    const urlWithoutShareCode =
      "https://www.dndbeyond.com/characters/91913267";
    const fetchImpl = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => sampleDndBeyondCharacterResponse,
    })) as unknown as typeof fetch;

    const result = await importDndBeyondCharacter(
      urlWithoutShareCode,
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/character/91913267?includeCustomItems=true"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.character.name).toBe(DND_BEYOND_CHARACTER_NAME);
    expect(result.sourceUrl).toBe(urlWithoutShareCode);
  });
});
