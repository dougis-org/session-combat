import { MongoDBContainer } from "@testcontainers/mongodb";
import { spawn } from "child_process";
import fetch from "node-fetch";
import { getDirectoryBasePort } from "../shared/port";
import { dropTestDatabase } from "../shared/mongo";
import { startDndBeyondMockServer } from "../mocks/dndBeyond/server";

async function waitForServer(
  url: string,
  nextProcess?: import("child_process").ChildProcess,
  maxAttempts = 60,
  delay = 2000,
): Promise<void> {
  let lastError: unknown;
  for (let i = 1; i <= maxAttempts; i++) {
    if (nextProcess && nextProcess.exitCode !== null) {
      throw new Error(`Next.js process exited prematurely with code ${nextProcess.exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    console.log(`  [waitForServer] attempt ${i}/${maxAttempts} — not ready yet`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(
    `Server did not become ready at ${url} after ${maxAttempts} attempts. ` +
      `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

async function globalSetup(): Promise<void> {
  console.log("Starting MongoDB container...");
  const mongoContainer = await new MongoDBContainer("mongo:8")
    .withExposedPorts(27017)
    .start();
  global.__MONGO_CONTAINER__ = mongoContainer;
  console.log("MongoDB container started");

  const mongoUri = `mongodb://localhost:${mongoContainer.getMappedPort(27017)}/?directConnection=true`;

  await dropTestDatabase(mongoUri);
  console.log("Test database dropped (clean slate)");

  const { server: dndBeyondServer, baseUrl: dndBeyondBaseUrl } = await startDndBeyondMockServer();
  global.__DND_BEYOND_MOCK_SERVER__ = dndBeyondServer;
  console.log(`DnD Beyond mock server started at ${dndBeyondBaseUrl}`);

  const port = getDirectoryBasePort();
  console.log(`[port-select] cwd=${process.cwd()} port=${port}`);

  const nextProcess = spawn("npx", ["next", "start"], {
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "0.0.0.0",
      MONGODB_URI: mongoUri,
      MONGODB_DB: "session-combat-test",
      DND_BEYOND_CHARACTER_SERVICE_BASE_URL: dndBeyondBaseUrl,
      ALLOW_INSECURE_DND_BEYOND_CHARACTER_SERVICE_BASE_URL: "true",
    },
    stdio: "pipe",
    detached: true,
  });

  nextProcess.stdout?.on("data", (data: Buffer) => {
    console.log(`Next.js: ${data.toString().trim()}`);
  });
  nextProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`Next.js Error: ${data.toString().trim()}`);
  });

  global.__NEXT_PROCESS__ = nextProcess;

  console.log(`Waiting for Next.js server on port ${port}...`);
  await waitForServer(`http://localhost:${port}/api/health`, nextProcess);
  console.log("Next.js server is ready");

  process.env.TEST_BASE_URL = `http://localhost:${port}`;
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_DB = "session-combat-test";
}

export default globalSetup;
