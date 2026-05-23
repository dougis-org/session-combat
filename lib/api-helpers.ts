import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { getUserById, InvalidUserIdError } from "@/lib/permissions";

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  let user: Record<string, unknown> | null;
  try {
    user = await getUserById(auth.userId);
  } catch (err) {
    if (err instanceof InvalidUserIdError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!user || typeof auth.tokenVersion !== 'number' || (user['tokenVersion'] ?? 0) !== auth.tokenVersion) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user['isAdmin'] !== true) {
    return NextResponse.json(
      { error: "Only administrators can perform this action" },
      { status: 403 }
    );
  }

  return null;
}
