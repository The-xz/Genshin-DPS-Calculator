import { useEffect, useState } from "react";
import "./App.css";

type Character = {
  id: number;
  name: string;
  element: string;
  weapon_type: string;
  base_hp: number;
  base_atk: number;
  base_def: number;
};

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/characters")
      .then((res) => res.json())
      .then((data) => setCharacters(data))
      .catch((error) => console.error("Failed to fetch characters:", error));
  }, []);

  return (
    <main>
      <h1>Genshin DPS Calculator</h1>

      <h2>Characters</h2>

      {characters.map((character) => (
        <div key={character.id}>
          <h3>{character.name}</h3>
          <p>Element: {character.element}</p>
          <p>Weapon: {character.weapon_type}</p>
          <p>Base HP: {character.base_hp}</p>
          <p>Base ATK: {character.base_atk}</p>
          <p>Base DEF: {character.base_def}</p>
        </div>
      ))}
    </main>
  );
}

export default App;