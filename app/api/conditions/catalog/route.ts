// GET /api/conditions/catalog — the default D&D 5e condition catalog (name + description)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";

export const GET = withAuth(async () => {
  try {
    const catalog = await storage.loadConditionCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Error fetching condition catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch condition catalog" },
      { status: 500 }
    );
  }
});
