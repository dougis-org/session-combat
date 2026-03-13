import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { importDndBeyondCharacter } from "@/lib/server/dndBeyondCharacterImport";
import { Character } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const overwrite = body?.overwrite === true;

    if (!url) {
      return NextResponse.json(
        { error: "A D&D Beyond character URL is required." },
        { status: 400 },
      );
    }

    const imported = await importDndBeyondCharacter(url);
    const existingCharacters = await storage.loadCharacters(auth.userId);
    const existingCharacter = existingCharacters.find(
      (character) =>
        character.name.trim().toLowerCase() ===
        imported.character.name.trim().toLowerCase(),
    );

    if (existingCharacter && !overwrite) {
      return NextResponse.json(
        {
          error: "A character with this name already exists.",
          conflict: "duplicate-name",
          existingCharacter: {
            id: existingCharacter.id,
            name: existingCharacter.name,
          },
          importedCharacter: {
            name: imported.character.name,
          },
          warnings: imported.warnings,
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const characterToSave: Character = {
      ...imported.character,
      _id: existingCharacter?._id,
      id: existingCharacter?.id || crypto.randomUUID(),
      userId: auth.userId,
      createdAt: existingCharacter?.createdAt || now,
      updatedAt: now,
    };

    await storage.saveCharacter(characterToSave);

    return NextResponse.json({
      character: characterToSave,
      warnings: imported.warnings,
      overwritten: Boolean(existingCharacter),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to import D&D Beyond character.";
    const status = /required|valid|supported|format|public|missing/i.test(
      message,
    )
      ? 400
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
