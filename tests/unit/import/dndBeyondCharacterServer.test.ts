jest.mock("server-only", () => ({}), { virtual: true });

import {
  fetchDndBeyondCharacter,
  importDndBeyondCharacter,
} from "@/lib/server/dndBeyondCharacterImport";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";

describe("dndBeyondCharacterImport server module", () => {
  test("fetches the public character-service payload", async () => {
    const fetchImpl = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => sampleDndBeyondCharacterResponse,
    })) as unknown as typeof fetch;

    const result = await fetchDndBeyondCharacter(
      "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/character/91913267?includeCustomItems=true"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.name).toBe("Dolor Vagarpie");
  });

  test("maps 403 and 404 upstream responses to a public access error", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(
        "https://www.dndbeyond.com/characters/91913267/BRdgB3",
        fetchImpl,
      ),
    ).rejects.toThrow(/make sure the character is public/i);
  });

  test("rejects malformed upstream payloads", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: false, data: null }),
    })) as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(
        "https://www.dndbeyond.com/characters/91913267/BRdgB3",
        fetchImpl,
      ),
    ).rejects.toThrow(/missing character data/i);
  });

  test("maps abort errors to a timeout message", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fetchImpl = jest.fn(async () => {
      throw abortError;
    }) as unknown as typeof fetch;

    await expect(
      fetchDndBeyondCharacter(
        "https://www.dndbeyond.com/characters/91913267/BRdgB3",
        fetchImpl,
      ),
    ).rejects.toThrow(/timed out/i);
  });

  test("imports and normalizes a character through the server entry point", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => sampleDndBeyondCharacterResponse,
    })) as unknown as typeof fetch;

    const result = await importDndBeyondCharacter(
      "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      fetchImpl,
    );

    expect(result.character.name).toBe("Dolor Vagarpie");
    expect(result.character.classes).toEqual([
      { class: "Rogue", level: 5 },
      { class: "Warlock", level: 7 },
    ]);
  });
});