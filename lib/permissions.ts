import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';

export async function isUserAdmin(userId: string): Promise<boolean | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return user?.isAdmin === true;
  } catch (err) {
    console.error('isUserAdmin: error checking admin status for userId', userId, err);
    return null;
  }
}
