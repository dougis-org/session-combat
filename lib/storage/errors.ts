export class StorageError extends Error {
  readonly op: string;
  readonly collection: string;

  constructor(op: string, collection: string, options: { cause: unknown }) {
    super(`Storage operation "${op}" failed on collection "${collection}"`, {
      cause: options.cause,
    });
    this.name = "StorageError";
    this.op = op;
    this.collection = collection;
  }
}
