import { createServer } from "net";

function djb2Port(cwd: string): number {
  let hash = 5381;
  for (let i = 0; i < cwd.length; i++) {
    hash = ((hash << 5) + hash + cwd.charCodeAt(i)) >>> 0;
  }
  return 20000 + (hash % 30000);
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

/**
 * djb2 hash of process.cwd() mapped to port range 20000–49999.
 * Deterministic per working directory — different agent directories get different ports.
 * Falls back up to 4 offsets if the base port is already in use.
 */
export async function getDirectoryPort(): Promise<number> {
  const base = djb2Port(process.cwd());
  for (let offset = 0; offset < 5; offset++) {
    const port = base + offset;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${base}–${base + 4} for cwd=${process.cwd()}`);
}

/** Synchronous version used where async is unavailable (e.g. playwright.config.ts). */
export function getDirectoryBasePort(): number {
  return djb2Port(process.cwd());
}
