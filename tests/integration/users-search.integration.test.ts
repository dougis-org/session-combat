import fetch from "node-fetch";
import { registerTestUser } from "./helpers/users";

const SEARCH_PATH = "/api/users/search";

describe("GET /api/users/search integration", () => {
  let baseUrl: string;
  let callerCookie: string;
  let callerUsername: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    const caller = await registerTestUser(baseUrl, "srchcaller");
    callerCookie = caller.cookie;
    callerUsername = caller.username;

    // Register additional users with a known prefix to test search
    for (let i = 0; i < 3; i++) {
      await registerTestUser(baseUrl, `srch${i}`);
    }
  }, 60000);

  function authed(cookie = callerCookie) {
    return { Cookie: cookie };
  }

  it("returns 401 for unauthenticated request", async () => {
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=srch`);
    expect(res.status).toBe(401);
  });

  it("returns 400 when q is missing", async () => {
    const res = await fetch(`${baseUrl}${SEARCH_PATH}`, { headers: authed() });
    expect(res.status).toBe(400);
  });

  it("returns 400 when q is empty", async () => {
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=`, { headers: authed() });
    expect(res.status).toBe(400);
  });

  it("returns 200 with empty array when no users match", async () => {
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=zzznomatch_xyzzy`, { headers: authed() });
    expect(res.status).toBe(200);
    const body = await res.json() as { results: unknown[] };
    expect(body.results).toEqual([]);
  });

  it("returns matching users for a valid prefix (case-insensitive)", async () => {
    // Use uppercase query to verify case-insensitive matching against lowercase usernames
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=SRCH`, { headers: authed() });
    expect(res.status).toBe(200);
    const body = await res.json() as { results: Array<{ id: string; username: string }> };
    expect(body.results.length).toBeGreaterThan(0);
    for (const user of body.results) {
      expect(user.username.toLowerCase()).toMatch(/^srch/);
    }
  });

  it("excludes the caller from their own search results", async () => {
    // Search for the caller's own username prefix
    const prefix = callerUsername.slice(0, 5);
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=${encodeURIComponent(prefix)}`, {
      headers: authed(),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { results: Array<{ id: string; username: string }> };
    const callerInResults = body.results.some(
      (u) => u.username.toLowerCase() === callerUsername.toLowerCase()
    );
    expect(callerInResults).toBe(false);
  });

  it("returns only id and username in each result (no PII)", async () => {
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=srch`, { headers: authed() });
    const body = await res.json() as { results: Array<Record<string, unknown>> };
    for (const user of body.results) {
      const keys = Object.keys(user).sort();
      expect(keys).toEqual(["id", "username"]);
    }
  });

  it("returns at most 15 results when more than 15 users match", async () => {
    // Register 16 users with a unique prefix
    const prefix = "srchcap";
    for (let i = 0; i < 16; i++) {
      await registerTestUser(baseUrl, `${prefix}${i}`);
    }
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=${prefix}`, { headers: authed() });
    expect(res.status).toBe(200);
    const body = await res.json() as { results: unknown[] };
    expect(body.results.length).toBe(15);
  }, 60000);

  it("handles a single character query", async () => {
    const res = await fetch(`${baseUrl}${SEARCH_PATH}?q=s`, { headers: authed() });
    expect(res.status).toBe(200);
    const body = await res.json() as { results: unknown[] };
    expect(Array.isArray(body.results)).toBe(true);
  });
});
