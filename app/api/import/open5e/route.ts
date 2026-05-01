import { NextRequest, NextResponse } from "next/server";
import {
  importMonstersFromOpen5E,
  importSpellsFromOpen5E,
} from "@/lib/import/dedupeEngine";
import { requireAdmin } from "@/lib/api-helpers";

interface ImportRequest {
  type: "monsters" | "spells" | ["monsters", "spells"];
}

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: number;
}

export async function POST(request: NextRequest) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body: ImportRequest = await request.json();
    const types: ("monsters" | "spells")[] = Array.isArray(body.type)
      ? body.type
      : [body.type];

    const results: Record<string, ImportResult> = {};

    for (const type of types) {
      if (type === "monsters") {
        results.monsters = await importMonstersFromOpen5E();
      } else if (type === "spells") {
        results.spells = await importSpellsFromOpen5E();
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error during open5e sync:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
