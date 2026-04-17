import { isUserAdmin } from "@/lib/permissions";
import { getDatabase } from "@/lib/db";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
jest.mock("mongodb", () => ({ ObjectId: jest.fn((id: string) => ({ id })) }));

const mockedGetDatabase = jest.mocked(getDatabase);

function mockCollection(methods: Record<string, jest.Mock>) {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue(methods),
  } as any);
}

describe("isUserAdmin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns true when user has isAdmin: true", async () => {
    mockCollection({ findOne: jest.fn().mockResolvedValue({ isAdmin: true }) });
    expect(await isUserAdmin("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("returns false when user has isAdmin: false", async () => {
    mockCollection({ findOne: jest.fn().mockResolvedValue({ isAdmin: false }) });
    expect(await isUserAdmin("507f1f77bcf86cd799439011")).toBe(false);
  });

  it("returns false when user exists without isAdmin field", async () => {
    mockCollection({ findOne: jest.fn().mockResolvedValue({ email: "x@example.com" }) });
    expect(await isUserAdmin("507f1f77bcf86cd799439011")).toBe(false);
  });

  it("returns false when user not found", async () => {
    mockCollection({ findOne: jest.fn().mockResolvedValue(null) });
    expect(await isUserAdmin("507f1f77bcf86cd799439011")).toBe(false);
  });

  it("returns null when getDatabase throws", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("connection refused"));
    expect(await isUserAdmin("507f1f77bcf86cd799439011")).toBeNull();
  });

  it("returns null when findOne throws", async () => {
    mockCollection({ findOne: jest.fn().mockRejectedValue(new Error("query failed")) });
    expect(await isUserAdmin("507f1f77bcf86cd799439011")).toBeNull();
  });

  it("returns null when userId is malformed (ObjectId parse error)", async () => {
    const { ObjectId } = jest.requireMock("mongodb");
    (ObjectId as jest.Mock).mockImplementationOnce(() => {
      throw Object.assign(new Error("bad objectid"), { name: "BSONError" });
    });
    mockCollection({ findOne: jest.fn() });
    expect(await isUserAdmin("not-valid")).toBeNull();
  });
});
