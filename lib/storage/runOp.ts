import { logStorageEvent } from "@/lib/telemetry/logger";
import { StorageError } from "@/lib/storage/errors";

export interface RunStorageOpMeta<T> {
  name: string;
  collection: string;
  isEmpty?: (result: T) => boolean;
}

export async function runStorageOp<T>(
  meta: RunStorageOpMeta<T>,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  let result: T;
  try {
    result = await fn();
  } catch (error) {
    logStorageEvent({
      name: meta.name,
      collection: meta.collection,
      outcome: "error",
      durationMs: Date.now() - start,
      error,
    });
    throw new StorageError(meta.name, meta.collection, { cause: error });
  }

  const outcome = meta.isEmpty?.(result) ? "not_found" : "success";
  logStorageEvent({
    name: meta.name,
    collection: meta.collection,
    outcome,
    durationMs: Date.now() - start,
  });
  return result;
}
