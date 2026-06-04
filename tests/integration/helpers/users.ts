import fetch from "node-fetch";
import { MongoClient, ObjectId } from "mongodb";
import { createTestUser } from "@/tests/integration/auth.test.helpers";

export async function makeUserAdmin(
  userId: string,
  mongoUri = process.env.MONGODB_URI,
  mongoDb = process.env.MONGODB_DB,
): Promise<void> {
  if (!mongoUri) {
    throw new Error("Failed to promote user to admin: MONGODB_URI is not set");
  }
  if (!mongoDb) {
    throw new Error("Failed to promote user to admin: MONGODB_DB is not set");
  }
  if (!ObjectId.isValid(userId)) {
    throw new Error(`Failed to promote user to admin: invalid userId format "${userId}"`);
  }

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(mongoDb);
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isAdmin: true } }
    );
    if (result.matchedCount === 0) {
      throw new Error(`Failed to promote user to admin: user ${userId} not found`);
    }
  } finally {
    await client.close();
  }
}

export async function registerTestUser(
  baseUrl: string,
  prefix = "user",
): Promise<{ email: string; password: string; cookie: string; userId: string; username: string }> {
  const { email, password, username } = createTestUser(prefix);

  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username }),
  });

  if (response.status !== 201) {
    throw new Error(
      `Registration failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { userId: string; email: string; username: string };

  const rawHeaders = (response.headers as unknown as {
    raw?: () => Record<string, string[]>;
  }).raw?.();
  const setCookieHeaders = rawHeaders?.["set-cookie"];

  let cookieHeader: string;
  if (Array.isArray(setCookieHeaders) && setCookieHeaders.length > 0) {
    cookieHeader = setCookieHeaders.map((c) => c.split(";")[0].trim()).join("; ");
  } else {
    const single = response.headers.get("set-cookie");
    if (!single) throw new Error("No Set-Cookie header in register response");
    cookieHeader = single.split(";")[0].trim();
  }

  return { email, password, cookie: cookieHeader, userId: data.userId, username: data.username };
}
