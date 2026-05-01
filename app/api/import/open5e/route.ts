import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import {
  getAllMonsters,
  getAllSpells,
} from "@/lib/import/open5eAdapter";
import { transformMonster } from "@/lib/import/transformMonster";
import { transformSpell } from "@/lib/import/transformSpell";
import { shouldImport } from "@/lib/import/dedupeEngine";
import { requireAdmin } from "@/lib/api-helpers";
import { MonsterTemplate } from "@/lib/types";
import { SpellTemplate } from "@/lib/types";

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
        results.monsters = await importMonsters();
      } else if (type === "spells") {
        results.spells = await importSpells();
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

async function importMonsters(): Promise<ImportResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for await (const creature of getAllMonsters()) {
    const result = transformMonster(creature);

    if (!result.valid) {
      errors++;
      continue;
    }

    const exists = await shouldImport("monsters", result.monster.name, result.monster.source || "");
    if (!exists) {
      skipped++;
      continue;
    }

    try {
      await storage.saveMonsterTemplate(result.monster);
      inserted++;
    } catch {
      errors++;
    }
  }

  return { inserted, skipped, errors };
}

async function importSpells(): Promise<ImportResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for await (const spellData of getAllSpells()) {
    const result = transformSpell(spellData);

    if (!result.valid) {
      errors++;
      continue;
    }

    const exists = await shouldImport("spells", result.spell.name, result.spell.source || "");
    if (!exists) {
      skipped++;
      continue;
    }

    try {
      await storage.saveSpellTemplate(result.spell);
      inserted++;
    } catch {
      errors++;
    }
  }

  return { inserted, skipped, errors };
}
