import { registerTestUser } from "../helpers/users";
import { DEFAULT_PREFERENCES } from "@/lib/preferences/schema";

describe("/api/me/preferences Integration Tests", () => {
  let baseUrl: string;
  let cookieA: string;
  let cookieB: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
    cookieA = (await registerTestUser(baseUrl, "meprefs-a")).cookie;
    cookieB = (await registerTestUser(baseUrl, "meprefs-b")).cookie;
  }, 30000);

  const get = (cookie?: string) =>
    fetch(`${baseUrl}/api/me/preferences`, {
      method: "GET",
      ...(cookie ? { headers: { Cookie: cookie } } : {}),
    });

  const patch = (body: unknown, cookie?: string) =>
    fetch(`${baseUrl}/api/me/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("GET is 401 when unauthenticated", async () => {
    expect((await get()).status).toBe(401);
  });

  it("PATCH is 401 when unauthenticated and does not write", async () => {
    expect((await patch({ dice: { sendToChat: true } })).status).toBe(401);
  });

  it("GET for a new user returns resolved defaults + schemaVersion, no-store", async () => {
    const res = await get(cookieA);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(await res.json()).toEqual({ schemaVersion: 1, values: DEFAULT_PREFERENCES, stored: {} });
  });

  it("PATCH with a valid partial persists and echoes the resolved result", async () => {
    const res = await patch({ dice: { sendToChat: true } }, cookieA);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.values.dice.sendToChat).toBe(true);
    const after = await (await get(cookieA)).json();
    expect(after.values.dice.sendToChat).toBe(true);
  });

  it("PATCH dice.surface persists a string and round-trips via GET", async () => {
    const user = (await registerTestUser(baseUrl, "meprefs-surface")).cookie;
    const res = await patch({ dice: { surface: "wood" } }, user);
    expect(res.status).toBe(200);
    expect((await res.json()).values.dice.surface).toBe("wood");
    const after = await (await get(user)).json();
    expect(after.values.dice.surface).toBe("wood");
    expect(after.stored.dice.surface).toBe("wood");
  });

  it("PATCH dice.surface null clears a stored value", async () => {
    const user = (await registerTestUser(baseUrl, "meprefs-surface-clear")).cookie;
    await patch({ dice: { surface: "felt" } }, user);
    const res = await patch({ dice: { surface: null } }, user);
    expect(res.status).toBe(200);
    const after = await (await get(user)).json();
    expect(after.values.dice.surface).toBeNull();
    expect(after.stored).toEqual({});
  });

  it("PATCH wrongly-typed dice.surface → 400, no write", async () => {
    const user = (await registerTestUser(baseUrl, "meprefs-surface-bad")).cookie;
    expect((await patch({ dice: { surface: 123 } }, user)).status).toBe(400);
    const after = await (await get(user)).json();
    expect(after.stored).toEqual({});
  });

  it.each([
    ["array", "[]"],
    ["null", "null"],
    ["string", '"nope"'],
    ["malformed json", "{bad"],
  ])("PATCH %s body → 400, no write", async (_label, raw) => {
    const before = await (await get(cookieB)).json();
    const res = await patch(raw, cookieB);
    expect(res.status).toBe(400);
    const after = await (await get(cookieB)).json();
    expect(after).toEqual(before);
  });

  it("PATCH wrongly-typed / out-of-range → 400, no field written", async () => {
    expect((await patch({ dice: { sendToChat: 1 } }, cookieB)).status).toBe(400);
    expect((await patch({ chat: { size: { height: 5, screenWidth: 1, screenHeight: 1 } } }, cookieB)).status).toBe(400);
  });

  it("PATCH unknown keys are stripped, known keys persisted", async () => {
    const res = await patch({ chat: { pinned: true }, bogusKey: 5 }, cookieB);
    expect(res.status).toBe(200);
    const after = await (await get(cookieB)).json();
    expect(after.values.chat.pinned).toBe(true);
    expect(JSON.stringify(after)).not.toContain("bogusKey");
  });

  it("user A's PATCH never touches user B's document", async () => {
    const freshA = (await registerTestUser(baseUrl, "meprefs-iso-a")).cookie;
    const freshB = (await registerTestUser(baseUrl, "meprefs-iso-b")).cookie;
    await patch({ dice: { sendToChat: true }, userId: "spoof" }, freshA);
    const bAfter = await (await get(freshB)).json();
    expect(bAfter.values.dice.sendToChat).toBe(false);
  });

  it("preference survives a fresh authentication (new cookie)", async () => {
    const user = await registerTestUser(baseUrl, "meprefs-relogin");
    await patch({ dice: { sendToChat: true } }, user.cookie);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const reCookie = loginRes.headers.get("set-cookie")!.split(";")[0].trim();
    const after = await (await get(reCookie)).json();
    expect(after.values.dice.sendToChat).toBe(true);
  });
});
