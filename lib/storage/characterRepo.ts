import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { Character, Party } from "@/lib/types";
import { buildEntityQuery, normalizeStoredEntityId } from "@/lib/storage/helpers";

export async function loadCharacters(userId: string): Promise<Character[]> {
  return runStorageOp(
    { name: "loadCharacters", collection: "characters_active", isEmpty: (res) => res.length === 0 },
    async () => {
      const db = await getDatabase();
      try {
        const characters = await db
          .collection<Character>("characters_active")
          .find({ userId })
          .toArray();
        return characters.map(normalizeStoredEntityId);
      } catch (viewError) {
        console.warn(
          "characters_active view unavailable, falling back to direct query:",
          viewError,
        );
        const characters = await db
          .collection<Character>("characters")
          .find({ userId, deletedAt: null as unknown as Date })
          .toArray();
        return characters.map(normalizeStoredEntityId);
      }
    }
  );
}

export async function loadCharacterById(id: string): Promise<Character | null> {
  return runStorageOp(
    { name: "loadCharacterById", collection: "characters_active", isEmpty: (res) => !res },
    async () => {
      const db = await getDatabase();
      try {
        const character = await db
          .collection<Character>("characters_active")
          .findOne({ id });
        return character ? normalizeStoredEntityId(character) : null;
      } catch {
        const character = await db
          .collection<Character>("characters")
          .findOne({ id, deletedAt: null as unknown as Date });
        return character ? normalizeStoredEntityId(character) : null;
      }
    }
  );
}

export async function saveCharacter(character: Character): Promise<void> {
  return runStorageOp(
    { name: "saveCharacter", collection: "characters" },
    async () => {
      const db = await getDatabase();
      const { _id, ...characterData } = character;
      const query = buildEntityQuery(character);
      await db
        .collection<Character>("characters")
        .updateOne(query, { $set: characterData }, { upsert: true });
    }
  );
}

export async function saveCharacters(characters: Character[]): Promise<void> {
  return runStorageOp(
    { name: "saveCharacters", collection: "characters" },
    async () => {
      for (const character of characters) {
        await storage.saveCharacter(character);
      }
    }
  );
}

export async function deleteCharacter(id: string, userId: string): Promise<void> {
  return runStorageOp(
    { name: "deleteCharacter", collection: "characters" },
    async () => {
      const db = await getDatabase();
      const result = await db
        .collection<Character>("characters")
        .updateOne({ id, userId }, { $set: { deletedAt: new Date() } });
      if (result.matchedCount === 0) {
        throw new Error(`Character ${id} not found`);
      }
      await db
        .collection<Party>("parties")
        .updateMany(
          { userId, "members.characterId": id, "members.leftAt": { $exists: false } },
          { $set: { "members.$[elem].leftAt": new Date() } },
          { arrayFilters: [{ "elem.characterId": id, "elem.leftAt": { $exists: false } }] }
        );
    }
  );
}
