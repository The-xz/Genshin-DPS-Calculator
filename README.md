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