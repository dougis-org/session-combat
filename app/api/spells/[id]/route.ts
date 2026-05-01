import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { requireAdmin } from "@/lib/api-helpers";
import { applySpellUpdates, SpellBody } from "@/lib/api/spell-helpers";

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

    const body: SpellBody = await request.json();
    const { spell: updated, errors } = applySpellUpdates(existing, body);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0].message }, { status: 400 });
    }

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
