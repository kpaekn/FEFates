import fs from "node:fs";
import path from "node:path";

import Skill from "./models/Skill.ts";
import Character from "./models/Character.ts";
import Class from "./models/Class.ts";
import ClassStats from "./models/ClassStats.ts";
import BoonBaneStats from "./models/BoonBaneStats.ts";
import CharacterStats from "./models/CharacterStats.ts";

const DATA_DIR = import.meta.dirname;

function loadModel<T>(
  filename: string,
  Model: { fromJSON(key: string, data: unknown): T },
): Map<string, T> {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8"));
  const result = new Map<string, T>();
  for (const [key, data] of Object.entries(raw)) {
    result.set(key, Model.fromJSON(key, data));
  }
  return result;
}

export class Database {
  skills: Map<string, Skill>;
  boonBaneStats: Map<string, BoonBaneStats>;
  classes: Map<string, Class>;
  classStats: Map<string, ClassStats>;
  characterStats: Map<string, CharacterStats>;
  characters: Map<string, Character>;

  constructor() {
    this.skills = loadModel("skills.json", Skill);
    this.boonBaneStats = loadModel("boon_bane_stats.json", BoonBaneStats);
    this.classes = loadModel("classes.json", Class);
    this.classStats = loadModel("class_stats.json", ClassStats);
    this.characterStats = loadModel("character_stats.json", CharacterStats);
    this.characters = loadModel("characters.json", Character);

    this.classes.forEach((cls) => cls.linkObjects(this));
    this.characters.forEach((character) => character.linkObjects(this));
    this.characterStats.forEach((stats) => stats.linkObjects(this));
  }

  /**
   * Gets all talent class options available to a character of the given gender.
   */
  getTalentOptions(gender: string): Class[] {
    return [...this.classes]
      .filter(([_, cls]) => cls.isTalent() && cls.matchesGender(gender))
      .map(([_, cls]) => cls);
  }

  sortCharacters(characters: Character[] | null) {
    if (!characters) return null;
    const bank = [...this.characters.keys()];
    return characters.sort((a, b) => {
      return bank.indexOf(a.key) - bank.indexOf(b.key);
    });
  }

  sortClasses(classes: Class[] | null) {
    if (!classes) return null;
    const bank = [...this.classes.keys()];
    return classes.sort((a, b) => {
      return bank.indexOf(a.key) - bank.indexOf(b.key);
    });
  }
}

export default new Database();
