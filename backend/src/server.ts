import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Genshin DPS Calculator backend is running");
});

app.get("/characters", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
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
        updated_at
      FROM characters
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

app.get("/weapons", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        source_id,
        name,
        weapon_type,
        rarity,
        base_atk,
        substat_type,
        substat_value,
        icon_url,
        updated_at
      FROM weapons
    `);

  app.get("/artifact-sets", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        source_id,
        name,
        rarity,
        two_piece_bonus,
        four_piece_bonus,
        icon_url,
        updated_at
      FROM artifact_sets
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch artifact sets" });
  }
});

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch weapons" });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});