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

/**
 * Bulk-insert monster templates in a single `insertMany` call.
 * Unordered so every failing row is reported at once; the caller is responsible
 * for compensating deletes on error (no multi-document transactions available).
 */
export async function saveManyMonsterTemplates(
  templates: MonsterTemplate[],
): Promise<void> {
  if (templates.length === 0) return;
  return runStorageOp(
    { name: "saveManyMonsterTemplates", collection: "monsterTemplates" },
    async () => {
      const db = await getDatabase();
      const docs = templates.map(({ _id, ...rest }) => rest);
      await db
        .collection<MonsterTemplate>("monsterTemplates")
        .insertMany(docs as MonsterTemplate[], { ordered: false });
    },
  );
}

/**
 * Delete monster templates by id, scoped to a single userId. Idempotent —
 * ids that no longer exist (or never did) simply match nothing.
 */
export async function deleteMonsterTemplatesByIds(
  ids: string[],
  userId: string,
): Promise<void> {
  if (ids.length === 0) return;
  return runStorageOp(
    { name: "deleteMonsterTemplatesByIds", collection: "monsterTemplates" },
    async () => {
      const db = await getDatabase();
      await db
        .collection<MonsterTemplate>("monsterTemplates")
        .deleteMany({ id: { $in: ids }, userId });
    },
  );
}

/**
 * Given candidate `{ name, source }` keys, return the set of `name|source`
 * strings that already exist for the target userId. Single `$in` query.
 */
export async function findExistingMonsterKeys(
  keys: { name: string; source: string }[],
  userId: string,
): Promise<Set<string>> {
  if (keys.length === 0) return new Set();
  return runStorageOp(
    {
      name: "findExistingMonsterKeys",
      collection: "monsterTemplates",
      isEmpty: (res: Set<string>) => res.size === 0,
    },
    async () => {
      const db = await getDatabase();
      const names = Array.from(new Set(keys.map((k) => k.name)));
      const rows = await db
        .collection<MonsterTemplate>("monsterTemplates")
        .find({ userId, name: { $in: names } })
        .project<{ name: string; source?: string }>({ name: 1, source: 1, _id: 0 })
        .toArray();
      return new Set(rows.map((r) => `${r.name}|${r.source ?? ""}`));
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
