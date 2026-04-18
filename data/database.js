"use strict";

const fs = require("fs");
const path = require("path");

const Skill = require("./models/Skill");
const Character = require("./models/Character");
const Class = require("./models/Class");
const ClassStats = require("./models/ClassStats");
const BoonBaneStats = require("./models/BoonBaneStats");
const CharacterStats = require("./models/CharacterStats");
const DataSet = require("./models/DataSet");

/**
 * @typedef {Object} CharacterStatEntry
 * @property {Record<string, number[]>} base - Keyed by route (e.g. "Standard", "Conquest")
 * @property {number[]} growth
 * @property {number[]} cap
 */

const DATA_DIR = __dirname;

/**
 * @template T
 * @param {string} filename
 * @returns {T}
 */
function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8"));
}

/**
 * @param {Record<string, any>} raw
 * @returns {Record<string, Character>}
 */
function hydrateCharacters(raw) {
  /** @type {Record<string, Character>} */
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = Character.fromJSON(key, data);
  }
  return result;
}

/**
 * @param {Record<string, any>} raw
 * @returns {Record<string, CharacterStats>}
 */
function hydrateCharacterStats(raw) {
  /** @type {Record<string, CharacterStats>} */
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = CharacterStats.fromJSON(key, data);
  }
  return result;
}

const skills = DataSet.fromJSON(loadJSON("skills.json"), Skill);
const boonBaneStats = DataSet.fromJSON(loadJSON("boon_bane_stats.json"), BoonBaneStats);
const classes = DataSet.fromJSON(loadJSON("classes.json"), Class);
const classStats = DataSet.fromJSON(loadJSON("class_stats.json"), ClassStats);
classes.forEach((cls) => cls.updateSkills(skills));

module.exports = {
  characters: hydrateCharacters(loadJSON("characters.json")),
  classes,
  characterStats: hydrateCharacterStats(loadJSON("character_stats.json")),
  classStats,
  boonBaneStats,
};
