import { ObjectId, Filter, Document } from "mongodb";

export interface QueryableEntity {
  _id?: string;
  id: string;
  userId: string;
}

export function buildEntityQuery<T extends QueryableEntity>(entity: T): Filter<T> {
  const query: Filter<Document> = { userId: entity.userId };
  if (entity._id) {
    return { ...query, _id: new ObjectId(entity._id) } as Filter<T>;
  }
  return { ...query, id: entity.id } as Filter<T>;
}

export function normalizeStoredEntityId<T extends { id?: string; _id?: string }>(
  entity: T,
): T & { id: string | undefined } {
  return {
    ...entity,
    id: entity.id || entity._id?.toString(),
  };
}
