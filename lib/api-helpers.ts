import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/middleware";
import { getDatabase } from "@/lib/db";
import { isUserAdmin } from "@/lib/permissions";

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  // Verify tokenVersion matches the DB to reject invalidated sessions
  if (!ObjectId.isValid(auth.userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    if (!user || user['tokenVersion'] !== auth.tokenVersion) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const admin = await isUserAdmin(auth.userId);
  if (admin === null) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  if (!admin) {
    return NextResponse.json(
      { error: "Only administrators can perform this action" },
      { status: 403 }
    );
  }

  return null;
}
