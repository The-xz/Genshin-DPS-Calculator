import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const API_VERSION = "6.5.54.2";
const LANGUAGE = "en";

const DEFAULT_CHARACTER_IDS = [
  "10000032", // Bennett
  // add more IDs here later
];

function mapRarity(rarity: string): number | null {
  if (rarity === "QUALITY_ORANGE") return 5;
  if (rarity === "QUALITY_PURPLE") return 4;
  return null;
}

function mapWeaponType(weapon: string): string {
  const weaponMap: Record<string, string> = {
    WEAPON_SWORD_ONE_HAND: "Sword",
    WEAPON_CLAYMORE: "Claymore",
    WEAPON_POLE: "Polearm",
    WEAPON_CATALYST: "Catalyst",
    WEAPON_BOW: "Bow",
  };

  return weaponMap[weapon] ?? weapon;
}

function getEnv() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
    throw new Error("Missing database environment variables");
  }

  return {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT,
  };
}

async function importCharacter(connection: mysql.Connection, characterId: string) {
  const url = `https://api.lunaris.moe/data/${API_VERSION}/${LANGUAGE}/char/${characterId}.json`;

  console.log(`Fetching ${characterId}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch character ${characterId}: ${response.status}`);
  }

  const data = await response.json();

  const level90Stats = data.info.attributes.find(
    (entry: any) => entry.level === 90 && entry.ascension === 6
  );

  if (!level90Stats) {
    throw new Error(`Could not find level 90 stats for ${characterId}`);
  }

  const character = {
    source_id: characterId,
    name: data.info.name,
    element: data.info.element,
    weapon_type: mapWeaponType(data.info.weapon),
    rarity: mapRarity(data.info.rarity),
    base_hp: level90Stats.hp,
    base_atk: level90Stats.atk,
    base_def: level90Stats.def,
    crit_rate: 5,
    crit_dmg: 50,
    icon_url: data.icons?.forward ?? null,
    portrait_url: data.icons?.coop_img ?? null,
    raw_json: JSON.stringify(data),
  };

  await connection.execute(
    `
    INSERT INTO characters (
      source_id,
      name,
      element,
      weapon_type,
      rarity,
      base_hp,
      base_atk,
      base_def,
      crit_rate,
      crit_dmg,
      icon_url,
      portrait_url,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      element = VALUES(element),
      weapon_type = VALUES(weapon_type),
      rarity = VALUES(rarity),
      base_hp = VALUES(base_hp),
      base_atk = VALUES(base_atk),
      base_def = VALUES(base_def),
      crit_rate = VALUES(crit_rate),
      crit_dmg = VALUES(crit_dmg),
      icon_url = VALUES(icon_url),
      portrait_url = VALUES(portrait_url),
      raw_json = VALUES(raw_json)
    `,
    [
      character.source_id,
      character.name,
      character.element,
      character.weapon_type,
      character.rarity,
      character.base_hp,
      character.base_atk,
      character.base_def,
      character.crit_rate,
      character.crit_dmg,
      character.icon_url,
      character.portrait_url,
      character.raw_json,
    ]
  );

  console.log(`Imported ${character.name}`);
}

async function main() {
  const env = getEnv();

  const characterIdsFromCommand = process.argv.slice(2);

  const characterIds =
    characterIdsFromCommand.length > 0
      ? characterIdsFromCommand
      : DEFAULT_CHARACTER_IDS;

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT),
  });

  for (const characterId of characterIds) {
    await importCharacter(connection, characterId);
  }

  await connection.end();

  console.log("Done importing characters.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});