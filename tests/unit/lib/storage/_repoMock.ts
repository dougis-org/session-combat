/**
 * Shared MongoDB mock for per-domain storage repo unit tests (#503).
 * Provides a chainable cursor and a collection whose operations can be told
 * to resolve with a value or reject with an Error.
 */
import { getDatabase } from "@/lib/db";

type OrError<T> = T | Error;

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
