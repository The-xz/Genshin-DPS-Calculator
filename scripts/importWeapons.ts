import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const API_VERSION = "6.5.54.2";
const LANGUAGE = "en";

const DEFAULT_WEAPON_IDS = [
  "11501", // Aquila Favonia
];

function mapRarity(rarity: string): number | null {
  if (rarity === "QUALITY_ORANGE") return 5;
  if (rarity === "QUALITY_PURPLE") return 4;
  if (rarity === "QUALITY_BLUE") return 3;
  if (rarity === "QUALITY_GREEN") return 2;
  if (rarity === "QUALITY_WHITE") return 1;
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

function getWeaponLevel90Stats(stats: Record<string, Record<string, number>>) {
  const level90Stats = stats["90"];

  if (!level90Stats) {
    throw new Error("Could not find level 90 weapon stats");
  }

  const baseAtk = level90Stats.atk;

  const substatEntry = Object.entries(level90Stats).find(
    ([key]) => key !== "atk"
  );

  return {
    baseAtk,
    substatType: substatEntry?.[0] ?? null,
    substatValue: substatEntry?.[1] ?? null,
  };
}

async function importWeapon(connection: mysql.Connection, weaponId: string) {
  const url = `https://api.lunaris.moe/data/${API_VERSION}/${LANGUAGE}/weapon/${weaponId}.json`;

  console.log(`Fetching weapon ${weaponId}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch weapon ${weaponId}: ${response.status}`);
  }

  const data = await response.json();

  const level90Stats = getWeaponLevel90Stats(data.stats);

  const weapon = {
    source_id: weaponId,
    name: data.name,
    weapon_type: mapWeaponType(data.weaponType),
    rarity: mapRarity(data.qualityType),
    base_atk: level90Stats.baseAtk,
    substat_type: level90Stats.substatType,
    substat_value: level90Stats.substatValue,
    icon_url: data.weaponIcon ?? null,
    raw_json: JSON.stringify(data),
  };

  await connection.execute(
    `
    INSERT INTO weapons (
      source_id,
      name,
      weapon_type,
      rarity,
      base_atk,
      substat_type,
      substat_value,
      icon_url,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      weapon_type = VALUES(weapon_type),
      rarity = VALUES(rarity),
      base_atk = VALUES(base_atk),
      substat_type = VALUES(substat_type),
      substat_value = VALUES(substat_value),
      icon_url = VALUES(icon_url),
      raw_json = VALUES(raw_json)
    `,
    [
      weapon.source_id,
      weapon.name,
      weapon.weapon_type,
      weapon.rarity,
      weapon.base_atk,
      weapon.substat_type,
      weapon.substat_value,
      weapon.icon_url,
      weapon.raw_json,
    ]
  );

  console.log(`Imported weapon: ${weapon.name}`);
}

async function main() {
  const env = getEnv();

  const weaponIdsFromCommand = process.argv.slice(2);

  const weaponIds =
    weaponIdsFromCommand.length > 0 ? weaponIdsFromCommand : DEFAULT_WEAPON_IDS;

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT),
  });

  for (const weaponId of weaponIds) {
    try {
      await importWeapon(connection, weaponId);
    } catch (error) {
      console.error(`Failed to import weapon ${weaponId}:`, error);
    }
  }

  await connection.end();

  console.log("Done importing weapons.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});