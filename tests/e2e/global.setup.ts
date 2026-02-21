import { MongoDBContainer } from "@testcontainers/mongodb";

async function globalSetup() {
  const container = await new MongoDBContainer().start();
  process.env.MONGODB_URI = container.getConnectionString();
  process.env.MONGODB_DB = "session-combat";

  // Store the container ID to be able to stop it in the teardown
  (global as any).__MONGOCONTAINER__ = container;
}

export default globalSetup;
