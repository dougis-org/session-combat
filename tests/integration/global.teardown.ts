import { dropTestDatabase } from "../shared/mongo";

async function globalTeardown(): Promise<void> {
  const nextProcess = global.__NEXT_PROCESS__;
  if (nextProcess?.pid) {
    console.log("Stopping Next.js server...");
    try {
      process.kill(-nextProcess.pid, "SIGTERM");
    } catch {
      nextProcess.kill("SIGTERM");
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await dropTestDatabase(mongoUri);
      console.log("Test database dropped (teardown)");
    }
  } catch (err) {
    console.error("Failed to drop test database during teardown:", err);
  }

  try {
    const dndBeyondServer = global.__DND_BEYOND_MOCK_SERVER__;
    if (dndBeyondServer) {
      await new Promise<void>((resolve) => dndBeyondServer.close(() => resolve()));
      console.log("DnD Beyond mock server stopped");
    }
  } catch (err) {
    console.error("Failed to stop DnD Beyond mock server during teardown:", err);
  }

  try {
    const mongoContainer = global.__MONGO_CONTAINER__;
    if (mongoContainer) {
      console.log("Stopping MongoDB container...");
      await mongoContainer.stop();
      console.log("MongoDB container stopped");
    }
  } catch (err) {
    console.error("Failed to stop MongoDB container during teardown:", err);
  }
}

export default globalTeardown;
