/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/items/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: (...args: unknown[]) => unknown) =>
    (request: NextRequest) =>
      handler(request, { userId: "user-123" }),
}));

jest.mock("@/lib/db");

import { getDatabase } from "@/lib/db";

const mockedGetDatabase = jest.mocked(getDatabase);

function makeGetRequest(): NextRequest {
  return new NextRequest("http://localhost/api/items", { method: "GET" });
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockDb(items: unknown[] = []) {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(items),
      }),
      insertOne: jest.fn().mockResolvedValue({ insertedId: "some-id" }),
    }),
  } as any);
}

function mockDbThrow() {
  mockedGetDatabase.mockRejectedValue(new Error("DB error"));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/items", () => {
  it("returns 200 with items array from DB", async () => {
    const mockItem = { id: "item-1", userId: "user-123", name: "Longsword" };
    mockDb([mockItem]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("item-1");
  });

  it("returns 500 when DB throws", async () => {
    mockDbThrow();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch items");
  });
});

describe("POST /api/items — name validation", () => {
  it("returns 400 when name is missing", async () => {
    const res = await POST(makePostRequest({ type: "weapon", rarity: "common" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Item name is required");
  });

  it("returns 400 when name is whitespace-only", async () => {
    const res = await POST(makePostRequest({ name: "   ", type: "weapon", rarity: "common" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Item name is required");
  });
});

describe("POST /api/items — type validation", () => {
  it("returns 400 when type is missing", async () => {
    const res = await POST(makePostRequest({ name: "Sword", rarity: "common" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Item type is required");
  });

  it("returns 400 when type is not a valid enum value", async () => {
    const res = await POST(makePostRequest({ name: "Sword", type: "banana", rarity: "common" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid item type");
  });
});

describe("POST /api/items — rarity validation", () => {
  it("returns 400 when rarity is missing", async () => {
    const res = await POST(makePostRequest({ name: "Sword", type: "weapon" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Item rarity is required");
  });

  it("returns 400 when rarity is not a valid enum value", async () => {
    const res = await POST(makePostRequest({ name: "Sword", type: "weapon", rarity: "epic" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid item rarity");
  });
});

describe("POST /api/items — numeric field validation", () => {
  it("returns 400 when quantity is zero", async () => {
    const res = await POST(makePostRequest({ name: "Sword", type: "weapon", rarity: "common", quantity: 0 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Quantity must be a positive number");
  });

  it("returns 400 when quantity is negative", async () => {
    const res = await POST(makePostRequest({ name: "Sword", type: "weapon", rarity: "common", quantity: -1 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Quantity must be a positive number");
  });

  it("returns 400 when value is negative", async () => {
    const res = await POST(makePostRequest({ name: "Sword", type: "weapon", rarity: "common", value: -5 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Value must be a non-negative number");
  });

  it("returns 400 when weight is negative", async () => {
    const res = await POST(makePostRequest({ name: "Sword", type: "weapon", rarity: "common", weight: -1 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Weight must be a non-negative number");
  });
});

describe("POST /api/items — success cases", () => {
  it("returns 201 with full item shape on valid request", async () => {
    mockDb();
    const res = await POST(makePostRequest({
      name: "Longsword",
      type: "weapon",
      rarity: "uncommon",
      description: "A sharp blade",
      quantity: 2,
      value: 15,
      weight: 3,
      attunement: false,
      equipped: true,
      properties: ["martial"],
      notes: "Found in the dungeon",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Longsword");
    expect(body.type).toBe("weapon");
    expect(body.rarity).toBe("uncommon");
    expect(body.description).toBe("A sharp blade");
    expect(body.quantity).toBe(2);
    expect(body.value).toBe(15);
    expect(body.weight).toBe(3);
    expect(body.attunement).toBe(false);
    expect(body.equipped).toBe(true);
    expect(body.properties).toEqual(["martial"]);
    expect(body.notes).toBe("Found in the dungeon");
    expect(body.userId).toBe("user-123");
    expect(typeof body.id).toBe("string");
  });

  it("returns 201 with defaults when only required fields provided", async () => {
    mockDb();
    const res = await POST(makePostRequest({ name: "Potion of Healing", type: "potion", rarity: "common" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.quantity).toBe(1);
    expect(body.attunement).toBe(false);
    expect(body.equipped).toBe(false);
  });

  it("returns 500 when DB throws", async () => {
    mockDbThrow();
    const res = await POST(makePostRequest({ name: "Sword", type: "weapon", rarity: "common" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create item");
  });
});
