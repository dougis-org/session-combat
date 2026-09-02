import { logStorageEvent } from "@/lib/telemetry/logger";
import { StorageError } from "@/lib/storage/errors";

export interface RunStorageOpMeta<T> {
  name: string;
  collection: string;
  isEmpty?: (result: T) => boolean;
  /**
   * Optional predicate identifying meaningful domain errors (e.g.
   * `DuplicateMemberError`) that MUST be re-thrown unchanged rather than
   * replaced with a `StorageError`. When absent, every rejection is wrapped
   * in `StorageError` exactly as before.
   */
  rethrowAsIs?: (error: unknown) => boolean;
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
    if (meta.rethrowAsIs?.(error)) {
      throw error;
    }
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
