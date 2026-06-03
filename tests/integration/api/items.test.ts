import fetch from "node-fetch";
import { registerTestUser } from "../helpers/users";

interface ItemResponse {
  id: string;
  userId: string;
  name: string;
  type: string;
  rarity: string;
  description?: string;
  quantity: number;
  value?: number;
  weight?: number;
  attunement: boolean;
  equipped: boolean;
  properties?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const VALID_ITEM = {
  name: "Dagger",
  type: "weapon",
  rarity: "common",
};

describe("Items API Integration Tests", () => {
  let baseUrl: string;
  let authCookie: string;
  let authCookie2: string;

  beforeAll(async () => {
    const url = process.env.TEST_BASE_URL;
    if (!url) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
    baseUrl = url;
    authCookie = (await registerTestUser(baseUrl, "items-user1")).cookie;
    authCookie2 = (await registerTestUser(baseUrl, "items-user2")).cookie;
  }, 30000);

  function authed(cookie = authCookie) {
    return { "Content-Type": "application/json", Cookie: cookie };
  }

  async function createItem(overrides: Partial<typeof VALID_ITEM> = {}, cookie = authCookie): Promise<ItemResponse> {
    const res = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: authed(cookie),
      body: JSON.stringify({ ...VALID_ITEM, ...overrides }),
    });
    if (res.status !== 201) {
      throw new Error(`createItem failed with status ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<ItemResponse>;
  }

  describe("Auth enforcement", () => {
    it("GET without auth cookie returns 401", async () => {
      const res = await fetch(`${baseUrl}/api/items`);
      expect(res.status).toBe(401);
    });

    it("POST without auth cookie returns 401", async () => {
      const res = await fetch(`${baseUrl}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(VALID_ITEM),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("Functional tests", () => {
    it("POST with valid body returns 201 with correct shape and defaults", async () => {
      const res = await fetch(`${baseUrl}/api/items`, {
        method: "POST",
        headers: authed(),
        body: JSON.stringify(VALID_ITEM),
      });
      expect(res.status).toBe(201);
      const body = await res.json() as ItemResponse;
      expect(body.quantity).toBe(1);
      expect(body.attunement).toBe(false);
      expect(body.equipped).toBe(false);
      expect(typeof body.id).toBe("string");
      expect(body.name).toBe("Dagger");
      expect(body.type).toBe("weapon");
      expect(body.rarity).toBe("common");
    });

    it("POST then GET round-trip: created item appears in GET response", async () => {
      const item = await createItem({ name: "Unique Sword" });

      const res = await fetch(`${baseUrl}/api/items`, { headers: authed() });
      expect(res.status).toBe(200);
      const list = await res.json() as ItemResponse[];
      expect(Array.isArray(list)).toBe(true);
      expect(list.some(i => i.id === item.id)).toBe(true);
    });
  });

  describe("User isolation", () => {
    it("user A's items are not visible to user B, but user B's own items are visible", async () => {
      const itemA = await createItem({ name: "User A Secret Item" }, authCookie);
      const itemB = await createItem({ name: "User B Own Item" }, authCookie2);

      const resB = await fetch(`${baseUrl}/api/items`, { headers: authed(authCookie2) });
      expect(resB.status).toBe(200);
      const listB = await resB.json() as ItemResponse[];

      expect(listB.some(i => i.id === itemA.id)).toBe(false);
      expect(listB.some(i => i.id === itemB.id)).toBe(true);
    });
  });
});
