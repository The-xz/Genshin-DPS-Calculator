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

type DatabaseWeapon = {
  id: number;
  source_id: string;
  name: string;
  weapon_type: string;
  rarity: number;
  base_atk: number;
  substat_type: string;
  substat_value: string;
  icon_url: string;
  updated_at: string;
};

type DatabaseArtifactSet = {
  id: number;
  source_id: string;
  name: string;
  rarity: number;
  two_piece_bonus: string;
  four_piece_bonus: string;
  icon_url: string;
  updated_at: string;
};

type ArtifactSlot = "Flower" | "Plume" | "Sands" | "Goblet" | "Circlet";

type EquippedArtifact = {
  slot: ArtifactSlot;
  selectedSet?: DatabaseArtifactSet;
};

type CharacterBuild = {
  name: string;
  element: string;
  role: string;
  iconUrl?: string;
  weaponType: string;
  selectedWeapon?: DatabaseWeapon;
  artifacts: EquippedArtifact[];
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

function createDefaultArtifacts(): EquippedArtifact[] {
  return [
    { slot: "Flower" },
    { slot: "Plume" },
    { slot: "Sands" },
    { slot: "Goblet" },
    { slot: "Circlet" },
  ];
}

const placeholderTeam: CharacterBuild[] = Array.from({ length: 4 }, () => ({
  name: "Empty Slot",
  element: "-",
  role: "Select character",
  weaponType: "-",
  selectedWeapon: undefined,
  artifacts: createDefaultArtifacts(),
  stats: {
    hp: 0,
    atk: 0,
    def: 0,
    critRate: 5,
    critDmg: 50,
    er: 100,
    em: 0,
  },
}));

function mapDatabaseCharacterToBuild(character: DatabaseCharacter): CharacterBuild {
  return {
    name: character.name,
    element: character.element,
    role: "Support",
    iconUrl: character.icon_url
      ? `https://api.lunaris.moe/data/assets/avataricon/${character.icon_url}.webp`
      : undefined,
    weaponType: character.weapon_type,
    selectedWeapon: undefined,
    artifacts: createDefaultArtifacts(),
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

function getActiveArtifactBonuses(artifacts: EquippedArtifact[]) {
  const setCounts = new Map<
    string,
    {
      set: DatabaseArtifactSet;
      count: number;
    }
  >();

  artifacts.forEach((artifact) => {
    if (!artifact.selectedSet) return;

    const existing = setCounts.get(artifact.selectedSet.source_id);

    if (existing) {
      existing.count += 1;
    } else {
      setCounts.set(artifact.selectedSet.source_id, {
        set: artifact.selectedSet,
        count: 1,
      });
    }
  });

  return Array.from(setCounts.values()).filter(({ count }) => count >= 2);
}

function CharacterCard({
  character,
  weapons,
  artifactSets,
  onWeaponChange,
  onArtifactChange,
}: {
  character: CharacterBuild;
  weapons: DatabaseWeapon[];
  artifactSets: DatabaseArtifactSet[];
  onWeaponChange: (weaponId: string) => void;
  onArtifactChange: (slot: ArtifactSlot, artifactSetId: string) => void;
}) {
  const compatibleWeapons = weapons.filter(
    (weapon) => weapon.weapon_type === character.weaponType
  );

  const activeArtifactBonuses = getActiveArtifactBonuses(character.artifacts);

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

        {character.name !== "Empty Slot" ? (
          <>
            <select
              className="weapon-select"
              value={character.selectedWeapon?.source_id ?? ""}
              onChange={(event) => onWeaponChange(event.target.value)}
            >
              <option value="">No weapon selected</option>

              {compatibleWeapons.map((weapon) => (
                <option key={weapon.source_id} value={weapon.source_id}>
                  {weapon.name}
                </option>
              ))}
            </select>

            {character.selectedWeapon ? (
              <div className="weapon-preview">
                <img
                  src={`https://api.lunaris.moe/data/assets/weaponicon/${character.selectedWeapon.icon_url}.webp`}
                  alt={character.selectedWeapon.name}
                  className="weapon-icon"
                />

                <div>
                  <p>{character.selectedWeapon.name}</p>
                  <span>
                    Base ATK {character.selectedWeapon.base_atk} •{" "}
                    {character.selectedWeapon.substat_type}{" "}
                    {character.selectedWeapon.substat_value}
                  </span>
                </div>
              </div>
            ) : (
              <span>No weapon selected</span>
            )}
          </>
        ) : (
          <>
            <p>No weapon selected</p>
            <span>-</span>
          </>
        )}
      </div>

      <div className="card-section">
        <h3>Artifacts</h3>

        {character.name !== "Empty Slot" ? (
          <>
            <div className="artifact-list">
              {character.artifacts.map((artifact) => (
                <div className="artifact-row" key={artifact.slot}>
                  <span className="artifact-slot">{artifact.slot}</span>
                  <div className="artifact-picker">
                    <div className="artifact-icon-box">
                      {artifact.selectedSet ? (
                        <img
                          src={`https://api.lunaris.moe/data/assets/artifacts/${artifact.selectedSet.icon_url}.webp`}
                          alt={artifact.selectedSet.name}
                          className="artifact-icon"
                        />
                      ) : (
                        <span>-</span>
                      )}
                    </div>

                    <select
                      className="artifact-select"
                      value={artifact.selectedSet?.source_id ?? ""}
                      onChange={(event) =>
                        onArtifactChange(artifact.slot, event.target.value)
                      }
                    >
                      <option value="">No set</option>

                      {artifactSets.map((set) => (
                        <option key={set.source_id} value={set.source_id}>
                          {set.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="artifact-bonuses">
              <h4>Active Bonuses</h4>

              {activeArtifactBonuses.length > 0 ? (
                activeArtifactBonuses.map(({ set, count }) => (
                  <div className="artifact-bonus" key={set.source_id}>
                    <strong>
                      {set.name} x{count}
                    </strong>

                    {count >= 2 && <span>2pc: {set.two_piece_bonus}</span>}
                    {count >= 4 && <span>4pc: {set.four_piece_bonus}</span>}
                  </div>
                ))
              ) : (
                <span>No active set bonuses</span>
              )}
            </div>
          </>
        ) : (
          <>
            <p>No artifacts selected</p>
            <span>-</span>
          </>
        )}
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
  const [weapons, setWeapons] = useState<DatabaseWeapon[]>([]);
  const [artifactSets, setArtifactSets] = useState<DatabaseArtifactSet[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [charactersResponse, weaponsResponse, artifactSetsResponse] =
          await Promise.all([
            fetch("http://localhost:3000/characters"),
            fetch("http://localhost:3000/weapons"),
            fetch("http://localhost:3000/artifact-sets"),
          ]);

        const charactersData: DatabaseCharacter[] =
          await charactersResponse.json();

        const weaponsData: DatabaseWeapon[] = await weaponsResponse.json();

        const artifactSetsData: DatabaseArtifactSet[] =
          await artifactSetsResponse.json();

        setWeapons(weaponsData);
        setArtifactSets(artifactSetsData);

        const importedCharacters = charactersData.map(
          mapDatabaseCharacterToBuild
        );

        const nextTeam = [...placeholderTeam];

        importedCharacters.slice(0, 4).forEach((character, index) => {
          nextTeam[index] = character;
        });

        setTeam(nextTeam);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    loadData();
  }, []);

  function handleWeaponChange(characterIndex: number, weaponId: string) {
    setTeam((currentTeam) =>
      currentTeam.map((character, index) => {
        if (index !== characterIndex) return character;

        const selectedWeapon = weapons.find(
          (weapon) => weapon.source_id === weaponId
        );

        return {
          ...character,
          selectedWeapon,
        };
      })
    );
  }

  function handleArtifactChange(
    characterIndex: number,
    slot: ArtifactSlot,
    artifactSetId: string
  ) {
    setTeam((currentTeam) =>
      currentTeam.map((character, index) => {
        if (index !== characterIndex) return character;

        const selectedSet = artifactSets.find(
          (set) => set.source_id === artifactSetId
        );

        return {
          ...character,
          artifacts: character.artifacts.map((artifact) =>
            artifact.slot === slot ? { ...artifact, selectedSet } : artifact
          ),
        };
      })
    );
  }

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
          <CharacterCard
            key={`${character.name}-${index}`}
            character={character}
            weapons={weapons}
            artifactSets={artifactSets}
            onWeaponChange={(weaponId) => handleWeaponChange(index, weaponId)}
            onArtifactChange={(slot, artifactSetId) =>
              handleArtifactChange(index, slot, artifactSetId)
            }
          />
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