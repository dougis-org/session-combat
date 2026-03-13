import "server-only";

import {
  DndBeyondCharacterData,
  DndBeyondCharacterServiceResponse,
  DndBeyondImportError,
  NormalizedDndBeyondCharacter,
  normalizeDndBeyondCharacter,
  parseDndBeyondCharacterUrl,
} from "@/lib/dndBeyondCharacterImport";

const DEFAULT_CHARACTER_SERVICE_BASE_URL =
  "https://character-service.dndbeyond.com/character/v5";
const ALLOW_INSECURE_CHARACTER_SERVICE_ENV =
  "ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL";
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
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedDndBeyondCharacter> {
  const data = await fetchDndBeyondCharacter(pageUrl, fetchImpl);
  return normalizeDndBeyondCharacter(data);
}

function buildCharacterServiceEndpoint(characterId: string): string {
  const baseUrl = validateCharacterServiceBaseUrl(
    process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL ||
      DEFAULT_CHARACTER_SERVICE_BASE_URL,
  );

  return `${baseUrl.replace(/\/$/, "")}/character/${characterId}?includeCustomItems=true`;
}

function validateCharacterServiceBaseUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl);

  if (
    parsed.protocol !== "https:" &&
    !(process.env.NODE_ENV === "test" || isInsecureBaseUrlExplicitlyAllowed())
  ) {
    throw new DndBeyondImportError(
      "DND_BEYOND_CHARACTER_SERVICE_BASE_URL must use HTTPS outside tests unless insecure upstream access is explicitly allowed.",
      { status: 500, exposeMessage: false },
    );
  }

  return parsed.toString().replace(/\/$/, "");
}

function isInsecureBaseUrlExplicitlyAllowed(): boolean {
  return process.env[ALLOW_INSECURE_CHARACTER_SERVICE_ENV] === "true";
}

function assertSuccessfulCharacterResponse(response: Response): void {
  if (response.ok) {
    return;
  }

  if (response.status === 404 || response.status === 403) {
    throw new DndBeyondImportError(
      "The D&D Beyond character could not be accessed. Make sure the character is public.",
      { status: 400 },
    );
  }

  throw new DndBeyondImportError("Failed to fetch the D&D Beyond character.", {
    status: 502,
    exposeMessage: false,
  });
}

function extractCharacterServiceData(body: unknown): DndBeyondCharacterData {
  const response = body as DndBeyondCharacterServiceResponse;

  if (!response.success || !response.data) {
    throw new DndBeyondImportError(
      "The D&D Beyond character response was missing character data.",
      { status: 502, exposeMessage: false },
    );
  }

  return response.data;
}

function mapFetchError(error: unknown): Error {
  if (error instanceof DndBeyondImportError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new DndBeyondImportError(
      "The D&D Beyond character request timed out.",
      { status: 502, exposeMessage: false },
    );
  }

  return new DndBeyondImportError("Failed to fetch the D&D Beyond character.", {
    status: 502,
    exposeMessage: false,
  });
}
