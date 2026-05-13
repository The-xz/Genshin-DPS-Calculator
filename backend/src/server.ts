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
    const [rows] = await db.query("SELECT * FROM characters");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});