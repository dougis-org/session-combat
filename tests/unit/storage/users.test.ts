/**
 * @jest-environment node
 */
import { ObjectId } from "mongodb";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import { InvalidUserIdError } from "@/lib/permissions";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);

const VALID_USER_ID = "507f1f77bcf86cd799439011";
const VALID_USER_ID_2 = "507f1f77bcf86cd799439012";
const VALID_USER_ID_3 = "507f1f77bcf86cd799439013";

function makeMockFindOne() {
  const findOne = jest.fn<Promise<unknown>, []>();
  return { findOne };
}

function makeMockFind() {
  const toArray = jest.fn<Promise<unknown[]>, []>();
  const find = jest.fn(() => ({ toArray }));
  return { find, toArray };
}

describe("getUserById", () => {
  let findOne: jest.MockedFunction<() => Promise<unknown>>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    const col = makeMockFindOne();
    findOne = col.findOne as jest.MockedFunction<() => Promise<unknown>>;
    mockDb = { collection: jest.fn(() => col) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  it("returns PublicUser when user exists", async () => {
    findOne.mockResolvedValue({ _id: new ObjectId(VALID_USER_ID), username: "alice" });

    const result = await storage.getUserById(VALID_USER_ID);

    expect(mockDb.collection).toHaveBeenCalledWith("users");
    expect(result).toEqual({ id: VALID_USER_ID, username: "alice" });
  });

  it("returns null when user does not exist", async () => {
    findOne.mockResolvedValue(null);

    const result = await storage.getUserById(VALID_USER_ID);

    expect(result).toBeNull();
  });

  it("throws InvalidUserIdError for invalid ObjectId", async () => {
    await expect(storage.getUserById("not-an-id")).rejects.toThrow(InvalidUserIdError);
    expect(mockedGetDatabase).not.toHaveBeenCalled();
  });
});

describe("getUsersByIds", () => {
  let toArray: jest.MockedFunction<() => Promise<unknown[]>>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    const col = makeMockFind();
    toArray = col.toArray as jest.MockedFunction<() => Promise<unknown[]>>;
    mockDb = { collection: jest.fn(() => col) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  it("returns empty object for empty input without querying DB", async () => {
    const result = await storage.getUsersByIds([]);

    expect(result).toEqual({});
    expect(mockedGetDatabase).not.toHaveBeenCalled();
  });

  it("returns full map when all users found", async () => {
    toArray.mockResolvedValue([
      { _id: new ObjectId(VALID_USER_ID), username: "alice" },
      { _id: new ObjectId(VALID_USER_ID_2), username: "bob" },
      { _id: new ObjectId(VALID_USER_ID_3), username: "carol" },
    ]);

    const result = await storage.getUsersByIds([VALID_USER_ID, VALID_USER_ID_2, VALID_USER_ID_3]);

    expect(result).toEqual({
      [VALID_USER_ID]: "alice",
      [VALID_USER_ID_2]: "bob",
      [VALID_USER_ID_3]: "carol",
    });
  });

  it("returns only found users when some are missing", async () => {
    toArray.mockResolvedValue([
      { _id: new ObjectId(VALID_USER_ID), username: "alice" },
      { _id: new ObjectId(VALID_USER_ID_2), username: "bob" },
    ]);

    const result = await storage.getUsersByIds([VALID_USER_ID, VALID_USER_ID_2, VALID_USER_ID_3]);

    expect(result).toEqual({
      [VALID_USER_ID]: "alice",
      [VALID_USER_ID_2]: "bob",
    });
    expect(result).not.toHaveProperty(VALID_USER_ID_3);
  });
});
