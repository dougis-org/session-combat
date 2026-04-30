import { storage } from "@/lib/storage";

type Collection = "monsters" | "spells";

export interface DedupeResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export async function shouldImport(
  collection: Collection,
  name: string,
  source: string
): Promise<boolean> {
  if (collection === "spells") {
    return !(await storage.spellExistsByNameAndSource(name, source));
  }

  return true;
}

export async function importWithDedup(
  collection: Collection,
  items: Array<{ name: string; source: string; id: string; [key: string]: unknown }>,
  saveFn: (item: unknown) => Promise<void>
): Promise<DedupeResult> {
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const exists = await shouldImport(collection, item.name, item.source);
      if (!exists) {
        skipped++;
        continue;
      }

      await saveFn(item);
      inserted++;
    } catch (error) {
      errors.push(
        `Failed to import "${item.name}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return { inserted, skipped, errors };
}
