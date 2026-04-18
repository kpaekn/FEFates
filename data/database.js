"use strict";

const fs = require("fs");
const path = require("path");

const Skill = require("./models/Skill");
const Character = require("./models/Character");
const Class = require("./models/Class");
const ClassStats = require("./models/ClassStats");
const BoonBaneStats = require("./models/BoonBaneStats");
const CharacterStats = require("./models/CharacterStats");

const DATA_DIR = __dirname;

class Database {
  constructor() {
    this.skills = this.loadModel("skills.json", Skill);
    this.boonBaneStats = this.loadModel("boon_bane_stats.json", BoonBaneStats);
    this.classes = this.loadModel("classes.json", Class);
    this.classStats = this.loadModel("class_stats.json", ClassStats);
    this.characterStats = this.loadModel("character_stats.json", CharacterStats);
    this.characters = this.loadModel("characters.json", Character);

    this.classes.forEach((cls) => cls.linkObjects(this));
    this.characters.forEach((character) => character.linkObjects(this));
  }

  /**
   * Hydrate a raw JSON object into a DataSet using a Model's fromJSON factory.
   * @template T
   * @param {string} filename
   * @param {{ fromJSON(key: string, data: any): T }} Model
   * @returns {Map<string, T>}
   */
  loadModel(filename, Model) {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8"));
    const result = new Map();
    for (const [key, data] of Object.entries(raw)) {
      result.set(key, Model.fromJSON(key, data));
    }
    return result;
  }
}

const database = new Database();

module.exports = database;
