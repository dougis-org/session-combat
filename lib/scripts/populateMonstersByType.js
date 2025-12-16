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
  // Build speed string
  let speedStr = "";
  if (apiMonster.speed) {
    const speeds = [];
    if (apiMonster.speed.walk) speeds.push(apiMonster.speed.walk);
    if (apiMonster.speed.burrow)
      speeds.push(`burrow ${apiMonster.speed.burrow}`);
    if (apiMonster.speed.climb) speeds.push(`climb ${apiMonster.speed.climb}`);
    if (apiMonster.speed.fly) speeds.push(`fly ${apiMonster.speed.fly}`);
    if (apiMonster.speed.swim) speeds.push(`swim ${apiMonster.speed.swim}`);
    speedStr = speeds.join(", ");
  }

  // Extract AC and AC note
  const ac = apiMonster.armor_class?.[0]?.value || 10;
  const acNote = apiMonster.armor_class?.[0]?.type
    ? `${apiMonster.armor_class[0].type} armor`
    : undefined;

  // Extract skills
  const skills = {};
  if (apiMonster.proficiencies) {
    apiMonster.proficiencies.forEach((prof) => {
      if (prof.proficiency.name.startsWith("Skill: ")) {
        const skillName = prof.proficiency.name
          .replace("Skill: ", "")
          .toLowerCase();
        skills[skillName] = prof.value;
      }
    });
  }

  // Extract saving throws
  const savingThrows = {};
  if (apiMonster.proficiencies) {
    apiMonster.proficiencies.forEach((prof) => {
      if (prof.proficiency.name.startsWith("Saving Throw: ")) {
        const abilityName = prof.proficiency.name
          .replace("Saving Throw: ", "")
          .toLowerCase();
        savingThrows[abilityName] = prof.value;
      }
    });
  }

  // Build senses object
  const senses = { ...apiMonster.senses };
  if (senses.passive_perception !== undefined) {
    senses.passive_perception = String(senses.passive_perception);
  }

  // Transform special abilities to traits
  const traits =
    apiMonster.special_abilities?.map((ability) => ({
      name: ability.name,
      description: ability.desc,
      ...(ability.attack_bonus && { attackBonus: ability.attack_bonus }),
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

      if (action.attack_bonus !== undefined) {
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
    size: apiMonster.size.toLowerCase(),
    type: apiMonster.type,
    alignment: apiMonster.alignment || "unaligned",
    ac,
    ...(acNote && { acNote }),
    hp: apiMonster.hit_points,
    maxHp: apiMonster.hit_points,
    speed: speedStr,
    abilityScores: {
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
    isGlobal: true,
    ...(traits.length > 0 && { traits }),
    ...(actions.length > 0 && { actions }),
    ...(reactions.length > 0 && { reactions }),
    ...(legendaryActions.length > 0 && { legendaryActions }),
  };
}

function generateTypeFile(type, monsters) {
  const typeCapitalized = type.toUpperCase().replace(/-/g, "_");
  const typeDescription = type.charAt(0).toUpperCase() + type.slice(1) + "s";

  const header = `/**
 * D&D 5e SRD ${typeDescription}
 * Source: D&D 5e API (https://www.dnd5eapi.co)
 */

import { MonsterTemplate } from '@/lib/types';

export const ${typeCapitalized}: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = `;

  const monstersJson = JSON.stringify(monsters, null, 2);

  return header + monstersJson + ";\n";
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

      const type = details.type;
      if (!monstersByType[type]) {
        monstersByType[type] = [];
      }
      monstersByType[type].push(transformed);
    } catch (error) {
      console.error(`Error fetching ${monsterRef.name}:`, error.message);
    }
  }

  console.log("\nStep 3: Grouping by type...");
  for (const [type, monsters] of Object.entries(monstersByType)) {
    console.log(`  ${type}: ${monsters.length} monsters`);
  }

  console.log("\nStep 4: Writing TypeScript files...");
  const monstersDir = path.join(__dirname, "..", "data", "monsters");

  for (const [type, monsters] of Object.entries(monstersByType)) {
    const filename = `${type}s.ts`; // e.g., 'aberrations.ts', 'beasts.ts'
    const filepath = path.join(monstersDir, filename);
    const content = generateTypeFile(type, monsters);

    fs.writeFileSync(filepath, content);
    console.log(`  ✓ Written ${filepath} (${monsters.length} monsters)`);
  }

  console.log("\n✅ Complete! All monster files have been generated.");
  console.log(
    `\nTotal monsters processed: ${Object.values(monstersByType).reduce(
      (sum, arr) => sum + arr.length,
      0
    )}`
  );
  console.log("\nNext steps:");
  console.log("1. Review the generated files in lib/data/monsters/");
  console.log("2. Update lib/data/monsters/index.ts to export all types");
  console.log("3. Run the seed script to populate the database");
}

main().catch(console.error);
