import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "session-combat";

export async function runBackfill(): Promise<number> {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Query for users that lack a username field completely
    const cursor = db.collection("users").find({ username: { $exists: false } });
    const users = await cursor.toArray();

    if (users.length === 0) {
      console.log("0 users updated");
      return 0;
    }

    let updatedCount = 0;
    const assignedInRun = new Set<string>();

    // Fetch all existing usernames once to avoid N+1 query pattern inside the loop
    const existingUsers = await db
      .collection("users")
      .find({ username: { $exists: true } }, { projection: { username: 1 } })
      .toArray();
    
    const takenUsernames = new Set<string>(
      existingUsers
        .map((u) => u.username)
        .filter((username): username is string => typeof username === "string")
    );

    for (const user of users) {
      if (typeof user.email !== "string") {
        console.warn(`User document ${user._id} has an invalid or missing email field; skipping.`);
        continue;
      }

      // Derive candidate from email local-part
      const email = user.email;
      const candidateBase = email.split("@")[0];
      
      let finalUsername = candidateBase;
      let suffix = 2;

      // Find a unique username that is not in the database and not assigned during this run
      while (takenUsernames.has(finalUsername) || assignedInRun.has(finalUsername)) {
        finalUsername = `${candidateBase}-${suffix}`;
        suffix++;
      }

      // Update the user document by setting the derived unique username
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { username: finalUsername } }
      );

      assignedInRun.add(finalUsername);
      console.log(`Assigned username "${finalUsername}" to user ${email}`);
      updatedCount++;
    }

    console.log(`${updatedCount} users updated`);
    return updatedCount;
  } finally {
    await client.close();
  }
}

// Check if run directly
const isMain = typeof require !== "undefined" && require.main === module ||
  (typeof process !== "undefined" && process.argv[1] &&
    (process.argv[1].includes("backfill-usernames.ts") || process.argv[1].includes("backfill-usernames")));

if (isMain) {
  runBackfill()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error running backfill script:", error);
      process.exit(1);
    });
}
