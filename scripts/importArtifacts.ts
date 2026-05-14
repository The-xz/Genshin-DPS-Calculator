import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const API_VERSION = "6.5.54.2";
const LANGUAGE = "en";

const DEFAULT_ARTIFACT_IDS = [
  "15037", // Scroll of the Hero of Cinder City
];

function mapRarity(rarity: string): number | null {
  if (rarity === "QUALITY_ORANGE") return 5;
  if (rarity === "QUALITY_PURPLE") return 4;
  if (rarity === "QUALITY_BLUE") return 3;
  if (rarity === "QUALITY_GREEN") return 2;
  if (rarity === "QUALITY_WHITE") return 1;
  return null;
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

async function importArtifactSet(
  connection: mysql.Connection,
  artifactId: string
) {
  const url = `https://api.lunaris.moe/data/${API_VERSION}/${LANGUAGE}/artifact/${artifactId}.json`;

  console.log(`Fetching artifact set ${artifactId}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch artifact set ${artifactId}: ${response.status}`);
  }

  const data = await response.json();

  const artifactSet = {
    source_id: artifactId,
    name: data.info.setName,
    rarity: mapRarity(data.info.qualityType),
    two_piece_bonus: data.info.setBonuses?.["2pc"] ?? null,
    four_piece_bonus: data.info.setBonuses?.["4pc"] ?? null,
    icon_url: data.info.setIcon ?? null,
    raw_json: JSON.stringify(data),
  };

  await connection.execute(
    `
    INSERT INTO artifact_sets (
      source_id,
      name,
      rarity,
      two_piece_bonus,
      four_piece_bonus,
      icon_url,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      rarity = VALUES(rarity),
      two_piece_bonus = VALUES(two_piece_bonus),
      four_piece_bonus = VALUES(four_piece_bonus),
      icon_url = VALUES(icon_url),
      raw_json = VALUES(raw_json)
    `,
    [
      artifactSet.source_id,
      artifactSet.name,
      artifactSet.rarity,
      artifactSet.two_piece_bonus,
      artifactSet.four_piece_bonus,
      artifactSet.icon_url,
      artifactSet.raw_json,
    ]
  );

  console.log(`Imported artifact set: ${artifactSet.name}`);
}

async function main() {
  const env = getEnv();

  const artifactIdsFromCommand = process.argv.slice(2);

  const artifactIds =
    artifactIdsFromCommand.length > 0
      ? artifactIdsFromCommand
      : DEFAULT_ARTIFACT_IDS;

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT),
  });

  for (const artifactId of artifactIds) {
    try {
      await importArtifactSet(connection, artifactId);
    } catch (error) {
      console.error(`Failed to import artifact set ${artifactId}:`, error);
    }
  }

  await connection.end();

  console.log("Done importing artifact sets.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});