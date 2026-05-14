import { useEffect, useState } from "react";
import "./App.css";

type DatabaseCharacter = {
  id: number;
  source_id: string;
  name: string;
  element: string;
  weapon_type: string;
  rarity: number;
  base_hp: number;
  base_atk: number;
  base_def: number;
  crit_rate: string;
  crit_dmg: string;
  icon_url: string;
  portrait_url: string;
  updated_at: string;
};

type CharacterBuild = {
  name: string;
  element: string;
  role: string;
  iconUrl?: string;
  weapon: {
    name: string;
    level: number;
    refinement: number;
  };
  artifacts: {
    set: string;
    mainStats: string;
  };
  stats: {
    hp: number;
    atk: number;
    def: number;
    critRate: number;
    critDmg: number;
    er: number;
    em: number;
  };
};

const placeholderTeam: CharacterBuild[] = [
  {
    name: "Empty Slot",
    element: "-",
    role: "Select character",
    weapon: {
      name: "No weapon selected",
      level: 1,
      refinement: 1,
    },
    artifacts: {
      set: "No artifacts selected",
      mainStats: "-",
    },
    stats: {
      hp: 0,
      atk: 0,
      def: 0,
      critRate: 5,
      critDmg: 50,
      er: 100,
      em: 0,
    },
  },
  {
    name: "Empty Slot",
    element: "-",
    role: "Select character",
    weapon: {
      name: "No weapon selected",
      level: 1,
      refinement: 1,
    },
    artifacts: {
      set: "No artifacts selected",
      mainStats: "-",
    },
    stats: {
      hp: 0,
      atk: 0,
      def: 0,
      critRate: 5,
      critDmg: 50,
      er: 100,
      em: 0,
    },
  },
  {
    name: "Empty Slot",
    element: "-",
    role: "Select character",
    weapon: {
      name: "No weapon selected",
      level: 1,
      refinement: 1,
    },
    artifacts: {
      set: "No artifacts selected",
      mainStats: "-",
    },
    stats: {
      hp: 0,
      atk: 0,
      def: 0,
      critRate: 5,
      critDmg: 50,
      er: 100,
      em: 0,
    },
  },
  {
    name: "Empty Slot",
    element: "-",
    role: "Select character",
    weapon: {
      name: "No weapon selected",
      level: 1,
      refinement: 1,
    },
    artifacts: {
      set: "No artifacts selected",
      mainStats: "-",
    },
    stats: {
      hp: 0,
      atk: 0,
      def: 0,
      critRate: 5,
      critDmg: 50,
      er: 100,
      em: 0,
    },
  },
];

function mapDatabaseCharacterToBuild(character: DatabaseCharacter): CharacterBuild {
  return {
    name: character.name,
    element: character.element,
    role: "Support",
    iconUrl: character.icon_url
      ? `https://api.lunaris.moe/data/assets/avataricon/${character.icon_url}.webp`
      : undefined,
    weapon: {
      name: "No weapon selected",
      level: 90,
      refinement: 1,
    },
    artifacts: {
      set: "No artifacts selected",
      mainStats: "Coming later",
    },
    stats: {
      hp: character.base_hp,
      atk: character.base_atk,
      def: character.base_def,
      critRate: Number(character.crit_rate),
      critDmg: Number(character.crit_dmg),
      er: 100,
      em: 0,
    },
  };
}

function CharacterCard({ character }: { character: CharacterBuild }) {
  return (
    <section className="character-card">
      <div className="portrait-placeholder">
        {character.iconUrl ? (
          <img
            src={character.iconUrl}
            alt={character.name}
            className="character-portrait"
          />
        ) : (
          character.name.charAt(0)
        )}
      </div>

      <h2>{character.name}</h2>
      <p className="subtext">
        {character.element} • {character.role}
      </p>

      <div className="card-section">
        <h3>Weapon</h3>
        <p>{character.weapon.name}</p>
        <span>
          Lv. {character.weapon.level} / R{character.weapon.refinement}
        </span>
      </div>

      <div className="card-section">
        <h3>Artifacts</h3>
        <p>{character.artifacts.set}</p>
        <span>{character.artifacts.mainStats}</span>
      </div>

      <div className="card-section stats">
        <h3>Stats</h3>
        <StatRow label="Base HP" value={character.stats.hp.toString()} />
        <StatRow label="Base ATK" value={character.stats.atk.toString()} />
        <StatRow label="Base DEF" value={character.stats.def.toString()} />
        <StatRow label="CRIT Rate" value={`${character.stats.critRate}%`} />
        <StatRow label="CRIT DMG" value={`${character.stats.critDmg}%`} />
        <StatRow label="ER" value={`${character.stats.er}%`} />
        <StatRow label="EM" value={character.stats.em.toString()} />
      </div>
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  const [team, setTeam] = useState<CharacterBuild[]>(placeholderTeam);

  useEffect(() => {
    fetch("http://localhost:3000/characters")
      .then((res) => res.json())
      .then((data: DatabaseCharacter[]) => {
        const importedCharacters = data.map(mapDatabaseCharacterToBuild);
        const nextTeam = [...placeholderTeam];

        importedCharacters.slice(0, 4).forEach((character, index) => {
          nextTeam[index] = character;
        });

        setTeam(nextTeam);
      })
      .catch((error) => console.error("Failed to fetch characters:", error));
  }, []);

  return (
    <main className="app">
      <header className="page-header">
        <div>
          <h1>Genshin DPS Calculator</h1>
          <p>Team build overview</p>
        </div>
      </header>

      <section className="team-grid">
        {team.map((character, index) => (
          <CharacterCard key={`${character.name}-${index}`} character={character} />
        ))}
      </section>

      <section className="results-panel">
        <h2>Damage Results</h2>
        <div className="result-grid">
          <div>
            <span>Total Rotation Damage</span>
            <strong>Coming soon</strong>
          </div>
          <div>
            <span>Rotation Time</span>
            <strong>Coming soon</strong>
          </div>
          <div>
            <span>DPS</span>
            <strong>Coming soon</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;