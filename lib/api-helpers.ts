import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { isUserAdmin } from "@/lib/permissions";

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
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
