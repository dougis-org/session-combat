import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { ChildProcess, spawn } from "child_process";
import fetch from "node-fetch";
import { findAvailablePort } from "../utils/port";

export interface TestServer {
  baseUrl: string;
  cleanup: () => Promise<void>;
}

/**
 * Wait for the server to respond OK on the given URL.
 * Logs each retry attempt and includes attempt count and last error in the
 * thrown Error if the server never becomes ready.
 */
async function waitForServer(
  url: string,
  maxAttempts = 30,
  delay = 2000,
): Promise<void> {
  let lastError: unknown;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    console.log(`  [waitForServer] attempt ${i}/${maxAttempts} — ${url} not ready yet`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(
    `Server did not become ready at ${url} after ${maxAttempts} attempts. ` +
      `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

/**
 * Start a MongoDB testcontainer + Next.js process.
 * Returns { baseUrl, cleanup } — call cleanup() in afterAll.
 */
export async function startTestServer(): Promise<TestServer> {
  console.log("Starting MongoDB container...");
  const mongoContainer: StartedMongoDBContainer = await new MongoDBContainer("mongo:8")
    .withExposedPorts(27017)
    .start();
  console.log("MongoDB container started");

  // Use localhost + mapped port with directConnection=true.
  // MongoDBContainer starts mongod with --replSet rs0; without directConnection
  // the driver performs replica-set member discovery and resolves the container's
  // internal hostname (e.g. 5743b865e394), which is unreachable from the host OS.
  const mongoUri = `mongodb://localhost:${mongoContainer.getMappedPort(27017)}/?directConnection=true`;
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_DB = "session-combat-test";

  const port = await findAvailablePort(3000);
  const baseUrl = `http://localhost:${port}`;
  console.log(`Starting Next.js server on port ${port}...`);

  const spawnEnv = {
    ...process.env,
    PORT: port.toString(),
    HOSTNAME: "0.0.0.0",
    MONGODB_URI: mongoUri,
    MONGODB_DB: "session-combat-test",
  };

  const nextProcess: ChildProcess = spawn("npx", ["next", "start"], {
    env: spawnEnv,
    stdio: "pipe",
    detached: true,
  });

  nextProcess.stdout?.on("data", (data: Buffer) => {
    console.log(`Next.js: ${data.toString().trim()}`);
  });
  nextProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`Next.js Error: ${data.toString().trim()}`);
  });

  console.log("Waiting for Next.js server to be ready...");
  await waitForServer(`${baseUrl}/api/health`);
  console.log("Next.js server is ready");

  const cleanup = async (): Promise<void> => {
    console.log("Cleaning up test server...");
    if (nextProcess.pid) {
      try {
        process.kill(-nextProcess.pid, "SIGTERM");
      } catch {
        nextProcess.kill("SIGTERM");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    await mongoContainer.stop();
    console.log("Cleanup complete");
  };

  return { baseUrl, cleanup };
}

/**
 * Register a user via the API and return the session cookie string
 * extracted from the Set-Cookie header, ready to pass as a Cookie header
 * in subsequent requests.
 */
export async function registerAndGetCookie(
  baseUrl: string,
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.status !== 201) {
    throw new Error(
      `Registration failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No Set-Cookie header in register response");
  }

  // Extract the cookie name=value pairs (strip attributes like Path, HttpOnly, etc.)
  return setCookie
    .split(",")
    .map((c) => c.split(";")[0].trim())
    .join("; ");
}
