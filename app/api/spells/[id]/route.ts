import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { SpellTemplate, DnDSpellSchool, isValidSpellSchool } from "@/lib/types";
import { requireAdmin } from "@/lib/api-helpers";
import {
  validateSpellName,
  validateSpellLevel,
  validateSpellSchool,
  parseSpellSchool,
} from "@/lib/import/spellValidation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const spell = await storage.loadSpellById(id);

    if (!spell) {
      return NextResponse.json({ error: "Spell not found" }, { status: 404 });
    }

    return NextResponse.json(spell);
  } catch (error) {
    console.error("Error loading spell:", error);
    return NextResponse.json(
      { error: "Failed to load spell" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
    const existing = await storage.loadSpellById(id);
    if (!existing) {
      return NextResponse.json({ error: "Spell not found" }, { status: 404 });
    }

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

    if (name !== undefined) {
      const nameError = validateSpellName(name);
      if (nameError) {
        return NextResponse.json({ error: nameError.message }, { status: 400 });
      }
    }

    if (level !== undefined) {
      const levelError = validateSpellLevel(level);
      if (levelError) {
        return NextResponse.json({ error: levelError.message }, { status: 400 });
      }
    }

    if (school !== undefined) {
      const schoolError = validateSpellSchool(school);
      if (schoolError) {
        return NextResponse.json({ error: schoolError.message }, { status: 400 });
      }
    }

    const updated: SpellTemplate = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      level: level !== undefined ? level : existing.level,
      concentration:
        concentration !== undefined ? concentration : existing.concentration,
      school:
        school !== undefined
          ? isValidSpellSchool(school)
            ? (school as DnDSpellSchool)
            : existing.school
          : existing.school,
      description: description !== undefined ? description : existing.description,
      castingTime: castingTime !== undefined ? castingTime : existing.castingTime,
      range: range !== undefined ? range : existing.range,
      duration: duration !== undefined ? duration : existing.duration,
      components:
        components !== undefined
          ? parseComponents(components)
          : existing.components,
      higherLevel:
        higherLevel !== undefined ? higherLevel : existing.higherLevel,
      damageType: damageType !== undefined ? damageType : existing.damageType,
      saveDc: saveDc !== undefined ? saveDc : existing.saveDc,
      saveType: saveType !== undefined ? saveType : existing.saveType,
      attackRoll: attackRoll !== undefined ? attackRoll : existing.attackRoll,
      updatedAt: new Date(),
    };

    await storage.saveSpellTemplate(updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating spell:", error);
    return NextResponse.json(
      { error: "Failed to update spell" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
    const existing = await storage.loadSpellById(id);
    if (!existing) {
      return NextResponse.json({ error: "Spell not found" }, { status: 404 });
    }

    await storage.deleteSpellTemplate(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting spell:", error);
    return NextResponse.json(
      { error: "Failed to delete spell" },
      { status: 500 }
    );
  }
}