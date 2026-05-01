import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { SpellTemplate, DnDSpellSchool, isValidSpellSchool } from "@/lib/types";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { requireAdmin } from "@/lib/api-helpers";
import { v4 as uuidv4 } from "uuid";

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
    const {
      name,
      level,
      concentration,
      school,
      description,
      castingTime,
      range,
      duration,
      components,
      higherLevel,
      damageType,
      saveDc,
      saveType,
      attackRoll,
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Spell name is required" },
        { status: 400 }
      );
    }

    if (level === undefined || level < 0 || level > 9) {
      return NextResponse.json(
        { error: "Level must be 0-9" },
        { status: 400 }
      );
    }

    if (!isValidSpellSchool(school)) {
      return NextResponse.json(
        { error: "Invalid spell school" },
        { status: 400 }
      );
    }

    const spell: SpellTemplate = {
      id: uuidv4(),
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      source: "open5e",
      name: name.trim(),
      level,
      concentration: Boolean(concentration),
      school: school as DnDSpellSchool,
      description: description || "",
      castingTime: castingTime || "1 action",
      range: range || "Self",
      duration: duration || "Instantaneous",
      components: {
        verbal: Boolean(components?.verbal),
        somatic: Boolean(components?.somatic),
        material: Boolean(components?.material),
      },
      higherLevel: higherLevel,
      damageType: damageType,
      saveDc: saveDc,
      saveType: saveType,
      attackRoll: Boolean(attackRoll),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
