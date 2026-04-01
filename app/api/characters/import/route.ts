import { NextRequest, NextResponse } from "next/server";
import { DndBeyondImportError } from "@/lib/dndBeyondCharacterImport";
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
      sourceUrl: url,
    });
  } catch (error) {
    const response = getImportErrorResponse(error);

    if (response.status >= 500) {
      console.error("D&D Beyond import failed", error);
    }

    return NextResponse.json(
      { error: response.message },
      { status: response.status },
    );
  }
}

function getImportErrorResponse(error: unknown): {
  message: string;
  status: number;
} {
  const importError = asImportError(error);

  if (importError) {
    return {
      status: importError.status,
      message: importError.exposeMessage
        ? importError.message
        : "Failed to import D&D Beyond character.",
    };
  }

  return {
    status: 502,
    message: "Failed to import D&D Beyond character.",
  };
}

function asImportError(
  error: unknown,
): Pick<DndBeyondImportError, "message" | "status" | "exposeMessage"> | null {
  const errorWithExposeFlag = error as { exposeMessage?: unknown } | null;
  const errorWithStatus = error as { status?: unknown } | null;
  const errorWithMessage = error as { message?: unknown } | null;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "status" in error &&
    typeof errorWithMessage?.message === "string" &&
    typeof errorWithStatus?.status === "number"
  ) {
    return {
      message: errorWithMessage.message,
      status: errorWithStatus.status,
      exposeMessage:
        typeof errorWithExposeFlag?.exposeMessage === "boolean"
          ? errorWithExposeFlag.exposeMessage
          : errorWithStatus.status < 500,
    };
  }

  return null;
}
