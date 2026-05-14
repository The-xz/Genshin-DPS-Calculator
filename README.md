# Genshin DPS Calculator

A school project aiming to create an easy-to-use DPS/DMG calculator for Genshin Impact.

The project uses a local MySQL database to store character information, a TypeScript/Express backend API, and a React frontend for displaying team builds and calculated stats.

## Current Features

- Local MySQL database setup
- Express + TypeScript backend
- React + TypeScript frontend
- Character data imported from Lunaris
- Character cards displayed in a 4-character team layout
- Character base stats shown:
  - Base HP
  - Base ATK
  - Base DEF
  - CRIT Rate
  - CRIT DMG
  - Energy Recharge
  - Elemental Mastery
- Character icons loaded from Lunaris assets

## Current Tech Stack

- React
- TypeScript
- Vite
- Node.js
- Express
- MySQL
- mysql2
- dotenv
- tsx

## Project Structure

```txt
Genshin-DPS-Calculator/
├── backend/
│   └── src/
│       ├── db.ts
│       └── server.ts
├── frontend/
│   └── src/
│       ├── App.tsx
│       └── App.css
├── scripts/
│   ├── importBennett.ts
│   └── importCharacters.ts
├── .env.example
├── package.json
└── README.md
```

## Local Setup

### 1. Install Dependencies

From the root folder:

```bash
npm install
```

Then install frontend dependencies:

```bash
cd frontend
npm install
```

### 2. Create the MySQL Database

Create a local MySQL database named:

```sql
CREATE DATABASE genshin_dps_calculator;
```

Create a MySQL user for the app:

```sql
CREATE USER 'genshin_app'@'localhost' IDENTIFIED BY 'your_password_here';

GRANT ALL PRIVILEGES ON genshin_dps_calculator.* TO 'genshin_app'@'localhost';

FLUSH PRIVILEGES;
```

### 3. Create the Characters Table

```sql
USE genshin_dps_calculator;

CREATE TABLE characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  element VARCHAR(50),
  weapon_type VARCHAR(50),
  rarity INT,
  base_hp INT,
  base_atk INT,
  base_def INT,
  crit_rate DECIMAL(5,2),
  crit_dmg DECIMAL(5,2),
  icon_url TEXT,
  portrait_url TEXT,
  raw_json JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4. Create `.env`

Create a `.env` file in the root folder:

```env
DB_HOST=localhost
DB_USER=genshin_app
DB_PASSWORD=your_password_here
DB_NAME=genshin_dps_calculator
DB_PORT=3306
PORT=3000
```

Do not commit `.env` to GitHub.

## Running the Project

### Start the Backend

From the root folder:

```bash
npm run dev
```

Backend runs on:

```txt
http://localhost:3000
```

Available endpoint:

```txt
GET /characters
```

### Start the Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

## Importing Characters

Characters can be imported from Lunaris by ID.

Example:

```bash
npm run import:characters -- 10000032 10000047 10000096 10000107
```

### Currently Tested Imports

- Bennett
- Kaedehara Kazuha
- Arlecchino
- Citlali

## Data Source

Character data and icons are imported from Lunaris:

```txt
https://api.lunaris.moe
```

Character icons use the asset path:

```txt
https://api.lunaris.moe/data/assets/avataricon/{icon_name}.webp
```

Example:

```txt
https://api.lunaris.moe/data/assets/avataricon/UI_AvatarIcon_Bennett.webp
```

## Planned Features

- Weapon database and import
- Artifact set database and import
- Character selector for each team slot
- Weapon selector
- Artifact selector
- Buff and team synergy system
- Damage formula calculations
- Rotation damage calculation
- DPS calculation
- Save/load builds
- Cleaner UI with character, weapon, and artifact images

## Disclaimer

This is an unofficial fan-made school project.

This project is not affiliated with, endorsed by, or sponsored by HoYoverse.

Genshin Impact names, characters, images, icons, and related assets belong to their respective owners.