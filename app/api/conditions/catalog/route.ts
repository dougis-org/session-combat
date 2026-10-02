// GET /api/conditions/catalog — the default D&D 5e condition catalog (name + description, plus optional removedFromPlay)
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import * as conditionCatalogRepo from "@/lib/storage/conditionCatalogRepo";

export const GET = withAuth(async () => {
  try {
    const catalog = await conditionCatalogRepo.loadConditionCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Error fetching condition catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch condition catalog" },
      { status: 500 }
    );
  }
});
