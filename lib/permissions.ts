import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';

export async function isUserAdmin(userId: string): Promise<boolean | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return user?.isAdmin === true;
  } catch (err) {
    if (err instanceof Error && err.name !== 'BSONError') {
      console.error('isUserAdmin: DB error for userId', userId, err);
    }
    return null;
  }
}
