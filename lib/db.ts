import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'session-combat';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Initialize MongoDB views and indexes after database connection.
 * Creates the characters_active view for soft-deleted character filtering.
 */
async function initializeDatabase(db: Db): Promise<void> {
  try {
    // Create index on deletedAt field for optimal query performance
    await db.collection('characters').createIndex({ deletedAt: 1 });
    console.log('Created index on characters.deletedAt');

    // Create characters_active view that filters out soft-deleted characters
    try {
      await db.dropCollection('characters_active');
    } catch {
      // View doesn't exist yet, ignore error
    }

    await db.createCollection('characters_active', {
      viewOn: 'characters',
      pipeline: [
        { $match: { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] } }
      ]
    });
    console.log('Created characters_active view');
  } catch (error) {
    // Silently ignore view/index errors - they may already exist or fail in read-only environments
    if (error instanceof Error && !error.message.includes('already exists')) {
      console.warn('Warning during database initialization:', error.message);
    }
  }
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const options: MongoClientOptions = {
      maxPoolSize: 10,
    };

    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();

    const db = client.db(DB_NAME);

    // Verify connection
    await db.admin().ping();

    // Initialize views and indexes
    await initializeDatabase(db);

    cachedClient = client;
    cachedDb = db;

    console.log('Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
