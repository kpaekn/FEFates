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

/**
 * Hydrate a raw JSON object into a DataSet using a Model's fromJSON factory.
 * @template T
 * @param {string} filename
 * @param {{ fromJSON(key: string, data: any): T }} Model
 * @returns {Map<string, T>}
 */
function loadModel(filename, Model) {
  const raw = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, filename), "utf8"),
  );
  /** @type {Map<string, T>} */
  const result = new Map();
  for (const [key, data] of Object.entries(raw)) {
    result.set(key, Model.fromJSON(key, data));
  }
  return result;
}

const skills = loadModel("skills.json", Skill);
const boonBaneStats = loadModel("boon_bane_stats.json", BoonBaneStats);
const classes = loadModel("classes.json", Class);
const classStats = loadModel("class_stats.json", ClassStats);
classes.forEach((cls) => {
  cls.setSkills(skills);
  cls.setPromotion(classes);
  cls.setStats(classStats);
  cls.setParallelClass(classes);
});
const characterStats = loadModel("character_stats.json", CharacterStats);
const characters = loadModel("characters.json", Character);
characters.forEach((character) => {
  character.setStats(characterStats);
  character.setParent(characters);
});

module.exports = {
  characters,
  classes,
  boonBaneStats,
};
