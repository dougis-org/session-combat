import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { validatePreferencePatch } from "@/lib/preferences/schema";

const noStore = (res: NextResponse): NextResponse => {
  res.headers.set("Cache-Control", "no-store");
  return res;
};

/** Resolved preferences (defaults deep-merged with the user's stored deltas). */
export const GET = withAuth(async (_request: NextRequest, auth) => {
  const resolved = await storage.getUserPreferences(auth.userId);
  return noStore(NextResponse.json(resolved, { status: 200 }));
});

/** Validated partial update, last-write-wins. Body carries no user identifier. */
export const PATCH = withAuth(async (request: NextRequest, auth) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = validatePreferencePatch(body);
  if (!parsed.ok) {
    return noStore(NextResponse.json({ error: parsed.error }, { status: 400 }));
  }

  const resolved = await storage.updateUserPreferences(auth.userId, parsed.values);
  return noStore(NextResponse.json(resolved, { status: 200 }));
});
