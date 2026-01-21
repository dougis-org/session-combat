import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;

/**
 * Connect to MongoDB using environment variables
 * Uses MONGODB_URI and MONGODB_DB (defaults to 'session-combat-e2e' for tests)
 */
async function connectDB(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
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
  const dbName = process.env.MONGODB_DB || 'session-combat-e2e';
  return mongoClient.db(dbName);
}

/**
 * Clear collections between test scenarios to ensure deterministic behavior
 * Only meant to be used during test execution
 */
export async function clearTestCollections(): Promise<void> {
  if (!process.env.MONGODB_DB) {
    console.warn(
      'MONGODB_DB not set; skipping collection cleanup. This should only happen in CI/test environments.'
    );
    return;
  }

  try {
    const db = await getTestDB();
    
    // Collections to clear between tests
    const collectionsToClean = [
      'users',
      'characters',
      'parties',
      'monsters',
      'encounters',
      'combats'
    ];

    for (const collectionName of collectionsToClean) {
      try {
        await db.collection(collectionName).deleteMany({});
      } catch (error) {
        // Collection might not exist; that's okay
        console.debug(`Collection ${collectionName} not found or could not be cleared`);
      }
    }

    console.log('Test collections cleared');
  } catch (error) {
    console.error('Failed to clear test collections:', error);
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
  filter: Record<string, any>
): Promise<void> {
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
  filter: Record<string, any> = {}
): Promise<any[]> {
  try {
    const db = await getTestDB();
    return await db.collection(collectionName).find(filter).toArray();
  } catch (error) {
    console.error(`Failed to find in ${collectionName}:`, error);
    throw error;
  }
}
