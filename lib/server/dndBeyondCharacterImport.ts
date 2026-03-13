import "server-only";

import {
  DndBeyondCharacterData,
  DndBeyondCharacterServiceResponse,
  NormalizedDndBeyondCharacter,
  normalizeDndBeyondCharacter,
  parseDndBeyondCharacterUrl,
} from "@/lib/dndBeyondCharacterImport";

const DEFAULT_CHARACTER_SERVICE_BASE_URL =
  "https://character-service.dndbeyond.com/character/v5";
const FETCH_TIMEOUT_MS = 15000;

export async function fetchDndBeyondCharacter(
  pageUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DndBeyondCharacterData> {
  const { characterId } = parseDndBeyondCharacterUrl(pageUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(
      buildCharacterServiceEndpoint(characterId),
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    assertSuccessfulCharacterResponse(response);
    return extractCharacterServiceData(await response.json());
  } catch (error) {
    throw mapFetchError(error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function importDndBeyondCharacter(
  pageUrl: string,
): Promise<NormalizedDndBeyondCharacter> {
  const data = await fetchDndBeyondCharacter(pageUrl);
  return normalizeDndBeyondCharacter(data);
}

function buildCharacterServiceEndpoint(characterId: string): string {
  const baseUrl =
    process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL ||
    DEFAULT_CHARACTER_SERVICE_BASE_URL;
  return `${baseUrl.replace(/\/$/, "")}/character/${characterId}?includeCustomItems=true`;
}

function assertSuccessfulCharacterResponse(response: Response): void {
  if (response.ok) {
    return;
  }

  if (response.status === 404 || response.status === 403) {
    throw new Error(
      "The D&D Beyond character could not be accessed. Make sure the character is public.",
    );
  }

  throw new Error("Failed to fetch the D&D Beyond character.");
}

function extractCharacterServiceData(body: unknown): DndBeyondCharacterData {
  const response = body as DndBeyondCharacterServiceResponse;

  if (!response.success || !response.data) {
    throw new Error(
      "The D&D Beyond character response was missing character data.",
    );
  }

  return response.data;
}

function mapFetchError(error: unknown): Error {
  if (error instanceof Error && error.name === "AbortError") {
    return new Error("The D&D Beyond character request timed out.");
  }

  return error instanceof Error
    ? error
    : new Error("Failed to fetch the D&D Beyond character.");
}
