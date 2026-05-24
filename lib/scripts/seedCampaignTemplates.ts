import { getDatabase } from "../db";
import { CampaignTemplate, CampaignChapter } from "../types";
import { GLOBAL_USER_ID } from "../constants";
import { randomUUID } from "crypto";

const now = new Date();

function makeTemplate(
  name: string,
  moduleName: string,
  description: string,
  chapters: Omit<CampaignChapter, "id">[]
): CampaignTemplate {
  return {
    id: randomUUID(),
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    name,
    moduleName,
    description,
    chapters: chapters.map((ch) => ({ ...ch, id: randomUUID() })),
    createdAt: now,
    updatedAt: now,
  };
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  ),

  makeTemplate(
    "Keep on the Borderlands",
    "B2",
    "The foundational sandbox adventure. Heroes base themselves at a frontier keep and explore the Caves of Chaos, a lair complex teeming with evil humanoids.",
    [
      { title: "The Keep", order: 1, levelRange: "1", location: "Keep on the Borderlands" },
      { title: "The Wilderness", order: 2, levelRange: "1-2", location: "Borderlands" },
      { title: "Caves of Chaos", order: 3, levelRange: "1-3", location: "Caves of Chaos" },
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  ),

  makeTemplate(
    "Against the Cult of the Reptile God",
    "N1",
    "A low-level mystery module for novice adventurers. The village of Orlane is gripped by a sinister cult. Heroes must investigate before the whole town falls under its sway.",
    [
      { title: "Orlane Village Investigation", order: 1, levelRange: "1-2", location: "Orlane" },
      { title: "Trail to the Lair", order: 2, levelRange: "2-3", location: "Wilderness" },
      { title: "Lair of the Reptile God", order: 3, levelRange: "3", location: "Dungeon Lair" },
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  ),

  makeTemplate(
    "Vecna: Eve of Ruin",
    "VEoR",
    "D&D's 50th anniversary adventure. The archlich Vecna plots to remake reality. Heroes must travel the multiverse collecting the Rod of Seven Parts before he can destroy existence.",
    [
      { title: "The Lich Rises", order: 1, levelRange: "10-12", location: "Neverwinter, Evernight" },
      { title: "The Wizards Three", order: 2, levelRange: "12-13", location: "Sigil" },
      { title: "Tomb of Mordenkainen", order: 3, levelRange: "13-14", location: "Forgotten Realms" },
      { title: "Aboard the Plaguewrought", order: 4, levelRange: "14-15", location: "Eberron" },
      { title: "A Land of War", order: 5, levelRange: "15-16", location: "Krynn, Dragonlance" },
      { title: "The Living City", order: 6, levelRange: "16-18", location: "Greyhawk" },
      { title: "The Citadel of Vecna", order: 7, levelRange: "18-20", location: "Vecna's Domain" },
    ]
  ),
];

async function seedCampaignTemplates(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<CampaignTemplate>("campaignTemplates");

  console.log(`Seeding ${CAMPAIGN_CATALOG.length} campaign templates...`);

  let inserted = 0;
  let skipped = 0;

  for (const template of CAMPAIGN_CATALOG) {
    const existing = await collection.findOne({
      name: template.name,
      userId: GLOBAL_USER_ID,
    });

    if (existing) {
      console.log(`  Skipping (exists): ${template.name}`);
      skipped++;
      continue;
    }

    await collection.insertOne(template as CampaignTemplate & { _id?: unknown });
    console.log(`  Inserted: ${template.name}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

seedCampaignTemplates()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
