#!/usr/bin/env node
/**
 * Fetch all D&D 5e SRD monsters from API and populate type-specific files
 * Usage: node lib/scripts/populateMonstersByType.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// Normalize monster type - convert "swarm of Tiny beasts" to "beast"
function normalizeType(apiType) {
  if (apiType.toLowerCase().includes('swarm')) {
    return 'beast';
  }
  return apiType.toLowerCase();
}

function getCRExperience(cr) {
  const xpTable = {
    0: 10,
    0.125: 25,
    0.25: 50,
    0.5: 100,
    1: 200,
    2: 450,
    3: 700,
    4: 1100,
    5: 1800,
    6: 2300,
    7: 2900,
    8: 3900,
    9: 5000,
    10: 5900,
    11: 7200,
    12: 8400,
    13: 10000,
    14: 11500,
    15: 13000,
    16: 15000,
    17: 18000,
    18: 20000,
    19: 22000,
    20: 25000,
    21: 33000,
    22: 41000,
    23: 50000,
    24: 62000,
    25: 75000,
    26: 90000,
    27: 105000,
    28: 120000,
    29: 135000,
    30: 155000,
  };
  return xpTable[cr] || 0;
}

function transformMonster(apiMonster) {
  // Parse armor class
  const ac = apiMonster.armor_class?.[0]?.value || 10;
  const armorType = apiMonster.armor_class?.[0]?.type || "";

  // Parse senses
  const senses = apiMonster.senses
    ? Object.entries(apiMonster.senses)
        .map(([key, value]) => `${key} ${value}`)
        .join(", ")
    : "";

  // Parse saving throws
  const savingThrows = {};
  if (apiMonster.proficiencies) {
    apiMonster.proficiencies
      .filter((prof) => prof.proficiency.name.startsWith("Saving Throw:"))
      .forEach((prof) => {
        const ability = prof.proficiency.name
          .replace("Saving Throw: ", "")
          .toLowerCase();
        savingThrows[ability] = prof.value;
      });
  }

  // Parse skills
  const skills = {};
  if (apiMonster.proficiencies) {
    apiMonster.proficiencies
      .filter((prof) => prof.proficiency.name.startsWith("Skill:"))
      .forEach((prof) => {
        const skill = prof.proficiency.name
          .replace("Skill: ", "")
          .toLowerCase();
        skills[skill] = prof.value;
      });
  }

  // Transform special abilities / traits
  const traits =
    apiMonster.special_abilities?.map((ability) => ({
      name: ability.name,
      description: ability.desc,
      ...(ability.dc && {
        saveDC: ability.dc.dc_value,
        saveType: ability.dc.dc_type?.name,
      }),
    })) || [];

  // Transform actions
  const actions =
    apiMonster.actions?.map((action) => {
      const transformed = {
        name: action.name,
        description: action.desc,
      };

      if (action.attack_bonus) {
        transformed.attackBonus = action.attack_bonus;
      }

      if (action.damage && action.damage.length > 0) {
        const dmg = action.damage[0];
        transformed.damageDescription = `${dmg.damage_dice} ${
          dmg.damage_type?.name || ""
        }`.trim();
      }

      if (action.dc) {
        transformed.saveDC = action.dc.dc_value;
        transformed.saveType = action.dc.dc_type?.name;
      }

      return transformed;
    }) || [];

  // Transform reactions
  const reactions =
    apiMonster.reactions?.map((reaction) => ({
      name: reaction.name,
      description: reaction.desc,
    })) || [];

  // Transform legendary actions
  const legendaryActions =
    apiMonster.legendary_actions?.map((action) => ({
      name: action.name,
      description: action.desc,
      ...(action.attack_bonus && { attackBonus: action.attack_bonus }),
    })) || [];

  // Parse languages
  const languages = apiMonster.languages
    ? apiMonster.languages
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l)
    : [];

  return {
    name: apiMonster.name,
    type: apiMonster.type,
    size: apiMonster.size,
    alignment: apiMonster.alignment,
    ac,
    armorType,
    hp: apiMonster.hit_points,
    hitDice: apiMonster.hit_dice,
    speed: apiMonster.speed,
    abilities: {
      strength: apiMonster.strength,
      dexterity: apiMonster.dexterity,
      constitution: apiMonster.constitution,
      intelligence: apiMonster.intelligence,
      wisdom: apiMonster.wisdom,
      charisma: apiMonster.charisma,
    },
    ...(Object.keys(savingThrows).length > 0 && { savingThrows }),
    ...(Object.keys(skills).length > 0 && { skills }),
    ...(apiMonster.damage_resistances?.length > 0 && {
      damageResistances: apiMonster.damage_resistances,
    }),
    ...(apiMonster.damage_immunities?.length > 0 && {
      damageImmunities: apiMonster.damage_immunities,
    }),
    ...(apiMonster.damage_vulnerabilities?.length > 0 && {
      damageVulnerabilities: apiMonster.damage_vulnerabilities,
    }),
    ...(apiMonster.condition_immunities?.length > 0 && {
      conditionImmunities: apiMonster.condition_immunities.map((ci) => ci.name),
    }),
    senses,
    ...(languages.length > 0 && { languages }),
    challengeRating: apiMonster.challenge_rating,
    experiencePoints:
      apiMonster.xp || getCRExperience(apiMonster.challenge_rating),
    source: "SRD",
    ...(traits.length > 0 && { traits }),
    ...(actions.length > 0 && { actions }),
    ...(reactions.length > 0 && { reactions }),
    ...(legendaryActions.length > 0 && { legendaryActions }),
  };
}

function generateTypeFile(type, monsters, outputDir) {
  const typeCapitalized = type.toUpperCase();
  // Pluralize the type name correctly
  const pluralType = typeCapitalized.endsWith('S') ? typeCapitalized : typeCapitalized + 'S';

  const content = `/**
 * ${type.charAt(0).toUpperCase() + type.slice(1)}-type monsters from D&D 5e SRD
 * Auto-generated from D&D 5e API
 */

import { MonsterTemplate } from "../../types";

export const ${pluralType}: Omit<
  MonsterTemplate,
  "id" | "userId" | "createdAt" | "updatedAt" | "_id"
>[] = [
${monsters
  .map((monster) => `  ${JSON.stringify(monster, null, 2).replace(/\n/g, "\n  ")}`)
  .join(",\n")}
];
`;

  const fileName = `${type}s.ts`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content);
  return fileName;
}

async function main() {
  console.log("Step 1: Fetching monster list from D&D 5e API...");
  const monsterList = await fetchJSON(
    "https://www.dnd5eapi.co/api/2014/monsters"
  );
  console.log(`Found ${monsterList.results.length} monsters\n`);

  console.log("Step 2: Fetching details for each monster...");
  const monstersByType = {};

  for (let i = 0; i < monsterList.results.length; i++) {
    const monsterRef = monsterList.results[i];
    console.log(
      `[${i + 1}/${monsterList.results.length}] Fetching ${monsterRef.name}...`
    );

    try {
      const details = await fetchJSON(
        `https://www.dnd5eapi.co${monsterRef.url}`
      );
      const transformed = transformMonster(details);

      // Normalize the type (e.g., "swarm of Tiny beasts" -> "beast")
      const normalizedType = normalizeType(details.type);
      if (!monstersByType[normalizedType]) {
        monstersByType[normalizedType] = [];
      }
      monstersByType[normalizedType].push(transformed);
    } catch (error) {
      console.error(`Error fetching ${monsterRef.name}:`, error.message);
    }
  }

  console.log("\nStep 3: Grouping by type...");
  const typeCounts = {};
  for (const [type, monsters] of Object.entries(monstersByType)) {
    typeCounts[type] = monsters.length;
    console.log(`  ${type}: ${monsters.length} monsters`);
  }

  console.log("\nStep 4: Writing TypeScript files...");
  const outputDir = path.join(__dirname, "../data/monsters");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedFiles = [];
  for (const [type, monsters] of Object.entries(monstersByType)) {
    const fileName = generateTypeFile(type, monsters, outputDir);
    generatedFiles.push({ type, fileName, count: monsters.length });
    console.log(
      `  ✓ Written ${path.join(outputDir, fileName)} (${monsters.length} monsters)`
    );
  }

  console.log("\n✅ Complete! All monster files have been generated.\n");
  console.log("Summary:");
  console.log("========================================");
  generatedFiles.forEach(({ type, count }) => {
    console.log(`  ${type.padEnd(20)} ${count.toString().padStart(3)} monsters`);
  });
  console.log("========================================");
  const totalMonsters = generatedFiles.reduce((sum, f) => sum + f.count, 0);
  console.log(`  ${'TOTAL'.padEnd(20)} ${totalMonsters.toString().padStart(3)} monsters`);
  console.log("========================================\n");

  console.log("Next steps:");
  console.log("1. Review the generated files in lib/data/monsters/");
  console.log("2. Update lib/data/monsters/index.ts to export all types");
  console.log("3. Run the seed script to populate the database");
}

main().catch(console.error);
