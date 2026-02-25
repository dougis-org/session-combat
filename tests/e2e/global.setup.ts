import { MongoDBContainer } from "@testcontainers/mongodb";

async function globalSetup() {
  const container = await new MongoDBContainer().start();
  process.env.MONGODB_URI = container.getConnectionString();
  process.env.MONGODB_DB = "session-combat-e2e";

  // Store the container reference for teardown
  global.__MONGOCONTAINER__ = container;
}

export default globalSetup;
