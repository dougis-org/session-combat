import { storage } from "@/lib/storage";
import {
  Open5ECreature,
  Open5ESpell,
  IOpen5EClient,
  Open5EClient,
} from "./open5eAdapter";
import { transformMonster } from "./transformMonster";
import { transformSpell } from "./transformSpell";

export type Collection = "monsters" | "spells";

export interface DedupeResult {
  inserted: number;
  skipped: number;
  errors: number;
}

export interface ImportResult {
  inserted: number;
  skipped: number;
  errors: number;
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

async function importSingleMonster(
  creature: Open5ECreature
): Promise<{ inserted: boolean; skipped: boolean; error: boolean }> {
  const result = transformMonster(creature);
  if (!result.valid) {
    return { inserted: false, skipped: false, error: true };
  }

  const exists = await shouldImport(
    "monsters",
    result.monster.name,
    result.monster.source || ""
  );
  if (!exists) {
    return { inserted: false, skipped: true, error: false };
  }

  await storage.saveMonsterTemplate(result.monster);
  return { inserted: true, skipped: false, error: false };
}

async function importSingleSpell(
  spellData: Open5ESpell
): Promise<{ inserted: boolean; skipped: boolean; error: boolean }> {
  const result = transformSpell(spellData);
  if (!result.valid) {
    return { inserted: false, skipped: false, error: true };
  }

  const exists = await shouldImport(
    "spells",
    result.spell.name,
    result.spell.source || ""
  );
  if (!exists) {
    return { inserted: false, skipped: true, error: false };
  }

  await storage.saveSpellTemplate(result.spell);
  return { inserted: true, skipped: false, error: false };
}

export async function importMonstersFromOpen5E(
  client: IOpen5EClient = new Open5EClient()
): Promise<ImportResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for await (const creature of client.getAllMonsters()) {
    const { inserted: ins, skipped: skp, error: err } =
      await importSingleMonster(creature);
    if (ins) inserted++;
    else if (skp) skipped++;
    else if (err) errors++;
  }

  return { inserted, skipped, errors };
}

export async function importSpellsFromOpen5E(
  client: IOpen5EClient = new Open5EClient()
): Promise<ImportResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for await (const spellData of client.getAllSpells()) {
    const { inserted: ins, skipped: skp, error: err } =
      await importSingleSpell(spellData);
    if (ins) inserted++;
    else if (skp) skipped++;
    else if (err) errors++;
  }

  return { inserted, skipped, errors };
}