import type {
  ImportedCharacterDraft,
  NormalizedDndBeyondCharacter,
} from "@/lib/dndBeyondCharacterImport";
import type { Character } from "@/lib/types";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";
import { createCharacterData, DND_BEYOND_CHARACTER_NAME } from "@/tests/helpers/characterTestHelpers";

export { createCharacterData as createImportedCharacterDraft, DND_BEYOND_CHARACTER_NAME };

export const DND_BEYOND_CHARACTER_URL =
  "https://www.dndbeyond.com/characters/91913267/BRdgB3";
export const EXISTING_IMPORTED_CHARACTER_ID = "existing-character-id";
export const IMPORT_WARNING = "Alignment was not supported and was omitted.";
export const CONFLICT_WARNING = "Race was not supported and was omitted.";

export function createNormalizedImportResult(
  overrides: Partial<NormalizedDndBeyondCharacter> = {},
): NormalizedDndBeyondCharacter {
  return {
    character: createCharacterData(),
    warnings: [IMPORT_WARNING],
    sourceCharacterId: String(sampleDndBeyondCharacterResponse.data.id),
    sourceUrl: sampleDndBeyondCharacterResponse.data.readonlyUrl ?? undefined,
    ...overrides,
  };
}

export function createPersistedImportedCharacter(
  overrides: Partial<Character> = {},
): Character {
  return {
    ...createCharacterData(),
    id: EXISTING_IMPORTED_CHARACTER_ID,
    userId: "test-user-id",
    ...overrides,
  };
}

export function createDuplicateNameConflictPayload(
  overrides: Partial<{
    error: string;
    warnings: string[];
    existingCharacter: { id: string; name: string };
  }> = {},
) {
  return {
    conflict: "duplicate-name",
    error: "Character already exists",
    warnings: [CONFLICT_WARNING],
    existingCharacter: {
      id: EXISTING_IMPORTED_CHARACTER_ID,
      name: DND_BEYOND_CHARACTER_NAME,
    },
    ...overrides,
  };
}

export function createImportedCharacterApiPayload(
  overrides: Partial<{
    character: Character;
    warnings: string[];
  }> = {},
) {
  return {
    character: createPersistedImportedCharacter({ userId: "user-1" }),
    warnings: [IMPORT_WARNING],
    ...overrides,
  };
}
