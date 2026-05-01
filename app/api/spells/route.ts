import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { SpellTemplate, DnDSpellSchool } from "@/lib/types";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { requireAdmin } from "@/lib/api-helpers";
import { v4 as uuidv4 } from "uuid";
import {
  validateSpellName,
  validateSpellLevel,
  validateSpellSchool,
  parseSpellSchool,
} from "@/lib/import/spellValidation";

function parseComponents(
  components: unknown
): SpellTemplate["components"] {
  if (!components || typeof components !== "object") {
    return { verbal: false, somatic: false, material: false };
  }
  const c = components as Record<string, unknown>;
  return {
    verbal: Boolean(c.verbal),
    somatic: Boolean(c.somatic),
    material: Boolean(c.material),
  };
}

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

    const nameError = validateSpellName(name);
    if (nameError) {
      return NextResponse.json({ error: nameError.message }, { status: 400 });
    }

    const levelError = validateSpellLevel(level);
    if (levelError) {
      return NextResponse.json({ error: levelError.message }, { status: 400 });
    }

    const schoolError = validateSpellSchool(school);
    if (schoolError) {
      return NextResponse.json({ error: schoolError.message }, { status: 400 });
    }

    const spell: SpellTemplate = {
      id: uuidv4(),
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      source: "open5e",
      name: name.trim(),
      level,
      concentration: Boolean(concentration),
      school: parseSpellSchool(school),
      description: description || "",
      castingTime: castingTime || "1 action",
      range: range || "Self",
      duration: duration || "Instantaneous",
      components: parseComponents(components),
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