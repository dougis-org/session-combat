/**
 * Shared test helpers for the per-domain storage repo unit tests (#503):
 * a chainable MongoDB mock plus assertion helpers for the StorageError /
 * telemetry contract every migrated method follows.
 */
import { getDatabase } from "@/lib/db";
import { StorageError } from "@/lib/storage/errors";
import * as logger from "@/lib/telemetry/logger";

type OrError<T> = T | Error;
type Outcome = "success" | "not_found" | "error";

export interface RepoMockOptions {
  findResult?: OrError<unknown[]>;
  findOne?: OrError<unknown>;
  count?: OrError<number>;
  updateOne?: OrError<Record<string, unknown>>;
  deleteOne?: OrError<Record<string, unknown>>;
  deleteMany?: OrError<Record<string, unknown>>;
  updateMany?: OrError<Record<string, unknown>>;
  insertOne?: OrError<Record<string, unknown>>;
  findOneAndUpdate?: OrError<unknown>;
}

const settle = <T>(v: OrError<T> | undefined, fallback: T): Promise<T> =>
  v instanceof Error ? Promise.reject(v) : Promise.resolve((v ?? fallback) as T);

export function makeCursor(result: OrError<unknown[]>) {
  const cursor: Record<string, jest.Mock> = {};
  for (const m of ["find", "sort", "collation", "limit", "project", "skip"]) {
    cursor[m] = jest.fn(() => cursor);
  }
  cursor.toArray = jest.fn(() => settle(result, []));
  return cursor;
}

export function mockCollection(opts: RepoMockOptions = {}) {
  const cursor = makeCursor(opts.findResult ?? []);
  const collection = {
    find: jest.fn(() => cursor),
    findOne: jest.fn(() => settle(opts.findOne, null)),
    countDocuments: jest.fn(() => settle(opts.count, 0)),
    updateOne: jest.fn(() => settle(opts.updateOne, { modifiedCount: 1, matchedCount: 1 })),
    updateMany: jest.fn(() => settle(opts.updateMany, {})),
    deleteOne: jest.fn(() => settle(opts.deleteOne, { deletedCount: 1 })),
    deleteMany: jest.fn(() => settle(opts.deleteMany, { deletedCount: 1 })),
    insertOne: jest.fn(() => settle(opts.insertOne, { insertedId: "x" })),
    findOneAndUpdate: jest.fn(() => settle(opts.findOneAndUpdate, null)),
    _cursor: cursor,
  };
  const db = { collection: jest.fn(() => collection) };
  jest.mocked(getDatabase).mockResolvedValue(db as never);
  return collection;
}

/**
 * Registers `beforeEach`/`afterEach` that stub `logStorageEvent` and reset
 * mocks. Returns a getter for the spy so tests can assert on emitted events.
 */
export function installStorageLogSpy() {
  let spy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    spy = jest.spyOn(logger, "logStorageEvent").mockImplementation();
  });
  afterEach(() => spy.mockRestore());
  return () => spy;
}

/** Assert a promise rejects with a StorageError, optionally checking op/collection. */
export async function expectStorageError(
  promise: Promise<unknown>,
  fields?: { op?: string; collection?: string },
): Promise<StorageError> {
  const err = await promise.then(
    () => {
      throw new Error("expected the promise to reject with a StorageError");
    },
    (e) => e,
  );
  expect(err).toBeInstanceOf(StorageError);
  if (fields?.op) expect((err as StorageError).op).toBe(fields.op);
  if (fields?.collection) expect((err as StorageError).collection).toBe(fields.collection);
  return err as StorageError;
}

/** Assert exactly one telemetry event with the given outcome was emitted. */
export function expectLoggedOutcome(spy: jest.SpyInstance, outcome: Outcome) {
  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ outcome }));
  const matching = spy.mock.calls.filter(
    (c) => (c[0] as { outcome?: string } | undefined)?.outcome === outcome,
  );
  expect(matching).toHaveLength(1);
}

export function expectNotLoggedOutcome(spy: jest.SpyInstance, outcome: Outcome) {
  expect(spy).not.toHaveBeenCalledWith(expect.objectContaining({ outcome }));
}

/** Assert every listed method is reachable as a function on the storage facade. */
export function expectFacadeMethods(
  storage: Record<string, unknown>,
  names: readonly string[],
) {
  for (const name of names) {
    expect(typeof storage[name]).toBe("function");
  }
}
