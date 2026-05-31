import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';

export class InvalidUserIdError extends Error {
  constructor(userId: string) {
    super(`Invalid userId: ${userId}`);
    this.name = 'InvalidUserIdError';
  }
}

/**
 * Fetch a user document by userId.
 * Throws InvalidUserIdError for malformed IDs, throws on DB error, returns null when not found.
 * Uses explicit $eq to prevent NoSQL injection.
 */
export async function getUserById(userId: string): Promise<Record<string, unknown> | null> {
  if (!ObjectId.isValid(userId)) throw new InvalidUserIdError(userId);
  const db = await getDatabase();
  const id = new ObjectId(userId);
  return db.collection('users').findOne(
    { _id: { $eq: id } },
    { projection: { email: 1, tokenVersion: 1, isAdmin: 1, username: 1 } }
  );
}

export async function isUserAdmin(userId: string): Promise<boolean | null> {
  try {
    const user = await getUserById(userId);
    return user?.['isAdmin'] === true;
  } catch (err) {
    console.error('isUserAdmin: error checking admin status for userId', userId, err);
    return null;
  }
}
