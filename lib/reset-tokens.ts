import crypto from "crypto";
import { getDatabase } from "@/lib/db";

const COLLECTION = "password_reset_tokens";
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface ResetTokenDocument {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function storeResetToken(
  userId: string,
  tokenHash: string
): Promise<void> {
  const db = await getDatabase();
  const col = db.collection<ResetTokenDocument>(COLLECTION);

  // Delete all prior active tokens for this user before inserting new one
  await col.deleteMany({ userId });

  await col.insertOne({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    createdAt: new Date(),
  });
}

export async function validateResetToken(token: string): Promise<string> {
  const db = await getDatabase();
  const col = db.collection<ResetTokenDocument>(COLLECTION);

  const tokenHash = hashToken(token);
  const doc = await col.findOne({ tokenHash });

  if (!doc) {
    throw new Error("Invalid or unknown reset token.");
  }
  if (doc.expiresAt < new Date()) {
    throw new Error("Reset token has expired.");
  }
  if (doc.consumedAt) {
    throw new Error("Reset token has already been used.");
  }

  return doc.userId;
}

export async function consumeResetToken(tokenHash: string): Promise<void> {
  const db = await getDatabase();
  const col = db.collection<ResetTokenDocument>(COLLECTION);

  await col.updateOne({ tokenHash }, { $set: { consumedAt: new Date() } });
}
