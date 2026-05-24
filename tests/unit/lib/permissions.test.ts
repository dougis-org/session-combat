import { getUserById, isUserAdmin, InvalidUserIdError } from "@/lib/permissions";
import { getDatabase } from "@/lib/db";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
jest.mock("mongodb", () => {
  const ObjectId = jest.fn((id: string) => ({ id })) as jest.Mock & { isValid: jest.Mock };
  ObjectId.isValid = jest.fn(() => true);
  return { ObjectId };
});

const mockedGetDatabase = jest.mocked(getDatabase);

function mockCollection(methods: Record<string, jest.Mock>) {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue(methods),
  } as any);
}

describe("getUserById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws InvalidUserIdError for invalid userId without querying DB", async () => {
    const { ObjectId } = jest.requireMock("mongodb");
    ObjectId.isValid.mockReturnValueOnce(false);
    await expect(getUserById("not-valid")).rejects.toThrow(InvalidUserIdError);
    expect(mockedGetDatabase).not.toHaveBeenCalled();
  });

  it("returns null when user not found", async () => {
    mockCollection({ findOne: jest.fn().mockResolvedValue(null) });
    expect(await getUserById("507f1f77bcf86cd799439011")).toBeNull();
  });

  it("returns user document when found", async () => {
    const doc = { email: "x@example.com", isAdmin: true };
    mockCollection({ findOne: jest.fn().mockResolvedValue(doc) });
    expect(await getUserById("507f1f77bcf86cd799439011")).toBe(doc);
  });

  it("throws when getDatabase throws", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("connection refused"));
    await expect(getUserById("507f1f77bcf86cd799439011")).rejects.toThrow("connection refused");
  });

  it("throws when findOne throws", async () => {
    mockCollection({ findOne: jest.fn().mockRejectedValue(new Error("query failed")) });
    await expect(getUserById("507f1f77bcf86cd799439011")).rejects.toThrow("query failed");
  });

  it("uses $eq operator in the query", async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    mockCollection({ findOne });
    await getUserById("507f1f77bcf86cd799439011");
    const query = findOne.mock.calls[0][0];
    expect(query._id).toHaveProperty("$eq");
  });
});

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

  it("returns null when userId is malformed (invalid ObjectId)", async () => {
    const { ObjectId } = jest.requireMock("mongodb");
    ObjectId.isValid.mockReturnValueOnce(false);
    expect(await isUserAdmin("not-valid")).toBeNull();
  });
});
