import { MongoClient } from "mongodb";

export async function dropTestDatabase(uri: string): Promise<void> {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db("session-combat-test").dropDatabase();
  } finally {
    await client.close();
  }
}
