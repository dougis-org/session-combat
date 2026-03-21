import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";

async function globalSetup() {
  if (!process.env.MONGODB_URI) {
    // Start a disposable MongoDB container for E2E tests when no external URI is provided.
    console.log("MONGODB_URI not set; starting a MongoDB testcontainer for E2E tests...");
    const mongoContainer: StartedMongoDBContainer = await new MongoDBContainer("mongo:8")
      .withExposedPorts(27017)
      .start();
    global.__MONGOCONTAINER__ = mongoContainer;

    const mongoUri = `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}/?directConnection=true`;
    process.env.MONGODB_URI = mongoUri;
  }

  if (!process.env.MONGODB_DB) {
    process.env.MONGODB_DB = "session-combat-e2e";
  }

  const dbName = process.env.MONGODB_DB;
  const allowCleanup = process.env.ALLOW_DB_CLEANUP === "true";
  if (!allowCleanup && !/test|e2e/i.test(dbName)) {
    throw new Error(
      `Unsafe MONGODB_DB for E2E cleanup: "${dbName}". ` +
        'Set MONGODB_DB to include "test" or "e2e", or set ALLOW_DB_CLEANUP=true to override.',
    );
  }
}

export default globalSetup;
