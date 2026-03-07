async function globalSetup() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. E2E tests require a running MongoDB instance.\n" +
      "Set MONGODB_URI before running: MONGODB_URI=mongodb://localhost:27017 npm run test:regression",
    );
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
