import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware";
import { getDatabase } from "@/lib/db";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";

const MAX_Q_LENGTH = 50;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const MAX_RESULTS = 15;
// Case-insensitive collation for prefix search — allows the users.username index to be used.
const CASE_INSENSITIVE_COLLATION = { locale: "en", strength: 2 } as const;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = withAuth(async (request: NextRequest, auth) => {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }
  if (q.length > MAX_Q_LENGTH) {
    return NextResponse.json(
      { error: `q must be at most ${MAX_Q_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    checkRateLimit(auth.userId, RATE_LIMIT, RATE_WINDOW_MS);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }

  if (!ObjectId.isValid(auth.userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDatabase();
    const docs = await db
      .collection("users")
      .find(
        {
          username: { $regex: new RegExp("^" + escapeRegex(q)) },
          _id: { $ne: new ObjectId(auth.userId) },
        },
        { projection: { username: 1 }, limit: MAX_RESULTS }
      )
      .collation(CASE_INSENSITIVE_COLLATION)
      .toArray();

    const results = docs.map((doc) => ({
      id: doc._id.toString(),
      username: doc.username as string,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("users/search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
