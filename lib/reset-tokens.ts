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

  // Atomically replace any existing token for this user (or insert if none exists),
  // ensuring only one active reset token per user at any time.
  await col.replaceOne(
    { userId },
    {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      createdAt: new Date(),
    },
    { upsert: true }
  );
}

export async function validateResetToken(token: string): Promise<string> {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid or unknown reset token.");
  }

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

  const result = await col.updateOne(
    { tokenHash, consumedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { consumedAt: new Date() } }
  );

  if (result.modifiedCount === 0) {
    throw new Error("Reset token has already been used or has expired.");
  }
}
