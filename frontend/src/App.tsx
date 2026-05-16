import { useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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

type ArtifactSubstat = {
  type: string;
  value?: string;
};

type EquippedArtifact = {
  slot: ArtifactSlot;
  selectedSet?: DatabaseArtifactSet;
  mainStatType?: string;
  mainStatValue?: string;
  substats: ArtifactSubstat[];
};

type CharacterBuild = {
  selectedCharacterId?: string;
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

type TeamCollection = {
  id: string;
  name: string;
  team: CharacterBuild[];
  updatedAt: string;
};

const artifactStatOptions = [
  "HP",
  "HP%",
  "ATK",
  "ATK%",
  "DEF",
  "DEF%",
  "Elemental Mastery",
  "Energy Recharge%",
  "CRIT Rate%",
  "CRIT DMG%",
  "Pyro DMG Bonus%",
  "Hydro DMG Bonus%",
  "Cryo DMG Bonus%",
  "Electro DMG Bonus%",
  "Anemo DMG Bonus%",
  "Geo DMG Bonus%",
  "Dendro DMG Bonus%",
  "Physical DMG Bonus%",
  "Healing Bonus%",
];

function createDefaultArtifacts(): EquippedArtifact[] {
  return [
    {
      slot: "Flower",
      mainStatType: "HP",
      mainStatValue: "4780",
      substats: [],
    },
    {
      slot: "Plume",
      mainStatType: "ATK",
      mainStatValue: "311",
      substats: [],
    },
    { slot: "Sands", substats: [] },
    { slot: "Goblet", substats: [] },
    { slot: "Circlet", substats: [] },
  ];
}

const placeholderTeam: CharacterBuild[] = Array.from({ length: 4 }, () => ({
  selectedCharacterId: undefined,
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
    selectedCharacterId: character.source_id,
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

function getArtifactSummary(artifacts: EquippedArtifact[]) {
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

  return Array.from(setCounts.values());
}

function normalizeArtifactInput(value: string): string {
  const normalizedValue = value.replace(",", ".");

  // Allow empty input
  if (normalizedValue === "") return "";

  // Allow numbers like:
  // 5
  // 5.
  // 5.4
  // .4
  const isValidNumberInput = /^(\d+)?(\.)?(\d+)?$/.test(normalizedValue);

  if (!isValidNumberInput) {
    return "";
  }

  return normalizedValue;
}

function normalizeSavedArtifactValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;

  const normalizedValue = String(value).replace(",", ".");

  if (
    normalizedValue === "" ||
    normalizedValue === "NaN" ||
    normalizedValue === "null" ||
    normalizedValue === "undefined"
  ) {
    return undefined;
  }

  return normalizedValue;
}

function CharacterCard({
  character,
  characters,
  weapons,
  artifactSets,
  onCharacterChange,
  onWeaponChange,
  onArtifactChange,
  onArtifactMainStatChange,
  onArtifactSubstatChange,
}: {
  character: CharacterBuild;
  characters: DatabaseCharacter[];
  weapons: DatabaseWeapon[];
  artifactSets: DatabaseArtifactSet[];
  onCharacterChange: (characterId: string) => void;
  onWeaponChange: (weaponId: string) => void;
  onArtifactChange: (slot: ArtifactSlot, artifactSetId: string) => void;
  onArtifactMainStatChange: (
    slot: ArtifactSlot,
    mainStatType: string,
    mainStatValue: string | undefined
  ) => void;
  onArtifactSubstatChange: (
    slot: ArtifactSlot,
    substatIndex: number,
    type: string,
    value: string | undefined
  ) => void;
}) {
  const compatibleWeapons = weapons.filter(
    (weapon) => weapon.weapon_type === character.weaponType
  );

  const artifactSummary = getArtifactSummary(character.artifacts);

  const [isArtifactEditorOpen, setIsArtifactEditorOpen] = useState(false);

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
      <div className="character-selector">
        <select
          className="character-select"
          value={character.selectedCharacterId ?? ""}
          onChange={(event) => onCharacterChange(event.target.value)}
        >
          <option value="">Select character</option>

          {characters.map((availableCharacter) => (
            <option
              key={availableCharacter.source_id}
              value={availableCharacter.source_id}
            >
              {availableCharacter.name}
            </option>
          ))}
        </select>
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
            <div className="artifact-summary-list">
              {artifactSummary.length > 0 ? (
                artifactSummary.map(({ set, count }) => (
                  <div className="artifact-summary-item" key={set.source_id}>
                    <div className="artifact-summary-left">
                      <img
                        src={`https://api.lunaris.moe/data/assets/artifacts/${set.icon_url}.webp`}
                        alt={set.name}
                        className="artifact-summary-icon"
                      />

                      <div>
                        <strong>{set.name}</strong>
                        <span>
                          {count} piece{count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="artifact-summary-badges">
                      {count >= 2 && <span>2pc</span>}
                      {count >= 4 && <span>4pc</span>}
                    </div>
                  </div>
                ))
              ) : (
                <span>No artifacts selected</span>
              )}
            </div>

            <button
              type="button"
              className="artifact-editor-toggle"
              onClick={() => setIsArtifactEditorOpen((current) => !current)}
            >
              {isArtifactEditorOpen ? "Hide artifact editor" : "Edit artifacts"}
            </button>

            {isArtifactEditorOpen && (
              <div className="artifact-editor-panel">
                <div className="artifact-editor-bonuses">
                  {artifactSummary
                    .filter(({ count }) => count >= 2)
                    .map(({ set, count }) => (
                      <div className="artifact-editor-bonus" key={set.source_id}>
                        <strong>{set.name}</strong>

                        {count >= 2 && <span>2pc: {set.two_piece_bonus}</span>}
                        {count >= 4 && <span>4pc: {set.four_piece_bonus}</span>}
                      </div>
                    ))}
                </div>

                <div className="artifact-list">
                  {character.artifacts.map((artifact) => {
                    return (
                      <div
                        className="artifact-row"
                        key={artifact.slot}
                      >
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

                        <div className="artifact-stats-editor">
                          <div className="artifact-main-stat-row">
                            <select
                              className="artifact-stat-select"
                              value={artifact.mainStatType ?? ""}
                              disabled={artifact.slot === "Flower" || artifact.slot === "Plume"}
                              onChange={(event) =>
                                onArtifactMainStatChange(
                                  artifact.slot,
                                  event.target.value,
                                  artifact.mainStatValue
                                )
                              }
                            >
                              <option value="">Main stat</option>

                              {artifactStatOptions.map((stat) => (
                                <option key={stat} value={stat}>
                                  {stat}
                                </option>
                              ))}
                            </select>

                            <input
                              className="artifact-stat-input"
                              type="text"
                              inputMode="decimal"
                              value={artifact.mainStatValue ?? ""}
                              placeholder="Value"
                              disabled={artifact.slot === "Flower" || artifact.slot === "Plume"}
                              onChange={(event) => {
                                const nextValue = normalizeArtifactInput(event.target.value);

                                onArtifactMainStatChange(
                                  artifact.slot,
                                  artifact.mainStatType ?? "",
                                  nextValue === "" ? undefined : nextValue
                                );
                              }}
                            />
                          </div>

                          <div className="artifact-substats">
                            {[0, 1, 2, 3].map((substatIndex) => {
                              const substat = artifact.substats?.[substatIndex];

                              return (
                                <div className="artifact-substat-row" key={substatIndex}>
                                  <select
                                    className="artifact-stat-select"
                                    value={substat?.type ?? ""}
                                    onChange={(event) =>
                                      onArtifactSubstatChange(
                                        artifact.slot,
                                        substatIndex,
                                        event.target.value,
                                        substat?.value
                                      )
                                    }
                                  >
                                    <option value="">Substat</option>

                                    {artifactStatOptions.map((stat) => (
                                      <option key={stat} value={stat}>
                                        {stat}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    className="artifact-stat-input"
                                    type="text"
                                    inputMode="decimal"
                                    value={substat?.value ?? ""}
                                    placeholder="Value"
                                    onChange={(event) => {
                                      const nextValue = normalizeArtifactInput(event.target.value);

                                      onArtifactSubstatChange(
                                        artifact.slot,
                                        substatIndex,
                                        substat?.type ?? "",
                                        nextValue === "" ? undefined : nextValue
                                      );
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

function createEmptyTeam(): CharacterBuild[] {
  return Array.from({ length: 4 }, () => ({
    selectedCharacterId: undefined,
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
}

function createCollection(name: string): TeamCollection {
  return {
    id: crypto.randomUUID(),
    name,
    team: createEmptyTeam(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeTeam(team: CharacterBuild[]): CharacterBuild[] {
  return team.map((character) => ({
    ...character,
    artifacts: character.artifacts.map((artifact) => ({
      ...artifact,
      mainStatType:
        artifact.mainStatType ??
        (artifact.slot === "Flower"
          ? "HP"
          : artifact.slot === "Plume"
            ? "ATK"
            : undefined),
      mainStatValue:
        normalizeSavedArtifactValue(artifact.mainStatValue) ??
        (artifact.slot === "Flower"
          ? "4780"
          : artifact.slot === "Plume"
            ? "311"
            : undefined),
      substats: (artifact.substats ?? []).map((substat) => ({
        ...substat,
        value: normalizeSavedArtifactValue(substat.value),
      })),
    })),
  }));
}

function normalizeCollections(collections: TeamCollection[]): TeamCollection[] {
  return collections.map((collection) => ({
    ...collection,
    team: normalizeTeam(collection.team),
  }));
}

function App() {
  const [, setTeam] = useState<CharacterBuild[]>(placeholderTeam);
  const [characters, setCharacters] = useState<DatabaseCharacter[]>([]);
  const [weapons, setWeapons] = useState<DatabaseWeapon[]>([]);
  const [artifactSets, setArtifactSets] = useState<DatabaseArtifactSet[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collections, setCollections] = useState<TeamCollection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>("");
  const [openMenuCollectionId, setOpenMenuCollectionId] = useState<string | null>(null);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [openCollectionIds, setOpenCollectionIds] = useState<string[]>([]);
  const [collectionWidths, setCollectionWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedCollections = localStorage.getItem("genshin-dps-collections");

    if (savedCollections) {
      const parsedCollections: TeamCollection[] = normalizeCollections(
        JSON.parse(savedCollections)
      );

      setCollections(parsedCollections);

      if (parsedCollections.length > 0) {
        setActiveCollectionId(parsedCollections[0].id);
        setOpenCollectionIds([parsedCollections[0].id]);
        setTeam(parsedCollections[0].team);
      }

      return;
    }

    const firstCollection = createCollection("Current Team");

    setCollections([firstCollection]);
    setActiveCollectionId(firstCollection.id);
    setOpenCollectionIds([firstCollection.id]);
    setTeam(firstCollection.team);

    localStorage.setItem(
      "genshin-dps-collections",
      JSON.stringify([firstCollection])
    );
  }, []);

  useEffect(() => {
    if (collections.length === 0) return;

    localStorage.setItem(
      "genshin-dps-collections",
      JSON.stringify(collections)
    );
  }, [collections]);

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
        setCharacters(charactersData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    loadData();
  }, []);

  function handleOpenCollection(collectionId: string) {
    const collection = collections.find(
      (currentCollection) => currentCollection.id === collectionId
    );

    if (!collection) return;

    setActiveCollectionId(collection.id);
    setOpenCollectionIds([collection.id]);
    setTeam(collection.team);
    setOpenMenuCollectionId(null);
  }

  function handleOpenCollectionBeside(collectionId: string) {
    const collection = collections.find(
      (currentCollection) => currentCollection.id === collectionId
    );

    if (!collection) return;

    setOpenCollectionIds((currentIds) =>
      currentIds.includes(collectionId)
        ? currentIds
        : [...currentIds, collectionId]
    );

    setActiveCollectionId(collection.id);
    setTeam(collection.team);
    setOpenMenuCollectionId(null);
  }

  function handleCloseOpenCollection(collectionId: string) {
    const nextOpenIds = openCollectionIds.filter((id) => id !== collectionId);

    if (nextOpenIds.length === 0) {
      return;
    }

    setOpenCollectionIds(nextOpenIds);

    if (collectionId === activeCollectionId) {
      const nextActiveCollection = collections.find(
        (collection) => collection.id === nextOpenIds[0]
      );

      if (!nextActiveCollection) return;

      setActiveCollectionId(nextActiveCollection.id);
      setTeam(nextActiveCollection.team);
    }
  }

  function handleStartResizeCollection(
    event: ReactPointerEvent<HTMLDivElement>,
    collectionId: string
  ) {
    event.preventDefault();

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const startX = event.clientX;
    const currentWidth =
      collectionWidths[collectionId] ??
      event.currentTarget.parentElement?.getBoundingClientRect().width ??
      1200;

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      const nextWidth = Math.max(
        1050,
        Math.min(1800, currentWidth + moveEvent.clientX - startX)
      );

      setCollectionWidths((currentWidths) => ({
        ...currentWidths,
        [collectionId]: nextWidth,
      }));
    }

    function handlePointerUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handleStartRename(collection: TeamCollection) {
    setRenamingCollectionId(collection.id);
    setRenameValue(collection.name);
    setOpenMenuCollectionId(null);
  }

  function handleCollectionArtifactMainStatChange(
    collectionId: string,
    characterIndex: number,
    slot: ArtifactSlot,
    mainStatType: string,
    mainStatValue: string | undefined
  ) {
    const collection = collections.find(
      (currentCollection) => currentCollection.id === collectionId
    );

    if (!collection) return;

    const nextTeam = collection.team.map((character, index) => {
      if (index !== characterIndex) return character;

      return {
        ...character,
        artifacts: character.artifacts.map((artifact) =>
          artifact.slot === slot
            ? {
                ...artifact,
                mainStatType,
                mainStatValue,
              }
            : artifact
        ),
      };
    });

    setActiveCollectionId(collectionId);
    setTeam(nextTeam);
    updateCollectionTeam(collectionId, nextTeam);
  }

  function handleCollectionArtifactSubstatChange(
    collectionId: string,
    characterIndex: number,
    slot: ArtifactSlot,
    substatIndex: number,
    type: string,
    value: string | undefined
  ) {
    const collection = collections.find(
      (currentCollection) => currentCollection.id === collectionId
    );

    if (!collection) return;

    const nextTeam = collection.team.map((character, index) => {
      if (index !== characterIndex) return character;

      return {
        ...character,
        artifacts: character.artifacts.map((artifact) => {
          if (artifact.slot !== slot) return artifact;

          const nextSubstats = [...(artifact.substats ?? [])];

          nextSubstats[substatIndex] = {
            type,
            value,
          };

          return {
            ...artifact,
            substats: nextSubstats,
          };
        }),
      };
    });

    setActiveCollectionId(collectionId);
    setTeam(nextTeam);
    updateCollectionTeam(collectionId, nextTeam);
  }

  function handleFinishRename(collectionId: string) {
    handleRenameCollection(
      collectionId,
      renameValue.trim() || "Untitled Collection"
    );

    setRenamingCollectionId(null);
    setRenameValue("");
  }

  function handleDeleteCollection(collectionId: string) {
    const nextCollections = collections.filter(
      (collection) => collection.id !== collectionId
    );

    if (nextCollections.length === 0) {
      const newCollection = createCollection("Current Team");

      setCollections([newCollection]);
      setActiveCollectionId(newCollection.id);
      setOpenCollectionIds([newCollection.id]);
      setTeam(newCollection.team);
      setOpenMenuCollectionId(null);
      return;
    }

    setCollections(nextCollections);
    setOpenCollectionIds((currentIds) =>
      currentIds.filter((id) => id !== collectionId)
    );

    if (collectionId === activeCollectionId) {
      setActiveCollectionId(nextCollections[0].id);
      setOpenCollectionIds([nextCollections[0].id]);
      setTeam(nextCollections[0].team);
    }

    setOpenMenuCollectionId(null);
  }

  function updateCollectionTeam(collectionId: string, nextTeam: CharacterBuild[]) {
    setCollections((currentCollections) =>
      currentCollections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              team: nextTeam,
              updatedAt: new Date().toISOString(),
            }
          : collection
      )
    );

    if (collectionId === activeCollectionId) {
      setTeam(nextTeam);
    }
  }

  function handleCollectionCharacterChange(
    collectionId: string,
    characterIndex: number,
    characterId: string
  ) {
    const collection = collections.find(
      (currentCollection) => currentCollection.id === collectionId
    );

    if (!collection) return;

    const nextTeam = collection.team.map((character, index) => {
      if (index !== characterIndex) return character;

      const selectedCharacter = characters.find(
        (dbCharacter) => dbCharacter.source_id === characterId
      );

      if (!selectedCharacter) {
        return {
          selectedCharacterId: undefined,
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
        };
      }

      return mapDatabaseCharacterToBuild(selectedCharacter);
    });

    setActiveCollectionId(collectionId);
    setTeam(nextTeam);
    updateCollectionTeam(collectionId, nextTeam);
  }

  function handleCollectionWeaponChange(
    collectionId: string,
    characterIndex: number,
    weaponId: string
  ) {
    const collection = collections.find(
      (currentCollection) => currentCollection.id === collectionId
    );

    if (!collection) return;

    const nextTeam = collection.team.map((character, index) => {
      if (index !== characterIndex) return character;

      const selectedWeapon = weapons.find(
        (weapon) => weapon.source_id === weaponId
      );

      return {
        ...character,
        selectedWeapon,
      };
    });

    setActiveCollectionId(collectionId);
    setTeam(nextTeam);
    updateCollectionTeam(collectionId, nextTeam);
  }

  function handleCollectionArtifactChange(
    collectionId: string,
    characterIndex: number,
    slot: ArtifactSlot,
    artifactSetId: string
  ) {
    const collection = collections.find(
      (currentCollection) => currentCollection.id === collectionId
    );

    if (!collection) return;

    const nextTeam = collection.team.map((character, index) => {
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
    });

    setActiveCollectionId(collectionId);
    setTeam(nextTeam);
    updateCollectionTeam(collectionId, nextTeam);
  }

  function handleNewCollection() {
    const collectionName = `Collection ${collections.length + 1}`;
    const newCollection = createCollection(collectionName);

    setCollections((currentCollections) => [...currentCollections, newCollection]);
    setActiveCollectionId(newCollection.id);
    setOpenCollectionIds([newCollection.id]);
    setTeam(newCollection.team);
  }

  function handleRenameCollection(collectionId: string, newName: string) {
    setCollections((currentCollections) =>
      currentCollections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              name: newName || "Untitled Collection",
              updatedAt: new Date().toISOString(),
            }
          : collection
      )
    );
  }

  const openCollections = openCollectionIds
    .map((collectionId) =>
      collections.find((collection) => collection.id === collectionId)
    )
    .filter((collection): collection is TeamCollection => Boolean(collection));

  return (
    <main
      className={`app-shell ${
        isSidebarOpen ? "sidebar-open" : "sidebar-collapsed"
      }`}
    >
      <aside className="sidebar">
        <div className="sidebar-header">
          {isSidebarOpen && <h2>Collections</h2>}

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen((current) => !current)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? "←" : "→"}
          </button>
        </div>

        {isSidebarOpen ? (
          <>
            <button
              type="button"
              className="new-collection-button"
              onClick={handleNewCollection}
            >
              + New Collection
            </button>

            <div className="collection-list">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`collection-item ${
                    collection.id === activeCollectionId ? "active" : ""
                  }`}
                >
                  {renamingCollectionId === collection.id ? (
                    <input
                      className="collection-rename-input"
                      value={renameValue}
                      autoFocus
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={() => handleFinishRename(collection.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleFinishRename(collection.id);
                        }

                        if (event.key === "Escape") {
                          setRenamingCollectionId(null);
                          setRenameValue("");
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="collection-title-button"
                      onClick={() => handleOpenCollection(collection.id)}
                    >
                      {collection.name}
                    </button>
                  )}

                  <button
                    type="button"
                    className="collection-menu-button"
                    onClick={() =>
                      setOpenMenuCollectionId((currentId) =>
                        currentId === collection.id ? null : collection.id
                      )
                    }
                    aria-label={`Open menu for ${collection.name}`}
                  >
                    ⋯
                  </button>

                  {openMenuCollectionId === collection.id && (
                    <div className="collection-menu">
                      <button
                        type="button"
                        onClick={() => handleOpenCollection(collection.id)}
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenCollectionBeside(collection.id)
                        }
                      >
                        Open beside
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartRename(collection)}
                      >
                        Rename
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDeleteCollection(collection.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="sidebar-collapsed-content">
            <span></span>
          </div>
        )}
      </aside>

      <section className="workspace">
        <header className="page-header">
          <div>
            <h1>Genshin DPS Calculator</h1>
            <p>Team build overview</p>
          </div>
        </header>

        <div className="workspace-collections">
          {openCollections.map((collection) => {
            const isActive = collection.id === activeCollectionId;

            return (
              <section
              key={collection.id}
              className={`collection-workspace-panel ${isActive ? "active" : ""}`}
              style={{
                width: collectionWidths[collection.id] ?? 1200,
              }}
            >
                <div className="collection-workspace-header">
                  <button
                    type="button"
                    className="collection-workspace-title"
                    onClick={() => {
                      setActiveCollectionId(collection.id);
                      setTeam(collection.team);
                    }}
                  >
                    {collection.name}
                  </button>

                  <button
                    type="button"
                    className="collection-workspace-close"
                    onClick={() => handleCloseOpenCollection(collection.id)}
                    aria-label={`Close ${collection.name}`}
                  >
                    ×
                  </button>
                </div>

                <section className="team-grid">
                  {collection.team.map((character, index) => (
                    <CharacterCard
                      key={`${collection.id}-${character.name}-${index}`}
                      character={character}
                      characters={characters}
                      weapons={weapons}
                      artifactSets={artifactSets}
                      onCharacterChange={(characterId) =>
                        handleCollectionCharacterChange(collection.id, index, characterId)
                      }
                      onWeaponChange={(weaponId) =>
                        handleCollectionWeaponChange(collection.id, index, weaponId)
                      }
                      onArtifactChange={(slot, artifactSetId) =>
                        handleCollectionArtifactChange(
                          collection.id,
                          index,
                          slot,
                          artifactSetId
                        )
                      }
                      onArtifactMainStatChange={(slot, mainStatType, mainStatValue) =>
                        handleCollectionArtifactMainStatChange(
                          collection.id,
                          index,
                          slot,
                          mainStatType,
                          mainStatValue
                        )
                      }
                      onArtifactSubstatChange={(slot, substatIndex, type, value) =>
                        handleCollectionArtifactSubstatChange(
                          collection.id,
                          index,
                          slot,
                          substatIndex,
                          type,
                          value
                        )
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

                <div
                  className="collection-resize-handle"
                  onPointerDown={(event) =>
                    handleStartResizeCollection(event, collection.id)
                  }
                />
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;