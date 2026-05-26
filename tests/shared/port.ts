/**
 * djb2 hash of process.cwd() mapped to port range 20000–49999.
 * Deterministic per working directory — different agent directories get different ports.
 */
export function getDirectoryBasePort(): number {
  const cwd = process.cwd();
  let hash = 5381;
  for (let i = 0; i < cwd.length; i++) {
    hash = ((hash << 5) + hash + cwd.charCodeAt(i)) >>> 0;
  }
  return 20000 + (hash % 30000);
}
