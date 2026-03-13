import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "@jest/globals";
import { createServer, Server } from "http";
import fetch from "node-fetch";
import {
  startTestServer,
  registerAndGetCookie,
  TestServer,
} from "../helpers/server";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";
import {
  DND_BEYOND_CHARACTER_NAME,
  DND_BEYOND_CHARACTER_URL,
} from "@/tests/helpers/dndBeyondImport";

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to bind mock character service");
      }
      resolve(address.port);
    });
  });
}

describe("Character import API integration", () => {
  let server: TestServer;
  let baseUrl: string;
  let cookie: string;
  let mockService: Server;
  let mockServicePort: number;
  let originalCharacterServiceBaseUrl: string | undefined;

  beforeAll(async () => {
    originalCharacterServiceBaseUrl =
      process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
    mockService = createServer((request, response) => {
      if (request.url?.startsWith("/character/v5/character/91913267")) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(sampleDndBeyondCharacterResponse));
        return;
      }

      if (request.url?.startsWith("/character/v5/character/500")) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Upstream failed" }));
        return;
      }

      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Not found" }));
    });

    mockServicePort = await listen(mockService);
    process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL = `http://127.0.0.1:${mockServicePort}/character/v5`;

    server = await startTestServer();
    baseUrl = server.baseUrl;
  }, 120000);

  afterAll(async () => {
    if (typeof originalCharacterServiceBaseUrl === "string") {
      process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL =
        originalCharacterServiceBaseUrl;
    } else {
      delete process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
    }
    await server.cleanup();
    await new Promise<void>((resolve, reject) => {
      mockService.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }, 30000);

  beforeEach(async () => {
    const email = `import-${Date.now()}-${Math.random()}@example.com`;
    cookie = await registerAndGetCookie(baseUrl, email, "testPassword123!");
  });

  test("imports a public D&D Beyond character for an authenticated user", async () => {
    const response = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.character.name).toBe(DND_BEYOND_CHARACTER_NAME);
    expect(body.character.id).toBeTruthy();
    expect(body.warnings).toEqual(expect.any(Array));
  });

  test("returns a conflict for duplicate-name imports unless overwrite is requested", async () => {
    const firstResponse = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    });

    expect(firstResponse.status).toBe(200);
    const firstBody = await firstResponse.json();

    const conflictResponse = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    });

    expect(conflictResponse.status).toBe(409);
    const conflictBody = await conflictResponse.json();
    expect(conflictBody.conflict).toBe("duplicate-name");
    expect(conflictBody.existingCharacter.id).toBeTruthy();
    expect(conflictBody.existingCharacter.name).toBe(firstBody.character.name);

    const overwriteResponse = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
        overwrite: true,
      }),
    });

    expect(overwriteResponse.status).toBe(200);
    const overwriteBody = await overwriteResponse.json();
    expect(overwriteBody.character.id).toBe(conflictBody.existingCharacter.id);
  });

  test("returns 400 for an invalid D&D Beyond URL", async () => {
    const response = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: "https://example.com/not-dnd-beyond",
      }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/canonical public D&D Beyond character URLs/i);
  });

  test("returns 502 when the upstream character service fails", async () => {
    const response = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: "https://www.dndbeyond.com/characters/500/BRdgB3",
      }),
    });

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe("Failed to import D&D Beyond character.");
  });
});
