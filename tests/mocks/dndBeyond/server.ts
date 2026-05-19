import { createServer, Server } from "http";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";

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

export function createDndBeyondMockServer(): {
  setup(): Promise<void>;
  teardown(): Promise<void>;
} {
  let server: Server | null = null;
  let originalCharacterServiceBaseUrl: string | undefined;
  let originalAllowInsecureCharacterServiceBaseUrl: string | undefined;

  return {
    async setup() {
      originalCharacterServiceBaseUrl = process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
      originalAllowInsecureCharacterServiceBaseUrl =
        process.env.ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL;

      server = createServer((request, response) => {
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

      const port = await listen(server);
      process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL = `http://127.0.0.1:${port}/character/v5`;
      process.env.ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL = "true";
    },

    async teardown() {
      if (typeof originalCharacterServiceBaseUrl === "string") {
        process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL = originalCharacterServiceBaseUrl;
      } else {
        delete process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
      }
      if (typeof originalAllowInsecureCharacterServiceBaseUrl === "string") {
        process.env.ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL =
          originalAllowInsecureCharacterServiceBaseUrl;
      } else {
        delete process.env.ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL;
      }

      if (server) {
        await new Promise<void>((resolve, reject) => {
          server!.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
        server = null;
      }
    },
  };
}
