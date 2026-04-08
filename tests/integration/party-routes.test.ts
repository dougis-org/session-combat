const mockRequireAuth = jest.fn();
const mockLoadParties = jest.fn();
const mockSaveParty = jest.fn();

jest.mock("../../lib/middleware", () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
}));

jest.mock("../../lib/storage", () => ({
  storage: {
    loadParties: (...args: any[]) => mockLoadParties(...args),
    saveParty: (...args: any[]) => mockSaveParty(...args),
  },
}));

import { POST as createParty } from "../../app/api/parties/route";
import { PUT as updateParty } from "../../app/api/parties/[id]/route";

describe("party API routes", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockLoadParties.mockReset();
    mockSaveParty.mockReset();

    mockRequireAuth.mockReturnValue({ userId: "user-1" });
    mockSaveParty.mockResolvedValue(undefined);
  });

  it("creates a party with an app-level id and authenticated userId", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Fellowship",
        description: "Ring-bearer escort",
        characterIds: ["frodo", "sam"],
      }),
    } as any;

    const response = await createParty(request);
    const savedParty = mockSaveParty.mock.calls[0][0];

    expect(mockSaveParty).toHaveBeenCalledTimes(1);
    expect(savedParty).toMatchObject({
      userId: "user-1",
      name: "Fellowship",
      description: "Ring-bearer escort",
      characterIds: ["frodo", "sam"],
    });
    expect(savedParty.id).toEqual(expect.any(String));
    expect(savedParty._id).toBeUndefined();
    expect(response.status).toBe(201);
  });

  it("updates an existing party without requiring _id on the loaded record", async () => {
    mockLoadParties.mockResolvedValue([
      {
        id: "party-123",
        userId: "user-1",
        name: "Old Name",
        description: "",
        characterIds: ["char-1"],
        createdAt: new Date("2026-04-07T00:00:00.000Z"),
        updatedAt: new Date("2026-04-07T00:01:00.000Z"),
      },
    ]);

    const request = {
      json: jest.fn().mockResolvedValue({
        name: "New Name",
        description: "Updated",
        characterIds: ["char-1", "char-2"],
      }),
    } as any;

    const response = await updateParty(request, {
      params: Promise.resolve({ id: "party-123" }),
    });
    const savedParty = mockSaveParty.mock.calls[0][0];

    expect(mockLoadParties).toHaveBeenCalledWith("user-1");
    expect(mockSaveParty).toHaveBeenCalledTimes(1);
    expect(savedParty).toMatchObject({
      id: "party-123",
      userId: "user-1",
      name: "New Name",
      description: "Updated",
      characterIds: ["char-1", "char-2"],
    });
    expect(savedParty._id).toBeUndefined();
    expect(response.status).toBe(200);
  });
});
