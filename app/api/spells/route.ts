import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { requireAdmin } from "@/lib/api-helpers";
import {
  validateSpellName,
  validateSpellLevel,
  validateSpellSchool,
} from "@/lib/import/spellValidation";
import { buildSpellFromBody } from "@/lib/api/spell-helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const concentration = searchParams.get("concentration");

    let spells = await storage.loadSpells();

    if (concentration === "true") {
      spells = spells.filter((s) => s.concentration);
    }

    return NextResponse.json(spells);
  } catch (error) {
    console.error("Error loading spells:", error);
    return NextResponse.json(
      { error: "Failed to load spells" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();

    const nameError = validateSpellName(body.name);
    if (nameError) {
      return NextResponse.json({ error: nameError.message }, { status: 400 });
    }

    const levelError = validateSpellLevel(body.level);
    if (levelError) {
      return NextResponse.json({ error: levelError.message }, { status: 400 });
    }

    const schoolError = validateSpellSchool(body.school);
    if (schoolError) {
      return NextResponse.json({ error: schoolError.message }, { status: 400 });
    }

    const spell = buildSpellFromBody(body);

    await storage.saveSpellTemplate(spell);

    return NextResponse.json(spell, { status: 201 });
  } catch (error) {
    console.error("Error creating spell:", error);
    return NextResponse.json(
      { error: "Failed to create spell" },
      { status: 500 }
    );
  }
}
