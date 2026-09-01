import { ObjectId } from "mongodb";
import { registerTestUser } from "./helpers/users";
import { DEFAULT_PREFERENCES } from "@/lib/preferences/schema";
import { InvalidUserIdError } from "@/lib/permissions";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/storage/userPreferencesRepo";
import { getDatabase } from "@/lib/db";
import { logStorageEvent } from "@/lib/telemetry/logger";

jest.mock("@/lib/telemetry/logger", () => ({
  ...jest.requireActual("@/lib/telemetry/logger"),
  logStorageEvent: jest.fn(),
}));

const mockLogStorageEvent = logStorageEvent as jest.MockedFunction<typeof logStorageEvent>;

describe("userPreferencesRepo integration", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
  });

  const newUser = async () => (await registerTestUser(baseUrl, "prefs")).userId;

  it("returns resolved defaults for a user with no preferences field", async () => {
    const userId = await newUser();
    await expect(getUserPreferences(userId)).resolves.toEqual({
      schemaVersion: 1,
      values: DEFAULT_PREFERENCES,
      stored: {},
    });
  });

  it("persists a delta and reflects it on the next read (round-trip)", async () => {
    const userId = await newUser();
    const size = { height: 500, screenWidth: 1440, screenHeight: 900 };
    await updateUserPreferences(userId, { dice: { sendToChat: true }, chat: { size } });
    const read = await getUserPreferences(userId);
    expect(read.values.dice.sendToChat).toBe(true);
    expect(read.values.chat.size).toEqual(size);
    expect(read.values.dice.disableAnimation).toBeNull();
  });

  it("merges successive updates rather than replacing them", async () => {
    const userId = await newUser();
    await updateUserPreferences(userId, { dice: { sendToChat: true } });
    await updateUserPreferences(userId, { chat: { pinned: true } });
    const read = await getUserPreferences(userId);
    expect(read.values.dice.sendToChat).toBe(true);
    expect(read.values.chat.pinned).toBe(true);
  });

  it("does not store a value equal to the default (unset)", async () => {
    const userId = await newUser();
    await updateUserPreferences(userId, { dice: { sendToChat: true } });
    await updateUserPreferences(userId, { dice: { sendToChat: false } });
    const read = await getUserPreferences(userId);
    expect(read.values.dice.sendToChat).toBe(false);
    expect(read.stored).toEqual({});
  });

  it("rejects a malformed userId", async () => {
    await expect(getUserPreferences("not-an-id")).rejects.toBeInstanceOf(InvalidUserIdError);
    await expect(
      updateUserPreferences("not-an-id", { dice: { sendToChat: true } }),
    ).rejects.toBeInstanceOf(InvalidUserIdError);
  });

  it("routes reads and writes through the storage telemetry seam", async () => {
    const userId = await newUser();
    mockLogStorageEvent.mockClear();
    await updateUserPreferences(userId, { dice: { sendToChat: true } });
    await getUserPreferences(userId);

    const events = mockLogStorageEvent.mock.calls.map((c) => c[0]);
    const prefEvents = events.filter((e) => e.name.endsWith("UserPreferences"));
    expect(prefEvents.map((e) => e.name)).toEqual(
      expect.arrayContaining(["updateUserPreferences", "getUserPreferences"]),
    );
    for (const e of prefEvents) expect(e.collection).toBe("users");
  });

  it("resolves a stored document with unknown / stale keys to defaults + valid deltas", async () => {
    const userId = await newUser();
    const db = await getDatabase();
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          preferences: {
            schemaVersion: 0,
            values: { dice: { sendToChat: true, bogus: 1 }, junk: true },
            updatedAt: new Date(),
          },
        },
      },
    );
    const read = await getUserPreferences(userId);
    expect(read.values).toEqual({
      ...DEFAULT_PREFERENCES,
      dice: { ...DEFAULT_PREFERENCES.dice, sendToChat: true },
    });
    expect(read.stored).toEqual({ dice: { sendToChat: true } });
  });
});
