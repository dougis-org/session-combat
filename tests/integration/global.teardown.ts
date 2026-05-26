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

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await dropTestDatabase(mongoUri);
    console.log("Test database dropped (teardown)");
  }

  const dndBeyondServer = global.__DND_BEYOND_MOCK_SERVER__;
  if (dndBeyondServer) {
    await new Promise<void>((resolve) => dndBeyondServer.close(() => resolve()));
    console.log("DnD Beyond mock server stopped");
  }

  const mongoContainer = global.__MONGO_CONTAINER__;
  if (mongoContainer) {
    console.log("Stopping MongoDB container...");
    await mongoContainer.stop();
    console.log("MongoDB container stopped");
  }
}

export default globalTeardown;
