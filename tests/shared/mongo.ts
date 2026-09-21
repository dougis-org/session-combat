import { MongoClient, type MongoClientOptions } from "mongodb";
import * as os from "os";

// Driver v7 resolves its client-metadata `os` adapter via a dynamic `import('os')`, which
// Jest's VM-sandboxed node test environment can't service — the import silently rejects,
// the driver swallows it, and MongoDB then rejects the connection with "Missing required
// sub-document 'driver'". Supplying the adapter synchronously sidesteps the dynamic import.
// See lib/db.ts for the equivalent fix in application code. Every test file that
// constructs its own MongoClient directly (rather than going through lib/db.ts) needs this.
export const TEST_MONGO_CLIENT_OPTIONS: MongoClientOptions = { runtimeAdapters: { os } };

export async function dropTestDatabase(uri: string): Promise<void> {
  const client = new MongoClient(uri, TEST_MONGO_CLIENT_OPTIONS);
  try {
    await client.connect();
    await client.db(process.env.MONGODB_DB ?? "session-combat-test").dropDatabase();
  } finally {
    await client.close();
  }
}
