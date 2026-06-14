import { MongoClient, Db, MongoClientOptions } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "session-combat";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectionPromise: Promise<{ client: MongoClient; db: Db }> | null = null;

/**
 * Initialize MongoDB views and indexes after database connection.
 *
 * Creates the `characters_active` view that automatically filters out soft-deleted characters.
 * This ensures that all queries against the view only return active (non-deleted) characters,
 * enforcing the soft delete logic at the database layer rather than in application code.
 *
 * Also creates an index on the deletedAt field for optimal query performance when the view
 * evaluates its filtering pipeline.
 */
async function initializeDatabase(db: Db): Promise<void> {
  try {
    // Compound index to support active-combat queries and completed-combat event queries
    await db.collection("combatStates").createIndex(
      { userId: 1, campaignId: 1, completedAt: 1 },
      { background: true }
    );
    console.log("Created index on combatStates.{userId,campaignId,completedAt}");

    // Create index on deletedAt field for optimal query performance
    // This index accelerates the $match pipeline in the characters_active view
    await db.collection("characters").createIndex({ deletedAt: 1 });
    console.log("Created index on characters.deletedAt");

    // Index on users.email for O(1) lookup in auth and password-reset flows — isolated so a
    // duplicate-email failure doesn't abort password_reset_tokens index creation below
    try {
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      console.log("Created index on users.email");
    } catch (indexError) {
      if (indexError instanceof Error && !indexError.message.includes("already exists")) {
        console.warn("Warning creating users.email index:", indexError.message);
      }
    }

    try {
      await db.collection("users").createIndex({ username: 1 }, { unique: true, sparse: true });
      console.log("Created index on users.username");
    } catch (indexError) {
      if (indexError instanceof Error && !indexError.message.includes("already exists")) {
        console.warn("Warning creating users.username index:", indexError.message);
      }
    }

    // Unique index on tokenHash for O(1) reset-token lookup
    await db
      .collection("password_reset_tokens")
      .createIndex({ tokenHash: 1 }, { unique: true });
    // Unique index on userId ensures replaceOne+upsert is atomic — only one token per user
    await db
      .collection("password_reset_tokens")
      .createIndex({ userId: 1 }, { unique: true });
    console.log("Created indexes on password_reset_tokens.tokenHash and userId");

    try {
      await db
        .collection("campaignMembers")
        .createIndex({ campaignId: 1, userId: 1 }, { unique: true });
      console.log("Created index on campaignMembers.{campaignId, userId}");
    } catch (indexError) {
      if (indexError instanceof Error && !indexError.message.includes("already exists")) {
        console.warn("Warning creating campaignMembers.{campaignId, userId} index:", indexError.message);
      }
    }

    try {
      await db.collection("campaignMembers").createIndex({ userId: 1 });
      console.log("Created index on campaignMembers.userId");
    } catch (indexError) {
      if (indexError instanceof Error && !indexError.message.includes("already exists")) {
        console.warn("Warning creating campaignMembers.userId index:", indexError.message);
      }
    }

    try {
      await db
        .collection("campaignCharacterShares")
        .createIndex({ campaignId: 1, characterId: 1 }, { unique: true });
      console.log("Created index on campaignCharacterShares.{campaignId, characterId}");
    } catch (indexError) {
      if (indexError instanceof Error && !indexError.message.includes("already exists")) {
        console.warn("Warning creating campaignCharacterShares.{campaignId, characterId} index:", indexError.message);
      }
    }

    try {
      await db
        .collection("campaignCharacterShares")
        .createIndex({ campaignId: 1, userId: 1 });
      console.log("Created index on campaignCharacterShares.{campaignId, userId}");
    } catch (indexError) {
      if (indexError instanceof Error && !indexError.message.includes("already exists")) {
        console.warn("Warning creating campaignCharacterShares.{campaignId, userId} index:", indexError.message);
      }
    }

    try {
      await db
        .collection("campaignMessages")
        .createIndex({ campaignId: 1, createdAt: 1 });
      console.log("Created index on campaignMessages.{campaignId, createdAt}");
    } catch (indexError) {
      if (indexError instanceof Error && !indexError.message.includes("already exists")) {
        console.warn("Warning creating campaignMessages.{campaignId, createdAt} index:", indexError.message);
      }
    }

    // Check if characters_active already exists as a view; only drop views,
    // never a real collection, to avoid accidental data loss during re-initialization.
    const existing = await db
      .listCollections({ name: "characters_active" })
      .toArray();
    if (existing.length > 0 && existing[0].type === "view") {
      try {
        await db.dropCollection("characters_active");
      } catch (error) {
        // Only ignore NamespaceNotFound; rethrow any other error so the outer
        // catch block can handle it appropriately.
        if (
          !(
            error instanceof Error &&
            "codeName" in error &&
            (error as { codeName?: string }).codeName === "NamespaceNotFound"
          )
        ) {
          throw error;
        }
      }
    }

    // Create characters_active MongoDB view that filters out soft-deleted characters.
    // { deletedAt: null } matches both null values AND missing fields, providing
    // backward compatibility with characters created before soft delete was implemented.
    await db.createCollection("characters_active", {
      viewOn: "characters",
      pipeline: [{ $match: { deletedAt: null } }],
    });
    console.log("Created characters_active view");
  } catch (error) {
    // Silently ignore view/index errors - they may already exist or fail in read-only environments
    if (error instanceof Error && !error.message.includes("already exists")) {
      console.warn("Warning during database initialization:", error.message);
    }
  }
}

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const options: MongoClientOptions = {
        maxPoolSize: 10,
      };

      const client = new MongoClient(MONGODB_URI, options);
      await client.connect();

      const db = client.db(DB_NAME);

      try {
        // Verify connection
        await db.admin().ping();

        // Initialize views and indexes
        await initializeDatabase(db);
      } catch (initError) {
        await client.close().catch(() => {});
        throw initError;
      }

      cachedClient = client;
      cachedDb = db;

      console.log("Connected to MongoDB");
      return { client, db };
    } catch (error) {
      connectionPromise = null;
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  })();

  return connectionPromise;
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export async function closeDatabase(): Promise<void> {
  connectionPromise = null;
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
