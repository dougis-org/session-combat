import { getDatabase } from "../db";
import { CampaignTemplate, CampaignChapter, EncounterTemplate, Monster } from "../types";
import { GLOBAL_USER_ID } from "../constants";
import { randomUUID } from "crypto";
import {
  CUSTOM_MONSTERS,
  requireCustomMonsterById,
  toEncounterMonster,
  toEncounterMonsters,
} from "../data/customMonsters";

const now = new Date();

function makeTemplate(
  name: string,
  moduleName: string,
  description: string,
  chapters: Omit<CampaignChapter, "id">[],
  encounters?: EncounterTemplate[]
): CampaignTemplate {
  return {
    id: randomUUID(),
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    name,
    moduleName,
    description,
    chapters: chapters.map((ch) => ({ ...ch, id: randomUUID() })),
    ...(encounters ? { encounters } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Build the encounter list for the Vecna: Eve of Ruin campaign.
 * One encounter per chapter covering the 11-chapter adventure structure,
 * with a key boss encounter where applicable. Monsters are pulled from
 * CUSTOM_MONSTERS via toEncounterMonster/toEncounterMonsters to ensure
 * each instance gets a unique id (independent HP/conditions).
 */
function vecnaEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const cultist = requireCustomMonsterById("cm-vecna-cultist");
  const impaler = requireCustomMonsterById("cm-relentless-impaler");
  const spiderdragon = requireCustomMonsterById("cm-spiderdragon");
  const deathwolf = requireCustomMonsterById("cm-deathwolf");
  const kasVampire = requireCustomMonsterById("cm-kas-vampire");
  const kasDeathKnight = requireCustomMonsterById("cm-kas-death-knight");
  const vecna = requireCustomMonsterById("cm-vecna");
  const acererak = requireCustomMonsterById("cm-acererak");
  const miska = requireCustomMonsterById("cm-miska");
  const lordSoth = requireCustomMonsterById("cm-lord-soth");
  const tiamat = requireCustomMonsterById("cm-tiamat-servant");
  const necro = requireCustomMonsterById("cm-necromancer-wizard");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    // Ch 1 — Return from Neverdeath Graveyard (Neverwinter)
    encounter(
      "Cultists of the Whispered One",
      "Fanatical cultists performing a dark ritual atop a Dolindar tomb.",
      compact([m(cultist), many(cultist, 2)])
    ),
    // Ch 2 — The Wizards Three (Sigil)
    encounter(
      "Kas's Vampire Ambush",
      "Kas the Bloody confronts the party in his vampiric form on the streets of Sigil.",
      compact([m(kasVampire), many(deathwolf, 2)])
    ),
    encounter(
      "Planescape Dabus Escort",
      "Sigil's faceless dabus wardens demand a toll at a portal gate.",
      compact([many(necro, 2)])
    ),
    // Ch 3 — The Lambent Zenith's Last Voyage (Astral Sea / Spelljammer)
    encounter(
      "Wreck of the Lambent Zenith",
      "Astral dreadnought-creatures and necromancer survivors of a lost spelljammer.",
      compact([many(necro, 2), many(cultist, 4), many(deathwolf, 2)])
    ),
    // Ch 4 — The Ruined Colossus (Eberron / Mount Ironrot)
    encounter(
      "Blades of Eberron at Ironrot",
      "Eberron warforged blade scouts and their lieutenant patrol the ruined colossus.",
      compact([many(necro, 2), many(cultist, 4)])
    ),
    encounter(
      "Eye Monger Patrol",
      "Aberrant-eyed servants of Vecna scour Mount Ironrot for the Rod fragment.",
      compact([many(necro, 1), many(cultist, 3)])
    ),
    // Ch 5 — Death House (Ravenloft / Barovia)
    encounter(
      "Death House Lurching Halls",
      "Animated furniture, sorrowsworn echoes, and Strahd's shadow guards stalk the cursed manor.",
      compact([many(cultist, 4), m(impaler)])
    ),
    // Ch 6 — Night of Blue Fire (Krynn / Dragonlance)
    encounter(
      "Lord Soth's Vanguard",
      "The death knight Lord Soth leads draconian shock troops against the party in Bittergrass Fen.",
      compact([m(lordSoth), many(cultist, 4), many(deathwolf, 2)])
    ),
    // Ch 7 — Tomb of Wayward Souls (Greyhawk / Oerth)
    encounter(
      "Acererak's False Liches",
      "Acererak's decoy liches and necromancer lieutenants test intruders in the upper tomb.",
      compact([many(necro, 3), m(impaler), m(spiderdragon)])
    ),
    encounter(
      "Acererak, the Archlich",
      "Acererak himself manifests to halt the party's progress through the Tomb of Wayward Souls.",
      compact([m(acererak), many(necro, 2), many(impaler, 2)])
    ),
    // Ch 8 — The Dragon Queen's Pride (Avernus / Nine Hells)
    encounter(
      "Abishai Court at the Red Belvedere",
      "Tiamat's fiendish lieutenants and cultist throngs defend the Dragon Queen's casino in Avernus.",
      compact([many(necro, 3), many(deathwolf, 3), m(impaler)])
    ),
    encounter(
      "Tiamat's Material Aspect",
      "An aspect of Tiamat in huge five-headed dragon form confronts the party atop the Dragon's Pride.",
      compact([m(tiamat), many(necro, 2)])
    ),
    // Ch 9 — The Betrayer Revealed (Kas sheds vampire disguise)
    encounter(
      "Kas Reveals True Form",
      "Kas drops his vampiric disguise and ascends to his true death-knight form.",
      compact([m(kasVampire), m(kasDeathKnight), many(deathwolf, 2)])
    ),
    // Ch 10 — The War of Pandesmos (Abyss)
    encounter(
      "Spyder-Fiend Vanguard",
      "Lolth-sent spider-fiends and abyss-touched cultists pour through a wound in the Abyss.",
      compact([many(necro, 3), many(spiderdragon, 2), many(deathwolf, 2)])
    ),
    encounter(
      "Miska, the Wolf-Spider",
      "The demon lord Miska leads the abyss-borne armies of Pandesmos against the multiverse itself.",
      compact([m(miska), many(necro, 3), many(deathwolf, 3), many(spiderdragon, 2)])
    ),
    // Ch 11 — Eve of Ruin (final confrontation)
    encounter(
      "Vecna's Inner Guard",
      "Vecna's elite deathwolf pack and relentless impaler honor guard hold the approach to the Eye.",
      compact([many(deathwolf, 4), many(impaler, 3), many(necro, 2)])
    ),
    encounter(
      "Kas, the Bloody-Handed",
      "Kas the Bloody in his true death-knight form defends Vecna's inner sanctum.",
      compact([m(kasDeathKnight), many(impaler, 3), many(deathwolf, 2)])
    ),
    encounter(
      "Acererak Joins the Eve",
      "The demilich returns as Vecna's final ally, commanding false liches and necromancer lieutenants.",
      compact([m(acererak), many(necro, 3), many(impaler, 2)])
    ),
    encounter(
      "Vecna, the Whispered One",
      "The archlich Vecna himself manifests to remake the multiverse — the Eve of Ruin.",
      compact([m(vecna), many(impaler, 3), many(deathwolf, 4), m(kasDeathKnight)])
    ),
  ];
}

/**
 * Build the encounter list for Curse of Strahd.
 * One encounter per major arc covering the 13-chapter campaign.
 */
function cosEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const animatedArmor = requireCustomMonsterById("cm-animated-armor");
  const ghoul = requireCustomMonsterById("cm-ghoul");
  const shamblingMound = requireCustomMonsterById("cm-shambling-mound");
  const vampireSpawn = requireCustomMonsterById("cm-vampire-spawn");
  const nightHag = requireCustomMonsterById("cm-night-hag");
  const wight = requireCustomMonsterById("cm-wight");
  const vampire = requireCustomMonsterById("cm-vampire");
  const wintersplinter = requireCustomMonsterById("cm-wintersplinter");
  const babaLysaga = requireCustomMonsterById("cm-baba-lysaga");
  const creepingHut = requireCustomMonsterById("cm-creeping-hut");
  const strahd = requireCustomMonsterById("cm-strahd-von-zarovich");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    // Ch 1 — Death House (lvl 1-2)
    encounter(
      "Death House Lurching Halls",
      "Animated armor and ghouls stalk the haunted manor of Death House in Barovia.",
      compact([many(animatedArmor, 4), many(ghoul, 3), m(shamblingMound)])
    ),
    // Ch 5 — The Town of Vallaki (lvl 3-5)
    encounter(
      "Vampire Spawn Ambush at Vallaki",
      "Strahd's vampire spawn attack the party on the streets of Vallaki.",
      compact([many(vampireSpawn, 3)])
    ),
    // Ch 6 — Old Bonegrinder (lvl 4-6)
    encounter(
      "Old Bonegrinder Dream Eaters",
      "Three night hag sisters grind children's bones in the windmill.",
      compact([many(nightHag, 3)])
    ),
    // Ch 9 — Yester Hill (lvl 6-8)
    encounter(
      "The Wintersplinter Awakens",
      "Druids of the Ravenkin awaken a blighted treant atop Yester Hill to crush Strahd.",
      compact([m(wintersplinter), many(wight, 2)])
    ),
    // Ch 11 — The Ruins of Berez (lvl 7-8)
    encounter(
      "Baba Lysaga's Creeping Hut",
      "The swamp witch Baba Lysaga attacks atop her walking hut to defend Ireena's infant form.",
      compact([m(babaLysaga), m(creepingHut), many(wight, 2)])
    ),
    // Ch 13 — Castle Ravenloft (lvl 9-10)
    encounter(
      "Strahd's Heart of Sorrow",
      "Count Strahd von Zarovich confronts the party in his study atop Castle Ravenloft.",
      compact([m(strahd), many(vampireSpawn, 2), m(vampire)])
    ),
  ];
}

/**
 * Build the encounter list for Tomb of Annihilation.
 * Covers the five-chapter structure with key set-piece encounters.
 */
function toaEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const tyrannoZombie = requireCustomMonsterById("cm-tyrannosaurus-zombie");
  const firenewtWarlock = requireCustomMonsterById("cm-firenewt-warlock");
  const firenewtWarrior = requireCustomMonsterById("cm-firenewt-warrior");
  const broodguard = requireCustomMonsterById("cm-yuan-ti-broodguard");
  const nightmare = requireCustomMonsterById("cm-yuan-ti-nightmare-speaker");
  const rasNsi = requireCustomMonsterById("cm-ras-nsi");
  const acererak = requireCustomMonsterById("cm-acererak");
  const atropal = requireCustomMonsterById("cm-atropal");
  const bodak = requireCustomMonsterById("cm-bodak");
  const skeleton = requireCustomMonsterById("cm-skeleton");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    // Ch 2 — The Land of Chult (lvl 5-6)
    encounter(
      "Zombie T-Rex in the Jungles of Chult",
      "An undead tyrannosaurus regurgitates zombie fodder in the Chult jungle.",
      compact([m(tyrannoZombie), many(skeleton, 4)])
    ),
    encounter(
      "Firenewt Ambush",
      "Firenewt warlocks of Imix patrol the jungle with their warrior escort.",
      compact([many(firenewtWarlock, 2), many(firenewtWarrior, 3)])
    ),
    // Ch 4 — Fane of the Night Serpent (lvl 7-9)
    encounter(
      "Yuan-ti Temple Guards of the Fane",
      "Serpentfolk defend the inner sanctum of the Fane of the Night Serpent.",
      compact([many(broodguard, 2), many(nightmare, 1), many(firenewtWarrior, 4)])
    ),
    encounter(
      "Ras Nsi's Final Stand",
      "The cursed paladin Ras Nsi defends the Fane as the exarch of Ubtao.",
      compact([m(rasNsi), many(broodguard, 2), many(nightmare, 1)])
    ),
    // Ch 5 — Tomb of the Nine Gods (lvl 9-11)
    encounter(
      "Acererak's Arrival at the Soulmonger",
      "Acererak himself manifests to stop the party from destroying the Soulmonger.",
      compact([m(acererak), m(atropal), many(bodak, 2), many(skeleton, 4)])
    ),
  ];
}

/**
 * Build the encounter list for Lost Mine of Phandelver.
 * Covers the four-part intro adventure with key set-piece encounters.
 */
function lmopEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const goblin = requireCustomMonsterById("cm-goblin");
  const bugbearChief = requireCustomMonsterById("cm-bugbear-chief");
  const bandit = requireCustomMonsterById("cm-bandit");
  const banditCaptain = requireCustomMonsterById("cm-bandit-captain");
  const mage = requireCustomMonsterById("cm-mage");
  const doppelganger = requireCustomMonsterById("cm-doppelganger");
  const greenHag = requireCustomMonsterById("cm-green-hag");
  const wyvern = requireCustomMonsterById("cm-wyvern");
  const orc = requireCustomMonsterById("cm-orc");
  const drowMage = requireCustomMonsterById("cm-drow-mage");
  const spectator = requireCustomMonsterById("cm-spectator");
  const venomfang = requireCustomMonsterById("cm-young-green-dragon");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    // Part 1 — Goblin Arrows (lvl 1-2)
    encounter(
      "Cragmaw Ambush on the Triboar Trail",
      "Goblins ambush the party on the Triboar Trail.",
      compact([many(goblin, 4)])
    ),
    encounter(
      "Cragmaw Hideout: Klarg's Cave",
      "The bugbear chief Klarg rules a cave hideout full of goblins.",
      compact([m(bugbearChief), many(goblin, 6)])
    ),
    // Part 2 — Phandalin (lvl 2-3)
    encounter(
      "Redbrand Ruffians in Phandalin",
      "Redbrand ruffians confront the party in the streets of Phandalin.",
      compact([many(bandit, 4), m(banditCaptain)])
    ),
    encounter(
      "Redbrand Hideout: Glasstaff",
      "Glasstaff — actually a doppelganger — defends the Tresendar Manor.",
      compact([many(bandit, 3), m(banditCaptain), m(doppelganger), m(mage)])
    ),
    // Part 3 — The Spider's Web (lvl 3-4)
    encounter(
      "Agatha the Green Hag at Conyberry",
      "A reclusive green hag offers the party a magical item in exchange for a quest.",
      compact([m(greenHag)])
    ),
    encounter(
      "Wyvern Tor",
      "A wyvern and its orc riders attack on the Triboar Trail.",
      compact([m(wyvern), many(orc, 3)])
    ),
    encounter(
      "Venomfang at Thundertree",
      "Venomfang, the young green dragon, threatens the ruins of Thundertree.",
      compact([m(venomfang)])
    ),
    // Part 4 — Wave Echo Cave (lvl 4-5)
    encounter(
      "Wave Echo Cave: The Black Spider",
      "Nezznar the Black Spider guards the Forge of Spells in Wave Echo Cave.",
      compact([m(drowMage), many(doppelganger, 2), m(spectator)])
    ),
  ];
}

/**
 * Build the encounter list for Tyranny of Dragons.
 * Spans the 13-episode, 17-chapter compilation covering HotDQ + RotT.
 */
function todEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const cyanwrath = requireCustomMonsterById("cm-langdedrosa-cyanwrath");
  const guardDrake = requireCustomMonsterById("cm-guard-drake");
  const koboldInventor = requireCustomMonsterById("cm-kobold-inventor");
  const koboldScale = requireCustomMonsterById("cm-kobold-scale-sorcerer");
  const mondath = requireCustomMonsterById("cm-frulam-mondath");
  const rezmir = requireCustomMonsterById("cm-rezmir");
  const dragonclaw = requireCustomMonsterById("cm-dragonclaw");
  const dragonfang = requireCustomMonsterById("cm-dragonfang");
  const dragonsoul = requireCustomMonsterById("cm-dragonsoul");
  const dragonwing = requireCustomMonsterById("cm-dragonwing");
  const blagothkus = requireCustomMonsterById("cm-blagothkus");
  const iceToad = requireCustomMonsterById("cm-ice-toad");
  const talis = requireCustomMonsterById("cm-talis-the-white");
  const tiamat = requireCustomMonsterById("cm-tiamat");
  const severin = requireCustomMonsterById("cm-severin");
  const rathModar = requireCustomMonsterById("cm-rath-modar");
  const ambushDrake = requireCustomMonsterById("cm-ambush-drake");
  const halfDragon = requireCustomMonsterById("cm-half-dragon-veteran");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    // Episode 1 — Greenest in Flames (lvl 1-2)
    encounter(
      "Attack on Greenest",
      "Cyanwrath the half-blue-dragon veteran leads kobold sappers in burning Greenest.",
      compact([m(cyanwrath), many(guardDrake, 2), many(koboldInventor, 2)])
    ),
    // Episode 2 — Raiders' Camp (lvl 2-3)
    encounter(
      "Raiders' Camp Assault",
      "The party infiltrates the cult's roadside raider camp led by Frulam Mondath.",
      compact([m(mondath), many(dragonsoul, 2)])
    ),
    // Episode 3 — Dragon Hatchery (lvl 3)
    encounter(
      "Dragon Hatchery in the Dreaming Cave",
      "Cultists harvest dragon eggs in the Dreaming Cave under guard drake protection.",
      compact([many(guardDrake, 2), many(koboldScale, 2)])
    ),
    // Episode 6 — Castle Naerytar (lvl 4-5)
    encounter(
      "Castle Naerytar: Rezmir's Court",
      "Rezmir the half-black-dragon Wyrmspeaker leads her cult cadre in Castle Naerytar.",
      compact([m(rezmir), many(dragonclaw, 3), many(dragonfang, 1), many(dragonsoul, 1)])
    ),
    // Episode 8 — Castle in the Clouds (lvl 5-7)
    encounter(
      "Castle in the Clouds: Blagothkus",
      "Blagothkus the cloud giant warlord commands Skyreach Castle.",
      compact([m(blagothkus), many(dragonwing, 2)])
    ),
    // Episode 10 — Sea of Moving Ice (lvl 9-10)
    encounter(
      "Sea of Moving Ice: Ice Toads",
      "Frost giants unleash ice toad packs on the party at Oyaviggaton.",
      compact([many(iceToad, 4), many(ambushDrake, 2)])
    ),
    // Episode 12 — The Factions Unite (lvl 11-13)
    encounter(
      "Council of Dragons: Talis the White",
      "Talis the White, adult silver dragon, rallies metallic allies against Tiamat.",
      compact([m(talis), many(halfDragon, 4)])
    ),
    // Episode 13 — The Well of Dragons (lvl 13-15)
    encounter(
      "The Well of Dragons: Tiamat's Return",
      "Tiamat manifests at the Well of Dragons as Severin and Rath Modar lead the final assault.",
      compact([m(tiamat), m(severin), m(rathModar), many(ambushDrake, 3)])
    ),
  ];
}

/**
 * Build the encounter list for Baldur's Gate: Descent into Avernus.
 * Covers the five-chapter structure with key Avernus set-pieces.
 */
function bgdiaEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const cultist = requireCustomMonsterById("cm-cultist-dead-three");
  const merregon = requireCustomMonsterById("cm-merregon");
  const narzugon = requireCustomMonsterById("cm-narzugon");
  const hellwasp = requireCustomMonsterById("cm-hellwasp");
  const hellwaspSwarm = requireCustomMonsterById("cm-hellwasp-swarm");
  const swordWraith = requireCustomMonsterById("cm-sword-wraith-commander");
  const bulezau = requireCustomMonsterById("cm-bulezau");
  const whiteAbishai = requireCustomMonsterById("cm-white-abishai");
  const zariel = requireCustomMonsterById("cm-zariel");
  const yeenoghu = requireCustomMonsterById("cm-yeenoghu");
  const hollyphant = requireCustomMonsterById("cm-hollyphant");
  const fleshGolem = requireCustomMonsterById("cm-fiendish-flesh-golem");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    // Ch 1 — A Tale of Two Cities (lvl 1-4)
    encounter(
      "Cult of the Dead Three in the Bathhouse Dungeon",
      "Cultists of the Dead Three perform grisly rituals in a bathhouse dungeon beneath Baldur's Gate.",
      compact([many(cultist, 4), m(fleshGolem)])
    ),
    // Ch 1 — Vanthampur Villa dungeon (lvl 3-5)
    encounter(
      "Vanthampur Villa Dungeon",
      "Merregon devil soldiers and a fiendish flesh golem defend the Vanthampur Villa basement.",
      compact([many(merregon, 2), m(fleshGolem), m(narzugon)])
    ),
    // Ch 2 — Elturel Has Fallen (lvl 4-6)
    encounter(
      "Elturel's Burning Refugees",
      "Hellriders on narzugon mounts pursue refugees fleeing the burning city of Elturel.",
      compact([many(narzugon, 2), many(cultist, 4)])
    ),
    // Ch 3 — Hellwasp Nest (lvl 6-8)
    encounter(
      "Hellwasp Nest",
      "Massive hellwasps attack the party's infernal war machine in the bone fields of Avernus.",
      compact([m(hellwasp), m(hellwaspSwarm), many(hellwasp, 2)])
    ),
    // Ch 3 — Crypt of the Hellriders (lvl 7-9)
    encounter(
      "Crypt of the Hellriders",
      "Sword wraith commanders lead undead knights in the Crypt of the Hellriders.",
      compact([m(swordWraith), many(merregon, 2)])
    ),
    // Ch 3 — Bel's Forge (lvl 8-10)
    encounter(
      "Bel's Forge: The Archdevil's Workshop",
      "Bel's bulezau and narzugon guard the infernal war factory at the Forge.",
      compact([m(bulezau), many(merregon, 4), many(narzugon, 2), m(whiteAbishai)])
    ),
    // Ch 5 — Zariel's Flying Fortress (lvl 12-13)
    encounter(
      "Zariel's Flying Fortress",
      "The archdevil Zariel awaits in her flying citadel, with Yeenoghu as a surprise cameo.",
      compact([m(zariel), m(yeenoghu), m(hollyphant), many(merregon, 4)])
    ),
  ];
}

function wdhEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const zhentarim = requireCustomMonsterById("cm-zhentarim-thug");
  const manshoon = requireCustomMonsterById("cm-manshoon-manyfaced");
  const jarlaxle = requireCustomMonsterById("cm-jarlaxle-baenre");
  const veteran = requireCustomMonsterById("cm-veteran");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Zhentarim Thugs at the Yawning Portal",
      "A street-level Zhentarim ambush spills out of the Yawning Portal tavern.",
      compact([many(zhentarim, 4)])
    ),
    encounter(
      "Manshoon's Tower",
      "Manshoon the Manyfaced confronts the party in Kolat Towers' parlor.",
      compact([m(manshoon), many(zhentarim, 4), many(veteran, 2)])
    ),
    encounter(
      "Jarlaxle's Shadowy Deal",
      "Drow mercenary Jarlaxle Baenre offers the party a deal at the Stonecutters' Guildhall.",
      compact([m(jarlaxle), many(veteran, 3)])
    ),
  ];
}

function sktEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const chiefGuh = requireCustomMonsterById("cm-chief-guh");
  const jarlStorvald = requireCustomMonsterById("cm-jarl-storvald");
  const dukeZalto = requireCustomMonsterById("cm-duke-zalto");
  const yikaria = requireCustomMonsterById("cm-yikaria");
  const uthgardtShaman = requireCustomMonsterById("cm-uthgardt-shaman");
  const slarkrethel = requireCustomMonsterById("cm-slarkrethel");
  const kingHekaton = requireCustomMonsterById("cm-king-hekaton");
  const iymrithDisguised = requireCustomMonsterById("cm-iymrith-disguised");
  const iymrithAncientBlue = requireCustomMonsterById("cm-iymrith-ancient-blue");
  const maegera = requireCustomMonsterById("cm-maegera-dawn-titan");
  const hillGiant = requireCustomMonsterById("cm-hill-giant");
  const fireGiant = requireCustomMonsterById("cm-fire-giant");
  const frostGiant = requireCustomMonsterById("cm-frost-giant");
  const cloudGiant = requireCustomMonsterById("cm-cloud-giant");
  const ogre = requireCustomMonsterById("cm-ogre");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Hill Giant Raid on Nightstone",
      "Starving hill giants attack the refuge of Nightstone for food.",
      compact([many(hillGiant, 4), many(ogre, 4)])
    ),
    encounter(
      "Chief Guh at Grudd Haug",
      "The hill giant chief Chief Guh holds court in his throne room.",
      compact([m(chiefGuh), many(hillGiant, 6)])
    ),
    encounter(
      "Jarl Storvald's Glacial Rift",
      "Frost giant Jarl Storvald guards the rift leading to Maelstrom.",
      compact([m(jarlStorvald), many(frostGiant, 4)])
    ),
    encounter(
      "Duke Zalto's Fire Forge",
      "Fire giant Duke Zalto forges the Ordning Crown at Ironslag.",
      compact([m(dukeZalto), many(fireGiant, 4)])
    ),
    encounter(
      "Slarkrethel's Lair",
      "The kraken Slarkrethel ambushes the party underwater in the Trackless Sea.",
      compact([m(slarkrethel)])
    ),
    encounter(
      "Yikaria's Floating Citadel",
      "Giant-king Yikaria holds court on a cloud-borne flying palace.",
      compact([m(yikaria), many(cloudGiant, 4)])
    ),
    encounter(
      "King Hekaton at Maelstrom",
      "The storm giant king Hekaton is rescued from his underwater prison.",
      compact([m(kingHekaton)])
    ),
    encounter(
      "Uthgardt Shaman at Stone Bridge",
      "An Uthgardt barbarian shaman challenges the party at a sacred stone bridge.",
      compact([m(uthgardtShaman), many(ogre, 4)])
    ),
    encounter(
      "Iymrith Revealed",
      "The ancient blue dragon Iymrith drops her giant form and reveals her true self.",
      compact([m(iymrithDisguised), m(iymrithAncientBlue)])
    ),
    encounter(
      "Maegera, the Dawn Titan",
      "The primordial Maegera erupts from the Dawn Titan's Tomb beneath the Maelstrom.",
      compact([m(maegera)])
    ),
  ];
}

function ootEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const drowEliteWarrior = requireCustomMonsterById("cm-drow-elite-warrior");
  const drider = requireCustomMonsterById("cm-drider");
  const ilvara = requireCustomMonsterById("cm-ilvara-mizzrym");
  const themberchaud = requireCustomMonsterById("cm-themberchaud");
  const rockblight = requireCustomMonsterById("cm-rockblight");
  const puddingKing = requireCustomMonsterById("cm-pudding-king");
  const troglodyte = requireCustomMonsterById("cm-troglodyte");
  const darkHunter = requireCustomMonsterById("cm-dark-hunter");
  const elderPurpleWorm = requireCustomMonsterById("cm-elder-purple-worm");
  const mazeEngine = requireCustomMonsterById("cm-maze-engine");
  const sporeServantBrute = requireCustomMonsterById("cm-spore-servant-brute");
  const demogorgon = requireCustomMonsterById("cm-demogorgon");
  const orcus = requireCustomMonsterById("cm-orcus");
  const zuggtmoy = requireCustomMonsterById("cm-zuggtmoy");
  const juiblex = requireCustomMonsterById("cm-juiblex");
  const frazUrbluu = requireCustomMonsterById("cm-fraz-urbluu");
  const yeenoghu = requireCustomMonsterById("cm-gnoll-fang-of-yeenoghu");
  const derroSavant = requireCustomMonsterById("cm-derro-savant");
  const ixitxachitl = requireCustomMonsterById("cm-ixitxachitl");
  const duergar = requireCustomMonsterById("cm-duergar");
  const deathSlaad = requireCustomMonsterById("cm-death-slaad");
  const grick = requireCustomMonsterById("cm-grimlock");
  const beholder = requireCustomMonsterById("cm-beholder");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Velkenvelve Escape",
      "The drow Ilvara Mizzrym and her elite guard pursue the escaping prisoners.",
      compact([m(ilvara), many(drowEliteWarrior, 6), many(drider, 2)])
    ),
    encounter(
      "Themberchaud the Wyvern",
      "The arrogant wyvern Themberchaud guards his rockblight nest.",
      compact([m(themberchaud), m(rockblight), many(troglodyte, 6)])
    ),
    encounter(
      "Neverlight Grove",
      "The demon lord Zuggtmoy's spore servants corrupt a once-beautiful grove.",
      compact([m(zuggtmoy), many(sporeServantBrute, 6), m(puddingKing)])
    ),
    encounter(
      "Gracklstugh Duergar Council",
      "The duergar stone-guard council debates whether to surrender the party to the drow.",
      compact([many(duergar, 6)])
    ),
    encounter(
      "Blingdenstone Defense",
      "The derro savant captures the party and challenges them in the fungal arena.",
      compact([m(derroSavant), many(grick, 4)])
    ),
    encounter(
      "Darklake Aboleth Lair",
      "An aboleth plots beneath the Darklake, enslaving ixitxachitl vigilante priests.",
      compact([m(beholder), many(ixitxachitl, 4)])
    ),
    encounter(
      "Demon Lord Encounter — Demogorgon",
      "The Prince of Demons erupts from Sloobludop's fetid waters.",
      compact([m(demogorgon), many(yeenoghu, 4)])
    ),
    encounter(
      "Demon Lord Encounter — Orcus",
      "The Demon Prince of the Undead arises from a corrupted shrine.",
      compact([m(orcus), many(deathSlaad, 6)])
    ),
    encounter(
      "Demon Lord Encounter — Zuggtmoy",
      "The demon queen of rot claims a festering grotto for her fungal court.",
      compact([m(zuggtmoy), many(elderPurpleWorm, 2)])
    ),
    encounter(
      "Demon Lord Encounter — Juiblex",
      "The Faceless Lord's ooze-pit bubbles up around the party.",
      compact([m(juiblex)])
    ),
    encounter(
      "Demon Lord Encounter — Fraz-Urb'luu",
      "The self-styled Prince of Deception reveals his true, terrible form.",
      compact([m(frazUrbluu)])
    ),
    encounter(
      "Gauntlgrym Pit Fight",
      "Fighting pit arena — drow, duergar, and prisoners in a chaotic brawl.",
      compact([many(drowEliteWarrior, 4), many(duergar, 4), many(troglodyte, 4)])
    ),
    encounter(
      "Audience with the Mages of Menzobarranzan",
      "Drow mage council interviews the party at the gates of the Underdark city.",
      compact([many(drowEliteWarrior, 8), m(mazeEngine)])
    ),
    encounter(
      "Mantol-Derith Dark Marketplace",
      "Caravan ambush by mind flayers and their grimlock servants.",
      compact([many(beholder, 2), many(grick, 6), m(darkHunter)])
    ),
    encounter(
      "Maze Engine Awakens",
      "The wandering maze spawns a maze engine, hunting the party.",
      compact([m(mazeEngine)])
    ),
    encounter(
      "Escape from the Abyss",
      "Last stand at the surface — drow pursuit and elder purple worm attack.",
      compact([many(drowEliteWarrior, 4), many(drider, 2), m(elderPurpleWorm)])
    ),
  ];
}

function dipEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const manticore = requireCustomMonsterById("cm-manticore");
  const cryovain = requireCustomMonsterById("cm-cryovain");
  const orc = requireCustomMonsterById("cm-orc");
  const orog = requireCustomMonsterById("cm-orog");
  const hobgoblin = requireCustomMonsterById("cm-hobgoblin");
  const hobgoblinCaptain = requireCustomMonsterById("cm-hobgoblin-captain");
  const stirges = requireCustomMonsterById("cm-stirges");
  const owlbear = requireCustomMonsterById("cm-owlbear");
  const gnoll = requireCustomMonsterById("cm-gnoll-fang-of-yeenoghu");
  const giantSpider = requireCustomMonsterById("cm-giant-spider");
  const bugbear = requireCustomMonsterById("cm-bugbear");
  const polarBear = requireCustomMonsterById("cm-polar-bear");
  const yeti = requireCustomMonsterById("cm-yeti");
  const piercer = requireCustomMonsterById("cm-piercer");
  const ogre = requireCustomMonsterById("cm-ogre");
  const youngRedDragon = requireCustomMonsterById("cm-young-red-dragon");
  const veteran = requireCustomMonsterById("cm-veteran");
  const stormGiant = requireCustomMonsterById("cm-storm-giant-awakened");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Manticore at Umbrage Hill",
      "A manticore attacks the windmill at Umbrage Hill.",
      compact([m(manticore), many(stirges, 4)])
    ),
    encounter(
      "Orc Tuskenross Ambush",
      "An orc war band led by an orog lies in wait at the Triboar Trail.",
      compact([many(orc, 8), m(orog)])
    ),
    encounter(
      "Hobgoblin Captain at Conyberry",
      "A hobgoblin captain rallies a raiding force outside Conyberry.",
      compact([m(hobgoblinCaptain), many(hobgoblin, 6), many(veteran, 2)])
    ),
    encounter(
      "Giant Spider's Lair",
      "A giant spider has strung her web across the road leading to Phandalin.",
      compact([m(giantSpider), many(stirges, 6)])
    ),
    encounter(
      "Owlbear Mountain Den",
      "A territorial owlbear defends its mountain lair.",
      compact([m(owlbear)])
    ),
    encounter(
      "Gnoll Pack at Wyvern Tor",
      "A gnoll pack ambushes the party at Wyvern Tor.",
      compact([many(gnoll, 6)])
    ),
    encounter(
      "Triboar Lane Ambush",
      "Mixed creature ambush — orc and hobgoblin raids collide on the Triboar.",
      compact([many(orc, 4), many(hobgoblin, 4), m(bugbear)])
    ),
    encounter(
      "Bugbear Chief at Axeholm",
      "A bugbear chief has fortified an abandoned dwarven outpost.",
      compact([m(bugbear), many(bugbear, 4)])
    ),
    encounter(
      "Yeti in the Spine of the World",
      "An albino yeti stalks the party across the Spine of the World's snowfields.",
      compact([m(yeti), many(polarBear, 2)])
    ),
    encounter(
      "Piercer Ambush in the Peaks",
      "Piercers drop from the ceiling of a narrow mountain pass.",
      compact([many(piercer, 6)])
    ),
    encounter(
      "Ogre Stronghold",
      "An ogre war band occupies an abandoned bandit camp.",
      compact([many(ogre, 4)])
    ),
    encounter(
      "Falcon's Hunting Lodge",
      "Mountain predators surround the party's lodge in the foothills.",
      compact([m(owlbear), many(polarBear, 3)])
    ),
    encounter(
      "Rezil's Tower Assault",
      "A veteran mage holds the tower against the party's assault.",
      compact([many(veteran, 4), m(hobgoblinCaptain)])
    ),
    encounter(
      "Cryovain at Icespire Hold",
      "The young white dragon Cryovain descends upon Icespire Peak.",
      compact([m(cryovain), m(stormGiant), many(ogre, 4)])
    ),
    encounter(
      "Storm Giant's Wrath",
      "An awakened storm giant unleashes thunder and lightning upon the climbing party.",
      compact([m(stormGiant), m(youngRedDragon), many(orc, 6)])
    ),
  ];
}

function pabtsoEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const psionicGoblin = requireCustomMonsterById("cm-psionic-goblin");
  const psionicGoblinBoss = requireCustomMonsterById("cm-psionic-goblin-boss");
  const cloaker = requireCustomMonsterById("cm-cloaker");
  const nezznar = requireCustomMonsterById("cm-nezznar");
  const mindFlayerCultist = requireCustomMonsterById("cm-mind-flayer-cultist");
  const obeliskSentinel = requireCustomMonsterById("cm-obelisk-sentinel");
  const elderBrainDragon = requireCustomMonsterById("cm-elder-brain-dragon");
  const nethereseObeliskBoss = requireCustomMonsterById("cm-netherese-obelisk-boss");
  const shadow = requireCustomMonsterById("cm-shadow");
  const hookHorror = requireCustomMonsterById("cm-hook-horror");
  const drider = requireCustomMonsterById("cm-drider");
  const hobgoblin = requireCustomMonsterById("cm-hobgoblin");
  const mindFlayer = requireCustomMonsterById("cm-mind-flayer");
  const veteran = requireCustomMonsterById("cm-veteran");
  const giantSpider = requireCustomMonsterById("cm-giant-spider");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Cragmaw Ambush at Triboar Trail",
      "Cragmaw goblins, led by a psionic goblin boss, ambush the wagon.",
      compact([many(psionicGoblin, 6), m(psionicGoblinBoss)])
    ),
    encounter(
      "Spider's Web — Cragmaw Castle",
      "Spiders and goblins patrol the goblin castle beneath Phandalin.",
      compact([many(psionicGoblin, 6), m(giantSpider)])
    ),
    encounter(
      "Hook Horror Ambush",
      "Hook horrors burst from a cavern wall at the party's approach.",
      compact([many(hookHorror, 4)])
    ),
    encounter(
      "Cloaker Mutate",
      "A cloaker mutates and ambushes the party from beneath a stone bridge.",
      compact([m(cloaker), many(shadow, 4)])
    ),
    encounter(
      "Wave Echo Cave Obelisk",
      "A mind flayer cultist tends to an obelisk fragment in the depths of Wave Echo Cave.",
      compact([m(mindFlayerCultist), m(obeliskSentinel), many(shadow, 6)])
    ),
    encounter(
      "Nezznar's Fortress Ambush",
      "The doppelganger crime lord Nezznar confronts the party at his hidden fortress.",
      compact([m(nezznar), m(mindFlayer), many(veteran, 4)])
    ),
    encounter(
      "Shattered Obelisk Awakens",
      "The Netherese obelisk pulses with malevolent psionic energy.",
      compact([m(nethereseObeliskBoss), m(obeliskSentinel), many(shadow, 8)])
    ),
    encounter(
      "Elder Brain Dragon Confrontation",
      "A mind flayer elder brain fused with a dragon attacks the party's stronghold.",
      compact([m(elderBrainDragon), many(mindFlayer, 4), many(drider, 2)])
    ),
    encounter(
      "Cragmaw Reinforcements at Phandalin",
      "Hobgoblin commandos and mind flayer thralls assault the town.",
      compact([many(hobgoblin, 6), m(mindFlayerCultist), m(mindFlayer)])
    ),
  ];
}

/**
 * Build the encounter list for Icewind Dale: Rime of the Frostmaiden. Set-piece boss fights across the 7-chapter survival-horror campaign, monsters pulled from CUSTOM_MONSTERS with unique per-instance ids.
 */
function rimeEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const coldlight = requireCustomMonsterById("cm-coldlight-walker");
  const berserker = requireCustomMonsterById("cm-chardalyn-berserker");
  const wyrmling = requireCustomMonsterById("cm-white-dragon-wyrmling-rime");
  const cragCat = requireCustomMonsterById("cm-crag-cat");
  const duergar = requireCustomMonsterById("cm-duergar-soldier-rime");
  const xardorok = requireCustomMonsterById("cm-xardorok-sunblight");
  const chardalynDragon = requireCustomMonsterById("cm-chardalyn-dragon");
  const frostDruid = requireCustomMonsterById("cm-frost-druid");
  const gerti = requireCustomMonsterById("cm-gerti-orelsdottr");
  const auril = requireCustomMonsterById("cm-auril-frostmaiden");
  const aunaut = requireCustomMonsterById("cm-aunaut-aurilblight");
  const mindFlayer = requireCustomMonsterById("cm-ythryn-mind-flayer");
  const iriolarthas = requireCustomMonsterById("cm-iriolarthas");
  const leviathan = requireCustomMonsterById("cm-leviathan");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Coldlight in the Blizzard",
      "Ch. 1 — An undead coldlight walker and frozen dead rise from the whiteout on the road between Ten-Towns.",
      compact([m(coldlight), many(coldlight, 2)])
    ),
    encounter(
      "Chardalyn Berserker Cave",
      "Ch. 1 — Chardalyn-maddened Reghed nomads and their white dragon wyrmling guards fight to the last around a black crystal brazier.",
      compact([many(berserker, 4), many(wyrmling, 2)])
    ),
    encounter(
      "Cackling Chasm Predators",
      "Ch. 2 — Crag cats stalk the party across the ice while a lone wyrmling circles overhead.",
      compact([many(cragCat, 3), m(wyrmling)])
    ),
    encounter(
      "Sunblight Fortress Assault",
      "Ch. 3 — Xardorok Sunblight and his duergar soldiers defend the forge that built the chardalyn dragon.",
      compact([m(xardorok), many(duergar, 8)])
    ),
    encounter(
      "Duergar Stone Guard",
      "Ch. 3 — A disciplined duergar patrol ambushes the party in the lower halls of Sunblight.",
      compact([many(duergar, 6), m(xardorok)])
    ),
    encounter(
      "Battle of Ten-Towns",
      "Ch. 4 — The chardalyn dragon descends on Bryn Shander; the town's fate rides on this fight. (Destruction's Light)",
      compact([m(chardalynDragon)])
    ),
    encounter(
      "Grimskalle Devotees",
      "Ch. 5 — Frost druids of Auril and a frost giant jarl bar the way into the Frostmaiden's island fortress.",
      compact([m(gerti), many(frostDruid, 3), many(wyrmling, 1)])
    ),
    encounter(
      "Auril, the Frostmaiden",
      "Ch. 5 — The goddess of winter confronts the party in her ten-foot ice-woman form, wrapped in a killing frost aura.",
      compact([m(auril), many(frostDruid, 2)])
    ),
    encounter(
      "Caves of Hunger",
      "Ch. 6 — Aunaut Aurilblight, priest-king of dead Ythryn, leads frost druids through the glacial labyrinth beneath the Reghed.",
      compact([m(aunaut), many(frostDruid, 3), many(coldlight, 2)])
    ),
    encounter(
      "Mind Flayers of Ythryn",
      "Ch. 7 — Illithid survivors of the Netherese necropolis strike from the shadows of the buried city.",
      compact([many(mindFlayer, 3)])
    ),
    encounter(
      "Iriolarthas, the Netherese Necromancer",
      "Ch. 7 — The undead archwizard of Ythryn defends the mythallar with siphoned Netherese magic.",
      compact([m(iriolarthas), many(mindFlayer, 2), many(coldlight, 2)])
    ),
    encounter(
      "The Leviathan Released",
      "Ch. 7 — A colossal wave-serpent of Realms myth is loosed as a last resort beneath the necropolis.",
      compact([m(leviathan)])
    ),
  ];
}

/**
 * Build the encounter list for The Wild Beyond the Witchlight. Optional-combat set-pieces across the 5-chapter Feywild adventure, culminating in the Hourglass Coven confrontation.
 */
function wbtwEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const brigand = requireCustomMonsterById("cm-harengon-brigand");
  const agdon = requireCustomMonsterById("cm-agdon-longscarf");
  const toy = requireCustomMonsterById("cm-animated-toy");
  const darkling = requireCustomMonsterById("cm-darkling-elder");
  const displacer = requireCustomMonsterById("cm-displacer-beast-pack-lord");
  const bavlorna = requireCustomMonsterById("cm-bavlorna-blightstraw");
  const skabatha = requireCustomMonsterById("cm-skabatha-nightshade");
  const unicorn = requireCustomMonsterById("cm-corrupted-unicorn");
  const wendigo = requireCustomMonsterById("cm-wendigo");
  const jabberwock = requireCustomMonsterById("cm-jabberwock");
  const brigid = requireCustomMonsterById("cm-brigid-morningglow");
  const mungoj = requireCustomMonsterById("cm-mungoj-reyhorn");
  const endelyn = requireCustomMonsterById("cm-endelyn-moongrave");
  const gala = requireCustomMonsterById("cm-sister-gala");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Harengon Brigands",
      "Ch. 1 — Agdon Longscarf and his rabbit-folk bandits demand a toll on the road to the Witchlight Carnival.",
      compact([m(agdon), many(brigand, 3)])
    ),
    encounter(
      "Bavlorna's Bog",
      "Ch. 2 (Hither) — The Hag of the East and her darkling servants ambush trespassers among the sorrow-bottles of her cottage.",
      compact([m(bavlorna), many(darkling, 4)])
    ),
    encounter(
      "Witchlight Thieves",
      "Ch. 3 (Thither) — A displacer beast pack roams Thither hunting anything that carries fey light.",
      compact([m(displacer), many(darkling, 2)])
    ),
    encounter(
      "Skabatha's Toy Factory",
      "Ch. 3 (Thither) — The Hag of the South animates her workshop; animated toys swarm from every shelf.",
      compact([m(skabatha), many(toy, 6)])
    ),
    encounter(
      "The Wendigo Hunt",
      "Ch. 4 (Yon) — A starving winter-spirit of the fractured Feywild runs the party down through the frozen wood.",
      compact([m(wendigo), many(toy, 2)])
    ),
    encounter(
      "The Jabberwock",
      "Ch. 4 (Yon) — The burbling terror of Yon: eyes of flame, jaws that bite, claws that catch.",
      compact([m(jabberwock)])
    ),
    encounter(
      "Endelyn's Moonlit Grove",
      "Ch. 4 (Yon) — Endelyn Moongrave fights beside a unicorn she has bound and defiled with tainted moonlight.",
      compact([m(endelyn), m(unicorn)])
    ),
    encounter(
      "The Hourglass Coven",
      "Ch. 5 (Palace of Heart's Desire) — Brigid Morningglow, Mungoj Reyhorn, Endelyn Moongrave, and Sister Gala re-form the full coven for the final battle over Prismeer.",
      compact([m(brigid), m(mungoj), m(endelyn), m(gala)])
    ),
  ];
}

/**
 * Build the encounter list for Princes of the Apocalypse. Signature set-pieces across the 5-chapter Elemental Evil sandbox, from the cult outposts through the four Elemental Nodes and the Elder Elemental Eye. 20+ encounters covering all four elements.
 */
function potaEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const cultist = requireCustomMonsterById("cm-black-earth-cultist");
  const airEle = requireCustomMonsterById("cm-air-elemental");
  const earthEle = requireCustomMonsterById("cm-earth-elemental");
  const fireEle = requireCustomMonsterById("cm-fire-elemental");
  const waterEle = requireCustomMonsterById("cm-water-elemental");
  const vaporEle = requireCustomMonsterById("cm-vapor-elemental");
  const myrmidon = requireCustomMonsterById("cm-earth-elemental-myrmidon");
  const aerisi = requireCustomMonsterById("cm-aerisi-kalinoth");
  const gar = requireCustomMonsterById("cm-gar-shatterkeel");
  const marlos = requireCustomMonsterById("cm-marlos-urnrayle");
  const vanifer = requireCustomMonsterById("cm-vanifer");
  const imix = requireCustomMonsterById("cm-imix");
  const ogremoch = requireCustomMonsterById("cm-ogremoch");
  const yuanTin = requireCustomMonsterById("cm-yuan-tin");
  const bane = requireCustomMonsterById("cm-bane");
  const eye = requireCustomMonsterById("cm-elder-elemental-eye");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Delegation Disappearance",
      "Ch. 1 — Black Earth cultists are behind the missing delegation in Red Larch.",
      compact([many(cultist, 4), m(myrmidon)])
    ),
    encounter(
      "Feathergale Spire (Howling Hate)",
      "Ch. 1 — Air cultists and their bound elementals hold the tower shrine of the Cult of the Howling Hate.",
      compact([m(aerisi), many(airEle, 2), many(cultist, 2)])
    ),
    encounter(
      "Sacred Stone Quarry (Black Earth)",
      "Ch. 1 — Marlos Urnrayle turns his petrifying gaze on intruders at the stone quarry.",
      compact([m(marlos), many(earthEle, 2), many(cultist, 3)])
    ),
    encounter(
      "Rivergard Keep (Crushing Wave)",
      "Ch. 2 — Gar Shatterkeel and water elementals defend the bandit keep on the Dessarin.",
      compact([m(gar), many(waterEle, 2), many(cultist, 3)])
    ),
    encounter(
      "Scarlet Moon Hall (Eternal Flame)",
      "Ch. 2 — Vanifer and fire elementals guard the burning hall of the Cult of the Eternal Flame.",
      compact([m(vanifer), many(fireEle, 2), many(cultist, 3)])
    ),
    encounter(
      "Sacred Stone Monastery",
      "Ch. 2 — Earth elemental myrmidons drill in the halls of the Black Earth monastery.",
      compact([many(myrmidon, 3), many(cultist, 4)])
    ),
    encounter(
      "Haunted Keep Vapor Ambush",
      "Ch. 2 — Vapor elementals of the Howling Hate choke the ruined keep with blinding mist.",
      compact([many(vaporEle, 3), many(cultist, 2)])
    ),
    encounter(
      "Temple of Elemental Evil — Earth Quadrant",
      "Ch. 3 — Marlos Urnrayle makes his last stand among galeb-duhr-strewn tunnels of the Fane.",
      compact([m(marlos), many(earthEle, 3), many(myrmidon, 1)])
    ),
    encounter(
      "Temple of Elemental Evil — Air Quadrant",
      "Ch. 3 — Aerisi Kalinoth and a storm of air and vapor elementals hold the Howling Hate sanctum.",
      compact([m(aerisi), many(airEle, 3), many(vaporEle, 2)])
    ),
    encounter(
      "Temple of Elemental Evil — Water Quadrant",
      "Ch. 3 — Gar Shatterkeel floods the Crushing Wave sanctum with elementals.",
      compact([m(gar), many(waterEle, 4)])
    ),
    encounter(
      "Temple of Elemental Evil — Fire Quadrant",
      "Ch. 3 — Vanifer and a bonfire of fire elementals defend the Eternal Flame sanctum.",
      compact([m(vanifer), many(fireEle, 4)])
    ),
    encounter(
      "Fane of the Eye — Reconvened Prophets",
      "Ch. 4 — The surviving prophets and their cultists rally at the central Fane of the Eye.",
      compact([m(aerisi), m(marlos), many(cultist, 6)])
    ),
    encounter(
      "Fane of the Eye — Elemental Guard",
      "Ch. 4 — One elemental of each kind guards the descent to the nodes.",
      compact([m(airEle), m(earthEle), m(fireEle), m(waterEle)])
    ),
    encounter(
      "Earth Node — Ogrémoch",
      "Ch. 5 — The Elemental Prince of Evil Earth, a moving mountain of black stone, rules the Earth Node.",
      compact([m(ogremoch), many(earthEle, 2)])
    ),
    encounter(
      "Fire Node — Imix",
      "Ch. 5 — The Elemental Prince of Evil Fire burns at the heart of the Fire Node.",
      compact([m(imix), many(fireEle, 2)])
    ),
    encounter(
      "Water Node — Yuan-Tin",
      "Ch. 5 — The Elemental Princess of Evil Water churns through the drowned Water Node.",
      compact([m(yuanTin), many(waterEle, 2)])
    ),
    encounter(
      "Air Node — Bane",
      "Ch. 5 — The Elemental Prince of Evil Air howls unseen through the Air Node.",
      compact([m(bane), many(airEle, 2)])
    ),
    encounter(
      "Black Earth Node Vanguard",
      "Ch. 5 — Earth elemental myrmidons and cultists cover Ogrémoch's flank.",
      compact([many(myrmidon, 3), many(cultist, 4)])
    ),
    encounter(
      "Eternal Flame Node Vanguard",
      "Ch. 5 — Vanifer's last fire cultists throw themselves into the breach.",
      compact([m(vanifer), many(fireEle, 3), many(cultist, 3)])
    ),
    encounter(
      "Crushing Wave Node Vanguard",
      "Ch. 5 — Gar Shatterkeel's water elementals flood the approach to the Water Node.",
      compact([m(gar), many(waterEle, 3), many(cultist, 2)])
    ),
    encounter(
      "Howling Hate Node Vanguard",
      "Ch. 5 — Aerisi Kalinoth's air and vapor elementals scream through the Air Node approach.",
      compact([m(aerisi), many(airEle, 3), many(vaporEle, 2)])
    ),
    encounter(
      "The Elder Elemental Eye",
      "Ch. 5 — The maddening god-shard behind all four cults manifests as a mountain of ringed, burning, freezing eyes.",
      compact([m(eye)])
    ),
  ];
}

/**
 * Build the encounter list for Curse of the Crimson Throne (Pathfinder Adventure Path presented with 5e SRD-style stat blocks). Signature set-pieces across the 6-chapter Korvosa campaign. Encounters converted from the original Pathfinder material carry a "(5e conversion)" note.
 */
function cotctEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const carrionGolem = requireCustomMonsterById("cm-carrion-golem");
  const doll = requireCustomMonsterById("cm-soulbound-doll");
  const devilfish = requireCustomMonsterById("cm-devilfish");
  const raktavarna = requireCustomMonsterById("cm-raktavarna");
  const dreamSpider = requireCustomMonsterById("cm-dream-spider");
  const reefclaw = requireCustomMonsterById("cm-reefclaw");
  const skeletonKnight = requireCustomMonsterById("cm-skeleton-knight-scarwall");
  const danseMacabre = requireCustomMonsterById("cm-danse-macabre");
  const chainedSpirit = requireCustomMonsterById("cm-chained-spirit");
  const umbralDragon = requireCustomMonsterById("cm-umbral-dragon");
  const princeInChains = requireCustomMonsterById("cm-prince-in-chains");
  const greaterDoppelganger = requireCustomMonsterById("cm-greater-doppelganger");
  const redMantis = requireCustomMonsterById("cm-red-mantis-assassin");
  const ileosa = requireCustomMonsterById("cm-ileosa-arabasti");
  const kazavon = requireCustomMonsterById("cm-kazavon");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Korvosan Street Riot",
      "Ch. 1 (Edge of Anarchy) — Crepusculum spies incite a plague of soulbound dolls into the rioting crowd. (5e conversion)",
      compact([many(doll, 4), many(raktavarna, 2)])
    ),
    encounter(
      "The Dead Warrens",
      "Ch. 1 (Edge of Anarchy) — A carrion golem stitched from executed criminals guards a smuggler's cache. (5e conversion)",
      compact([m(carrionGolem), many(raktavarna, 2)])
    ),
    encounter(
      "Blood Veil Plague Ward",
      "Ch. 2 (Seven Days to the Grave) — Plague-cult raktavarnas and a carrion golem drag away the dead and the dying. (5e conversion)",
      compact([m(carrionGolem), many(raktavarna, 3), many(doll, 2)])
    ),
    encounter(
      "Acadamae Crypts",
      "Ch. 2 (Seven Days to the Grave) — Devilfish infest the flooded lower crypts beneath the Acadamae. (5e conversion)",
      compact([many(devilfish, 3)])
    ),
    encounter(
      "Old Korvosa Gang War",
      "Ch. 3 (Escape from Old Korvosa) — Dream-spider shiver dens and reefclaw-infested docks make every alley in Old Korvosa lethal. (5e conversion)",
      compact([many(dreamSpider, 4), many(reefclaw, 2)])
    ),
    encounter(
      "The Rakshasa's Doubles",
      "Ch. 3 (Escape from Old Korvosa) — Greater doppelgangers wearing stolen faces spring the Queen's trap. (5e conversion)",
      compact([many(greaterDoppelganger, 3)])
    ),
    encounter(
      "Cinderlands Trial",
      "Ch. 4 (A History of Ashes) — A Red Mantis assassin follows the party across the Storval Plateau, striking from the ash. (5e conversion)",
      compact([m(redMantis), many(dreamSpider, 2)])
    ),
    encounter(
      "Skeletons of Scarwall — Outer Ward",
      "Ch. 5 (Skeletons of Scarwall) — Skeleton knights bound to the castle walls reassemble faster than the party can break them. (5e conversion)",
      compact([many(skeletonKnight, 4), many(chainedSpirit, 2)])
    ),
    encounter(
      "The Danse Macabre",
      "Ch. 5 (Skeletons of Scarwall) — A whirling chorus of ghost dancers animates every bone in the hall. (5e conversion)",
      compact([m(danseMacabre), many(skeletonKnight, 2)])
    ),
    encounter(
      "The Prince in Chains",
      "Ch. 5 (Skeletons of Scarwall) — The oathbreaker knight of Scarwall bars the way to Kazavon's relic. (5e conversion)",
      compact([m(princeInChains), many(chainedSpirit, 3)])
    ),
    encounter(
      "The Umbral Dragon of the Deep Vault",
      "Ch. 5 (Skeletons of Scarwall) — A gaunt shadow-winged dragon haunts the vault beneath the castle. (5e conversion)",
      compact([m(umbralDragon)])
    ),
    encounter(
      "Queen Ileosa Arabasti",
      "Ch. 6 (Crown of Fangs) — The Crown of Fangs regenerates the Queen faster than steel can end her; her royal doubles fight at her side. (5e conversion)",
      compact([m(ileosa), many(greaterDoppelganger, 4)])
    ),
    encounter(
      "Kazavon, the Dragon Tyrant",
      "Ch. 6 (Crown of Fangs) — The ancient dragon-spirit behind the Crimson Throne manifests in full in the throne room. (5e conversion)",
      compact([m(kazavon)])
    ),
  ];
}

/**
 * Build the encounter list for Hell's Rebels (Pathfinder Adventure Path presented with 5e SRD-style stat blocks). Urban-rebellion set-pieces across the 6-chapter Kintargo campaign. Devil stat blocks use canonical DamageType values only.
 */
function hrEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const dottari = requireCustomMonsterById("cm-dottari-guard");
  const hellknight = requireCustomMonsterById("cm-hellknight");
  const shrike = requireCustomMonsterById("cm-impaler-shrike");
  const gambler = requireCustomMonsterById("cm-gambling-devil");
  const scrivenite = requireCustomMonsterById("cm-scrivenite");
  const agent = requireCustomMonsterById("cm-thrune-agent");
  const chorister = requireCustomMonsterById("cm-diabolic-chorister");
  const forsaken = requireCustomMonsterById("cm-forsaken-legion");
  const nightprowler = requireCustomMonsterById("cm-nightprowler");
  const shadowDragon = requireCustomMonsterById("cm-shadow-dragon-hr");
  const shadowGolem = requireCustomMonsterById("cm-shadow-golem");
  const cruciarus = requireCustomMonsterById("cm-cruciarus");
  const barzillai = requireCustomMonsterById("cm-barbaroscia-thrune");
  const archdevil = requireCustomMonsterById("cm-barbaroscia-archdevil");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "The Proclamation Riot",
      "Ch. 1 (In Hell's Bright Shadow) — Barbaroscia's first edict turns the Aria Park crowd into a bloodbath of dottari and Thrune agents.",
      compact([many(dottari, 6), many(agent, 2)])
    ),
    encounter(
      "Impaler Shrikes of Kintargo",
      "Ch. 1 (In Hell's Bright Shadow) — Fey shrikes impale warnings — and rebels — on the railings of the Devil's Nursery.",
      compact([many(shrike, 4), many(scrivenite, 2)])
    ),
    encounter(
      "The Long Roads Coffeehouse Raid",
      "Ch. 2 (Turn of the Torrent) — Thrune agents and a gambling devil corner the Silver Ravens at their first safehouse.",
      compact([m(gambler), many(agent, 4)])
    ),
    encounter(
      "Order of the Torrent",
      "Ch. 2 (Turn of the Torrent) — The party must defeat the Hellknights of the Torrent to win them as allies.",
      compact([many(hellknight, 4), many(dottari, 2)])
    ),
    encounter(
      "Diabolic Choir of the Temple",
      "Ch. 3 (Dance of the Damned) — Diabolic choristers and scrivenites process through the streets binding listeners to Asmodeus's liturgy.",
      compact([many(chorister, 3), many(scrivenite, 3)])
    ),
    encounter(
      "Barbaroscia's Assassins",
      "Ch. 3 (Dance of the Damned) — Thrune agents and a gambling devil are sent to end the rebellion in one night.",
      compact([m(gambler), many(agent, 5)])
    ),
    encounter(
      "Assault on the Temple of Asmodeus",
      "Ch. 4 (A Song of Silver) — Hellknights, choristers, and a cruciarus hold the temple steps against the Silver Ravens.",
      compact([m(cruciarus), many(hellknight, 4), many(chorister, 2)])
    ),
    encounter(
      "Barbaroscia Thrune, Inquisitor",
      "Ch. 4 (A Song of Silver) — The tyrant-inquisitor of House Thrune fights from the high altar, calling infernal chains down on the rebels.",
      compact([m(barzillai), many(hellknight, 3)])
    ),
    encounter(
      "The Kintargo Contract",
      "Ch. 5 (The Kintargo Contract) — Forsaken legions of dead Chelish soldiers rise to enforce an infernal writ.",
      compact([many(forsaken, 3), many(scrivenite, 2)])
    ),
    encounter(
      "The Nightprowler",
      "Ch. 5 (The Kintargo Contract) — The monster of Kintargo's own making — a shadow-cloaked assassin-beast — hunts the party through the undercity.",
      compact([m(nightprowler), many(forsaken, 2)])
    ),
    encounter(
      "The Shadow Dragon of the Undercity",
      "Ch. 5 (The Kintargo Contract) — A dragon consumed by the Shadowfell claims the ancient vaults beneath the city.",
      compact([m(shadowDragon)])
    ),
    encounter(
      "Infernal Hauntings",
      "Ch. 6 (Breaking the Bones of Hell) — A shadow golem and forsaken legions besiege the liberated city as Hell pushes back.",
      compact([m(shadowGolem), many(forsaken, 4)])
    ),
    encounter(
      "Barbaroscia Thrune, Ascended",
      "Ch. 6 (Breaking the Bones of Hell) — Remade by Asmodeus into a horned archdevil, Barbaroscia meets the Silver Ravens in Caina for the final reckoning.",
      compact([m(archdevil), m(cruciarus)])
    ),
  ];
}

/**
 * Build the encounter list for Red Hand of Doom (classic 3.5e module presented with 5e SRD-style stat blocks). The army-vs-heroes campaign across 5 chapters, from the Witchwood to the Fane of Tiamat. 15+ encounters, combat-heavy throughout.
 */
function rhodEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const hob = requireCustomMonsterById("cm-hobgoblin-hand");
  const hobCaptain = requireCustomMonsterById("cm-hobgoblin-hand-captain");
  const bugbear = requireCustomMonsterById("cm-bugbear-red-hand");
  const hound = requireCustomMonsterById("cm-hell-hound-tiamat");
  const dragonspawn = requireCustomMonsterById("cm-tiamat-dragonspawn");
  const defender = requireCustomMonsterById("cm-red-hand-veteran");
  const skalmad = requireCustomMonsterById("cm-skalmad-red-fang");
  const kulkzor = requireCustomMonsterById("cm-kulkzor-wyrmspeaker");
  const hurog = requireCustomMonsterById("cm-hurog-manthex");
  const harnoth = requireCustomMonsterById("cm-harnoth-bloodwatcher");
  const abithriax = requireCustomMonsterById("cm-abithriax");
  const zanthrus = requireCustomMonsterById("cm-zanthrus-wyrmspeaker");
  const wyrmlord = requireCustomMonsterById("cm-wyrmlord");
  const azarrKul = requireCustomMonsterById("cm-azarr-kul");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Witchwood Ambush",
      "Ch. 1 (The Witchwood) — Red Hand hobgoblins and bugbears spring a road ambush with hell hounds loosed ahead of the column.",
      compact([many(hob, 8), many(bugbear, 2), many(hound, 1)])
    ),
    encounter(
      "Skalmad the Red Fang",
      "Ch. 1 (The Witchwood) — A vampiric hobgoblin lieutenant hunts the Witchwood by night with a pack of hounds.",
      compact([m(skalmad), many(hound, 2)])
    ),
    encounter(
      "Red Hand Outriders",
      "Ch. 2 (The Horde Grows) — Hobgoblin cavalry and a captain screen the horde's advance across the Vale.",
      compact([many(hob, 6), m(hobCaptain), many(bugbear, 2)])
    ),
    encounter(
      "Kulk'zor the Wyrmspeaker",
      "Ch. 2 (The Horde Grows) — A rising dragon-priest of the Red Hand torches a village to draw the party out.",
      compact([m(kulkzor), many(hob, 4), many(dragonspawn, 1)])
    ),
    encounter(
      "Vraath Keep",
      "Ch. 3 (Forging an Army) — Bugbears and a hobgoblin captain hold the ruined keep overlooking the Witchwood.",
      compact([m(hobCaptain), many(bugbear, 8)])
    ),
    encounter(
      "Skull Gorge Bridge",
      "Ch. 3 (Forging an Army) — Hobgoblins and a hell hound defend the bridge the horde needs to cross the Elsir.",
      compact([many(hob, 6), many(hound, 2), m(hobCaptain)])
    ),
    encounter(
      "Rallying the Vale",
      "Ch. 3 (Forging an Army) — Elsir Vale defenders muster at Dawn Way as dragonspawn scouts test the line.",
      compact([many(defender, 6), many(dragonspawn, 2)])
    ),
    encounter(
      "Siege of Brindol — The Walls",
      "Ch. 4 (The Battle of Brindol) — Red Hand infantry and ogre-blooded siege beasts hit the north wall in waves.",
      compact([many(hob, 12), m(hurog), many(hobCaptain, 2)])
    ),
    encounter(
      "Siege of Brindol — Harnoth Bloodwatcher",
      "Ch. 4 (The Battle of Brindol) — The Red Hand's champion warlord leads the breach with his bodyguard.",
      compact([m(harnoth), many(hob, 6), m(hobCaptain)])
    ),
    encounter(
      "Abithriax Over Brindol",
      "Ch. 4 (The Battle of Brindol) — The horde's young red dragon strafes the burning city.",
      compact([m(abithriax), many(hob, 4)])
    ),
    encounter(
      "Brindol Militia Stand",
      "Ch. 4 (The Battle of Brindol) — Brindol's defenders hold the market square while the party counterattacks.",
      compact([many(defender, 8), m(hurog)])
    ),
    encounter(
      "Approach to the Fane",
      "Ch. 5 (Fane of Tiamat) — Fanatic hobgoblins and dragonspawn sentries guard the mountain path.",
      compact([many(hob, 6), many(dragonspawn, 2)])
    ),
    encounter(
      "Zanthrus, Wyrm-Speaker",
      "Ch. 5 (Fane of Tiamat) — The senior priest of the Fane holds the outer chambers with Tiamat's blessing.",
      compact([m(zanthrus), many(hob, 4), many(dragonspawn, 2)])
    ),
    encounter(
      "The Wyrmlord's Sanctum",
      "Ch. 5 (Fane of Tiamat) — Wyrmlord Koth and a bound red dragon defend the inner sanctum of the five-headed queen.",
      compact([m(wyrmlord), m(abithriax)])
    ),
    encounter(
      "Azarr Kul, the Red Hand",
      "Ch. 5 (Fane of Tiamat) — The half-red-dragon high cleric of Tiamat makes his stand at the altar, horde bodyguard at his back.",
      compact([m(azarrKul), many(hob, 4), m(hobCaptain)])
    ),
  ];
}

function candlekeepEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const ckExtradimensionalThief = requireCustomMonsterById("cm-ck-extradimensional-thief");
  const ckFlyingBookSwarm = requireCustomMonsterById("cm-ck-flying-book-swarm");
  const ckMazfroth = requireCustomMonsterById("cm-ck-mazfroth");
  const ckDolinaNightcaller = requireCustomMonsterById("cm-ck-dolina-nightcaller");
  const ckShadowRavenFlock = requireCustomMonsterById("cm-ck-shadow-raven-flock");
  const ckDerroMineWarden = requireCustomMonsterById("cm-ck-derro-mine-warden");
  const ckShemshime = requireCustomMonsterById("cm-ck-shemshime");
  const ckPriceOfBeautyHag = requireCustomMonsterById("cm-ck-price-of-beauty-hag");
  const ckAlchemyDevotee = requireCustomMonsterById("cm-ck-alchemy-devotee");
  const ckCanopicGolem = requireCustomMonsterById("cm-ck-canopic-golem");
  const ckYellowcrestPoltergeist = requireCustomMonsterById("cm-ck-yellowcrest-poltergeist");
  const ckLurueCorruptedUnicorn = requireCustomMonsterById("cm-ck-lurue-corrupted-unicorn");
  const ckFlameskullArchivist = requireCustomMonsterById("cm-ck-flameskull-archivist");
  const ckAlkazaarMummyLord = requireCustomMonsterById("cm-ck-alkazaar-mummy-lord");
  const ckWisteriaArcanaloth = requireCustomMonsterById("cm-ck-wisteria-arcanaloth");
  const ckLoreholdScrivener = requireCustomMonsterById("cm-ck-lorehold-scrivener");
  const ckXanthoria = requireCustomMonsterById("cm-ck-xanthoria");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "The Joy of Extradimensional Spaces",
      "Adv. 1 — A cutpurse who has learned to fold space raids the demiplane vault, aided by animated library defenses.",
      compact([many(ckExtradimensionalThief, 2), many(ckFlyingBookSwarm, 2)])
    ),
    encounter(
      "Mazfroth's Mighty Digressions",
      "Adv. 2 — The mimic tome Mazfroth wakes in the reading room, its book-swarm spawn scattering across the shelves.",
      compact([m(ckMazfroth), many(ckFlyingBookSwarm, 3)])
    ),
    encounter(
      "Book of the Raven",
      "Adv. 3 — Shadowfell ravens and the Raven Queen's herald Dolina contest the party's claim on the Book of the Raven.",
      compact([m(ckDolinaNightcaller), many(ckShadowRavenFlock, 3)])
    ),
    encounter(
      "A Deep and Creeping Darkness",
      "Adv. 4 — Derro mine wardens ambush the party in the flooded lift shafts of Dhol Kuldhir.",
      compact([many(ckDerroMineWarden, 6), m(ckShadowRavenFlock)])
    ),
    encounter(
      "Shemshime's Bedtime Rhyme",
      "Adv. 5 — The bookborne fiend Shemshime spreads its maddening curse through a sealed wing of Candlekeep.",
      compact([m(ckShemshime), many(ckFlyingBookSwarm, 2)])
    ),
    encounter(
      "The Price of Beauty",
      "Adv. 6 — The Sylvan Mirror Hag defends the Temple of the All-Seeing Mirror with vanity-cursed thralls.",
      compact([m(ckPriceOfBeautyHag), many(ckAlchemyDevotee, 3)])
    ),
    encounter(
      "Book of Cylinders",
      "Adv. 7 — A canopic golem stitched from ancient organs guards the cylinder archive.",
      compact([m(ckCanopicGolem)])
    ),
    encounter(
      "Sarah of Yellowcrest Manor",
      "Adv. 8 — The poltergeist of murdered Sarah tears Yellowcrest Manor apart around the investigators.",
      compact([many(ckYellowcrestPoltergeist, 2), m(ckShadowRavenFlock)])
    ),
    encounter(
      "Lore of Lurue",
      "Adv. 9 — A unicorn servant of Lurue, corrupted by the villain of Ilinvur, charges the party in the sacred glade.",
      compact([m(ckLurueCorruptedUnicorn), many(ckShadowRavenFlock, 2)])
    ),
    encounter(
      "Kandlekeep Dekonstruktion",
      "Adv. 10 — Flameskull archivists animate as the library's wards misfire during the sabotage.",
      compact([many(ckFlameskullArchivist, 3), many(ckFlyingBookSwarm, 2)])
    ),
    encounter(
      "Zikran's Zephyrean Tome",
      "Adv. 11 — Alkazaar's djinn-bound guardian and a whirl of elemental servants defend the trapped tome.",
      compact([m(ckAlkazaarMummyLord), many(ckAlchemyDevotee, 2)])
    ),
    encounter(
      "The Curious Tale of Wisteria Vale",
      "Adv. 12 — Vane, the arcanaloth warden of the demiplane prison, springs the trap on the party.",
      compact([m(ckWisteriaArcanaloth), m(ckCanopicGolem)])
    ),
    encounter(
      "The Canopic Being",
      "Adv. 13 — A canopic golem and a Lorehold scrivener attempt to add the party's memories to the archive.",
      compact([m(ckCanopicGolem), many(ckLoreholdScrivener, 2)])
    ),
    encounter(
      "The Book of Inner Alchemy",
      "Adv. 14 — Devotees of Inner Alchemy fight to keep the party from the transmutation manual.",
      compact([many(ckAlchemyDevotee, 5)])
    ),
    encounter(
      "The Scrivener's Tale",
      "Adv. 15 — Lorehold scriveners bind the party into the endless book, page by page.",
      compact([many(ckLoreholdScrivener, 4), m(ckExtradimensionalThief)])
    ),
    encounter(
      "Alkazaar's Appendix",
      "Adv. 16 — Alkazaar the djinn-bound mummy rises fully in his Calimshan tomb, sandstorm at his back.",
      compact([m(ckAlkazaarMummyLord), many(ckDerroMineWarden, 2)])
    ),
    encounter(
      "Xanthoria",
      "Adv. 17 — The lichen horror Xanthoria erupts through the library floor, choking the stacks with spores.",
      compact([m(ckXanthoria), many(ckFlameskullArchivist, 2)])
    ),
  ];
}

function radiantCitadelEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const rcNightMarketThief = requireCustomMonsterById("cm-rc-night-market-thief");
  const rcMoonriseLycanthrope = requireCustomMonsterById("cm-rc-moonrise-lycanthrope");
  const rcHollowMineFiend = requireCustomMonsterById("cm-rc-hollow-mine-fiend");
  const rcTletepecWarlock = requireCustomMonsterById("cm-rc-tletepec-warlock");
  const rcViceLord = requireCustomMonsterById("cm-rc-vice-lord");
  const rcSiabsungkohElder = requireCustomMonsterById("cm-rc-siabsungkoh-elder");
  const rcInvisibleMountainOrchid = requireCustomMonsterById("cm-rc-invisible-mountain-orchid");
  const rcGoldGuardian = requireCustomMonsterById("cm-rc-gold-guardian");
  const rcManivarshaNaga = requireCustomMonsterById("cm-rc-manivarsha-naga");
  const rcAkharinSangarChampion = requireCustomMonsterById("cm-rc-akharin-sangar-champion");
  const rcSpiritOfTheSunTrials = requireCustomMonsterById("cm-rc-spirit-of-the-sun-trials");
  const rcBuriedDynastyRevenant = requireCustomMonsterById("cm-rc-buried-dynasty-revenant");
  const rcDjaynaiStormHerald = requireCustomMonsterById("cm-rc-djaynai-storm-herald");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Salted Legacy",
      "Adv. 1 (Kuwayba) — A market feud turns violent as night-market cutthroats sabotage rival stalls.",
      compact([many(rcNightMarketThief, 5)])
    ),
    encounter(
      "Written in Blood",
      "Adv. 2 (Atagua) — A werebeast bound to the Song of Moonrise stalks the plantation by night.",
      compact([many(rcMoonriseLycanthrope, 2), many(rcNightMarketThief, 2)])
    ),
    encounter(
      "The Fiend of Hollow Mine",
      "Adv. 3 (Tletepec) — The fiend beneath the mine surfaces, its coil-warlock cultists chanting it upward.",
      compact([m(rcHollowMineFiend), many(rcTletepecWarlock, 3)])
    ),
    encounter(
      "Wages of Vice",
      "Adv. 4 (Zinda) — The Vice-Lord of Zinda calls in the party's debts at swordpoint in the pleasure-house.",
      compact([m(rcViceLord), many(rcNightMarketThief, 4)])
    ),
    encounter(
      "Sins of Our Elders",
      "Adv. 5 (Siabsungkoh) — An Elder of Siabsungkoh binds the party in ancestral roots to settle an old debt.",
      compact([many(rcSiabsungkohElder, 3), m(rcInvisibleMountainOrchid)])
    ),
    encounter(
      "Gold for Fools and Princes",
      "Adv. 6 (Iber) — The gilded Guardian of Fools and Princes wakes when the party lifts the treasure.",
      compact([m(rcGoldGuardian)])
    ),
    encounter(
      "Between Tangled Roots",
      "Adv. 7 (Murann) — The Naga of the Tangled Waters tests the party at the flooded crossing.",
      compact([m(rcManivarshaNaga), many(rcSiabsungkohElder, 2)])
    ),
    encounter(
      "Shadow of the Sun",
      "Adv. 8 (Akharin Sangar) — A duel-bound Champion of Akharin Sangar bars the way with the town's honor at stake.",
      compact([many(rcAkharinSangarChampion, 2), m(rcSpiritOfTheSunTrials)])
    ),
    encounter(
      "The Sun Trials",
      "Adv. 9 (Atagua) — Sun-Trial Wardens judge the party in a blinding trial of light.",
      compact([many(rcSpiritOfTheSunTrials, 2)])
    ),
    encounter(
      "Buried Dynasty",
      "Adv. 10 (Yeonido) — Revenants of the Buried Dynasty rise to defend the tomb they were sworn to.",
      compact([many(rcBuriedDynastyRevenant, 4)])
    ),
    encounter(
      "Song of Moonrise",
      "Adv. 11 (Atagua) — Under the rising moon, cursed werebeasts of the Song descend on the village.",
      compact([many(rcMoonriseLycanthrope, 5)])
    ),
    encounter(
      "In the Mists of Manivarsha",
      "Adv. 12 (Manivarsha) — The Naga of the Tangled Waters and a storm herald guard the contested delta.",
      compact([m(rcManivarshaNaga), m(rcDjaynaiStormHerald)])
    ),
    encounter(
      "Orchids of the Invisible Mountain",
      "Adv. 13 (Djaynai) — Orchid wraiths and a storm herald of Djaynai defend the mountain's hidden heart.",
      compact([many(rcInvisibleMountainOrchid, 3), m(rcDjaynaiStormHerald)])
    ),
  ];
}

function goldenVaultEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const gvMuseumGuard = requireCustomMonsterById("cm-gv-museum-guard");
  const gvMurkmireRelicGuardian = requireCustomMonsterById("cm-gv-murkmire-relic-guardian");
  const gvStygianImpDealer = requireCustomMonsterById("cm-gv-stygian-imp-dealer");
  const gvObservatoryStarSpawn = requireCustomMonsterById("cm-gv-observatory-star-spawn");
  const gvClockworkSentinel = requireCustomMonsterById("cm-gv-clockwork-sentinel");
  const gvPrisoner13 = requireCustomMonsterById("cm-gv-prisoner-13");
  const gvMasterpieceMimic = requireCustomMonsterById("cm-gv-masterpiece-mimic");
  const gvAstralExpressMarauder = requireCustomMonsterById("cm-gv-astral-express-marauder");
  const gvGoldenVaultInsideAgent = requireCustomMonsterById("cm-gv-golden-vault-inside-agent");
  const gvVaultGolem = requireCustomMonsterById("cm-gv-vault-golem");
  const gvGoldenVaultMastermind = requireCustomMonsterById("cm-gv-golden-vault-mastermind");
  const gvAccursedShardElemental = requireCustomMonsterById("cm-gv-accursed-shard-elemental");
  const gvHeartOfAshesCultist = requireCustomMonsterById("cm-gv-heart-of-ashes-cultist");
  const gvFireAndDarknessSalamander = requireCustomMonsterById("cm-gv-fire-and-darkness-salamander");
  const gvEfreetiFortressWarden = requireCustomMonsterById("cm-gv-efreeti-fortress-warden");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "The Murkmire Malevolence",
      "Adv. 1 — Museum guards and the Murkmire relic guardian catch the party mid-heist over the fossil.",
      compact([many(gvMuseumGuard, 4), m(gvMurkmireRelicGuardian)])
    ),
    encounter(
      "The Stygian Gambit",
      "Adv. 2 — A stygian croupier and imp dealers rig the casino floor against the crew.",
      compact([many(gvStygianImpDealer, 3), many(gvMuseumGuard, 2)])
    ),
    encounter(
      "Reach for the Stars",
      "Adv. 3 — A star spawn stirs in the observatory dome as the party lifts the meteorite.",
      compact([many(gvObservatoryStarSpawn, 2), many(gvClockworkSentinel, 2)])
    ),
    encounter(
      "Prisoner 13",
      "Adv. 4 — The ghostly Prisoner 13 hunts the corridors of Revel's End as the alarm sounds.",
      compact([m(gvPrisoner13), many(gvMuseumGuard, 4)])
    ),
    encounter(
      "Masterpiece Imbroglio",
      "Adv. 5 — A frame mimic and clockwork sentinels defend the art museum's prize gallery.",
      compact([many(gvMasterpieceMimic, 2), many(gvClockworkSentinel, 3)])
    ),
    encounter(
      "Affair on the Concordant Express",
      "Adv. 6 — Marauders board the astral train car-by-car as it races through the Astral Sea.",
      compact([many(gvAstralExpressMarauder, 5)])
    ),
    encounter(
      "The Murkmire Malevolence, Act II",
      "Adv. 7 — The turncoat vault agent doubles back with hired guards to reclaim the relic.",
      compact([m(gvGoldenVaultInsideAgent), many(gvMuseumGuard, 5)])
    ),
    encounter(
      "Vidorant's Vault",
      "Adv. 8 — The vault golem and a rival mastermind converge on the same prize.",
      compact([m(gvVaultGolem), m(gvGoldenVaultMastermind)])
    ),
    encounter(
      "Tockworth's Clockworks",
      "Adv. 9 — The gnomish workshop turns hostile, sentinels pouring off every bench.",
      compact([many(gvClockworkSentinel, 6)])
    ),
    encounter(
      "Shard of the Accursed",
      "Adv. 10 — The Shard of the Accursed floats free of its case, curse-light filling the arena.",
      compact([m(gvAccursedShardElemental), many(gvClockworkSentinel, 2)])
    ),
    encounter(
      "Heart of Ashes",
      "Adv. 11 — Cinder cult zealots and a salamander guard the burning relic in the cult temple.",
      compact([many(gvHeartOfAshesCultist, 5), m(gvFireAndDarknessSalamander)])
    ),
    encounter(
      "The Stygian Gambit, Act II",
      "Adv. 12 — The croupier calls in infernal muscle when the crew tries to cash out.",
      compact([many(gvStygianImpDealer, 2), many(gvFireAndDarknessSalamander, 2)])
    ),
    encounter(
      "Fire and Darkness",
      "Adv. 13 — The Efreeti Fortress Warden and salamander guards defend the brass vault.",
      compact([m(gvEfreetiFortressWarden), many(gvFireAndDarknessSalamander, 3)])
    ),
  ];
}

function yawningPortalEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const ypBelakDruid = requireCustomMonsterById("cm-yp-belak-druid");
  const ypTwigBlightSwarm = requireCustomMonsterById("cm-yp-twig-blight-swarm");
  const ypDuergarForgemaster = requireCustomMonsterById("cm-yp-duergar-forgemaster");
  const ypMountainTroll = requireCustomMonsterById("cm-yp-mountain-troll");
  const ypTamoachanCouatlGuardian = requireCustomMonsterById("cm-yp-tamoachan-couatl-guardian");
  const ypTombOfHorrorsGargoyle = requireCustomMonsterById("cm-yp-tomb-of-horrors-gargoyle");
  const ypSirBluto = requireCustomMonsterById("cm-yp-sir-bluto");
  const ypWhitePlumeGuardian = requireCustomMonsterById("cm-yp-white-plume-guardian");
  const ypDeadInThayThayanApprentice = requireCustomMonsterById("cm-yp-dead-in-thay-thayan-apprentice");
  const ypJuiblexSpawn = requireCustomMonsterById("cm-yp-juiblex-spawn");
  const ypHillGiantAgainstTheGiants = requireCustomMonsterById("cm-yp-hill-giant-against-the-giants");
  const ypFrostGiantAgainstTheGiants = requireCustomMonsterById("cm-yp-frost-giant-against-the-giants");
  const ypFireGiantAgainstTheGiants = requireCustomMonsterById("cm-yp-fire-giant-against-the-giants");
  const acererakLich = requireCustomMonsterById("cm-acererak-lich");
  const vecnaRobes = requireCustomMonsterById("cm-vecna-robes");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "The Sunless Citadel",
      "Adv. 1 — Belak the Outcast defends the Gulthias Tree with waves of twig blight clusters.",
      compact([m(ypBelakDruid), many(ypTwigBlightSwarm, 4)])
    ),
    encounter(
      "The Forge of Fury",
      "Adv. 2 — Duergar smiths and a mountain troll hold the lower forges of Stone Tooth.",
      compact([many(ypDuergarForgemaster, 3), m(ypMountainTroll)])
    ),
    encounter(
      "The Hidden Shrine of Tamoachan",
      "Adv. 3 — A couatl guardian tests the party in the gas-flooded upper shrine.",
      compact([m(ypTamoachanCouatlGuardian), many(ypTombOfHorrorsGargoyle, 2)])
    ),
    encounter(
      "White Plume Mountain",
      "Adv. 4 — Sir Bluto's bandits and Keraptis's vault golem guard the three legendary weapons.",
      compact([m(ypSirBluto), m(ypWhitePlumeGuardian)])
    ),
    encounter(
      "Dead in Thay",
      "Adv. 5 — Thayan blood apprentices and a Doomvault ooze defend the Halls of Corruption.",
      compact([many(ypDeadInThayThayanApprentice, 4), m(ypJuiblexSpawn)])
    ),
    encounter(
      "Against the Giants",
      "Adv. 6 — Hill, frost, and fire giants of the allied steadings converge on the party in Snurre's hall.",
      compact([many(ypHillGiantAgainstTheGiants, 2), many(ypFrostGiantAgainstTheGiants, 2), m(ypFireGiantAgainstTheGiants)])
    ),
    encounter(
      "Tomb of Horrors",
      "Adv. 7 — In the final chamber, Acererak the archlich manifests beside the Robes-clad shade of Vecna.",
      compact([m(acererakLich), m(vecnaRobes), many(ypTombOfHorrorsGargoyle, 2)])
    ),
  ];
}

function saltmarshEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const gosSmugglerThug = requireCustomMonsterById("cm-gos-smuggler-thug");
  const gosLizardfolkScaleShield = requireCustomMonsterById("cm-gos-lizardfolk-scale-shield");
  const gosBullywugCroaker = requireCustomMonsterById("cm-gos-bullywug-croaker");
  const gosGhostOfTheEmperor = requireCustomMonsterById("cm-gos-ghost-of-the-emperor");
  const gosTammerautLacedon = requireCustomMonsterById("cm-gos-tammeraut-lacedon");
  const gosAbbeyLycanthrope = requireCustomMonsterById("cm-gos-abbey-lycanthrope");
  const gosGiantSeaEel = requireCustomMonsterById("cm-gos-giant-sea-eel");
  const gosFinalEnemyFortressGuard = requireCustomMonsterById("cm-gos-final-enemy-fortress-guard");
  const gosSahuaginPriestess = requireCustomMonsterById("cm-gos-sahuagin-priestess");
  const gosMerrowBrute = requireCustomMonsterById("cm-gos-merrow-brute");
  const sahuaginBaron = requireCustomMonsterById("cm-sahuagin-baron");
  const gosSahuaginRaider = requireCustomMonsterById("cm-gos-sahuagin-raider");
  const gosKrakenPriestStyes = requireCustomMonsterById("cm-gos-kraken-priest-styes");
  const gosStyesAberration = requireCustomMonsterById("cm-gos-styes-aberration");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Saltmarsh",
      "Adv. 1 — Smugglers running contraband through the docks turn on the party when discovered.",
      compact([many(gosSmugglerThug, 5)])
    ),
    encounter(
      "The Sinister Secret of Saltmarsh",
      "Adv. 2 — The haunted house's smuggler crew and their lizardfolk hirelings spring the trap in the cellar.",
      compact([many(gosSmugglerThug, 4), many(gosLizardfolkScaleShield, 3)])
    ),
    encounter(
      "Danger at Dunwater",
      "Adv. 3 — Lizardfolk scale-shields and bullywug croakers defend the river lair against a feared invasion.",
      compact([many(gosLizardfolkScaleShield, 4), many(gosBullywugCroaker, 4)])
    ),
    encounter(
      "Salvage Operation",
      "Adv. 4 — Drowned officers of the Emperor of the Waves and lacedons rise as the party boards the derelict.",
      compact([m(gosGhostOfTheEmperor), many(gosTammerautLacedon, 4)])
    ),
    encounter(
      "Isle of the Abbey",
      "Adv. 5 — Wererat marauders and a giant sea eel guard the ruined abbey and its lighthouse.",
      compact([many(gosAbbeyLycanthrope, 4), m(gosGiantSeaEel)])
    ),
    encounter(
      "The Final Enemy",
      "Adv. 6 — Shark-wardens, wave priestesses, and merrow brutes hold the outer wall of the sahuagin fortress.",
      compact([many(gosFinalEnemyFortressGuard, 4), many(gosSahuaginPriestess, 2), m(gosMerrowBrute)])
    ),
    encounter(
      "The Final Enemy: The Baron's Throne",
      "Adv. 6 — The Sahuagin Baron and his raider elite make their stand in the inner sanctum.",
      compact([m(sahuaginBaron), many(gosSahuaginRaider, 6)])
    ),
    encounter(
      "Tammeraut's Fate",
      "Adv. 7 — Lacedon packs and a drowned officer besiege the Firewatch lighthouse night after night.",
      compact([many(gosTammerautLacedon, 6), m(gosGhostOfTheEmperor)])
    ),
    encounter(
      "The Styes",
      "Adv. 8 — The Kraken Priest of the Styes and skum aberrations drag the party down into the rotting canals.",
      compact([m(gosKrakenPriestStyes), many(gosStyesAberration, 4)])
    ),
  ];
}

function madMageEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const wdmmUndermountainGoblin = requireCustomMonsterById("cm-wdmm-undermountain-goblin");
  const wdmmKenkuScavenger = requireCustomMonsterById("cm-wdmm-kenku-scavenger");
  const wdmmCarrionCrawlerTunnels = requireCustomMonsterById("cm-wdmm-carrion-crawler-tunnels");
  const wdmmMimicTreasure = requireCustomMonsterById("cm-wdmm-mimic-treasure");
  const wdmmGrayOozeCrawler = requireCustomMonsterById("cm-wdmm-gray-ooze-crawler");
  const wdmmSpectatorVault = requireCustomMonsterById("cm-wdmm-spectator-vault");
  const wdmmNothicHoarder = requireCustomMonsterById("cm-wdmm-nothic-hoarder");
  const wdmmFlameskullLostLevel = requireCustomMonsterById("cm-wdmm-flameskull-lost-level");
  const wdmmLavaChild = requireCustomMonsterById("cm-wdmm-lava-child");
  const wdmmStoneGolemArcaneChambers = requireCustomMonsterById("cm-wdmm-stone-golem-arcane-chambers");
  const wdmmIntellectDevourer = requireCustomMonsterById("cm-wdmm-intellect-devourer");
  const wdmmNimblewrightMaddgoth = requireCustomMonsterById("cm-wdmm-nimblewright-maddgoth");
  const wdmmCraniumRatSwarm = requireCustomMonsterById("cm-wdmm-cranium-rat-swarm");
  const wdmmShieldGuardianHalaster = requireCustomMonsterById("cm-wdmm-shield-guardian-halaster");
  const wdmmDerroSavantLost = requireCustomMonsterById("cm-wdmm-derro-savant-lost");
  const wdmmDrowHouseGuard = requireCustomMonsterById("cm-wdmm-drow-house-guard");
  const wdmmDrowMageSargauth = requireCustomMonsterById("cm-wdmm-drow-mage-sargauth");
  const wdmmMindFlayerArcanist = requireCustomMonsterById("cm-wdmm-mind-flayer-arcanist");
  const wdmmFlumphScout = requireCustomMonsterById("cm-wdmm-flumph-scout");
  const wdmmQuaggothThonot = requireCustomMonsterById("cm-wdmm-quaggoth-thonot");
  const wdmmGrellHunter = requireCustomMonsterById("cm-wdmm-grell-hunter");
  const wdmmWraithTerminus = requireCustomMonsterById("cm-wdmm-wraith-terminus");
  const wdmmWereratSkulk = requireCustomMonsterById("cm-wdmm-wererat-skulk");
  const wdmmNeogiSlaver = requireCustomMonsterById("cm-wdmm-neogi-slaver");
  const wdmmTroglodyteSlitherswamp = requireCustomMonsterById("cm-wdmm-troglodyte-slitherswamp");
  const wdmmSorlynPriest = requireCustomMonsterById("cm-wdmm-sorlyn-priest");
  const wdmmOtyughWarren = requireCustomMonsterById("cm-wdmm-otyugh-warren");
  const wdmmShadowduskCultist = requireCustomMonsterById("cm-wdmm-shadowdusk-cultist");
  const wdmmWoodWoadWyllowwood = requireCustomMonsterById("cm-wdmm-wood-woad-wyllowwood");
  const wdmmFlindSlaver = requireCustomMonsterById("cm-wdmm-flind-slaver");
  const wdmmDweomercoreApprentice = requireCustomMonsterById("cm-wdmm-dweomercore-apprentice");
  const wdmmHalasterApprenticeMuiral = requireCustomMonsterById("cm-wdmm-halaster-apprentice-muiral");
  const wdmmHalasterApprenticeTrobriand = requireCustomMonsterById("cm-wdmm-halaster-apprentice-trobriand");
  const wdmmDeathTyrantMuiwood = requireCustomMonsterById("cm-wdmm-death-tyrant-muiwood");
  const wdmmVampireSpawnWraithHaunts = requireCustomMonsterById("cm-wdmm-vampire-spawn-wraith-haunts");
  const wdmmGauthEye = requireCustomMonsterById("cm-wdmm-gauth-eye");
  const wdmmHalasterApprenticeArcturia = requireCustomMonsterById("cm-wdmm-halaster-apprentice-arcturia");
  const wdmmShadowduskAberrantHulk = requireCustomMonsterById("cm-wdmm-shadowdusk-aberrant-hulk");
  const wdmmMadMageSimulacrum = requireCustomMonsterById("cm-wdmm-mad-mage-simulacrum");
  const wdmmHalasterBlackcloak = requireCustomMonsterById("cm-wdmm-halaster-blackcloak");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Dungeon Level — Goblin Bazaar Ambush",
      "Ch. 1 (Level 1) — Undermountain goblins swarm the party from the collapsed bazaar stalls.",
      compact([many(wdmmUndermountainGoblin, 8)])
    ),
    encounter(
      "Dungeon Level — Kenku Scavengers",
      "Ch. 1 (Level 1) — Kenku scavengers pick over the dead in the entry halls and turn on the living.",
      compact([many(wdmmKenkuScavenger, 5), many(wdmmUndermountainGoblin, 3)])
    ),
    encounter(
      "Dungeon Level — Carrion Crawler Nest",
      "Ch. 1 (Level 1) — Carrion crawlers drop from the ceiling of a refuse-choked corridor.",
      compact([many(wdmmCarrionCrawlerTunnels, 3)])
    ),
    encounter(
      "Dungeon Level — The Chest That Bites",
      "Ch. 1 (Level 1) — A treasure mimic and a gray ooze crawler guard a false vault.",
      compact([many(wdmmMimicTreasure, 2), many(wdmmGrayOozeCrawler, 2)])
    ),
    encounter(
      "Dungeon Level — Bound Spectator",
      "Ch. 1 (Level 1) — A spectator bound a century ago attacks anyone reaching for its charge.",
      compact([m(wdmmSpectatorVault), many(wdmmUndermountainGoblin, 4)])
    ),
    encounter(
      "Dungeon Level — Nothic in the Dark",
      "Ch. 1 (Level 1) — A hoarding nothic ambushes the party from a rubble pile, rotting gaze first.",
      compact([many(wdmmNothicHoarder, 2)])
    ),
    encounter(
      "Dungeon Level — Flameskull Watchpost",
      "Ch. 1 (Level 1) — A flameskull left as a sentry lights up the stair to Level 2.",
      compact([m(wdmmFlameskullLostLevel), many(wdmmUndermountainGoblin, 5)])
    ),
    encounter(
      "Dungeon Level — Lava Child Forge Raiders",
      "Ch. 1 (Level 1) — Lava children raid an old smithy for metal to melt.",
      compact([many(wdmmLavaChild, 3), many(wdmmUndermountainGoblin, 3)])
    ),
    encounter(
      "Arcane Chambers — Stone Golem Ward",
      "Ch. 2 (Level 2) — A stone golem enforces the silence of an abandoned laboratory.",
      compact([m(wdmmStoneGolemArcaneChambers)])
    ),
    encounter(
      "Arcane Chambers — Intellect Devourers",
      "Ch. 2 (Level 2) — Intellect devourers scuttle out of a cracked specimen jar.",
      compact([many(wdmmIntellectDevourer, 4)])
    ),
    encounter(
      "Arcane Chambers — Nimblewright Patrol",
      "Ch. 2 (Level 2) — Maddgoth-built nimblewrights sweep the corridors on a fixed circuit.",
      compact([many(wdmmNimblewrightMaddgoth, 3)])
    ),
    encounter(
      "Arcane Chambers — Cranium Rat Hivemind",
      "Ch. 2 (Level 2) — A swarm of cranium rats coalesces into a single scheming mind.",
      compact([many(wdmmCraniumRatSwarm, 2)])
    ),
    encounter(
      "Arcane Chambers — Shield Guardian Vault",
      "Ch. 2 (Level 2) — Halaster's shield guardian defends an amulet-locked door.",
      compact([m(wdmmShieldGuardianHalaster), m(wdmmFlameskullLostLevel)])
    ),
    encounter(
      "Arcane Chambers — Gray Ooze Cistern",
      "Ch. 2 (Level 2) — Gray ooze crawlers drip from corroded pipes over a flooded chamber.",
      compact([many(wdmmGrayOozeCrawler, 4)])
    ),
    encounter(
      "Arcane Chambers — Derro Savant Experiment",
      "Ch. 2 (Level 2) — A derro savant tests a maddening sonic device on captured goblins.",
      compact([many(wdmmDerroSavantLost, 3), many(wdmmUndermountainGoblin, 3)])
    ),
    encounter(
      "Sargauth Level — Drow Enclave Checkpoint",
      "Ch. 3 (Level 3) — Drow house guards and an enclave mage hold the bridge over the Sargauth.",
      compact([many(wdmmDrowHouseGuard, 5), m(wdmmDrowMageSargauth)])
    ),
    encounter(
      "Sargauth Level — Mind Flayer Arcanist",
      "Ch. 3 (Level 3) — A mind flayer arcanist of the ruined enclave probes the party's thoughts, then attacks.",
      compact([m(wdmmMindFlayerArcanist), m(wdmmCraniumRatSwarm)])
    ),
    encounter(
      "Sargauth Level — Flumph Refuge",
      "Ch. 3 (Level 3) — Flumphs beg the party for aid, and the illithid patrol hunting them arrives.",
      compact([many(wdmmFlumphScout, 4), m(wdmmMindFlayerArcanist)])
    ),
    encounter(
      "Sargauth Level — Quaggoth Warren",
      "Ch. 3 (Level 3) — Enslaved quaggoths and a thonot break loose in the tunnels.",
      compact([many(wdmmQuaggothThonot, 4)])
    ),
    encounter(
      "Sargauth Level — Grell Hunting Party",
      "Ch. 3 (Level 3) — Grell hunters drift down out of a vertical shaft, tentacles first.",
      compact([many(wdmmGrellHunter, 3)])
    ),
    encounter(
      "Sargauth Level — Wraith of the Old Enclave",
      "Ch. 3 (Level 3) — A wraith bound to the drowned enclave drains anyone who lingers on the shore.",
      compact([many(wdmmWraithTerminus, 2)])
    ),
    encounter(
      "Skullport — Wererat Extortion",
      "Ch. 4 (Skullport) — Skullport wererats corner the party in a dead-end alley of the Port of Shadow.",
      compact([many(wdmmWereratSkulk, 5)])
    ),
    encounter(
      "Skullport — Neogi Slave Coffle",
      "Ch. 4 (Skullport) — Neogi slavers try to add the party to their coffle at the flesh market.",
      compact([many(wdmmNeogiSlaver, 3), many(wdmmTroglodyteSlitherswamp, 3)])
    ),
    encounter(
      "Skullport — Sorlyn Sun-Cult Raid",
      "Ch. 4 (Skullport) — Sorlyn priests torch a shadow shrine and fight anyone in their way.",
      compact([many(wdmmSorlynPriest, 3), many(wdmmKenkuScavenger, 4)])
    ),
    encounter(
      "Skullport — Kenku Fence Double-Cross",
      "Ch. 4 (Skullport) — A kenku fencing ring turns on the party mid-deal.",
      compact([many(wdmmKenkuScavenger, 6)])
    ),
    encounter(
      "Skullport — Wererat Nest Assault",
      "Ch. 4 (Skullport) — The party pushes into the wererat nest under the docks.",
      compact([many(wdmmWereratSkulk, 4), m(wdmmOtyughWarren)])
    ),
    encounter(
      "Skullport — Cranium Rat Broker",
      "Ch. 4 (Skullport) — An information broker fronted by a cranium rat swarm demands a steep price.",
      compact([many(wdmmCraniumRatSwarm, 2), many(wdmmWereratSkulk, 2)])
    ),
    encounter(
      "Skullport — Sorlyn vs. Shadow Cult Crossfire",
      "Ch. 4 (Skullport) — The party is caught between Sorlyn crusaders and a hidden Shadowdusk cell.",
      compact([many(wdmmSorlynPriest, 2), many(wdmmShadowduskCultist, 3)])
    ),
    encounter(
      "Wyllowwood — Wood Woad Wardens",
      "Ch. 5 (Level 5) — Wyllow's wood woads challenge trespassers among the underground trees.",
      compact([many(wdmmWoodWoadWyllowwood, 3)])
    ),
    encounter(
      "Wyllowwood — Carrion Crawler Grove",
      "Ch. 5 (Level 5) — Carrion crawlers infest the rotting northern grove.",
      compact([many(wdmmCarrionCrawlerTunnels, 4)])
    ),
    encounter(
      "Wyllowwood — Otyugh Compost Pit",
      "Ch. 5 (Level 5) — An otyugh has made its home in Wyllow's compost sink.",
      compact([many(wdmmOtyughWarren, 2)])
    ),
    encounter(
      "Wyllowwood — Wraith Among the Roots",
      "Ch. 5 (Level 5) — A wraith haunts the graves at the wood's edge.",
      compact([many(wdmmWraithTerminus, 2), m(wdmmWoodWoadWyllowwood)])
    ),
    encounter(
      "Wyllowwood — Nothic Thicket",
      "Ch. 5 (Level 5) — Nothics stalk the party through the false forest.",
      compact([many(wdmmNothicHoarder, 3)])
    ),
    encounter(
      "Wyllowwood — Flameskull Beacon",
      "Ch. 5 (Level 5) — A flameskull marks the path to the dryad Wyllow's glade.",
      compact([many(wdmmFlameskullLostLevel, 2), m(wdmmWoodWoadWyllowwood)])
    ),
    encounter(
      "Lost Level — Flameskull Sentinels",
      "Ch. 6 (Lost Level) — Multiple flameskulls guard the Netherese vault stairs.",
      compact([many(wdmmFlameskullLostLevel, 4)])
    ),
    encounter(
      "Lost Level — Stone Golem Archive",
      "Ch. 6 (Lost Level) — A stone golem defends a shelf of pre-Netheril tomes.",
      compact([m(wdmmStoneGolemArcaneChambers), m(wdmmFlameskullLostLevel)])
    ),
    encounter(
      "Lost Level — Wraith Vault",
      "Ch. 6 (Lost Level) — Wraiths of the vault's original guardians rise as the seals break.",
      compact([many(wdmmWraithTerminus, 3)])
    ),
    encounter(
      "Lost Level — Gray Ooze Flood",
      "Ch. 6 (Lost Level) — Gray ooze crawlers pour through a breached wall.",
      compact([many(wdmmGrayOozeCrawler, 5)])
    ),
    encounter(
      "Lost Level — Nimblewright Cache Guards",
      "Ch. 6 (Lost Level) — Nimblewrights reactivate to protect a spell cache.",
      compact([many(wdmmNimblewrightMaddgoth, 2), m(wdmmFlameskullLostLevel)])
    ),
    encounter(
      "Lost Level — Intellect Devourer Swarm",
      "Ch. 6 (Lost Level) — Intellect devourers spill from a broken stasis vault.",
      compact([many(wdmmIntellectDevourer, 5)])
    ),
    encounter(
      "Maddgoth's Castle — Nimblewright Honor Guard",
      "Ch. 7 (Level 7) — Maddgoth's nimblewrights form a wall of whirling rapiers at the gate.",
      compact([many(wdmmNimblewrightMaddgoth, 4)])
    ),
    encounter(
      "Maddgoth's Castle — Shrunken Halls",
      "Ch. 7 (Level 7) — Shield guardians and mimics fill the miniature castle's corridors.",
      compact([m(wdmmShieldGuardianHalaster), many(wdmmMimicTreasure, 2)])
    ),
    encounter(
      "Maddgoth's Castle — The Torturer's Lab",
      "Ch. 7 (Level 7) — Nothics and a carrion crawler infest Maddgoth's abandoned workshop.",
      compact([many(wdmmNothicHoarder, 2), many(wdmmCarrionCrawlerTunnels, 2)])
    ),
    encounter(
      "Maddgoth's Castle — Flameskull Rafters",
      "Ch. 7 (Level 7) — Flameskulls patrol the rafters of the great hall.",
      compact([many(wdmmFlameskullLostLevel, 3)])
    ),
    encounter(
      "Maddgoth's Castle — Gray Slime Moat",
      "Ch. 7 (Level 7) — Gray ooze crawlers fill the castle's inner moat.",
      compact([many(wdmmGrayOozeCrawler, 4), m(wdmmNimblewrightMaddgoth)])
    ),
    encounter(
      "Slitherswamp — Troglodyte Ambush",
      "Ch. 8 (Level 8) — Troglodytes rise from the fungal muck, stench rolling ahead of them.",
      compact([many(wdmmTroglodyteSlitherswamp, 8)])
    ),
    encounter(
      "Slitherswamp — Flind Slavers",
      "Ch. 8 (Level 8) — Flind slavers drive a troglodyte work-gang and turn the chains on the party.",
      compact([many(wdmmFlindSlaver, 3), many(wdmmTroglodyteSlitherswamp, 4)])
    ),
    encounter(
      "Slitherswamp — Otyugh Bog",
      "Ch. 8 (Level 8) — Otyughs wallow in the deepest sink of the swamp level.",
      compact([many(wdmmOtyughWarren, 2), many(wdmmCarrionCrawlerTunnels, 2)])
    ),
    encounter(
      "Slitherswamp — Lava Child Crossing",
      "Ch. 8 (Level 8) — Lava children guard a magma vent that bridges two islands.",
      compact([many(wdmmLavaChild, 4)])
    ),
    encounter(
      "Slitherswamp — Grell Mud-Fishers",
      "Ch. 8 (Level 8) — Grell hunters hover over the mire, hauling prey up into the dark.",
      compact([many(wdmmGrellHunter, 3)])
    ),
    encounter(
      "Slitherswamp — Carrion Crawler Reeds",
      "Ch. 8 (Level 8) — Carrion crawlers hide among the giant reeds along a narrow causeway.",
      compact([many(wdmmCarrionCrawlerTunnels, 4)])
    ),
    encounter(
      "Dweomercore — Entrance Exam",
      "Ch. 9 (Level 9) — Student-wizards of the mage school test the party with an ambush 'lesson.'",
      compact([many(wdmmDweomercoreApprentice, 5)])
    ),
    encounter(
      "Dweomercore — Muiral's Laboratory",
      "Ch. 9 (Level 9) — Muiral the Misshapen, apprentice of Halaster, defends his tunnels with student-wizards.",
      compact([m(wdmmHalasterApprenticeMuiral), many(wdmmDweomercoreApprentice, 3)])
    ),
    encounter(
      "Dweomercore — Trobriand's Foundry",
      "Ch. 9 (Level 9) — Trobriand the Metal Mage, apprentice of Halaster, unleashes constructs on the intruders.",
      compact([m(wdmmHalasterApprenticeTrobriand), m(wdmmStoneGolemArcaneChambers), many(wdmmNimblewrightMaddgoth, 2)])
    ),
    encounter(
      "Dweomercore — Summoning Seminar Gone Wrong",
      "Ch. 9 (Level 9) — A botched student summoning fills the lecture hall with grells and flameskulls.",
      compact([many(wdmmGrellHunter, 2), many(wdmmFlameskullLostLevel, 2)])
    ),
    encounter(
      "Dweomercore — Cranium Rat Study Hall",
      "Ch. 9 (Level 9) — A swarm of cranium rats has infested the library and reads over the party's shoulder.",
      compact([many(wdmmCraniumRatSwarm, 2), many(wdmmDweomercoreApprentice, 2)])
    ),
    encounter(
      "Dweomercore — Golem Proving Ground",
      "Ch. 9 (Level 9) — Stone golems and student-wizards run combat drills the party interrupts.",
      compact([m(wdmmStoneGolemArcaneChambers), many(wdmmDweomercoreApprentice, 4)])
    ),
    encounter(
      "Muiwood — Death Tyrant's Grove",
      "Ch. 10 (Muiwood) — A death tyrant floats above a blighted underground wood, raising the fallen as zombies.",
      compact([m(wdmmDeathTyrantMuiwood)])
    ),
    encounter(
      "Muiwood — Wood Woad Last Stand",
      "Ch. 10 (Muiwood) — The last wood woads of the corrupted wood fight the beholder's undead.",
      compact([many(wdmmWoodWoadWyllowwood, 3), m(wdmmVampireSpawnWraithHaunts)])
    ),
    encounter(
      "Muiwood — Carrion Blight",
      "Ch. 10 (Muiwood) — Carrion crawlers and otyughs thrive in the death tyrant's negative-energy shadow.",
      compact([many(wdmmCarrionCrawlerTunnels, 3), m(wdmmOtyughWarren)])
    ),
    encounter(
      "Muiwood — Wraith Thornwall",
      "Ch. 10 (Muiwood) — Wraiths drift through a wall of dead brambles ringing the tyrant's grove.",
      compact([many(wdmmWraithTerminus, 3)])
    ),
    encounter(
      "Muiwood — Nothic Carrion Feast",
      "Ch. 10 (Muiwood) — Nothics squabble over corpses at the wood's edge and turn on the newcomers.",
      compact([many(wdmmNothicHoarder, 4)])
    ),
    encounter(
      "Muiwood — Gauth Scavengers",
      "Ch. 10 (Muiwood) — Gauths trail the death tyrant, feeding on the magic of anything it kills.",
      compact([many(wdmmGauthEye, 2)])
    ),
    encounter(
      "Wraith Haunts — Vampire Spawn Warren",
      "Ch. 11 (Wraith Haunts) — Vampire spawn boil out of a sealed crypt as the party breaks the ward.",
      compact([many(wdmmVampireSpawnWraithHaunts, 4)])
    ),
    encounter(
      "Wraith Haunts — Wraith Choir",
      "Ch. 11 (Wraith Haunts) — A knot of wraiths drains the warmth from an entire gallery.",
      compact([many(wdmmWraithTerminus, 4)])
    ),
    encounter(
      "Wraith Haunts — Flameskull Ossuary",
      "Ch. 11 (Wraith Haunts) — Flameskulls light every alcove of a bone-lined hall.",
      compact([many(wdmmFlameskullLostLevel, 3), m(wdmmVampireSpawnWraithHaunts)])
    ),
    encounter(
      "Wraith Haunts — Death Tyrant Reprise",
      "Ch. 11 (Wraith Haunts) — The Muiwood death tyrant, if it survived, pursues the party into the haunts.",
      compact([m(wdmmDeathTyrantMuiwood), many(wdmmWraithTerminus, 2)])
    ),
    encounter(
      "Wraith Haunts — Cranium Rat Reliquary",
      "Ch. 11 (Wraith Haunts) — A cranium rat swarm nests in a sarcophagus, whispering the dead's secrets.",
      compact([many(wdmmCraniumRatSwarm, 2), m(wdmmVampireSpawnWraithHaunts)])
    ),
    encounter(
      "Wraith Haunts — Spectator Tomb Guard",
      "Ch. 11 (Wraith Haunts) — A spectator has guarded one noble's tomb for a century and won't stop now.",
      compact([m(wdmmSpectatorVault), many(wdmmWraithTerminus, 2)])
    ),
    encounter(
      "Wraith Haunts — Gauth Grave-Robbers",
      "Ch. 11 (Wraith Haunts) — Gauths pry open sarcophagi looking for magic to devour.",
      compact([many(wdmmGauthEye, 2), m(wdmmCraniumRatSwarm)])
    ),
    encounter(
      "Terminus Level — Arcturia's Flesh Gardens",
      "Ch. 12 (Terminus Level) — Arcturia, apprentice of Halaster, reshapes intruders among her flesh-warped horrors.",
      compact([m(wdmmHalasterApprenticeArcturia), m(wdmmShadowduskAberrantHulk)])
    ),
    encounter(
      "Terminus Level — Aberrant Hulk Pen",
      "Ch. 12 (Terminus Level) — Aberrant hulks break their bindings in a warped holding chamber.",
      compact([many(wdmmShadowduskAberrantHulk, 2)])
    ),
    encounter(
      "Terminus Level — Gauth Overseers",
      "Ch. 12 (Terminus Level) — Gauths patrol the antimagic-warded approach to Halaster's sanctum.",
      compact([many(wdmmGauthEye, 3)])
    ),
    encounter(
      "Terminus Level — Chaos Simulacrum",
      "Ch. 12 (Terminus Level) — A snow-bodied simulacrum of Halaster tests the party with wild magic.",
      compact([m(wdmmMadMageSimulacrum), many(wdmmFlameskullLostLevel, 2)])
    ),
    encounter(
      "Terminus Level — Shield Guardian Gauntlet",
      "Ch. 12 (Terminus Level) — Two shield guardians hold the final corridor to the terminus stair.",
      compact([many(wdmmShieldGuardianHalaster, 2)])
    ),
    encounter(
      "Terminus Level — Wraith Terminus",
      "Ch. 12 (Terminus Level) — Wraiths guard the threshold between Undermountain and the deepest hold.",
      compact([many(wdmmWraithTerminus, 3), m(wdmmMadMageSimulacrum)])
    ),
    encounter(
      "Shadowdusk Hold — Cultist Outer Ward",
      "Ch. 13 (Shadowdusk Hold) — Shadowdusk cultists chant the party into a Far Realm haze at the gate.",
      compact([many(wdmmShadowduskCultist, 6)])
    ),
    encounter(
      "Shadowdusk Hold — Aberrant Hulk Vanguard",
      "Ch. 13 (Shadowdusk Hold) — Aberrant hulks and cultists hold the reality-warped great hall.",
      compact([many(wdmmShadowduskAberrantHulk, 2), many(wdmmShadowduskCultist, 4)])
    ),
    encounter(
      "Shadowdusk Hold — Arcturia's Return",
      "Ch. 13 (Shadowdusk Hold) — Arcturia allies with the Shadowdusks, flesh-warping the party's front line.",
      compact([m(wdmmHalasterApprenticeArcturia), many(wdmmShadowduskCultist, 4)])
    ),
    encounter(
      "Shadowdusk Hold — Elder Rune Chamber",
      "Ch. 13 (Shadowdusk Hold) — Aberrant hulks and cranium rats defend the rune Halaster needs.",
      compact([m(wdmmShadowduskAberrantHulk), many(wdmmCraniumRatSwarm, 2)])
    ),
    encounter(
      "Shadowdusk Hold — Halaster's Intervention",
      "Ch. 13 (Shadowdusk Hold) — Halaster Blackcloak appears mid-battle, blinking through the fight on his own agenda.",
      compact([m(wdmmHalasterBlackcloak), many(wdmmShadowduskCultist, 4)])
    ),
    encounter(
      "Shadowdusk Hold — The Mad Mage Unbound",
      "Ch. 13 (Shadowdusk Hold) — Halaster Blackcloak, backed by his shield guardian and a simulacrum, settles accounts in the deepest hall of Undermountain.",
      compact([m(wdmmHalasterBlackcloak), m(wdmmShieldGuardianHalaster), m(wdmmMadMageSimulacrum)])
    ),
  ];
}

function runelordsEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const rotrGoblinPyro = requireCustomMonsterById("cm-rotr-goblin-pyro");
  const rotrSinspawnWrath = requireCustomMonsterById("cm-rotr-sinspawn-wrath");
  const rotrNualia = requireCustomMonsterById("cm-rotr-nualia");
  const rotrScarecrowGolem = requireCustomMonsterById("cm-rotr-scarecrow-golem");
  const rotrOgrekinHillbilly = requireCustomMonsterById("cm-rotr-ogrekin-hillbilly");
  const rotrLucrecia = requireCustomMonsterById("cm-rotr-lucrecia");
  const rotrHillGiantRaider = requireCustomMonsterById("cm-rotr-hill-giant-raider");
  const rotrMokmurian = requireCustomMonsterById("cm-rotr-mokmurian");
  const rotrStoneGiantElder = requireCustomMonsterById("cm-rotr-stone-giant-elder");
  const rotrClockworkReaper = requireCustomMonsterById("cm-rotr-clockwork-reaper");
  const rotrShadowOfRuneforge = requireCustomMonsterById("cm-rotr-shadow-of-runeforge");
  const rotrDenizenOfLeng = requireCustomMonsterById("cm-rotr-denizen-of-leng");
  const rotrLamiaMatriarchGuard = requireCustomMonsterById("cm-rotr-lamia-matriarch-guard");
  const karzougDemonSkin = requireCustomMonsterById("cm-karzoug-demon-skin");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Burnt Offerings",
      "Ch. 1 (Sandpoint) — Goblin pyros raid the Swallowtail Festival, then Nualia's sinspawn hold Thistletop. (5e conversion)",
      compact([many(rotrGoblinPyro, 6), many(rotrSinspawnWrath, 2)])
    ),
    encounter(
      "Thistletop: Nualia the Fallen",
      "Ch. 1 (Thistletop) — Nualia Tobyn, remade by Lamashtu, makes her stand over the runewell. (5e conversion)",
      compact([m(rotrNualia), many(rotrSinspawnWrath, 3)])
    ),
    encounter(
      "The Skinsaw Murders",
      "Ch. 2 (Foxglove Manor) — The scarecrow golems and Foxglove ogrekin guard the rotting manor as Lucrecia watches. (5e conversion)",
      compact([many(rotrScarecrowGolem, 3), many(rotrOgrekinHillbilly, 2), m(rotrLucrecia)])
    ),
    encounter(
      "The Hook Mountain Massacre",
      "Ch. 3 (Fort Rannick) — Hook Mountain hill giant raiders and ogrekin storm the fort's walls. (5e conversion)",
      compact([many(rotrHillGiantRaider, 3), many(rotrOgrekinHillbilly, 4)])
    ),
    encounter(
      "Fortress of the Stone Giants",
      "Ch. 4 (Jorgenfist) — Mokmurian the Stone Lord and a stone giant elder command the runecarved fortress. (5e conversion)",
      compact([m(rotrMokmurian), many(rotrStoneGiantElder, 2), m(rotrClockworkReaper)])
    ),
    encounter(
      "Sins of the Saviors",
      "Ch. 5 (Runeforge) — Runeforge shadow-wizards and clockwork reapers guard the seven wings of the forge. (5e conversion)",
      compact([many(rotrShadowOfRuneforge, 4), many(rotrClockworkReaper, 2)])
    ),
    encounter(
      "The Spires of Xin-Shalast",
      "Ch. 6 (Xin-Shalast) — Denizens of Leng and concubine devils bar the road to the Pinnacle of Avarice. (5e conversion)",
      compact([many(rotrDenizenOfLeng, 2), many(rotrLamiaMatriarchGuard, 3)])
    ),
    encounter(
      "Karzoug, the Runelord of Greed",
      "Ch. 6 (Pinnacle of Avarice) — Karzoug awakens from ten thousand years of stasis to reclaim Thassilon. (5e conversion)",
      compact([m(karzougDemonSkin), many(rotrDenizenOfLeng, 2)])
    ),
  ];
}

function kingmakerEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const kmStagLord = requireCustomMonsterById("cm-km-stag-lord");
  const kmStagLordBandit = requireCustomMonsterById("cm-km-stag-lord-bandit");
  const kmTatzlwyrm = requireCustomMonsterById("cm-km-tatzlwyrm");
  const kmOwlbearAlpha = requireCustomMonsterById("cm-km-owlbear-alpha");
  const kmSprigganRaider = requireCustomMonsterById("cm-km-spriggan-raider");
  const kmLinnormFen = requireCustomMonsterById("cm-km-linnorm-fen");
  const kmArmagTwiceBorn = requireCustomMonsterById("cm-km-armag-twice-born");
  const kmTrollKingHargulka = requireCustomMonsterById("cm-km-troll-king-hargulka");
  const kmHodag = requireCustomMonsterById("cm-km-hodag");
  const kmBoggardSwampPriest = requireCustomMonsterById("cm-km-boggard-swamp-priest");
  const kmFirstWorldScytheTree = requireCustomMonsterById("cm-km-first-world-scythe-tree");
  const kmNyrissa = requireCustomMonsterById("cm-km-nyrissa");
  const kmWillOWispSwarm = requireCustomMonsterById("cm-km-will-o-wisp-swarm");
  const lanternKing = requireCustomMonsterById("cm-lantern-king");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "Stolen Land",
      "Ch. 1 (Stolen Lands) — The Stag Lord and his bandits ambush the party from the Thorn River fort's palisade. (5e conversion)",
      compact([m(kmStagLord), many(kmStagLordBandit, 6)])
    ),
    encounter(
      "Rivers Run Red",
      "Ch. 2 (Kingdom) — Tatzlwyrms and an owlbear alpha threaten the young kingdom's first settlements. (5e conversion)",
      compact([many(kmTatzlwyrm, 4), m(kmOwlbearAlpha)])
    ),
    encounter(
      "The Varnhold Vanishing",
      "Ch. 3 (Varnhold) — Spriggan raiders and the Fen Linnorm cross over from the First World to swallow the town. (5e conversion)",
      compact([many(kmSprigganRaider, 5), m(kmLinnormFen)])
    ),
    encounter(
      "Blood for Blood",
      "Ch. 4 (Tiger Lords) — Armag the Twice-Born leads a Tiger Lord warband and troll mercenaries against the kingdom. (5e conversion)",
      compact([m(kmArmagTwiceBorn), m(kmTrollKingHargulka), many(kmHodag, 2)])
    ),
    encounter(
      "War of the River Kings",
      "Ch. 5 (River Kingdoms) — Hooktongue boggard priests and First World scythe trees hold the Hooktongue Slough. (5e conversion)",
      compact([many(kmBoggardSwampPriest, 4), many(kmFirstWorldScytheTree, 2)])
    ),
    encounter(
      "Sound of a Thousand Screams: Nyrissa",
      "Ch. 6 (First World) — Nyrissa the nymph queen tends her rose garden Briar as the party arrives. (5e conversion)",
      compact([m(kmNyrissa), many(kmWillOWispSwarm, 3)])
    ),
    encounter(
      "Sound of a Thousand Screams: The Lantern King",
      "Ch. 6 (First World) — The Lantern King, Eldest of the First World, reveals himself as the true architect of the curse. (5e conversion)",
      compact([m(lanternKing), many(kmWillOWispSwarm, 4)])
    ),
  ];
}

function wrathOfTheRighteousEncounters(): EncounterTemplate[] {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });

  const wotrCultistOfBaphomet = requireCustomMonsterById("cm-wotr-cultist-of-baphomet");
  const wotrDretchSwarm = requireCustomMonsterById("cm-wotr-dretch-swarm");
  const wotrVrockShrieker = requireCustomMonsterById("cm-wotr-vrock-shrieker");
  const wotrBrimorak = requireCustomMonsterById("cm-wotr-brimorak");
  const wotrShieldArchon = requireCustomMonsterById("cm-wotr-shield-archon");
  const wotrGrayGarrisonCultistLord = requireCustomMonsterById("cm-wotr-gray-garrison-cultist-lord");
  const wotrBabauSkirmisher = requireCustomMonsterById("cm-wotr-babau-skirmisher");
  const wotrSchirBrute = requireCustomMonsterById("cm-wotr-schir-brute");
  const wotrHezrouFrontline = requireCustomMonsterById("cm-wotr-hezrou-frontline");
  const wotrNabasuGlutton = requireCustomMonsterById("cm-wotr-nabasu-glutton");
  const wotrRavenerHunter = requireCustomMonsterById("cm-wotr-ravener-hunter");
  const wotrNocticula = requireCustomMonsterById("cm-wotr-nocticula");
  const wotrBaphomet = requireCustomMonsterById("cm-wotr-baphomet");
  const wotrDeskari = requireCustomMonsterById("cm-wotr-deskari");
  const wotrCrusaderMarshalAlly = requireCustomMonsterById("cm-wotr-crusader-marshal-ally");

  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));

  return [
    encounter(
      "The Worldwound Incursion",
      "Ch. 1 (Kenabres) — Cultists of Baphomet and dretch rabble pour through a fresh rift as the city burns.",
      compact([many(wotrCultistOfBaphomet, 5), many(wotrDretchSwarm, 3)])
    ),
    encounter(
      "Sword of Valor",
      "Ch. 2 (Drezen) — Vrock shriekers and a brimorak firestarter hold the citadel's shattered gate; a shield archon fights beside the party.",
      compact([many(wotrVrockShrieker, 2), many(wotrBrimorak, 3), m(wotrShieldArchon)])
    ),
    encounter(
      "Sword of Valor: Staunton Vhane",
      "Ch. 2 (Gray Garrison) — Staunton Vhane, the fallen warpriest, defends the wardstone chamber with babau slayers.",
      compact([m(wotrGrayGarrisonCultistLord), many(wotrBabauSkirmisher, 3)])
    ),
    encounter(
      "Demon's Heresy",
      "Ch. 3 (Worldwound) — Schir warband brutes and a hezrou screen the approach to the Ivory Sanctum.",
      compact([many(wotrSchirBrute, 4), many(wotrHezrouFrontline, 2)])
    ),
    encounter(
      "The Midnight Isles",
      "Ch. 4 (Abyss) — Nabasu soul-gluttons and ravener hunters of Deskari harvest the crusaders' dead on Nocticula's islands.",
      compact([many(wotrNabasuGlutton, 2), many(wotrRavenerHunter, 3)])
    ),
    encounter(
      "The Midnight Isles: Nocticula",
      "Ch. 4 (Abyss) — An aspect of Nocticula, the Redeemer Queen, receives the party in her shadow-garden palace.",
      compact([m(wotrNocticula), many(wotrBabauSkirmisher, 4)])
    ),
    encounter(
      "Herald of the Ivory Labyrinth",
      "Ch. 5 (Abyss) — Baphomet, the Prince of Beasts, hunts the party through his endless maze for the stolen Herald.",
      compact([m(wotrBaphomet), many(wotrHezrouFrontline, 2)])
    ),
    encounter(
      "City of Locusts",
      "Ch. 6 (Iz) — Deskari, the Usher of the Apocalypse, rises from the Worldwound's heart as the crusade marshals rally the last charge.",
      compact([m(wotrDeskari), many(wotrRavenerHunter, 3), many(wotrCrusaderMarshalAlly, 2)])
    ),
  ];
}

// ===========================================================================
// populate-campaigns-g5a — encounter helpers
// ===========================================================================

/** Shared encounter-builder locals used by the G5a helpers below. */
function g5aBuilders() {
  const encounter = (
    name: string,
    description: string,
    monsters: Monster[]
  ): EncounterTemplate => ({ name, description, monsters });
  const m = (
    template: ReturnType<typeof requireCustomMonsterById>
  ): Monster | undefined => toEncounterMonster(template);
  const many = (
    template: ReturnType<typeof requireCustomMonsterById>,
    n: number
  ): Monster[] => toEncounterMonsters(template, n);
  const compact = (arr: (Monster | Monster[] | undefined)[]): Monster[] =>
    arr.flatMap((x) => (Array.isArray(x) ? x : x ? [x] : []));
  return { encounter, m, many, compact };
}

/** Planescape: Turn of Fortune's Wheel — 14-plane planar adventure path. */
function totfwEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const rogue = requireCustomMonsterById("cm-totfw-tulpa-reform-rogue");
  const ordinator = requireCustomMonsterById("cm-totfw-modron-ordinator");
  const courier = requireCustomMonsterById("cm-totfw-devil-courier");
  const beastLord = requireCustomMonsterById("cm-totfw-beast-lord-guardian");
  const balor = requireCustomMonsterById("cm-totfw-balor-sergeant");
  const puppetMaster = requireCustomMonsterById("cm-totfw-tulpa-puppet-master");
  const sentinel = requireCustomMonsterById("cm-totfw-vault-sentinel");
  const dispater = requireCustomMonsterById("cm-totfw-dispater");
  const bandit = requireCustomMonsterById("cm-bandit");
  const shadow = requireCustomMonsterById("cm-shadow");

  return [
    encounter("Hirelings & Heroes", "Ch 1 (Sigil) — The Heroes of Sigil vet the party by throwing a rogue tulpa raid at them in the Hive Ward.", compact([m(rogue), many(bandit, 3)])),
    encounter("Keys to the Vault", "Ch 2 (Vault of the Planes entrance) — Tulpa raiders try to seize the party's key before they can enter.", compact([many(rogue, 3), many(bandit, 2)])),
    encounter("Sigil Patrol", "Ch 3 (Sigil) — A Fated tax collector's infernal courier and hired blades corner the party over an unpaid planar toll.", compact([m(courier), many(rogue, 2), many(bandit, 2)])),
    encounter("Mechanus — Modron Cube Patrol", "Ch 4 (Mechanus) — A marching cube of modrons registers the party as unlicensed variables and moves to correct them.", compact([m(ordinator), many(bandit, 4)])),
    encounter("Arborea — Bacchanal Gone Wrong", "Ch 5 (Arborea) — Revelers turned raiders under a tulpa's sway ambush the party on Olympus's slopes.", compact([many(rogue, 4), m(courier)])),
    encounter("Elysium — The Oinoloth's Blight", "Ch 6 (Elysium) — A pocket of the plane has been corrupted; a devil courier smuggles the contagion in a warded case.", compact([m(courier), many(shadow, 4)])),
    encounter("The Beastlands — The Hunt", "Ch 7 (Beastlands) — A Beast Lord's guardian judges the party as trespassers and tests them in single combat.", compact([m(beastLord), many(rogue, 2)])),
    encounter("Gehenna — Slag Ambush", "Ch 8 (Gehenna) — A balor sergeant collecting the volcano's toll in souls blocks the party's climb.", compact([m(balor), many(courier, 2)])),
    encounter("The Nine Hells — Dispater's Fortress", "Ch 9 (Dis) — Dispater, Archdevil of Dis, receives the party in the Iron Tower and decides they know too much.", compact([m(dispater), many(courier, 2), m(balor)])),
    encounter("The Gray Waste — Hopeless Siege", "Ch 10 (Hades) — Larvae-herding fiends and a balor overseer wear the party down in the plane of despair.", compact([m(balor), many(shadow, 6)])),
    encounter("Carceri — The Prisoner Exchange", "Ch 11 (Carceri) — Escaped tulpa raiders and their devil fixer try to trade the party for their own freedom.", compact([many(rogue, 5), m(courier)])),
    encounter("The Abyss — Demonweb Approach", "Ch 12 (Abyss) — A balor sergeant leads a warband guarding a demon lord's layer entrance.", compact([m(balor), many(rogue, 4)])),
    encounter("The Outlands — Spire's Shadow", "Ch 13 (Outlands) — Near the Spire magic falters; the party must beat the puppet master's construct escort with steel.", compact([m(sentinel), many(ordinator, 2)])),
    encounter("Behind the Wheel", "Ch 13-14 — The Tulpa Puppet Master reveals himself as the war's architect and turns the party's own doubts against them.", compact([m(puppetMaster), many(rogue, 4), m(sentinel)])),
    encounter("Echoes of Delusion", "Ch 14 (final vault) — The Spindle of Sinbad wakes its sentinel and the puppet master makes his last stand.", compact([m(sentinel), m(puppetMaster), many(ordinator, 2)])),
  ];
}

/** Dragonlance: Shadow of the Dragon Queen — the War of the Lance. */
function dsotdqEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const baaz = requireCustomMonsterById("cm-dsotdq-draconian-baaz");
  const kapak = requireCustomMonsterById("cm-dsotdq-draconian-kapak");
  const sivak = requireCustomMonsterById("cm-dsotdq-draconian-sivak");
  const aurak = requireCustomMonsterById("cm-dsotdq-draconian-aurak");
  const officer = requireCustomMonsterById("cm-dsotdq-dragon-army-officer");
  const blueDragon = requireCustomMonsterById("cm-dsotdq-young-blue-dragon");
  const highlord = requireCustomMonsterById("cm-dsotdq-dragonarmy-highlord");
  const blueLady = requireCustomMonsterById("cm-dsotdq-blue-lady");
  const soth = requireCustomMonsterById("cm-lord-soth");
  const skeleton = requireCustomMonsterById("cm-skeleton");

  return [
    encounter("Termination Dust", "Ch 1 (Vogler) — The first draconian raiders reach the village as the harvest festival ends.", compact([many(baaz, 4), m(officer)])),
    encounter("The Northern Wastes", "Ch 2 (Solamnia front) — A kapak patrol poisons the well at a way-station on the road to Kalaman.", compact([many(kapak, 3), many(baaz, 3)])),
    encounter("Sanction's Warning", "Ch 3 (road to Sanction) — A sivak infiltrator wearing a dead scout's face leads an ambush.", compact([m(sivak), many(baaz, 4), m(officer)])),
    encounter("On the Road", "Ch 4 (Solamnic countryside) — An aurak draconian and dragonarmy troops hold a burned bridge.", compact([m(aurak), many(kapak, 2), many(baaz, 2)])),
    encounter("The Blue Lady's Vanguard", "Ch 4-5 (Plains of Solamnia) — A young blue dragon of the Dragonarmy strafes the marching column.", compact([m(blueDragon), many(officer, 2), many(baaz, 4)])),
    encounter("Soth's Advance", "Ch 5 (Battle of the Plains) — Lord Soth, Death Knight of the Rose, commands the center of the enemy host.", compact([m(soth), many(skeleton, 8), m(aurak)])),
    encounter("The Flying Citadels", "Ch 6 (High Skies of Krynn) — Heroes board a floating citadel defended by a Dragonarmy Highlord.", compact([m(highlord), many(sivak, 2), many(kapak, 3)])),
    encounter("Flames of War", "Ch 7 (Kalaman) — The Highlord and the last draconian companies make a stand in the burning streets.", compact([m(highlord), many(aurak, 2), many(baaz, 6)])),
    encounter("Shadow of the Dragon Queen", "Ch 7 (finale) — The Blue Lady, an aspect of Takhisis, joins Lord Soth for the final confrontation over Kalaman.", compact([m(blueLady), m(soth), many(skeleton, 6)])),
  ];
}

/** Spelljammer: Light of Xaryxis — Flash-Gordon space opera. */
function loxEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const captain = requireCustomMonsterById("cm-lox-brallish-pirate-captain");
  const thrall = requireCustomMonsterById("cm-lox-mind-controlled-paladin");
  const vampirate = requireCustomMonsterById("cm-lox-vampirate");
  const xhalcaraz = requireCustomMonsterById("cm-lox-xhalcaraz");
  const mindFlayer = requireCustomMonsterById("cm-mind-flayer");
  const shadow = requireCustomMonsterById("cm-shadow");
  const bandit = requireCustomMonsterById("cm-bandit");

  return [
    encounter("Message in a Bottle", "Part 1 (Rock of Bral) — A rival pirate captain jumps the party the moment they inherit a spelljamming ship.", compact([m(captain), many(bandit, 4)])),
    encounter("Below the Rock", "Part 2 (Underdark gateway) — Mind-controlled githyanki thralls try to stop the party activating the astral gate.", compact([many(thrall, 2), many(bandit, 3)])),
    encounter("Wildspace Encounter", "Part 3 (Xaryxis approaches) — Hallothere Lazybower's vampirate crew grapple the hull and board.", compact([many(vampirate, 3), many(shadow, 3)])),
    encounter("The Vampirate Captain", "Part 3 (Wildspace) — Lazybower himself fights on the open deck as the ships drift toward a dead sun.", compact([m(vampirate), m(captain), many(shadow, 4)])),
    encounter("The Xaryxian Empire", "Part 4 (Xaryxis) — Mind flayers and paladin thralls guard the beacon aimed at the party's homeworld.", compact([many(mindFlayer, 2), many(thrall, 2)])),
    encounter("Light of Xaryxis", "Part 4 (finale) — Xhalcaraz, Emperor of Xaryxis, bonds with the cosmic beacon for the final battle.", compact([m(xhalcaraz), many(mindFlayer, 2), m(thrall)])),
  ];
}

/** The Temple of Elemental Evil — the prototypical mega-dungeon. */
function toeeEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const acolyte = requireCustomMonsterById("cm-toee-elemental-cult-acolyte");
  const priest = requireCustomMonsterById("cm-toee-temple-priest");
  const iuz = requireCustomMonsterById("cm-toee-iuz");
  const zuggtmoy = requireCustomMonsterById("cm-zuggtmoy");
  const bandit = requireCustomMonsterById("cm-bandit");
  const goblin = requireCustomMonsterById("cm-goblin");
  const bugbear = requireCustomMonsterById("cm-bugbear");
  const ogre = requireCustomMonsterById("cm-ogre");
  const skeleton = requireCustomMonsterById("cm-skeleton");
  const fireGiant = requireCustomMonsterById("cm-fire-giant");
  const magmin = requireCustomMonsterById("cm-magmin");
  const hellHound = requireCustomMonsterById("cm-hell-hound");
  const troglodyte = requireCustomMonsterById("cm-troglodyte");

  return [
    encounter("The Moathouse", "Ch 1 (Hommlet) — Agents of the Hidden Shrine meet at the ruined moathouse; bandits and a bugbear enforcer guard the cellar.", compact([m(bugbear), many(bandit, 4), many(goblin, 3)])),
    encounter("Temple Approach Patrol", "Ch 2 (above ground) — Humanoid raiders and an Elemental Cult acolyte scout the temple perimeter.", compact([m(acolyte), many(goblin, 4), many(bandit, 2)])),
    encounter("The Earth Node Crypts", "Ch 3 (Temple Level 1) — Ogres and animated dead of past victims guard the hidden node entrance.", compact([many(ogre, 2), many(skeleton, 6)])),
    encounter("The Water Node", "Ch 4 (Temple Level 2) — Water cultists and troglodyte slaves defend a flooded shrine.", compact([m(acolyte), many(troglodyte, 4), many(bandit, 2)])),
    encounter("The Fire Node", "Ch 5 (Temple Level 3) — Fire giants, magmin, and a hound of the fire cult hold the burning bridge.", compact([m(fireGiant), many(magmin, 4), many(hellHound, 2)])),
    encounter("Priest of the Elder Elemental Eye", "Ch 5-6 (Temple Level 3-4) — A high priest bars the stair to the air node with node-fueled magic.", compact([m(priest), many(acolyte, 2), many(troglodyte, 2)])),
    encounter("Zuggtmoy, Demoness Queen of Fungi", "Ch 6 (Temple Level 4) — The bound demoness makes her play for freedom in the heart of the temple.", compact([m(zuggtmoy), many(acolyte, 3), many(troglodyte, 2)])),
    encounter("Old Wicked's Cameo", "Ch 6 (optional finale) — Iuz the Evil arrives to claim the temple's power for himself if the party lingers.", compact([m(iuz), m(priest), many(acolyte, 2)])),
  ];
}

/** The Keep on the Borderlands — the foundational sandbox. */
function b2Encounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const priest = requireCustomMonsterById("cm-b2-priest-of-chaos");
  const zargon = requireCustomMonsterById("cm-b2-zargon");
  const goblin = requireCustomMonsterById("cm-goblin");
  const orc = requireCustomMonsterById("cm-orc");
  const hobgoblin = requireCustomMonsterById("cm-hobgoblin");
  const bugbear = requireCustomMonsterById("cm-bugbear");
  const ogre = requireCustomMonsterById("cm-ogre");
  const bandit = requireCustomMonsterById("cm-bandit");

  return [
    encounter("The Treacherous Priest", "Ch 1 (The Keep) — The Keep's guest chaplain is a spy for the Caves; cornered, he calls in hired blades.", compact([m(priest), many(bandit, 4)])),
    encounter("Ambush on the Trail", "Ch 2 (Wilderness) — A mixed goblin-and-orc raiding party hits the road between the Keep and the ravine.", compact([many(goblin, 6), many(orc, 3)])),
    encounter("Caves of Chaos: The Goblin Warren", "Ch 2 (Caves of Chaos) — The goblin and hobgoblin caves rally to repel intruders in the central ravine.", compact([many(hobgoblin, 5), many(goblin, 6)])),
    encounter("Caves of Chaos: The Ogre's Cave", "Ch 2-3 (Caves of Chaos) — A bought ogre and bugbear guards hold the approach to the inner caves.", compact([many(ogre, 2), many(bugbear, 3)])),
    encounter("The Shrine of Evil Chaos", "Ch 3 (Inner Caves) — The treacherous priest, unmasked, defends the shrine with undead-tainted acolytes.", compact([m(priest), many(hobgoblin, 4), many(bandit, 2)])),
    encounter("Zargon, the One-Eyed Evil", "Ch 3 (Inner Caves) — The immortal horror behind the Caves of Chaos rises from its pit.", compact([m(zargon), many(bugbear, 3), many(ogre, 1)])),
  ];
}

/** Queen of the Spiders — the GDQ1-7 supermodule. */
function qotsEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const patrolCaptain = requireCustomMonsterById("cm-qots-drow-patrol-captain");
  const eclavdra = requireCustomMonsterById("cm-qots-eclavdra");
  const priestess = requireCustomMonsterById("cm-qots-drow-priestess-of-lolth");
  const lolth = requireCustomMonsterById("cm-qots-lolth");
  const hillGiant = requireCustomMonsterById("cm-hill-giant");
  const frostGiant = requireCustomMonsterById("cm-frost-giant");
  const fireGiant = requireCustomMonsterById("cm-fire-giant");
  const ogre = requireCustomMonsterById("cm-ogre");
  const hellHound = requireCustomMonsterById("cm-hell-hound");
  const kuoToa = requireCustomMonsterById("cm-kuo-toa");
  const drider = requireCustomMonsterById("cm-drider");
  const giantSpider = requireCustomMonsterById("cm-giant-spider");
  const drowWarrior = requireCustomMonsterById("cm-drow-elite-warrior");
  const drowMage = requireCustomMonsterById("cm-drow-mage");

  return [
    encounter("Steading of the Hill Giant Chief", "Ch 1 (G1) — The great hall erupts as the party is discovered among the drunken hill giants and their ogre mercenaries.", compact([many(hillGiant, 2), many(ogre, 4)])),
    encounter("Glacial Rift of the Frost Giant Jarl", "Ch 2 (G2) — Frost giants and their winter-wolf pack hold the icy ledges above the rift.", compact([many(frostGiant, 2), many(ogre, 2)])),
    encounter("Hall of the Fire Giant King", "Ch 3 (G3) — King Snurre's fire giants and hell hounds guard the way to the hidden Underdark stair.", compact([many(fireGiant, 2), many(hellHound, 3)])),
    encounter("Descent into the Depths", "Ch 4 (D1) — The first drow patrol shadows the party through the vast caverns and springs its trap.", compact([m(patrolCaptain), many(drowWarrior, 3), m(drowMage)])),
    encounter("Shrine of the Kuo-Toa", "Ch 5 (D2) — Blind priests of Blibdoolpoolp and their giant guards ambush the party at the pilgrim bridge.", compact([many(kuoToa, 6), many(ogre, 1)])),
    encounter("Erelhei-Cinlu Intrigue", "Ch 6 (D3 / Vault of the Drow) — Eclavdra, priestess of the House of Eilservs, tests the party in the streets of the drow city.", compact([m(eclavdra), many(drowWarrior, 4), many(drider, 2)])),
    encounter("The Fane of Lolth", "Ch 6 (D3) — A drow priestess of Lolth defends the temple with drider guards and swarming spiders.", compact([m(priestess), many(drider, 3), many(giantSpider, 4)])),
    encounter("Gate to the Demonweb Pits", "Ch 7 (Q1) — Eclavdra makes her last stand at the astral gate, backed by a priestess of Lolth.", compact([m(eclavdra), m(priestess), many(drowWarrior, 4)])),
    encounter("Lolth, the Spider Queen", "Ch 7 (Q1 finale) — In the heart of the Demonweb, Lolth herself descends on her spider-throne.", compact([m(lolth), many(drider, 4), many(giantSpider, 6)])),
  ];
}

/** Return to the Tomb of Horrors — Acererak's bid for godhood. */
function rtohEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const acolyte = requireCustomMonsterById("cm-rtoh-acolyte-of-acererak");
  const nightProwler = requireCustomMonsterById("cm-rtoh-night-prowler");
  const moilianWraith = requireCustomMonsterById("cm-rtoh-cursed-moilian-wraith");
  const soulMonger = requireCustomMonsterById("cm-rtoh-soul-monger-construct");
  const decoyDemilich = requireCustomMonsterById("cm-rtoh-acererak-decoy-demilich");
  const trueDemilich = requireCustomMonsterById("cm-rtoh-acererak-true-demilich");
  const acererakLich = requireCustomMonsterById("cm-acererak-lich");
  const banshee = requireCustomMonsterById("cm-banshee");
  const shadow = requireCustomMonsterById("cm-shadow");
  const skeleton = requireCustomMonsterById("cm-skeleton");

  return [
    encounter("The Original Tomb", "Ch 1 (Tomb of Horrors) — The death-trap corridors still bite; guardian shadows and skeletons harry the re-entry.", compact([many(shadow, 4), many(skeleton, 6)])),
    encounter("The Decoy Demilich", "Ch 1 (Tomb of Horrors) — The jade skull rises as a decoy demilich to devour the souls of the overconfident.", compact([m(decoyDemilich), many(shadow, 3)])),
    encounter("The City of Moil", "Ch 2 (Moil, the City That Waits) — In the eternal dark, cursed Moilian wraiths and a night prowler drift between the frozen towers.", compact([many(moilianWraith, 2), m(nightProwler)])),
    encounter("The Wailing Cathedral", "Ch 2 (Moil) — A banshee choir and Acererak's cultists work the soul-harvest apparatus.", compact([many(banshee, 2), many(acolyte, 3)])),
    encounter("Fortress of Conclusion: The Vestibule", "Ch 3 (Fortress of Conclusion) — Soul-monger constructs and an acererak-lich lieutenant guard the ritual chamber doors.", compact([many(soulMonger, 2), m(acererakLich), many(acolyte, 2)])),
    encounter("Acererak, True Demilich Ascendant", "Ch 3 (Fortress of Conclusion) — On the verge of godhood, Acererak turns the millennia of harvested souls against the party.", compact([m(trueDemilich), m(soulMonger), many(acolyte, 3)])),
  ];
}

/** Against the Cult of the Reptile God — a low-level mystery. */
function n1Encounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const villager = requireCustomMonsterById("cm-n1-charmed-villager");
  const scout = requireCustomMonsterById("cm-n1-reptile-cult-scout");
  const yuanTi = requireCustomMonsterById("cm-n1-yuan-ti-servitor");
  const explictica = requireCustomMonsterById("cm-n1-explictica-defilus");
  const troglodyte = requireCustomMonsterById("cm-troglodyte");
  const giantSpider = requireCustomMonsterById("cm-giant-spider");

  return [
    encounter("The Stalked Village", "Ch 1 (Orlane) — Charmed villagers turn on the party after dark once the cult marks them as a threat.", compact([many(villager, 5), m(scout)])),
    encounter("The Golden Grain Inn", "Ch 1 (Orlane) — Cult scouts posing as patrons try to drug the party's drinks and take them quietly.", compact([many(scout, 3), many(villager, 3)])),
    encounter("The Troglodyte Maze", "Ch 2 (Wastelands) — Troglodytes ambush the party in the reeking tunnels that lead toward the cult's lair.", compact([many(troglodyte, 4), m(scout)])),
    encounter("The Cult's Antechamber", "Ch 3 (Cave Lair) — Yuan-ti servitors and giant spiders guard the approach to the inner shrine.", compact([many(yuanTi, 3), many(giantSpider, 3)])),
    encounter("Explictica Defilus, the Reptile God", "Ch 3 (Cave Lair) — The self-styled Reptile God and her servitors make their stand in the flooded shrine cavern.", compact([m(explictica), many(yuanTi, 2), many(troglodyte, 2)])),
  ];
}

// ===========================================================================
// populate-campaigns-g5b — encounter helpers
// ===========================================================================

/** Age of Worms — the Kyuss / Dragotha adventure path. */
function aowEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const faceless = requireCustomMonsterById("cm-aow-faceless-one");
  const kyussSpawn = requireCustomMonsterById("cm-aow-kyuss-spawn");
  const wtw = requireCustomMonsterById("cm-aow-worm-that-walks");
  const apostle = requireCustomMonsterById("cm-aow-apostle-of-kyuss");
  const dragotha = requireCustomMonsterById("cm-aow-dragotha");
  const kyuss = requireCustomMonsterById("cm-aow-kyuss-avatar");
  const cultist = requireCustomMonsterById("cm-vecna-cultist");
  const necro = requireCustomMonsterById("cm-necromancer-wizard");
  const mindFlayer = requireCustomMonsterById("cm-mind-flayer");
  const beholder = requireCustomMonsterById("cm-beholder");
  const skeleton = requireCustomMonsterById("cm-skeleton");

  return [
    encounter("The Whispering Cairn", "Ch 1 (Diamond Lake) — Worm-cult acolytes finish a rite in the necromancer Eravan's tomb.", compact([many(cultist, 4), m(kyussSpawn)])),
    encounter("The Three Faces of Evil", "Ch 2 (Dourstone Mine) — The Ebon Triad's faceless leader oversees the shrine of the worm god.", compact([m(faceless), many(cultist, 4)])),
    encounter("Encounter at Blackwall Keep", "Ch 3 (Blackwall Keep) — Lizardfolk raiders and a worm-cult infiltrator besiege the border fort.", compact([many(skeleton, 6), m(kyussSpawn), m(cultist)])),
    encounter("The Hall of Harsh Reflections", "Ch 4 (Free City of Greyhawk) — Doppelganger assassins and their mind flayer handler stalk the party.", compact([many(mindFlayer, 1), many(cultist, 4), m(necro)])),
    encounter("The Champion's Belt", "Ch 5 (Greyhawk arena) — A rigged gladiatorial match pits the party against worm-touched beasts and a Spawn of Kyuss.", compact([many(kyussSpawn, 2), many(cultist, 4)])),
    encounter("A Gathering of Winds", "Ch 6 (Diamond Lake, return) — Ilthane's cult warband assaults Allustan's rebuilt tower.", compact([many(cultist, 6), m(faceless), many(skeleton, 4)])),
    encounter("The Spire of Long Shadows", "Ch 7 (Spire of Long Shadows) — The alien architecture warps the mind; a Worm That Walks guards Balakarde's shattered spirit.", compact([m(wtw), many(kyussSpawn, 2)])),
    encounter("The Prince of Redhand", "Ch 8 (Redhand) — A masquerade turns deadly as the Apostle of Kyuss reveals himself at court.", compact([m(apostle), many(cultist, 4), m(necro)])),
    encounter("The Library of Last Resort", "Ch 9 (Isle of Last Resort) — A cleric of Vecna's warband races the party for Dragotha's phylactery.", compact([m(necro), many(cultist, 5), m(wtw)])),
    encounter("Kings of the Rift", "Ch 10 (Riftcrown) — Worm-cult siege engines and an Apostle assault the besieged city.", compact([m(apostle), many(kyussSpawn, 3), many(skeleton, 6)])),
    encounter("Into the Wormcrawl Fissure", "Ch 11 (Wormcrawl Fissure) — Dragotha, the undead dragon, defends the fissure that leads to Kyuss.", compact([m(dragotha), many(kyussSpawn, 3)])),
    encounter("Dawn of a New Age: The Apostles", "Ch 12 (Alhaster) — The Ebon Triad's surviving apostles hold the ritual circle open.", compact([many(apostle, 2), many(wtw, 1), many(cultist, 6)])),
    encounter("Dawn of a New Age: Dragotha Returns", "Ch 12 (Alhaster) — Dragotha rejoins the fray as Kyuss begins to manifest.", compact([m(dragotha), m(apostle), many(kyussSpawn, 4)])),
    encounter("Kyuss, the Worm That Walks Divine", "Ch 12 (Alhaster) — The worm god manifests over Alhaster to usher in the Age of Worms.", compact([m(kyuss), many(kyussSpawn, 4), m(wtw)])),
  ];
}

/** Dungeons of Drakkenheim — the Haze-contaminated city. */
function dodrakEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const thug = requireCustomMonsterById("cm-dodrak-crimson-thug");
  const knight = requireCustomMonsterById("cm-dodrak-silver-order-knight");
  const marauder = requireCustomMonsterById("cm-dodrak-haze-marauder");
  const hazeElemental = requireCustomMonsterById("cm-dodrak-haze-elemental");
  const otyugh = requireCustomMonsterById("cm-dodrak-plague-otyugh");
  const vorn = requireCustomMonsterById("cm-dodrak-king-odius-vorn");
  const sovereign = requireCustomMonsterById("cm-dodrak-hollow-sovereign");
  const bandit = requireCustomMonsterById("cm-bandit");

  return [
    encounter("Arrival in Drakkenheim", "Ch 1 (Outskirts) — Haze-touched marauders fall on a refugee caravan at the ruined gate.", compact([many(marauder, 3), many(bandit, 3)])),
    encounter("The Outer City", "Ch 2 (Outer Drakkenheim) — A Crimson Society ambush in the market quarter turns into a three-way brawl with Silver Order patrols.", compact([many(thug, 4), many(knight, 2)])),
    encounter("Faction Intrigue", "Ch 3 (Drakkenheim) — A Silver Order strike team and Crimson Society thugs both want the party's delerium sample.", compact([many(knight, 3), many(thug, 3)])),
    encounter("The Underbelly", "Ch 3-4 (Sewers) — A Haze-mutated plague otyugh nests in the slime channels beneath the city.", compact([m(otyugh), many(marauder, 2)])),
    encounter("Inside the Walls", "Ch 4 (Inner Drakkenheim) — Haze elementals drift through the contaminated inner streets.", compact([many(hazeElemental, 2), many(marauder, 3)])),
    encounter("Heart of Chaos", "Ch 5 (Crater District) — The Haze is thickest here; elementals and mutated marauders swarm the crater's edge.", compact([many(hazeElemental, 2), m(otyugh), many(marauder, 2)])),
    encounter("The Cathedral", "Ch 6 (Cathedral of Saint Vitruvio) — King Odius Vorn, the spellweaver-lich, works his ritual in the ruined nave.", compact([m(vorn), many(hazeElemental, 2), many(marauder, 3)])),
    encounter("The Cosmos Shrine: Vorn's Last Stand", "Ch 7 (Cosmos Shrine) — Vorn expends his phylactery's power to hold the shrine.", compact([m(vorn), m(hazeElemental), many(knight, 2)])),
    encounter("The Hollow Sovereign", "Ch 7 (Cosmos Shrine) — The will inside the fallen meteor rises to remake the world in the Haze's image.", compact([m(sovereign), many(hazeElemental, 3)])),
  ];
}

/** Scarlet Citadel — the Twilight Princess's giant stronghold. */
function scEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const apostle = requireCustomMonsterById("cm-sc-twilight-apostle");
  const picket = requireCustomMonsterById("cm-sc-stone-giant-picket");
  const frostChampion = requireCustomMonsterById("cm-sc-frost-giant-champion");
  const wrathguard = requireCustomMonsterById("cm-sc-fire-giant-wrathguard");
  const princess = requireCustomMonsterById("cm-sc-twilight-princess");
  const hillGiant = requireCustomMonsterById("cm-hill-giant");
  const ogre = requireCustomMonsterById("cm-ogre");
  const goblin = requireCustomMonsterById("cm-goblin");
  const airElemental = requireCustomMonsterById("cm-air-elemental");

  return [
    encounter("The Approach & Outer Bailey", "Ch 1 — Hill giants and ogre thralls hold the mountain trail up to the citadel gate.", compact([many(hillGiant, 2), many(ogre, 3)])),
    encounter("The Garrison", "Ch 2 — Stone giant pickets and their goblin servitors patrol the barracks level.", compact([m(picket), many(goblin, 6), many(ogre, 1)])),
    encounter("The Lower Citadel", "Ch 3 — Twilight apostles conduct a rite in the slave-quarter temple.", compact([many(apostle, 2), many(goblin, 4)])),
    encounter("The Twisting Halls", "Ch 4 — The labyrinth shifts around a fire giant patrol and its stone giant guide.", compact([m(picket), many(ogre, 2), many(goblin, 4)])),
    encounter("The Great Hall", "Ch 5 — The stone giant court, with a frost giant champion standing honor guard over the throne.", compact([m(frostChampion), many(picket, 1), many(apostle, 2)])),
    encounter("The Twilight Tower", "Ch 6 — Twilight apostles and a bound air elemental defend the mage tower's stair.", compact([many(apostle, 3), m(airElemental)])),
    encounter("The Heart Vault", "Ch 7 — Fire giant wrathguards seal the treasure vault against intruders.", compact([m(wrathguard), many(apostle, 2)])),
    encounter("The Twilight Princess: Wrathguard", "Ch 8 — The Princess's fire giant bodyguard and apostle circle meet the party at the lair doors.", compact([m(wrathguard), m(frostChampion), many(apostle, 2)])),
    encounter("The Twilight Princess", "Ch 8 — The stone giant evoker archmage unleashes the citadel's stored evocation power.", compact([m(princess), m(wrathguard), many(apostle, 2)])),
  ];
}

/** Courts of the Shadow Fey — the Queen of Night and Magic's court. */
function cotsfEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const courtier = requireCustomMonsterById("cm-cotsf-shadow-fey-courtier");
  const warrior = requireCustomMonsterById("cm-cotsf-shadow-fey-warrior");
  const shadowElemental = requireCustomMonsterById("cm-cotsf-shadow-elemental");
  const guardian = requireCustomMonsterById("cm-cotsf-shadow-portal-guardian");
  const champion = requireCustomMonsterById("cm-cotsf-shadow-fey-champion");
  const queen = requireCustomMonsterById("cm-cotsf-archfey-monarch");
  const shadow = requireCustomMonsterById("cm-shadow");

  return [
    encounter("Arrival in the Shadow Realm", "Ch 1 (Shadow Roads) — Portal guardians challenge the party the moment they cross into the Shadow Realm.", compact([m(guardian), many(shadow, 4)])),
    encounter("The Descent", "Ch 1 (Shadow Roads) — Shadow fey warriors shadow the party along the twisting roads and strike from the gloom.", compact([many(warrior, 3), many(shadow, 3)])),
    encounter("The Outer Courts", "Ch 2 — Courtiers test the party with a deadly game of riddles and enchanted blades.", compact([many(courtier, 3), many(warrior, 2)])),
    encounter("The Twisting Halls", "Ch 3 — The court physically rearranges around shadow elementals and fey warriors.", compact([many(shadowElemental, 2), many(warrior, 3)])),
    encounter("The Queen's Gambit: Champion", "Ch 4 (Palace of the Queen of Night) — The Queen's champion and courtiers bar the throne room.", compact([m(champion), many(courtier, 2), many(warrior, 2)])),
    encounter("The Queen of Night and Magic", "Ch 4 — The corrupted archfey monarch fights from her throne of endless night.", compact([m(queen), m(champion), many(shadowElemental, 2)])),
  ];
}

/** Empire of the Ghouls — from the Radiant Citadel to Doresain's court. */
function eotgEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const cultist = requireCustomMonsterById("cm-eotg-ghoul-cultist");
  const guard = requireCustomMonsterById("cm-eotg-radiant-citadel-guard");
  const ghastDevourer = requireCustomMonsterById("cm-eotg-ghast-devourer");
  const construct = requireCustomMonsterById("cm-eotg-merciful-construct");
  const revenant = requireCustomMonsterById("cm-eotg-hidden-founder-revenant");
  const doresain = requireCustomMonsterById("cm-eotg-doresain");
  const ghoul = requireCustomMonsterById("cm-ghoul");
  const bodak = requireCustomMonsterById("cm-bodak");
  const shadow = requireCustomMonsterById("cm-shadow");

  return [
    encounter("Arrival at the Radiant Citadel", "Ch 1 — A ghoul-cult cell is unmasked in the hub city; the Citadel guard rallies with the party.", compact([many(cultist, 4), m(guard), m(construct)])),
    encounter("The Spite House", "Ch 1-2 — Ghoul cultists defend a townhouse that hides a tunnel to the Underworld.", compact([many(cultist, 4), many(ghoul, 3)])),
    encounter("Desert Bones", "Ch 3 (Siwal) — Ghast devourers rise from a desert necropolis the cult has been mining for corpses.", compact([many(ghastDevourer, 2), many(ghoul, 4)])),
    encounter("Into the Underworld", "Ch 4 — The party crosses into the Ghoul Imperium past darakhul patrols and shadow-things.", compact([many(ghastDevourer, 2), many(shadow, 3), many(ghoul, 3)])),
    encounter("The Ghoul City", "Ch 5 (Vendekhul) — Doresain's bodaks and ghast devourers guard the approach to the throne.", compact([many(bodak, 2), many(ghastDevourer, 2), many(ghoul, 4)])),
    encounter("Doresain's Court", "Ch 5 — Doresain, the Ghoul King, holds court in his palace of bone.", compact([m(doresain), many(ghastDevourer, 2), many(ghoul, 4)])),
    encounter("The Hidden Truth", "Ch 6 (Radiant Citadel) — A hidden founder's revenant reveals the traitor within the Citadel's council.", compact([m(revenant), many(cultist, 3), m(construct)])),
    encounter("Heart of the Empire", "Ch 6 — Doresain makes his final bid at the Concord Vault as the founders' revenant fights beside the party.", compact([m(doresain), m(revenant), many(bodak, 2)])),
  ];
}

/** The Shackled City — the Cauldron adventure path. */
function scapEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const skum = requireCustomMonsterById("cm-scap-skum-raider");
  const drakthar = requireCustomMonsterById("cm-scap-drakthar");
  const cagewright = requireCustomMonsterById("cm-scap-cagewright-mage");
  const assassin = requireCustomMonsterById("cm-scap-shackled-assassin");
  const adimarchus = requireCustomMonsterById("cm-scap-adimarchus");
  const goblin = requireCustomMonsterById("cm-goblin");
  const bugbear = requireCustomMonsterById("cm-bugbear");
  const beholder = requireCustomMonsterById("cm-beholder");
  const fireElemental = requireCustomMonsterById("cm-fire-elemental");
  const skeleton = requireCustomMonsterById("cm-skeleton");

  return [
    encounter("Life's Bazaar", "Ch 1 (Cauldron Underdark) — Skum raiders drag captives through the flooded caverns beneath the slave market.", compact([many(skum, 5)])),
    encounter("Drakthar's Way", "Ch 2 (Cauldron Undercity) — The vampire bugbear Drakthar leads goblin raids from a cave complex.", compact([m(drakthar), many(goblin, 6)])),
    encounter("Flood Season", "Ch 3 (Cauldron) — Kidnapper cultists and skum use the rising floodwaters to move through the city unseen.", compact([many(skum, 4), many(bugbear, 2)])),
    encounter("The Demonskar Legacy", "Ch 4 (Cauldron Surrounds) — A Cagewright mage binds a fire elemental at the old Demonskar shrine.", compact([m(cagewright), m(fireElemental), many(bugbear, 2)])),
    encounter("Test of the Smoking Eye", "Ch 5 (Abyss) — Occipitus's fiendish trials pit the party against summoned horrors.", compact([many(fireElemental, 2), many(skeleton, 6)])),
    encounter("Secrets of the Soul Pillars", "Ch 6 (Cauldron) — Wee Jas temple assassins ambush the party in the frozen spellweaver complex.", compact([many(assassin, 2), many(skeleton, 4)])),
    encounter("Lords of Oblivion", "Ch 7 (Cauldron) — A beholder crime-lord conducts unholy rituals beneath the city with Cagewright backing.", compact([m(beholder), m(cagewright), many(assassin, 1)])),
    encounter("Foundations of Flame", "Ch 8 (Undercauldron) — Cagewright mages open a planar rift as the volcano beneath Cauldron wakes.", compact([many(cagewright, 2), many(fireElemental, 2)])),
    encounter("Thirteen Cages", "Ch 9 (Plague Lands) — The Cagewright inner circle guards the ritual cages in the volcano's heart.", compact([many(cagewright, 2), many(assassin, 2), many(fireElemental, 1)])),
    encounter("Strike on Shatterhorn", "Ch 10 (Shatterhorn) — The last Cagewright remnants make their stand in a ruined yuan-ti temple.", compact([m(cagewright), many(assassin, 2), many(skum, 3)])),
    encounter("Zenith Trajectory", "Ch 11 (Occipitus) — Demodand jailers and a Cagewright warden hold the gate to Skullrot.", compact([many(assassin, 2), m(cagewright), many(fireElemental, 2)])),
    encounter("Asylum: The Cagewright Wardens", "Ch 12 (Skullrot) — The final Cagewrights spend their lives to keep Adimarchus's cell sealed to all but themselves.", compact([many(cagewright, 3), many(assassin, 2)])),
    encounter("Asylum: Adimarchus Wakes", "Ch 12 (Skullrot) — The Demon Prince of Madness stirs, and reality frays around the asylum.", compact([m(adimarchus), many(assassin, 2), many(fireElemental, 2)])),
    encounter("Adimarchus, Demon Prince of Madness", "Ch 12 (Skullrot) — The freed demon prince turns the party's own minds against them.", compact([m(adimarchus), many(fireElemental, 3), m(assassin)])),
  ];
}

/** Vault of the Drow — the D-series descent to Erelhei-Cinlu. */
function d3Encounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const quaggoth = requireCustomMonsterById("cm-d3-quaggoth-slave");
  const guardCaptain = requireCustomMonsterById("cm-d3-drow-house-guard-captain");
  const vaGuulgh = requireCustomMonsterById("cm-d3-va-guulgh");
  const patrolCaptain = requireCustomMonsterById("cm-qots-drow-patrol-captain");
  const eclavdra = requireCustomMonsterById("cm-qots-eclavdra");
  const priestess = requireCustomMonsterById("cm-qots-drow-priestess-of-lolth");
  const lolth = requireCustomMonsterById("cm-qots-lolth");
  const drowWarrior = requireCustomMonsterById("cm-drow-elite-warrior");
  const drowMage = requireCustomMonsterById("cm-drow-mage");
  const drider = requireCustomMonsterById("cm-drider");
  const kuoToa = requireCustomMonsterById("cm-kuo-toa");
  const mindFlayer = requireCustomMonsterById("cm-mind-flayer");

  return [
    encounter("Descent into the Depths of the Earth", "Ch 1 (D1) — A drow patrol fleeing the fire giant hall is being hunted through the caverns by mind flayers.", compact([m(patrolCaptain), many(drowWarrior, 3), m(mindFlayer)])),
    encounter("The Vast Caverns", "Ch 1 (D1) — Quaggoth slaves, driven mad, ambush the party at a fungal chokepoint.", compact([many(quaggoth, 5)])),
    encounter("Shrine of the Kuo-Toa", "Ch 2 (D2) — Va-Guulgh, Priest-Prince of Blibdoolpoolp, springs his trap at the pilgrim bridge.", compact([m(vaGuulgh), many(kuoToa, 6)])),
    encounter("Erelhei-Cinlu", "Ch 3 (D3) — A drow house guard captain and Eclavdra's retinue test the party in the streets of the drow city.", compact([m(guardCaptain), m(eclavdra), many(drowWarrior, 3)])),
    encounter("The Fane of Lolth", "Ch 3 (D3) — A priestess of Lolth defends the temple with drider guards and a drow war-mage.", compact([m(priestess), many(drider, 3), m(drowMage)])),
    encounter("Beyond the Vault: Lolth", "Ch 4 (astral gate) — The hidden portal opens on the Demonweb, and Lolth descends to greet the intruders.", compact([m(lolth), many(drider, 4), m(priestess)])),
  ];
}

/** Return to the Temple of Elemental Evil — the Tharizdun cult reborn. */
function rtteeEncounters(): EncounterTemplate[] {
  const { encounter, m, many, compact } = g5aBuilders();
  const spy = requireCustomMonsterById("cm-rtee-cult-spy");
  const earthAcolyte = requireCustomMonsterById("cm-rtee-earth-cult-acolyte");
  const lieutenant = requireCustomMonsterById("cm-rtee-tharizdun-lieutenant");
  const olhydra = requireCustomMonsterById("cm-rtee-olhydra");
  const yanCBin = requireCustomMonsterById("cm-rtee-yan-c-bin");
  const imix = requireCustomMonsterById("cm-imix");
  const ogremoch = requireCustomMonsterById("cm-ogremoch");
  const zuggtmoy = requireCustomMonsterById("cm-zuggtmoy");
  const earthElemental = requireCustomMonsterById("cm-earth-elemental");
  const beholder = requireCustomMonsterById("cm-beholder");
  const bugbear = requireCustomMonsterById("cm-bugbear");

  return [
    encounter("Hommlet and Surrounds", "Ch 1 — Elder Eye cult spies have infiltrated the rebuilt town; unmasked, they call in bugbear muscle.", compact([many(spy, 2), many(bugbear, 3)])),
    encounter("The Moathouse, Excavated", "Ch 1 — The cult has dug out the old moathouse; earth acolytes and a bound elemental guard the new shaft.", compact([many(earthAcolyte, 3), m(earthElemental)])),
    encounter("Rastor and the Crater Ridge Mines", "Ch 2 — Earth-cult conscripts work the node mine under the lash of their acolytes.", compact([many(earthAcolyte, 4), many(earthElemental, 2)])),
    encounter("The Outer Fane", "Ch 3 (Temple of All-Consumption) — A Tharizdun lieutenant marshals the perimeter defense.", compact([m(lieutenant), many(earthAcolyte, 3), many(bugbear, 2)])),
    encounter("The Inner Fane", "Ch 3 — A bound beholder and the cult's inner circle guard the sanctum of the Elder Elemental Eye.", compact([m(beholder), m(lieutenant), many(earthAcolyte, 2)])),
    encounter("The Fire Node: Princes Rising", "Ch 4 (Fire Node) — Imix and Ogrémoch manifest as the summoning nears completion; Zuggtmoy is dragged half-free.", compact([m(imix), m(ogremoch), many(earthAcolyte, 3)])),
    encounter("The Temple of All-Consumption", "Ch 4 (finale) — Olhydra and Yan-C-Bin complete the archomental convergence over the restored temple.", compact([m(olhydra), m(yanCBin), m(zuggtmoy)])),
  ];
}

const CAMPAIGN_CATALOG: CampaignTemplate[] = [
  makeTemplate(
    "Curse of Strahd",
    "CoS",
    "Gothic horror in the vampire-ruled domain of Barovia. Heroes are drawn into the mists and must defeat Count Strahd von Zarovich to escape.",
    [
      { title: "Death House", order: 1, levelRange: "1-2", location: "Village of Barovia" },
      { title: "Into the Mists", order: 2, levelRange: "1-3", location: "Barovia" },
      { title: "The Village of Barovia", order: 3, levelRange: "2-3", location: "Village of Barovia" },
      { title: "The Town of Vallaki", order: 4, levelRange: "3-5", location: "Vallaki" },
      { title: "The Village of Krezk", order: 5, levelRange: "4-5", location: "Krezk" },
      { title: "Old Bonegrinder", order: 6, levelRange: "4-6", location: "Barovia" },
      { title: "Argynvostholt", order: 7, levelRange: "5-7", location: "Barovia" },
      { title: "The Wizard of Wines", order: 8, levelRange: "5-7", location: "Barovia" },
      { title: "Yester Hill & Van Richten's Tower", order: 9, levelRange: "6-8", location: "Barovia" },
      { title: "The Werewolf Den", order: 10, levelRange: "6-8", location: "Barovia" },
      { title: "The Ruins of Berez", order: 11, levelRange: "7-8", location: "Barovia" },
      { title: "The Amber Temple", order: 12, levelRange: "8-9", location: "Mount Ghakis" },
      { title: "Castle Ravenloft", order: 13, levelRange: "9-10", location: "Castle Ravenloft" },
    ],
    cosEncounters()
  ),

  makeTemplate(
    "Tomb of Annihilation",
    "ToA",
    "A death curse is draining the life force of anyone who has been resurrected. Heroes must travel to the jungle land of Chult and destroy the source.",
    [
      { title: "Port Nyanzaru", order: 1, levelRange: "1-4", location: "Port Nyanzaru, Chult" },
      { title: "The Land of Chult", order: 2, levelRange: "1-6", location: "Chult Jungles" },
      { title: "Dwellers of the Forbidden City", order: 3, levelRange: "5-7", location: "Omu" },
      { title: "Fane of the Night Serpent", order: 4, levelRange: "7-9", location: "Omu" },
      { title: "Tomb of the Nine Gods", order: 5, levelRange: "9-11", location: "Tomb of Annihilation" },
    ],
    toaEncounters()
  ),

  makeTemplate(
    "Lost Mine of Phandelver",
    "LMoP",
    "An introductory adventure set in the Forgotten Realms. Heroes escort a wagon to Phandalin and uncover a conspiracy involving the lost Wave Echo Cave.",
    [
      { title: "Goblin Arrows", order: 1, levelRange: "1-2", location: "Triboar Trail" },
      { title: "Phandalin", order: 2, levelRange: "2-3", location: "Phandalin" },
      { title: "The Spider's Web", order: 3, levelRange: "3-4", location: "Sword Coast Frontier" },
      { title: "Wave Echo Cave", order: 4, levelRange: "4-5", location: "Wave Echo Cave" },
    ],
    lmopEncounters()
  ),

  makeTemplate(
    "Rise of the Runelords",
    "RotR",
    "An ancient Thassilonian evil stirs beneath Varisia. Heroes defend the frontier town of Sandpoint and unravel a conspiracy reaching back ten thousand years.",
    [
      { title: "Burnt Offerings", order: 1, levelRange: "1-4", location: "Sandpoint, Thistletop" },
      { title: "The Skinsaw Murders", order: 2, levelRange: "5-7", location: "Sandpoint, Foxglove Manor, Magnimar" },
      { title: "The Hook Mountain Massacre", order: 3, levelRange: "8-10", location: "Fort Rannick, Hook Mountain" },
      { title: "Fortress of the Stone Giants", order: 4, levelRange: "11-13", location: "Sandpoint, Jorgenfist" },
      { title: "Sins of the Saviors", order: 5, levelRange: "13-15", location: "Runeforge" },
      { title: "The Spires of Xin-Shalast", order: 6, levelRange: "15-17", location: "Xin-Shalast, Pinnacle of Avarice" },
    ],
    runelordsEncounters()
  ),

  makeTemplate(
    "Waterdeep: Dragon Heist",
    "WDH",
    "An urban treasure hunt through the City of Splendors. Heroes search for half a million gold dragons while navigating warring criminal factions.",
    [
      { title: "A Friend in Need", order: 1, levelRange: "1-2", location: "Yawning Portal, Waterdeep" },
      { title: "Trollskull Alley", order: 2, levelRange: "2-3", location: "North Ward, Waterdeep" },
      { title: "Fireball", order: 3, levelRange: "3-4", location: "Trollskull Alley" },
      { title: "Dragon Season", order: 4, levelRange: "4-5", location: "Waterdeep" },
      { title: "Spring: The Zhentarim Villain", order: 5, levelRange: "4-5", location: "Waterdeep" },
      { title: "Summer: The Xanathar Villain", order: 6, levelRange: "4-5", location: "Waterdeep" },
      { title: "Autumn: The Cassalanters Villain", order: 7, levelRange: "4-5", location: "Waterdeep" },
      { title: "Winter: Jarlaxle's Villain", order: 8, levelRange: "4-5", location: "Waterdeep" },
      { title: "Volo's Waterdeep Enchiridion", order: 9, levelRange: "5", location: "Waterdeep" },
    ],
    wdhEncounters()
  ),

  makeTemplate(
    "Storm King's Thunder",
    "SKT",
    "The giant lords have abandoned their ancient ordning and chaos erupts across the Savage Frontier. Heroes must end the giant threat and restore order.",
    [
      { title: "A Great Upheaval", order: 1, levelRange: "1-5", location: "Nightstone, Sword Coast Frontier" },
      { title: "Rumblings", order: 2, levelRange: "5-6", location: "Sword Coast Frontier" },
      { title: "The Savage Frontier", order: 3, levelRange: "6-7", location: "Sword Coast North" },
      { title: "The Herald of Doom", order: 4, levelRange: "7-8", location: "Blistercoil" },
      { title: "Den of the Hill Giants", order: 5, levelRange: "8-9", location: "Grudd Haug" },
      { title: "Glacial Rift of the Frost Giants", order: 6, levelRange: "9", location: "Ice Road" },
      { title: "Forge of the Fire Giants", order: 7, levelRange: "9-10", location: "Ironslag" },
      { title: "Maelstrom", order: 8, levelRange: "10-11", location: "Maelstrom, Trackless Sea" },
      { title: "Citadel Felbarr", order: 9, levelRange: "10-11", location: "Citadel Felbarr" },
      { title: "Hold of the Storm Giant King", order: 10, levelRange: "11", location: "Maelstrom" },
    ],
    sktEncounters()
  ),

  makeTemplate(
    "Out of the Abyss",
    "OotA",
    "Captured by the drow, heroes must escape the Underdark as demon lords run rampant in the depths. A two-part descent into darkness and madness.",
    [
      { title: "Prisoner of the Drow", order: 1, levelRange: "1-2", location: "Velkenvelve" },
      { title: "Into Darkness", order: 2, levelRange: "2-3", location: "Underdark" },
      { title: "The Darklake", order: 3, levelRange: "3-4", location: "Darklake" },
      { title: "Gracklstugh", order: 4, levelRange: "4-5", location: "Gracklstugh" },
      { title: "Neverlight Grove", order: 5, levelRange: "4-5", location: "Neverlight Grove" },
      { title: "Blingdenstone", order: 6, levelRange: "5-6", location: "Blingdenstone" },
      { title: "Escape from the Underdark", order: 7, levelRange: "6-7", location: "Underdark" },
      { title: "Audience in Gauntlgrym", order: 8, levelRange: "7-8", location: "Gauntlgrym" },
      { title: "Mantol-Derith", order: 9, levelRange: "8-9", location: "Mantol-Derith" },
      { title: "Descent into the Depths", order: 10, levelRange: "9-10", location: "Underdark" },
      { title: "Gravenhollow", order: 11, levelRange: "10-11", location: "Gravenhollow" },
      { title: "The Tower of Vengeance", order: 12, levelRange: "11-12", location: "Underdark" },
      { title: "The Wormwrithings", order: 13, levelRange: "12-13", location: "The Wormwrithings" },
      { title: "The Labyrinth", order: 14, levelRange: "13-14", location: "The Labyrinth" },
      { title: "The City of Spiders", order: 15, levelRange: "14", location: "Menzoberranzan" },
      { title: "The Fetid Wedding", order: 16, levelRange: "14-15", location: "Sloobludop" },
      { title: "Against the Demon Lords", order: 17, levelRange: "15", location: "Underdark" },
    ],
    ootEncounters()
  ),

  makeTemplate(
    "Ghosts of Saltmarsh",
    "GoS",
    "A maritime anthology of seven connected adventures set in and around the port town of Saltmarsh. Seafaring, smugglers, and sea monsters await.",
    [
      { title: "Saltmarsh", order: 1, levelRange: "1", location: "Saltmarsh" },
      { title: "The Sinister Secret of Saltmarsh", order: 2, levelRange: "1-3", location: "Haunted House, Saltmarsh" },
      { title: "Danger at Dunwater", order: 3, levelRange: "3-5", location: "Dunwater River" },
      { title: "Salvage Operation", order: 4, levelRange: "4-6", location: "Emperor of the Waves" },
      { title: "Isle of the Abbey", order: 5, levelRange: "5-7", location: "Abyss Isle" },
      { title: "The Final Enemy", order: 6, levelRange: "7-9", location: "Sahuagin Fortress" },
      { title: "Tammeraut's Fate", order: 7, levelRange: "9-11", location: "Firewatch Island" },
      { title: "The Styes", order: 8, levelRange: "11-12", location: "The Styes" },
    ],
    saltmarshEncounters()
  ),

  makeTemplate(
    "The Wild Beyond the Witchlight",
    "WBtW",
    "A whimsical Feywild adventure through a traveling carnival and a fractured fairytale realm. Combat is optional — every problem has a clever solution.",
    [
      { title: "The Witchlight Carnival", order: 1, levelRange: "1-2", location: "Witchlight Carnival" },
      { title: "Hither", order: 2, levelRange: "2-4", location: "Hither, Prismeer" },
      { title: "Thither", order: 3, levelRange: "4-6", location: "Thither, Prismeer" },
      { title: "Yon", order: 4, levelRange: "6-7", location: "Yon, Prismeer" },
      { title: "Palace of Heart's Desire", order: 5, levelRange: "7-8", location: "Palace of Heart's Desire" },
    ],
    wbtwEncounters()
  ),

  makeTemplate(
    "Waterdeep: Dungeon of the Mad Mage",
    "WDMM",
    "The massive 23-level mega-dungeon of Undermountain beneath Waterdeep, created by the mad mage Halaster Blackcloak. A complete dungeon-crawl campaign from 5th to 20th level.",
    [
      { title: "Dungeon Level", order: 1, levelRange: "5-6", location: "Undermountain Level 1" },
      { title: "Arcane Chambers", order: 2, levelRange: "6-7", location: "Undermountain Level 2" },
      { title: "Sargauth Level", order: 3, levelRange: "7-8", location: "Undermountain Level 3" },
      { title: "Skullport", order: 4, levelRange: "8-9", location: "Skullport" },
      { title: "Wyllowwood", order: 5, levelRange: "9-10", location: "Undermountain Level 5" },
      { title: "Lost Level", order: 6, levelRange: "10-11", location: "Undermountain Level 6" },
      { title: "Maddgoth's Castle", order: 7, levelRange: "11-12", location: "Undermountain Level 7" },
      { title: "Slitherswamp", order: 8, levelRange: "12-13", location: "Undermountain Level 8" },
      { title: "Dweomercore", order: 9, levelRange: "13-14", location: "Undermountain Level 9" },
      { title: "Muirwoods", order: 10, levelRange: "14-15", location: "Undermountain Level 10-12" },
      { title: "Wraith Haunts", order: 11, levelRange: "15-16", location: "Undermountain Level 13-16" },
      { title: "The Terminus Level", order: 12, levelRange: "16-18", location: "Undermountain Level 17-20" },
      { title: "Shadowdusk Hold", order: 13, levelRange: "18-20", location: "Undermountain Level 21-23" },
    ],
    madMageEncounters()
  ),

  makeTemplate(
    "Icewind Dale: Rime of the Frostmaiden",
    "IDROTF",
    "Survival horror in the frozen north. The goddess Auril has cast Icewind Dale into perpetual winter, and heroes must brave the cold to end her reign.",
    [
      { title: "Ten-Towns", order: 1, levelRange: "1-4", location: "Ten-Towns, Icewind Dale" },
      { title: "Icewind Dale", order: 2, levelRange: "4", location: "Icewind Dale Wilderness" },
      { title: "Sunblight", order: 3, levelRange: "4-5", location: "Sunblight Fortress" },
      { title: "Destruction's Light", order: 4, levelRange: "6", location: "Ten-Towns" },
      { title: "Auril's Abode", order: 5, levelRange: "7", location: "Solstice, Auril's Island" },
      { title: "Caves of Hunger", order: 6, levelRange: "8", location: "Reghed Glacier" },
      { title: "Doom of Ythryn", order: 7, levelRange: "9-12", location: "Ythryn, Netherese Necropolis" },
    ],
    rimeEncounters()
  ),

  makeTemplate(
    "Baldur's Gate: Descent into Avernus",
    "BGDIA",
    "From the streets of Baldur's Gate to the first layer of the Nine Hells. Heroes must save the holy city of Elturel from eternal damnation.",
    [
      { title: "A Tale of Two Cities", order: 1, levelRange: "1-4", location: "Baldur's Gate" },
      { title: "Elturel Has Fallen", order: 2, levelRange: "4-6", location: "Elturel, Avernus" },
      { title: "Avernus", order: 3, levelRange: "6-10", location: "Avernus, Nine Hells" },
      { title: "Sword of Zariel", order: 4, levelRange: "10-12", location: "Avernus" },
      { title: "Escape from Avernus", order: 5, levelRange: "12-13", location: "Avernus" },
    ],
    bgdiaEncounters()
  ),

  makeTemplate(
    "Princes of the Apocalypse",
    "PotA",
    "Four elemental cults of Elemental Evil spread chaos across the Dessarin Valley. Heroes must infiltrate their strongholds and destroy the Elder Elemental Eye.",
    [
      { title: "Rise of Elemental Evil", order: 1, levelRange: "3-5", location: "Red Larch, Dessarin Valley" },
      { title: "The Dessarin Valley", order: 2, levelRange: "5-7", location: "Dessarin Valley" },
      { title: "Secret of the Sumber Hills", order: 3, levelRange: "7-10", location: "Sacred Stone Monastery, Haunted Keep" },
      { title: "Alarums and Excursions", order: 4, levelRange: "10-13", location: "Temple of the Elder Eye" },
      { title: "The Elder Elemental Eye", order: 5, levelRange: "13-15", location: "Elemental Nodes" },
    ],
    potaEncounters()
  ),

  makeTemplate(
    "Curse of the Crimson Throne",
    "CotCT",
    "Political upheaval and plague tear apart the city of Korvosa. Heroes fight to save the city from a tyrannical queen while surviving assassination, disease, and ancient evil.",
    [
      { title: "Edge of Anarchy", order: 1, levelRange: "1-3", location: "Korvosa" },
      { title: "Seven Days to the Grave", order: 2, levelRange: "3-6", location: "Korvosa" },
      { title: "Escape from Old Korvosa", order: 3, levelRange: "6-9", location: "Old Korvosa" },
      { title: "A History of Ashes", order: 4, levelRange: "9-11", location: "Cinderlands" },
      { title: "Skeletons of Scarwall", order: 5, levelRange: "11-14", location: "Scarwall Castle" },
      { title: "Crown of Fangs", order: 6, levelRange: "14-17", location: "Castle Korvosa" },
    ],
    cotctEncounters()
  ),

  makeTemplate(
    "Hell's Rebels",
    "HR",
    "The tyrant Barzillai Thrune seizes control of Kintargo. Heroes must build an underground resistance movement to liberate the city from diabolic oppression.",
    [
      { title: "In Hell's Bright Shadow", order: 1, levelRange: "1-3", location: "Kintargo" },
      { title: "Turn of the Torrent", order: 2, levelRange: "3-6", location: "Kintargo" },
      { title: "Dance of the Damned", order: 3, levelRange: "6-9", location: "Kintargo" },
      { title: "A Song of Silver", order: 4, levelRange: "9-12", location: "Kintargo" },
      { title: "A Hell of a Time", order: 5, levelRange: "12-15", location: "Hell" },
      { title: "Breaking the Bones of Hell", order: 6, levelRange: "15-17", location: "Kintargo, Hell" },
    ],
    hrEncounters()
  ),

  makeTemplate(
    "Red Hand of Doom",
    "RHoD",
    "A massive hobgoblin horde devoted to Tiamat marches on the Elsir Vale. Heroes must rally defenders and stop the Red Hand before they burn everything to ash.",
    [
      { title: "The Witchwood", order: 1, levelRange: "5-6", location: "Elsir Vale, Witchwood" },
      { title: "The Horde Grows", order: 2, levelRange: "6-7", location: "Elsir Vale" },
      { title: "Forging an Army", order: 3, levelRange: "7-8", location: "Elsir Vale" },
      { title: "The Battle of Brindol", order: 4, levelRange: "8-9", location: "Brindol" },
      { title: "Fane of Tiamat", order: 5, levelRange: "9-10", location: "Fane of Tiamat" },
    ],
    rhodEncounters()
  ),

  makeTemplate(
    "Candlekeep Mysteries",
    "CM",
    "Seventeen standalone mystery adventures, each triggered by a book discovered in the great library of Candlekeep. Covers levels 1-16.",
    [
      { title: "The Joy of Extradimensional Spaces", order: 1, levelRange: "1", location: "Candlekeep" },
      { title: "Mazfroth's Mighty Digressions", order: 2, levelRange: "2", location: "Candlekeep" },
      { title: "Book of the Raven", order: 3, levelRange: "2-3", location: "Shadowfell" },
      { title: "A Deep and Creeping Darkness", order: 4, levelRange: "4", location: "Mines of Dhol Kuldhir" },
      { title: "Shemshime's Bedtime Rhyme", order: 5, levelRange: "4", location: "Candlekeep" },
      { title: "The Price of Beauty", order: 6, levelRange: "5", location: "Temple of the All-Seeing Mirror" },
      { title: "Book of Cylinders", order: 7, levelRange: "6", location: "Candlekeep" },
      { title: "Sarah of Yellowcrest Manor", order: 8, levelRange: "7", location: "Yellowcrest Manor" },
      { title: "Lore of Lurue", order: 9, levelRange: "7", location: "Ilinvur" },
      { title: "Kandlekeep Dekonstruktion", order: 10, levelRange: "8", location: "Candlekeep" },
      { title: "Zikran's Zephyrean Tome", order: 11, levelRange: "10", location: "Zikran's Realm" },
      { title: "The Curious Tale of Wisteria Vale", order: 12, levelRange: "11", location: "Wisteria Vale" },
      { title: "The Canopic Being", order: 13, levelRange: "12", location: "Candlekeep" },
      { title: "The Book of Inner Alchemy", order: 14, levelRange: "13", location: "Candlekeep" },
      { title: "The Scrivener's Tale", order: 15, levelRange: "14", location: "Candlekeep" },
      { title: "Alkazaar's Appendix", order: 16, levelRange: "15", location: "Calimshan" },
      { title: "Xanthoria", order: 17, levelRange: "16", location: "Candlekeep" },
    ],
    candlekeepEncounters()
  ),

  makeTemplate(
    "Journeys Through the Radiant Citadel",
    "JttRC",
    "Thirteen culturally-inspired standalone adventures set across the multiverse, connected by the gemstone city of the Radiant Citadel. Levels 1-14.",
    [
      { title: "Salted Legacy", order: 1, levelRange: "1", location: "Kuwayba" },
      { title: "Written in Blood", order: 2, levelRange: "3", location: "Atagua" },
      { title: "The Fiend of Hollow Mine", order: 3, levelRange: "4", location: "Tletepec" },
      { title: "Wages of Vice", order: 4, levelRange: "5", location: "Zinda" },
      { title: "Sins of Our Elders", order: 5, levelRange: "6", location: "Siabsungkoh" },
      { title: "Gold for Fools and Princes", order: 6, levelRange: "7", location: "Iber" },
      { title: "Between Tangled Roots", order: 7, levelRange: "8", location: "Murann" },
      { title: "Shadow of the Sun", order: 8, levelRange: "9", location: "Akharin Sangar" },
      { title: "The Sun Trials", order: 9, levelRange: "10", location: "Atagua" },
      { title: "Buried Dynasty", order: 10, levelRange: "11", location: "Yeonido" },
      { title: "Song of Moonrise", order: 11, levelRange: "12", location: "Atagua" },
      { title: "In the Mists of Manivarsha", order: 12, levelRange: "13", location: "Manivarsha" },
      { title: "Orchids of the Invisible Mountain", order: 13, levelRange: "14", location: "Djaynai" },
    ],
    radiantCitadelEncounters()
  ),

  makeTemplate(
    "Keys from the Golden Vault",
    "KftGV",
    "Thirteen heist adventures across the D&D multiverse, commissioned by the mysterious Golden Vault. Each mission calls for cunning over brute force.",
    [
      { title: "The Murkmire Malevolence", order: 1, levelRange: "1", location: "Murkveil Museum" },
      { title: "The Stygian Gambit", order: 2, levelRange: "2", location: "Nine Hells Casino" },
      { title: "Reach for the Stars", order: 3, levelRange: "3", location: "Observatory" },
      { title: "Prisoner 13", order: 4, levelRange: "4", location: "Revel's End, Icewind Dale" },
      { title: "Masterpiece Imbroglio", order: 5, levelRange: "5", location: "Art Museum" },
      { title: "Affair on the Concordant Express", order: 6, levelRange: "5", location: "Astral Sea" },
      { title: "The Murkmire Malevolence Act II", order: 7, levelRange: "6", location: "Urban" },
      { title: "Vidorant's Vault", order: 8, levelRange: "7", location: "Thief's Vault" },
      { title: "Tockworth's Clockworks", order: 9, levelRange: "8", location: "Gnomish Workshop" },
      { title: "Shard of the Accursed", order: 10, levelRange: "8", location: "Arena" },
      { title: "Heart of Ashes", order: 11, levelRange: "9", location: "Cult Temple" },
      { title: "The Stygian Gambit Act II", order: 12, levelRange: "10", location: "Infernal" },
      { title: "Fire and Darkness", order: 13, levelRange: "11", location: "Efreeti Fortress" },
    ],
    goldenVaultEncounters()
  ),

  makeTemplate(
    "Tales from the Yawning Portal",
    "TftYP",
    "Seven legendary dungeons from D&D's history updated for 5th edition — from the Sunless Citadel to the dreaded Tomb of Horrors.",
    [
      { title: "The Sunless Citadel", order: 1, levelRange: "1-3", location: "Sunless Citadel" },
      { title: "The Forge of Fury", order: 2, levelRange: "3-5", location: "Stone Tooth Mountain" },
      { title: "The Hidden Shrine of Tamoachan", order: 3, levelRange: "5-8", location: "Tamoachan" },
      { title: "White Plume Mountain", order: 4, levelRange: "8-9", location: "White Plume Mountain" },
      { title: "Dead in Thay", order: 5, levelRange: "9-11", location: "Doomvault, Thay" },
      { title: "Against the Giants", order: 6, levelRange: "11-13", location: "Giant Strongholds" },
      { title: "Tomb of Horrors", order: 7, levelRange: "13+", location: "Tomb of Horrors" },
    ],
    yawningPortalEncounters()
  ),

  makeTemplate(
    "Age of Worms",
    "AoW",
    "Graverobbers to world saviors — twelve-part 3.5e epic in which heroes uncover a conspiracy to bring about the Age of Worms, ushering in the death god Kyuss.",
    [
      { title: "The Whispering Cairn", order: 1, levelRange: "1-3", location: "Diamond Lake" },
      { title: "The Three Faces of Evil", order: 2, levelRange: "3-4", location: "Whispering Cairn Region" },
      { title: "Encounter at Cromm's Hold", order: 3, levelRange: "5-6", location: "Greyhawk Surrounds" },
      { title: "The Hall of Harsh Reflections", order: 4, levelRange: "7-8", location: "Free City of Greyhawk" },
      { title: "The Champion's Belt", order: 5, levelRange: "9-10", location: "Free City of Greyhawk" },
      { title: "A Gathering of Winds", order: 6, levelRange: "11-12", location: "Mage's Tomb" },
      { title: "The Spire of Long Shadows", order: 7, levelRange: "13-15", location: "Spire of Long Shadows" },
      { title: "The Tyrant of Mintarn", order: 8, levelRange: "15-16", location: "Mintarn" },
      { title: "The Library of Last Resort", order: 9, levelRange: "16-18", location: "Dragotha's Lair" },
      { title: "Kings of the Rift", order: 10, levelRange: "18-19", location: "The Rift" },
      { title: "Into the Wormcrawl Fissure", order: 11, levelRange: "19-20", location: "Wormcrawl Fissure" },
      { title: "Dawn of a New Age", order: 12, levelRange: "20+", location: "Alhaster" },
    ],
    aowEncounters()
  ),

  makeTemplate(
    "Planescape: Turn of Fortune's Wheel",
    "TotFW",
    "Reality-bending mysteries in Sigil, the City of Doors. Heroes discover they keep reincarnating and must uncover why — a journey across the Outlands to the Spire itself.",
    [
      { title: "Beginning of the End", order: 1, levelRange: "3-4", location: "Sigil" },
      { title: "Fortune Favors the Bold", order: 2, levelRange: "4-5", location: "Sigil" },
      { title: "Into the Outlands", order: 3, levelRange: "5-6", location: "Outlands" },
      { title: "Automata — Recalibration", order: 4, levelRange: "6", location: "Automata" },
      { title: "Curst — Invisible Bonds", order: 5, levelRange: "6-7", location: "Curst" },
      { title: "Excelsior — Lost Souls", order: 6, levelRange: "7", location: "Excelsior" },
      { title: "Faunel — Vicious Alliances", order: 7, levelRange: "7-8", location: "Faunel" },
      { title: "Glorium — Heroes of the Day", order: 8, levelRange: "8", location: "Glorium" },
      { title: "Rigus — Eternity's Rampart", order: 9, levelRange: "8-9", location: "Rigus" },
      { title: "Sylvania — Titan on the Town", order: 10, levelRange: "9-10", location: "Sylvania" },
      { title: "Outlands Explorations", order: 11, levelRange: "9-10", location: "Outlands" },
      { title: "Secrets of the Spire", order: 12, levelRange: "10", location: "Spire of the Outlands" },
      { title: "Behind the Wheel", order: 13, levelRange: "10", location: "Beyond the Spire" },
      { title: "Echoes of Delusion", order: 14, levelRange: "17", location: "Multiverse" },
    ],
    totfwEncounters()
  ),

  makeTemplate(
    "Dragonlance: Shadow of the Dragon Queen",
    "DSotDQ",
    "War comes to Krynn. Heroes fight alongside the Knights of Solamnia to defend the city of Kalaman against the Dragon Armies during the legendary War of the Lance.",
    [
      { title: "Preludes", order: 1, levelRange: "1", location: "Vogler" },
      { title: "Onslaught", order: 2, levelRange: "1-3", location: "Vogler, Solamnia" },
      { title: "Destinies Entwined", order: 3, levelRange: "3-5", location: "Solamnic Plains" },
      { title: "In the Ruins of Kalaman", order: 4, levelRange: "5-7", location: "Kalaman" },
      { title: "Seeking the Starfall", order: 5, levelRange: "7-9", location: "Dread Marsh" },
      { title: "Shadow of the Dragon Queen", order: 6, levelRange: "9-10", location: "Kalaman Surrounds" },
      { title: "Flames of War", order: 7, levelRange: "10-11", location: "Kalaman" },
    ],
    dsotdqEncounters()
  ),

  makeTemplate(
    "Empire of the Ghouls",
    "EotG",
    "Six-chapter 5e campaign descending from the streets of Zobeck to the Ghoul Imperium in the Underworld. Heroes must stop an undead empire from conquering the world.",
    [
      { title: "The Spite House", order: 1, levelRange: "1-3", location: "Zobeck" },
      { title: "The Cult Exposed", order: 2, levelRange: "3-5", location: "Zobeck, Huldramose" },
      { title: "Desert Bones", order: 3, levelRange: "5-7", location: "Siwal" },
      { title: "Into the Underdark", order: 4, levelRange: "7-9", location: "Underworld" },
      { title: "The Ghoul City", order: 5, levelRange: "9-11", location: "Vendekhul" },
      { title: "Heart of the Empire", order: 6, levelRange: "11-13", location: "Ghoul Imperium" },
    ],
    eotgEncounters()
  ),

  makeTemplate(
    "Phandelver and Below: The Shattered Obelisk",
    "PaBtSO",
    "An expanded take on Lost Mine of Phandelver that continues into a cosmic horror storyline. Heroes must stop a mind flayer plot threatening Phandalin and the world.",
    [
      { title: "Goblins at the Gates", order: 1, levelRange: "1-2", location: "Goblin Ambush, Triboar Trail" },
      { title: "Trouble in Phandalin", order: 2, levelRange: "2-3", location: "Phandalin" },
      { title: "The Spider's Web", order: 3, levelRange: "3-4", location: "Cragmaw Castle" },
      { title: "Wave Echo Cave", order: 4, levelRange: "4-5", location: "Wave Echo Cave" },
      { title: "Paths of the Dead", order: 5, levelRange: "5-6", location: "Phandalin Surrounds" },
      { title: "The Shattered Obelisk", order: 6, levelRange: "6-8", location: "Talhundereth" },
      { title: "Into the Underdark", order: 7, levelRange: "8-10", location: "Underdark" },
      { title: "The Netherese Obelisk", order: 8, levelRange: "10-12", location: "Illithinoch" },
    ],
    pabtsoEncounters()
  ),

  makeTemplate(
    "The Temple of Elemental Evil",
    "ToEE",
    "The prototypical mega-dungeon campaign. Heroes defend the village of Hommlet and plunge into the depths of the Temple to stop the demoness Zuggtmoy.",
    [
      { title: "The Village of Hommlet", order: 1, levelRange: "1-2", location: "Hommlet" },
      { title: "The Moathouse", order: 2, levelRange: "2-4", location: "Moathouse Ruins" },
      { title: "The Village of Nulb", order: 3, levelRange: "4-5", location: "Nulb" },
      { title: "The Temple First Level", order: 4, levelRange: "5-6", location: "Temple of Elemental Evil" },
      { title: "The Temple Dungeon Levels", order: 5, levelRange: "6-9", location: "Temple Dungeons" },
      { title: "The Elemental Nodes", order: 6, levelRange: "9-11", location: "Elemental Nodes" },
    ],
    toeeEncounters()
  ),

  makeTemplate(
    "Keep on the Borderlands",
    "B2",
    "The foundational sandbox adventure. Heroes base themselves at a frontier keep and explore the Caves of Chaos, a lair complex teeming with evil humanoids.",
    [
      { title: "The Keep", order: 1, levelRange: "1", location: "Keep on the Borderlands" },
      { title: "The Wilderness", order: 2, levelRange: "1-2", location: "Borderlands" },
      { title: "Caves of Chaos", order: 3, levelRange: "1-3", location: "Caves of Chaos" },
    ],
    b2Encounters()
  ),

  makeTemplate(
    "Kingmaker",
    "KM",
    "Conquer the untamed Stolen Lands and forge a kingdom from the wilderness. An epic hexcrawl adventure path combining dungeon crawling with kingdom building.",
    [
      { title: "Stolen Land", order: 1, levelRange: "1-5", location: "Stolen Lands, Brevoy" },
      { title: "Rivers Run Red", order: 2, levelRange: "5-8", location: "Stolen Lands Kingdom" },
      { title: "The Varnhold Vanishing", order: 3, levelRange: "8-10", location: "Varnhold" },
      { title: "Blood for Blood", order: 4, levelRange: "10-12", location: "Tiger Lords Territory" },
      { title: "War of the River Kings", order: 5, levelRange: "12-15", location: "River Kingdoms" },
      { title: "Sound of a Thousand Screams", order: 6, levelRange: "15-20", location: "First World" },
    ],
    kingmakerEncounters()
  ),

  makeTemplate(
    "Wrath of the Righteous",
    "WotR",
    "A mythic crusade against demonic hordes pouring from the Worldwound. Heroes ascend to mythic power to lead armies and close the planar rift forever.",
    [
      { title: "The Worldwound Incursion", order: 1, levelRange: "1-4", location: "Kenabres, Worldwound" },
      { title: "Sword of Valor", order: 2, levelRange: "4-8", location: "Drezen" },
      { title: "Demon's Heresy", order: 3, levelRange: "8-11", location: "Midnight Isles Approach" },
      { title: "The Midnight Isles", order: 4, levelRange: "11-14", location: "Midnight Isles, Abyss" },
      { title: "Herald of the Ivory Labyrinth", order: 5, levelRange: "14-17", location: "Abyss" },
      { title: "City of Locusts", order: 6, levelRange: "17-20", location: "Iz, Worldwound" },
    ],
    wrathOfTheRighteousEncounters()
  ),

  makeTemplate(
    "The Dark of Hot Springs Island",
    "HotSI",
    "A system-neutral faction-driven hexcrawl set on a remote volcanic island. Multiple factions compete for magical resources in a richly detailed sandbox.",
    [
      { title: "Arrival at Hot Springs Island", order: 1, levelRange: "4-5", location: "Hot Springs Island Coast" },
      { title: "The Elemental Factions", order: 2, levelRange: "4-6", location: "Hot Springs Island" },
      { title: "The Ancient Ruins", order: 3, levelRange: "5-7", location: "Shasarazade Ruins" },
      { title: "The Efreeti Stronghold", order: 4, levelRange: "6-8", location: "Sulfur Springs Fortress" },
    ]
  ),

  makeTemplate(
    "Points of Light",
    "PoL",
    "The classic 4th edition heroic-to-epic adventure arc through the dark world of the Nentir Vale — from the Keep on the Shadowfell to the Pyramid of Shadows.",
    [
      { title: "Keep on the Shadowfell", order: 1, levelRange: "1-3", location: "Winterhaven, Shadowfell Keep" },
      { title: "Thunderspire Labyrinth", order: 2, levelRange: "4-6", location: "Thunderspire Mountain" },
      { title: "Pyramid of Shadows", order: 3, levelRange: "7-10", location: "Pyramid of Shadows" },
    ]
  ),

  makeTemplate(
    "The Lost City",
    "B4",
    "A psychedelic buried pyramid adventure for Basic D&D. Heroes descend into the city of Cynidicea, battling monster-filled dungeon levels and warring masked cults.",
    [
      { title: "The Desert Journey", order: 1, levelRange: "1", location: "Desert" },
      { title: "The Pyramid Exterior", order: 2, levelRange: "1-2", location: "Lost City Pyramid" },
      { title: "The Upper Pyramid Levels", order: 3, levelRange: "2-3", location: "Pyramid Interior" },
      { title: "The Lower City of Cynidicea", order: 4, levelRange: "3", location: "Cynidicea" },
    ]
  ),

  makeTemplate(
    "Dungeons of Drakkenheim",
    "DoDrak",
    "A meteor struck the city of Drakkenheim fifteen years ago, unleashing arcane chaos. Five factions fight over the ruins and the dangerous delerium crystals within.",
    [
      { title: "Introduction to Drakkenheim", order: 1, levelRange: "1-2", location: "Drakkenheim Outskirts" },
      { title: "The Outer City", order: 2, levelRange: "2-4", location: "Outer Drakkenheim" },
      { title: "Faction Intrigue", order: 3, levelRange: "4-6", location: "Drakkenheim" },
      { title: "Inside the Walls", order: 4, levelRange: "6-8", location: "Inner Drakkenheim" },
      { title: "Heart of Chaos", order: 5, levelRange: "8-10", location: "Crater District" },
      { title: "The Cathedral", order: 6, levelRange: "10-11", location: "Cathedral of Saint Vitruvio" },
      { title: "The Cosmos Shrine", order: 7, levelRange: "11-13", location: "Cosmos Shrine" },
    ],
    dodrakEncounters()
  ),

  makeTemplate(
    "Savage Tide",
    "ST",
    "From city thieves to planar pirates — twelve-part 3.5e epic spanning from the city of Sasserine to the Isle of Dread and the Abyss itself.",
    [
      { title: "There Is No Honor", order: 1, levelRange: "1-3", location: "Sasserine" },
      { title: "The Bullywug Gambit", order: 2, levelRange: "3-5", location: "Sasserine" },
      { title: "The Sea Wyvern's Wake", order: 3, levelRange: "5-7", location: "Trackless Sea" },
      { title: "Here There Be Monsters", order: 4, levelRange: "7-9", location: "Isle of Dread" },
      { title: "Tides of Dread", order: 5, levelRange: "9-11", location: "Isle of Dread" },
      { title: "The Lightless Depths", order: 6, levelRange: "11-13", location: "Isle of Dread Underdark" },
      { title: "City of Broken Idols", order: 7, levelRange: "13-15", location: "Thanaclan" },
      { title: "Serpents of Scuttlecove", order: 8, levelRange: "15-16", location: "Scuttlecove" },
      { title: "Into the Maw", order: 9, levelRange: "16-17", location: "Abyss" },
      { title: "Wells of Darkness", order: 10, levelRange: "18-19", location: "Wells of Darkness, Abyss" },
      { title: "Enemies of My Enemy", order: 11, levelRange: "19-20", location: "Abyss" },
      { title: "Prince of Demons", order: 12, levelRange: "20", location: "Gaping Maw, Abyss" },
    ]
  ),

  makeTemplate(
    "Night Below: An Underdark Campaign",
    "NB",
    "A sweeping 2nd edition Underdark campaign. Heroes investigate kidnappings that pull them into the vast underworld, culminating in a final battle in the Sunless Sea.",
    [
      { title: "The Evils of Haranshire", order: 1, levelRange: "1-5", location: "Haranshire" },
      { title: "Perils of the Underdark", order: 2, levelRange: "5-10", location: "Underdark" },
      { title: "The Sunless Sea", order: 3, levelRange: "10-14", location: "Sunless Sea, Underdark" },
    ]
  ),

  makeTemplate(
    "Return to the Temple of Elemental Evil",
    "RttToEE",
    "A 3rd edition sequel to the classic. The Elder Elemental Eye cult has rebuilt its power in the Crater Ridge Mines. Heroes must stop the summoning of an Elemental Prince.",
    [
      { title: "Hommlet and Surrounds", order: 1, levelRange: "4-6", location: "Hommlet" },
      { title: "Rastor and the Crater Ridge Mines", order: 2, levelRange: "6-9", location: "Crater Ridge Mines" },
      { title: "The Inner Temple", order: 3, levelRange: "9-11", location: "Temple of All-Consumption" },
      { title: "The Fire Node", order: 4, levelRange: "11-14", location: "Fire Node" },
    ],
    rtteeEncounters()
  ),

  makeTemplate(
    "Desert of Desolation",
    "I3-5",
    "An Arabian-nights trilogy across sun-scorched deserts and ancient pharaoh tombs. Three modules — Pharaoh, Oasis of the White Palm, and Lost Tomb of Martek.",
    [
      { title: "Pharaoh", order: 1, levelRange: "5-7", location: "Desert of Desolation" },
      { title: "Oasis of the White Palm", order: 2, levelRange: "7-9", location: "Desert Oasis" },
      { title: "Lost Tomb of Martek", order: 3, levelRange: "9-10", location: "Tomb of Martek" },
    ]
  ),

  makeTemplate(
    "Queen of the Spiders",
    "GDQ1-7",
    "The legendary 1st edition supermodule linking the Against the Giants and Drow series. From giant steading to the depths of the Underdark and the Abyss itself.",
    [
      { title: "Steading of the Hill Giant Chief", order: 1, levelRange: "8-9", location: "Hill Giant Steading" },
      { title: "Glacial Rift of the Frost Giant Jarl", order: 2, levelRange: "9-10", location: "Frost Giant Glacial Rift" },
      { title: "Hall of the Fire Giant King", order: 3, levelRange: "10-11", location: "Fire Giant Hall" },
      { title: "Descent into the Depths of the Earth", order: 4, levelRange: "10-11", location: "Underdark" },
      { title: "Shrine of the Kuo-Toa", order: 5, levelRange: "11-12", location: "Underdark" },
      { title: "Vault of the Drow", order: 6, levelRange: "12-13", location: "Erelhei-Cinlu" },
      { title: "Queen of the Demonweb Pits", order: 7, levelRange: "13-14", location: "Demonweb Pits, Abyss" },
    ],
    qotsEncounters()
  ),

  makeTemplate(
    "Against the Cult of the Reptile God",
    "N1",
    "A low-level mystery module for novice adventurers. The village of Orlane is gripped by a sinister cult. Heroes must investigate before the whole town falls under its sway.",
    [
      { title: "Orlane Village Investigation", order: 1, levelRange: "1-2", location: "Orlane" },
      { title: "Trail to the Lair", order: 2, levelRange: "2-3", location: "Wilderness" },
      { title: "Lair of the Reptile God", order: 3, levelRange: "3", location: "Dungeon Lair" },
    ],
    n1Encounters()
  ),

  makeTemplate(
    "Spelljammer: Light of Xaryxis",
    "LoX",
    "A Flash Gordon-style space opera across the stars. Heroes must save their world from being drained of life by the Xaryxian Empire — twelve fast-paced episodes.",
    [
      { title: "Part 1: Wildspace", order: 1, levelRange: "5-6", location: "Wildspace" },
      { title: "Part 2: The Astral Sea", order: 2, levelRange: "6", location: "Astral Sea" },
      { title: "Part 3: The Xaryxian Empire", order: 3, levelRange: "6-7", location: "Xaryxian Empire" },
      { title: "Part 4: The Light of Xaryxis", order: 4, levelRange: "7-8", location: "Xaryxis" },
    ],
    loxEncounters()
  ),

  makeTemplate(
    "Scarlet Citadel",
    "SC",
    "A classic-style mega-dungeon from Kobold Press. The Scarlet Citadel is a living dungeon with evolving factions, strange ecosystems, and deadly secrets over ten levels.",
    [
      { title: "The Ruined Keep", order: 1, levelRange: "1-2", location: "Redtower, Scarlet Citadel" },
      { title: "The Upper Dungeons", order: 2, levelRange: "2-4", location: "Scarlet Citadel" },
      { title: "The Arcane Scriptorium", order: 3, levelRange: "4-5", location: "Scarlet Citadel" },
      { title: "The Dwarf Barracks", order: 4, levelRange: "5-6", location: "Scarlet Citadel" },
      { title: "The Middle Depths", order: 5, levelRange: "6-7", location: "Scarlet Citadel" },
      { title: "The Deep Dungeons", order: 6, levelRange: "7-8", location: "Scarlet Citadel" },
      { title: "The Prison Warrens", order: 7, levelRange: "8-9", location: "Scarlet Citadel" },
      { title: "The Sunken Vaults", order: 8, levelRange: "9-10", location: "Scarlet Citadel" },
    ],
    scEncounters()
  ),

  makeTemplate(
    "Courts of the Shadow Fey",
    "CotSF",
    "Political intrigue and danger in the Shadow Fey court. The Queen of Night and Magic has claimed a city, and only heroes who can navigate the deadly fey courts can save it.",
    [
      { title: "Arrival in the Shadow Realm", order: 1, levelRange: "7-8", location: "Shadow Roads" },
      { title: "The Outer Courts", order: 2, levelRange: "8-9", location: "Courts of the Shadow Fey" },
      { title: "The Inner Sanctum", order: 3, levelRange: "9-10", location: "Courts of the Shadow Fey" },
      { title: "The Queen's Gambit", order: 4, levelRange: "10-11", location: "Palace of the Queen of Night" },
    ],
    cotsfEncounters()
  ),

  makeTemplate(
    "Vault of the Drow",
    "D3",
    "The third module of the classic Drow series. Heroes infiltrate the vast underground vault of the drow city of Erelhei-Cinlu to complete their mission against Lolth.",
    [
      { title: "The Vault Approaches", order: 1, levelRange: "10-11", location: "Underdark" },
      { title: "The Fungi Forest", order: 2, levelRange: "11-12", location: "Vault of the Drow" },
      { title: "Erelhei-Cinlu", order: 3, levelRange: "12-13", location: "Erelhei-Cinlu" },
      { title: "The Fane of Lolth", order: 4, levelRange: "13-14", location: "Temple of Lolth" },
    ],
    d3Encounters()
  ),

  makeTemplate(
    "Tyranny of Dragons",
    "ToD",
    "The Cult of the Dragon seeks to free Tiamat from the Nine Hells. A two-volume campaign spanning the Sword Coast, from cult raids to a climactic battle at the Well of Dragons.",
    [
      { title: "Episode 1: Greenest in Flames", order: 1, levelRange: "1-2", location: "Greenest" },
      { title: "Episode 2: Raiders' Camp", order: 2, levelRange: "2-3", location: "Cult Raider Camp" },
      { title: "Episode 3: Dragon Hatchery", order: 3, levelRange: "3", location: "Dreaming Cave" },
      { title: "Episode 4: On the Road", order: 4, levelRange: "3-4", location: "Sword Coast Road" },
      { title: "Episode 5: Construction Ahead", order: 5, levelRange: "4", location: "Carnath Roadhouse" },
      { title: "Episode 6: Castle Naerytar", order: 6, levelRange: "4-5", location: "Castle Naerytar" },
      { title: "Episode 7: Hunting Lodge", order: 7, levelRange: "5", location: "Hunting Lodge" },
      { title: "Episode 8: Castle in the Clouds", order: 8, levelRange: "5-7", location: "Cloud Giant Castle" },
      { title: "Episode 9: Mission to Thay", order: 9, levelRange: "8-9", location: "Thay" },
      { title: "Episode 10: The Sea of Moving Ice", order: 10, levelRange: "9-10", location: "Sea of Moving Ice" },
      { title: "Episode 11: Xonthal's Tower", order: 11, levelRange: "10-11", location: "Xonthal's Tower" },
      { title: "Episode 12: The Factions Unite", order: 12, levelRange: "11-13", location: "Waterdeep" },
      { title: "Episode 13: The Well of Dragons", order: 13, levelRange: "13-15", location: "Well of Dragons" },
    ],
    todEncounters()
  ),

  makeTemplate(
    "Expedition to the Barrier Peaks",
    "S3",
    "A crashed spaceship in the Barrier Peaks blends fantasy and science fiction. Heroes explore a wrecked spacecraft filled with malfunctioning robots, alien creatures, and futuristic tech.",
    [
      { title: "Outer Decks", order: 1, levelRange: "8-9", location: "Crashed Spaceship" },
      { title: "Crew Quarters", order: 2, levelRange: "9-10", location: "Spaceship Interior" },
      { title: "The Lounge and Gardens", order: 3, levelRange: "10", location: "Spaceship Interior" },
      { title: "Activity Deck", order: 4, levelRange: "10-11", location: "Spaceship Interior" },
      { title: "Lower Engineering", order: 5, levelRange: "11", location: "Spaceship Interior" },
      { title: "The Bridge", order: 6, levelRange: "11-12", location: "Spaceship Bridge" },
    ]
  ),

  makeTemplate(
    "Return to the Tomb of Horrors",
    "RttToH",
    "A massive 2e expansion of the original death-trap dungeon. The archlich Acererak has returned and built an entire city around the original Tomb. Three interlinked campaigns in one box.",
    [
      { title: "The Tomb of Horrors", order: 1, levelRange: "13-14", location: "Tomb of Horrors" },
      { title: "The City That Waits", order: 2, levelRange: "14-15", location: "Moil, the City That Waits" },
      { title: "Fortress of Conclusion", order: 3, levelRange: "15-16", location: "Fortress of Conclusion" },
    ],
    rtohEncounters()
  ),

  makeTemplate(
    "The Shackled City",
    "SCAP",
    "A city-based 3.5e epic entirely set in the volcanic city of Cauldron. From slave-thief investigations to planar conspiracy — twelve chapters from 1st to 20th level.",
    [
      { title: "Life's Bazaar", order: 1, levelRange: "1-3", location: "Cauldron" },
      { title: "Drakthar's Way", order: 2, levelRange: "3-4", location: "Cauldron Undercity" },
      { title: "Flood Season", order: 3, levelRange: "4-6", location: "Cauldron" },
      { title: "The Demonskar Legacy", order: 4, levelRange: "6-8", location: "Cauldron Surrounds" },
      { title: "Test of the Smoking Eye", order: 5, levelRange: "8-9", location: "Abyss" },
      { title: "Secrets of the Soul Pillars", order: 6, levelRange: "9-11", location: "Cauldron" },
      { title: "Lords of Oblivion", order: 7, levelRange: "11-13", location: "Cauldron" },
      { title: "Foundations of Flame", order: 8, levelRange: "13-14", location: "Undercauldron" },
      { title: "Thirteen Cages", order: 9, levelRange: "14-16", location: "Plague Lands" },
      { title: "Strike on Shatterhorn", order: 10, levelRange: "16-17", location: "Shatterhorn" },
      { title: "Zenith Trajectory", order: 11, levelRange: "17-19", location: "Occipitus, Abyss" },
      { title: "Asylum", order: 12, levelRange: "19-20", location: "Cauldron" },
    ],
    scapEncounters()
  ),

  makeTemplate(
    "Reavers of Harkenwold",
    "RoH",
    "A 4th edition rebellion adventure. The Iron Circle has seized the Harkenwold villages and heroes must rally the people, forge alliances, and drive out the invaders.",
    [
      { title: "Road to Adventure", order: 1, levelRange: "2", location: "Harkenwold Road" },
      { title: "Opening Salvos", order: 2, levelRange: "2-3", location: "Harkenwold" },
      { title: "Gathering Allies", order: 3, levelRange: "3", location: "Harkenwold" },
      { title: "Battle of Albridge", order: 4, levelRange: "3-4", location: "Albridge" },
      { title: "Iron Keep", order: 5, levelRange: "4", location: "Iron Keep" },
    ]
  ),

  makeTemplate(
    "Dragon of Icespire Peak",
    "DIP",
    "A quest-board sandbox adventure from the D&D Essentials Kit. A young white dragon has driven monsters from the Sword Mountains, threatening the town of Phandalin.",
    [
      { title: "Phandalin Job Board (Tier 1)", order: 1, levelRange: "1-2", location: "Phandalin" },
      { title: "Mid-Range Quests", order: 2, levelRange: "3-4", location: "Sword Coast Frontier" },
      { title: "Advanced Quests", order: 3, levelRange: "4-5", location: "Sword Mountains" },
      { title: "Icespire Hold", order: 4, levelRange: "6-7", location: "Icespire Hold" },
    ],
    dipEncounters()
  ),

  makeTemplate(
    "Vecna: Eve of Ruin",
    "VEoR",
    "D&D's 50th anniversary adventure. The archlich Vecna plots to remake reality. Heroes must travel the multiverse collecting the Rod of Seven Parts before he can destroy existence.",
    [
      { title: "Return from Neverdeath Graveyard", order: 1, levelRange: "10-12", location: "Neverwinter, Evernight" },
      { title: "The Wizards Three", order: 2, levelRange: "12-13", location: "Sigil" },
      { title: "The Lambent Zenith's Last Voyage", order: 3, levelRange: "13-14", location: "Astral Sea, Spelljammer" },
      { title: "The Ruined Colossus", order: 4, levelRange: "14-15", location: "Mount Ironrot, Eberron" },
      { title: "Death House", order: 5, levelRange: "15-16", location: "Barovia, Ravenloft" },
      { title: "Night of Blue Fire", order: 6, levelRange: "15-16", location: "Krynn, Dragonlance" },
      { title: "Tomb of Wayward Souls", order: 7, levelRange: "16-17", location: "Oerth, Greyhawk" },
      { title: "The Dragon Queen's Pride", order: 8, levelRange: "17-18", location: "Avernus, Nine Hells" },
      { title: "The Betrayer Revealed", order: 9, levelRange: "17-18", location: "Pandesmos, Abyss" },
      { title: "The War of Pandesmos", order: 10, levelRange: "18-19", location: "Pandesmos, Abyss" },
      { title: "Eve of Ruin", order: 11, levelRange: "19-20", location: "Vecna's Domain, multiverse" },
    ],
    vecnaEncounters()
  ),
];

export async function seedCampaignTemplates(options: { force?: boolean } = {}): Promise<{ inserted: number; skipped: number; updated: number }> {
  const db = await getDatabase();
  const collection = db.collection<CampaignTemplate>("campaignTemplates");

  console.log(`Seeding ${CAMPAIGN_CATALOG.length} campaign templates...`);

  let inserted = 0;
  let skipped = 0;
  let updated = 0;

  for (const template of CAMPAIGN_CATALOG) {
    const existing = await collection.findOne({
      name: template.name,
      userId: GLOBAL_USER_ID,
    });

    if (existing) {
      if (options.force) {
        await collection.updateOne(
          { name: template.name, userId: GLOBAL_USER_ID },
          { $set: template },
          { upsert: true }
        );
        console.log(`  Force updated: ${template.name}`);
        updated++;
      } else {
        console.log(`  Skipping (exists): ${template.name}`);
        skipped++;
      }
      continue;
    }

    await collection.insertOne(template as CampaignTemplate & { _id?: unknown });
    console.log(`  Inserted: ${template.name}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
  return { inserted, skipped, updated };
}

export async function runCli(): Promise<void> {
  const force = process.argv.includes("--force");
  await seedCampaignTemplates({ force });
  process.exit(0);
}

export function handleCliError(error: unknown): never {
  console.error("Seed failed:", error);
  process.exit(1);
}

/* istanbul ignore next */
if (require.main === module) {
  runCli().catch(handleCliError);
}
