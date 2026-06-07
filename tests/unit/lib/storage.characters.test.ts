/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "@/lib/db";

const mockedUpdateMany = jest.fn().mockResolvedValue({});
const mockedUpdateOne = jest.fn();

const mockedCollection = jest.fn().mockReturnValue({
  updateOne: mockedUpdateOne,
  updateMany: mockedUpdateMany,
});

jest.mocked(getDatabase).mockResolvedValue({ collection: mockedCollection } as any);

describe("storage.deleteCharacter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCollection.mockReturnValue({
      updateOne: mockedUpdateOne,
      updateMany: mockedUpdateMany,
    });
  });

  test("T2-A: resolves without error when character is found (matchedCount === 1)", async () => {
    mockedUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

    await expect(storage.deleteCharacter("char-123", "user-456")).resolves.toBeUndefined();
    expect(mockedUpdateOne).toHaveBeenCalledTimes(1);
  });

  test("T2-B: throws when character is not found (matchedCount === 0)", async () => {
    mockedUpdateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

    await expect(storage.deleteCharacter("char-123", "user-456")).rejects.toThrow(
      "Character char-123 not found"
    );
  });
});
