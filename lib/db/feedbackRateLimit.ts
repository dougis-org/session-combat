import { getDatabase } from '@/lib/db';

const WINDOW_HOURS = 1;
const MAX_SUBMISSIONS = 12;

let indexEnsured = false;

async function ensureIndex(): Promise<void> {
  if (indexEnsured) return;
  const db = await getDatabase();
  const col = db.collection('feedbackRateLimits');
  await col.createIndex({ windowResetAt: 1 }, { expireAfterSeconds: 0, background: true });
  await col.createIndex({ ip: 1 }, { unique: true, background: true });
  indexEnsured = true;
}

export async function checkAndIncrementRateLimit(ip: string): Promise<{ allowed: boolean }> {
  await ensureIndex();
  const db = await getDatabase();
  const collection = db.collection('feedbackRateLimits');
  const now = new Date();
  const windowResetAt = new Date(now.getTime() + WINDOW_HOURS * 60 * 60 * 1000);

  // Attempt atomic increment for an existing active window within the limit
  const incrementResult = await collection.updateOne(
    { ip: { $eq: ip }, windowResetAt: { $gt: now }, count: { $lt: MAX_SUBMISSIONS } },
    { $inc: { count: 1 } }
  );

  if (incrementResult.modifiedCount === 1) {
    return { allowed: true };
  }

  // No active window found — check if the IP is over the limit in a current window
  const overLimit = await collection.findOne({
    ip: { $eq: ip },
    windowResetAt: { $gt: now },
    count: { $gte: MAX_SUBMISSIONS },
  });

  if (overLimit) {
    return { allowed: false };
  }

  // No active window exists (first ever, or TTL expired) — create a new one
  await collection.replaceOne(
    { ip: { $eq: ip } },
    { ip, count: 1, windowResetAt },
    { upsert: true }
  );

  return { allowed: true };
}
