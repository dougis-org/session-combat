import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { isUserAdmin } from "@/lib/permissions";
import { storage } from "@/lib/storage";
import {
  fetchMonsters,
  fetchSpells,
  getAllMonsters,
  getAllSpells,
  Open5ECreature,
  Open5ESpell,
} from "@/lib/import/open5eAdapter";
import { transformMonster } from "@/lib/import/transformMonster";
import { transformSpell } from "@/lib/import/transformSpell";
import { shouldImport } from "@/lib/import/dedupeEngine";

interface ImportRequest {
  type: "monsters" | "spells" | ["monsters", "spells"];
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const admin = await isUserAdmin(auth.userId);
  if (admin === null) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
  if (!admin) {
    return NextResponse.json(
      { error: "Only administrators can trigger sync" },
      { status: 403 }
    );
  }

  try {
    const body: ImportRequest = await request.json();
    const types: ("monsters" | "spells")[] = Array.isArray(body.type)
      ? body.type
      : [body.type];

    const results: Record<string, unknown> = {};

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

async function importMonsters() {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for await (const creature of getAllMonsters()) {
    const { monster, valid } = transformMonster(creature);

    if (!valid) {
      errors++;
      continue;
    }

    const exists = await shouldImport("monsters", monster.name, monster.source || "");
    if (!exists) {
      skipped++;
      continue;
    }

    try {
      await storage.saveMonsterTemplate(monster);
      inserted++;
    } catch {
      errors++;
    }
  }

  return { inserted, skipped, errors };
}

async function importSpells() {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for await (const spellData of getAllSpells()) {
    const { spell, valid } = transformSpell(spellData);

    if (!valid) {
      errors++;
      continue;
    }

    const exists = await shouldImport("spells", spell.name, spell.source || "");
    if (!exists) {
      skipped++;
      continue;
    }

    try {
      await storage.saveSpellTemplate(spell);
      inserted++;
    } catch {
      errors++;
    }
  }

  return { inserted, skipped, errors };
}
