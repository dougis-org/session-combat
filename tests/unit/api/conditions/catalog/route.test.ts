/**
 * @jest-environment node
 */
import { GET } from "@/app/api/conditions/catalog/route";
import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: (...args: unknown[]) => unknown) =>
    (request: NextRequest) =>
      handler(request, { userId: "user-123" }),
}));

jest.mock("@/lib/storage", () => ({
  storage: { loadConditionCatalog: jest.fn() },
}));

const mockedStorage = jest.mocked(storage);

function makeGetRequest(): NextRequest {
  return new NextRequest("http://localhost/api/conditions/catalog", { method: "GET" });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/conditions/catalog", () => {
  it("returns 200 with a { name, description }[] payload", async () => {
    mockedStorage.loadConditionCatalog.mockResolvedValue([
      { name: "Poisoned", description: "Disadvantage on attacks and ability checks." },
    ]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { name: "Poisoned", description: "Disadvantage on attacks and ability checks." },
    ]);
  });

  it("omits any extra fields present on the underlying stored document", async () => {
    mockedStorage.loadConditionCatalog.mockResolvedValue([
      { name: "Prone", description: "Prone description" } as never,
    ]);
    const res = await GET(makeGetRequest());
    const body = await res.json();
    expect(Object.keys(body[0]).sort()).toEqual(["description", "name"]);
  });

  it("returns 500 when the catalog read fails", async () => {
    mockedStorage.loadConditionCatalog.mockRejectedValue(new Error("db down"));
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });
});
