import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { SpellTemplate, DnDSpellSchool, isValidSpellSchool } from "@/lib/types";
import { requireAdmin } from "@/lib/api-helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
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
      components: components !== undefined ? components : existing.components,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting spell:", error);
    return NextResponse.json(
      { error: "Failed to delete spell" },
      { status: 500 }
    );
  }
}