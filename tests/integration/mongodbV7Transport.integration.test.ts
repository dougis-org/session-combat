/**
 * Driver-version-sensitive coverage for the mongodb v6 -> v7 upgrade (issue #638).
 *
 * EXCLUDED FROM SHARED SERVER MIGRATION — same rationale as dedupeEngine.integration.test.ts:
 * these tests manage their own dedicated MongoDB container(s) (one standalone, one
 * replica-set) instead of using the shared global-setup container, since they need to
 * force specific topology/failure conditions (non-replset, forced invalidation) that the
 * shared instance can't safely be put into without affecting every other integration test.
 */
import { GenericContainer, Wait, StartedTestContainer } from "testcontainers";
import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient, Db } from "mongodb";
import { TEST_MONGO_CLIENT_OPTIONS } from "@/tests/shared/mongo";

const WATCHED = ["campaigns", "campaignMessages", "campaignRolls"];

async function withEnv<T>(uri: string, dbName: string, fn: () => Promise<T>): Promise<T> {
  const savedUri = process.env.MONGODB_URI;
  const savedDb = process.env.MONGODB_DB;
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = dbName;
  try {
    return await fn();
  } finally {
    if (savedUri !== undefined) process.env.MONGODB_URI = savedUri; else delete process.env.MONGODB_URI;
    if (savedDb !== undefined) process.env.MONGODB_DB = savedDb; else delete process.env.MONGODB_DB;
  }
}

describe("mongodb v7 upgrade: standalone-mode detection (issue #638)", () => {
  let container: StartedTestContainer;
  let uri: string;

  beforeAll(async () => {
    // Plain mongod, no --replSet — a genuine standalone instance, unlike MongoDBContainer
    // (which always initiates a replica set). This is what detectReplicaSet() must
    // correctly reject as non-replica-set.
    container = await new GenericContainer("mongo:8")
      .withExposedPorts(27017)
      .withWaitStrategy(Wait.forLogMessage(/Waiting for connections/))
      .withStartupTimeout(120_000)
      .start();
    uri = `mongodb://${container.getHost()}:${container.getMappedPort(27017)}/?directConnection=true`;
  }, 120000);

  afterAll(async () => {
    await container?.stop();
  }, 30000);

  it("watch() on a standalone instance throws an error matching one of the four known conditions", async () => {
    const client = new MongoClient(uri, TEST_MONGO_CLIENT_OPTIONS);
    try {
      await client.connect();
      let caught: unknown;
      try {
        // Driver v7 constructs the cursor lazily — close() alone (matching the v6-era probe
        // shape) no longer forces the initial aggregate to reach the server, so the
        // standalone rejection wouldn't surface. tryNext() forces that first command, exactly
        // as the fixed detectReplicaSet() probe in lib/server/transport.ts now does.
        const cursor = client
          .db("session-combat-test")
          .collection("campaigns")
          .watch([], { maxAwaitTimeMS: 100 });
        await cursor.tryNext();
        await cursor.close();
        throw new Error("watch() unexpectedly succeeded against a standalone instance");
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(Error);
      const err = caught as Error & { code?: number };
      const matches =
        err.message.includes("not running with --replSet") ||
        err.message.includes("$changeStream") ||
        err.code === 76 ||
        err.code === 40573;
      expect(matches).toBe(true);
    } finally {
      await client.close();
    }
  });

  it("subscribe() falls back to polling (no near-instant delivery) against a standalone instance", async () => {
    await withEnv(uri, "session-combat-test", async () => {
      jest.resetModules();
      const { subscribe } = await import("@/lib/server/transport");
      const { closeDatabase, getDatabase } = await import("@/lib/db");
      const db = await getDatabase();
      const campaignId = `standalone-${Date.now()}`;

      const events: unknown[] = [];
      const unsubscribe = await subscribe(campaignId, "user-1", (e) => events.push(e));

      try {
        const start = Date.now();
        // pollCampaigns() filters with a strict $gt against `since` (captured at subscribe()
        // time, millisecond precision) — without a gap, this insert can land in the exact
        // same millisecond and never match.
        await new Promise((r) => setTimeout(r, 10));
        await db.collection("campaigns").insertOne({
          id: campaignId,
          campaignId,
          updatedAt: new Date(),
        });

        // A change-stream-backed subscription would observe this almost immediately.
        // The polling path only sweeps every 2000ms, so waiting well under that interval
        // and finding nothing is itself evidence the polling (not change-stream) path
        // was selected — directly exercising detectReplicaSet()'s standalone branch.
        await new Promise((r) => setTimeout(r, 800));
        expect(events.length).toBe(0);
        expect(Date.now() - start).toBeGreaterThanOrEqual(800);

        // Confirm delivery does eventually happen via the poll interval.
        await new Promise((r) => setTimeout(r, 2500));
        expect(events.length).toBeGreaterThan(0);
      } finally {
        unsubscribe();
        await closeDatabase();
      }
    });
  }, 15000);
});

describe("mongodb v7 upgrade: change-stream pipeline + invalidation recovery (issue #638)", () => {
  let mongoContainer: StartedMongoDBContainer;
  let uri: string;
  let db: Db;
  let client: MongoClient;

  beforeAll(async () => {
    mongoContainer = await new MongoDBContainer("mongo:8").withExposedPorts(27017).start();
    // Include the db name in the path, matching how a real (Atlas-style) production URI
    // embeds it — openStream()'s bare client.db() call relies on that to resolve the same
    // database as connectToDatabase()'s explicit client.db(DB_NAME); a bare host:port URI
    // with no path segment would silently default to "test" instead.
    uri = `${mongoContainer.getConnectionString()}/session-combat-test?directConnection=true`;
    client = new MongoClient(uri, TEST_MONGO_CLIENT_OPTIONS);
    await client.connect();
    db = client.db("session-combat-test");
  }, 120000);

  afterAll(async () => {
    await client?.close();
    await mongoContainer?.stop();
  }, 30000);

  beforeEach(async () => {
    for (const coll of [...WATCHED, "campaignMembers"]) {
      await db.collection(coll).deleteMany({});
    }
  });

  it("the existing $changeStream pipeline opens cleanly and observes writes to all three watched collections", async () => {
    await withEnv(uri, "session-combat-test", async () => {
      jest.resetModules();
      const { subscribe } = await import("@/lib/server/transport");
      const { closeDatabase, getDatabase } = await import("@/lib/db");
      const liveDb = await getDatabase();
      const campaignId = `pipeline-${Date.now()}`;
      const userId = "dm-user";

      await liveDb.collection("campaignMembers").insertOne({
        id: "m1",
        campaignId,
        userId,
        role: "dm",
        status: "active",
        history: [],
      });

      const events: Array<{ type: string; campaignId: string; data: unknown }> = [];
      const unsubscribe = await subscribe(campaignId, userId, (e) => events.push(e));

      try {
        // Give the change stream time to actually open before writing.
        await new Promise((r) => setTimeout(r, 1000));

        await liveDb.collection("campaigns").insertOne({
          id: campaignId,
          campaignId,
          updatedAt: new Date(),
          activeSessionId: "s1",
        });
        await liveDb.collection("campaignMessages").insertOne({
          id: "msg1",
          campaignId,
          senderId: userId,
          senderName: "DM",
          text: "hello",
          visibility: { scope: "group" },
          createdAt: new Date(),
        });
        await liveDb.collection("campaignRolls").insertOne({
          id: "roll1",
          campaignId,
          sessionId: "s1",
          rollerId: userId,
          rollerName: "DM",
          formula: "1d20",
          rolls: [10],
          total: 10,
          visibility: { scope: "group" },
          createdAt: new Date(),
        });
        // Unrelated collection — must be filtered server-side, never reach the handler.
        await liveDb.collection("someOtherCollection").insertOne({ campaignId, junk: true });

        await new Promise((r) => setTimeout(r, 1500));

        const types = events.map((e) => e.type);
        expect(types).toEqual(expect.arrayContaining(["change", "session", "message", "roll"]));
        expect(events.some((e) => (e.data as { junk?: boolean })?.junk === true)).toBe(false);
      } finally {
        unsubscribe();
        await closeDatabase();
      }
    });
  }, 20000);

  it("survives an idle gap between change events with no premature teardown", async () => {
    await withEnv(uri, "session-combat-test", async () => {
      jest.resetModules();
      const { subscribe } = await import("@/lib/server/transport");
      const { closeDatabase, getDatabase } = await import("@/lib/db");
      const liveDb = await getDatabase();
      const campaignId = `idle-${Date.now()}`;

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const events: Array<{ type: string }> = [];
      const unsubscribe = await subscribe(campaignId, "user-idle", (e) => events.push(e));

      try {
        // Holds the stream open with zero writes for a meaningfully longer gap than the
        // other tests' sub-2s windows, so this proves the stream survives genuine idle
        // time rather than only proving events propagate quickly when they happen right away.
        await new Promise((r) => setTimeout(r, 10000));

        const prematureTermination = errorSpy.mock.calls.some(
          ([msg]) => msg === "transport change stream terminated:"
        );
        expect(prematureTermination).toBe(false);

        await liveDb.collection("campaigns").insertOne({
          id: campaignId,
          campaignId,
          updatedAt: new Date(),
        });
        await new Promise((r) => setTimeout(r, 1500));
        expect(events.some((e) => e.type === "change")).toBe(true);
      } finally {
        unsubscribe();
        errorSpy.mockRestore();
        await closeDatabase();
      }
    });
  }, 20000);

  it("recovers automatically after the change stream is invalidated (watched collection dropped)", async () => {
    await withEnv(uri, "session-combat-test", async () => {
      jest.resetModules();
      const { subscribe } = await import("@/lib/server/transport");
      const { closeDatabase, getDatabase } = await import("@/lib/db");
      const liveDb = await getDatabase();
      const campaignId = `invalidation-${Date.now()}`;
      const userId = "dm-user-2";

      await liveDb.collection("campaignMembers").insertOne({
        id: "m2",
        campaignId,
        userId,
        role: "dm",
        status: "active",
        history: [],
      });

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const events: Array<{ type: string; campaignId: string; data: unknown }> = [];
      const unsubscribe = await subscribe(campaignId, userId, (e) => events.push(e));

      try {
        await new Promise((r) => setTimeout(r, 1000));

        // openStream() opens a DATABASE-level change stream (client.db().watch(...)), and per
        // MongoDB's change-stream invalidation rules, a database-level stream is invalidated
        // only by dropping the database itself — dropping a single collection within it just
        // emits a normal (non-invalidating) "drop" event that demux() silently ignores.
        await liveDb.dropDatabase();

        // Allow the invalidation event to propagate and the automatic reopen to complete.
        await new Promise((r) => setTimeout(r, 2000));

        // Driver v7 removed the distinct ChangeStreamInvalidatedError class — invalidation
        // now arrives as an ordinary `{ operationType: 'invalidate' }` document through
        // iteration (see lib/server/transport.ts's openStream()), so the log this produces
        // is a plain string in the second arg, not an Error with a distinguishable `.name`.
        const invalidationLogged = errorSpy.mock.calls.some(
          ([msg, detail]) =>
            msg === "transport change stream terminated:" && detail === "invalidate event received"
        );
        expect(invalidationLogged).toBe(true);

        // Confirm the cursor was actually reopened (not just closed) by writing a fresh
        // document post-invalidation and observing it.
        events.length = 0;
        await liveDb.collection("campaigns").insertOne({
          id: campaignId,
          campaignId,
          updatedAt: new Date(),
        });
        await new Promise((r) => setTimeout(r, 1500));
        expect(events.some((e) => e.type === "change")).toBe(true);
      } finally {
        unsubscribe();
        errorSpy.mockRestore();
        await closeDatabase();
      }
    });
  }, 20000);
});
