import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { MonsterTemplate } from "@/lib/types";
import { buildEntityQuery, normalizeStoredEntityId } from "@/lib/storage/helpers";
import { GLOBAL_USER_ID } from "@/lib/constants";

export async function loadMonsterTemplates(userId: string): Promise<MonsterTemplate[]> {
  return runStorageOp(
    { name: "loadMonsterTemplates", collection: "monsterTemplates", isEmpty: (res) => res.length === 0 },
    async () => {
      const db = await getDatabase();
      const templates = await db
        .collection<MonsterTemplate>("monsterTemplates")
        .find({ userId })
        .toArray();
      return templates.map(normalizeStoredEntityId);
    },
  );
}

export async function loadGlobalMonsterTemplates(): Promise<MonsterTemplate[]> {
  return loadMonsterTemplates(GLOBAL_USER_ID);
}

export async function loadAllMonsterTemplates(userId: string): Promise<MonsterTemplate[]> {
  // No own DB call — the two sibling reads are each wrapped in runStorageOp,
  // so a driver failure already surfaces as a single StorageError naming the
  // real failing op. Wrapping again would double-wrap the error and emit a
  // redundant telemetry event.
  const [userTemplates, globalTemplates] = await Promise.all([
    loadMonsterTemplates(userId),
    loadGlobalMonsterTemplates(),
  ]);
  return [...userTemplates, ...globalTemplates];
}

export async function saveMonsterTemplate(template: MonsterTemplate): Promise<void> {
  return runStorageOp(
    { name: "saveMonsterTemplate", collection: "monsterTemplates" },
    async () => {
      const db = await getDatabase();
      const { _id, ...templateData } = template;
      const query = buildEntityQuery(template);
      await db
        .collection<MonsterTemplate>("monsterTemplates")
        .updateOne(query, { $set: templateData }, { upsert: true });
    },
  );
}

export async function deleteMonsterTemplate(id: string, userId: string): Promise<void> {
  return runStorageOp(
    { name: "deleteMonsterTemplate", collection: "monsterTemplates" },
    async () => {
      const db = await getDatabase();
      await db.collection<MonsterTemplate>("monsterTemplates").deleteOne({ id, userId });
    },
  );
}

export async function monsterExistsByNameAndSource(name: string, source: string): Promise<boolean> {
  return runStorageOp(
    { name: "monsterExistsByNameAndSource", collection: "monsterTemplates" },
    async () => {
      const db = await getDatabase();
      const count = await db
        .collection<MonsterTemplate>("monsterTemplates")
        .countDocuments({ name, source: source || "" });
      return count > 0;
    },
  );
}

export async function findMonsterByNameAndSource(
  name: string,
  source: string,
): Promise<MonsterTemplate | null> {
  return runStorageOp(
    {
      name: "findMonsterByNameAndSource",
      collection: "monsterTemplates",
      isEmpty: (res) => res === null,
    },
    async () => {
      const db = await getDatabase();
      return (await db
        .collection<MonsterTemplate>("monsterTemplates")
        .findOne({ name, source: source || "" })) as MonsterTemplate | null;
    },
  );
}
