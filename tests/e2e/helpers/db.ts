import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

/**
 * Connect to MongoDB using environment variables
 * Uses MONGODB_URI and MONGODB_DB (defaults to 'session-combat-e2e' for tests)
 */
async function connectDB(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const client_ = new MongoClient(mongoUri);
  await client_.connect();
  client = client_;
  return client;
}

/**
 * Get the test database instance
 */
async function getTestDB() {
  const mongoClient = await connectDB();
  const dbName = process.env.MONGODB_DB || "session-combat-e2e";
  return mongoClient.db(dbName);
}

/**
 * Clear collections between test scenarios to ensure deterministic behavior
 * Only meant to be used during test execution
 */
export async function clearTestCollections(): Promise<void> {
  const dbName = process.env.MONGODB_DB || "session-combat-e2e";
  const allowCleanup = process.env.ALLOW_DB_CLEANUP === "true";
  const isTestDb = /test|e2e/i.test(dbName);

  if (!process.env.MONGODB_URI) {
    console.warn(
      "MONGODB_URI not set; skipping collection cleanup. This is expected in local development without a running test database.",
    );
    return;
  }

  if (!allowCleanup && !isTestDb) {
    console.error(
      `Refusing to clear collections for non-test database "${dbName}". Either set MONGODB_DB to include "test" or "e2e", or set ALLOW_DB_CLEANUP=true to override.`,
    );
    throw new Error("Unsafe database configuration for clearTestCollections");
  }

  try {
    const db = await getTestDB();

    // Collections to clear between tests
    const collectionsToClean = [
      "users",
      "characters",
      "parties",
      "monsters",
      "encounters",
      "combats",
    ];

    for (const collectionName of collectionsToClean) {
      try {
        await db.collection(collectionName).deleteMany({});
      } catch (error) {
        // Collection might not exist; log error for debugging
        console.debug(
          `Collection ${collectionName} not found or could not be cleared`,
          error,
        );
      }
    }

    console.log("Test collections cleared");
  } catch (error) {
    console.error("Failed to clear test collections:", error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB (cleanup after tests)
 */
export async function disconnectDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}

/**
 * Delete specific documents from a collection (for targeted cleanup)
 */
export async function deleteFromCollection(
  collectionName: string,
  filter: Record<string, unknown>,
): Promise<void> {
  const dbName = process.env.MONGODB_DB || "session-combat-e2e";
  const allowCleanup = process.env.ALLOW_DB_CLEANUP === "true";
  const isTestDb = /test|e2e/i.test(dbName);

  if (!allowCleanup && !isTestDb) {
    console.error(
      `Refusing to delete from collection on non-test DB "${dbName}". Set ALLOW_DB_CLEANUP=true to override.`,
    );
    throw new Error("Unsafe database configuration for deleteFromCollection");
  }

  try {
    const db = await getTestDB();
    await db.collection(collectionName).deleteMany(filter);
  } catch (error) {
    console.error(`Failed to delete from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Find documents in a collection (for verification or debugging)
 */
export async function findInCollection(
  collectionName: string,
  filter: Record<string, unknown> = {},
): Promise<Record<string, unknown>[]> {
  try {
    const db = await getTestDB();
    return (await db
      .collection(collectionName)
      .find(filter)
      .toArray()) as Record<string, unknown>[];
  } catch (error) {
    console.error(`Failed to find in ${collectionName}:`, error);
    throw error;
  }
}
