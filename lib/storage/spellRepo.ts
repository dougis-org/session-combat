import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { SpellTemplate } from "@/lib/types";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { buildEntityQuery, normalizeStoredEntityId } from "@/lib/storage/helpers";

/**
 * Spell-template storage (#504). A driver failure now rejects with
 * `StorageError` for every method — most notably `loadSpellById`, which
 * previously swallowed DB errors to `null` and made a real outage
 * indistinguishable from a genuine not-found at `app/api/spells/[id]/route.ts`.
 *
 * The pre-database id-shape guard in `loadSpellById` and `deleteSpellTemplate`
 * stays OUTSIDE `runStorageOp`: it is input validation, not error handling, and
 * must not emit a telemetry event.
 */

const COLLECTION = "spellTemplates";

function hasValidIdShape(id: string): boolean {
  return Boolean(id) && typeof id === "string" && id.length <= 64;
}

export async function loadSpells(userId?: string, concentration?: boolean): Promise<SpellTemplate[]> {
  return runStorageOp(
    { name: "loadSpells", collection: COLLECTION, isEmpty: (r) => r.length === 0 },
    async () => {
      const db = await getDatabase();
      const query: Record<string, unknown> = userId
        ? { userId }
        : { userId: GLOBAL_USER_ID };
      if (concentration !== undefined) {
        query.concentration = concentration;
      }
      const spells = await db
        .collection<SpellTemplate>(COLLECTION)
        .find(query)
        .toArray();
      return spells.map(normalizeStoredEntityId);
    },
  );
}

export async function loadSpellById(id: string): Promise<SpellTemplate | null> {
  if (!hasValidIdShape(id)) {
    return null;
  }
  return runStorageOp(
    { name: "loadSpellById", collection: COLLECTION, isEmpty: (r) => !r },
    async () => {
      const db = await getDatabase();
      const spell = await db
        .collection<SpellTemplate>(COLLECTION)
        .findOne({ id, userId: GLOBAL_USER_ID });
      return spell ? normalizeStoredEntityId(spell) : null;
    },
  );
}

export async function saveSpellTemplate(spell: SpellTemplate): Promise<void> {
  return runStorageOp({ name: "saveSpellTemplate", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const { _id, ...spellData } = spell;
    const query = buildEntityQuery(spell);
    await db
      .collection<SpellTemplate>(COLLECTION)
      .updateOne(query, { $set: spellData }, { upsert: true });
  });
}

export async function deleteSpellTemplate(id: string): Promise<void> {
  if (!hasValidIdShape(id)) {
    return;
  }
  return runStorageOp({ name: "deleteSpellTemplate", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    await db
      .collection<SpellTemplate>(COLLECTION)
      .deleteOne({ id, userId: GLOBAL_USER_ID });
  });
}

export async function spellExistsByNameAndSource(name: string, source: string): Promise<boolean> {
  return runStorageOp({ name: "spellExistsByNameAndSource", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const count = await db
      .collection<SpellTemplate>(COLLECTION)
      .countDocuments({ name, source });
    return count > 0;
  });
}
