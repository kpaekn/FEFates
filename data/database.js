"use strict";

const fs = require("fs");
const path = require("path");

const Character = require("./models/Character");
const Class = require("./models/Class");
const Stat = require("./models/Stats");
const ClassStats = require("./models/ClassStats");
const BoonBaneStats = require("./models/BoonBaneStats");
const CharacterStats = require("./models/CharacterStats");

/**
 * @typedef {Object} CharacterData
 * @property {string} name
 * @property {string} class_set
 * @property {"m" | "f"} gender
 * @property {"all" | "birthright" | "conquest" | "revelation"} route
 * @property {{ friendship: string, partner: string }} supports
 * @property {boolean} adult
 * @property {string} personal_skill
 * @property {string} growth
 */

/**
 * @typedef {Object} CharacterStatEntry
 * @property {Record<string, number[]>} base - Keyed by route (e.g. "Standard", "Conquest")
 * @property {number[]} growth
 * @property {number[]} cap
 */

/**
 * @typedef {Object} HydratedClassStatEntry
 * @property {Stat} base
 * @property {Stat} growth
 * @property {Stat} max
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
 * @param {Record<string, import("./models/Skill")>} skillMap
 * @returns {Record<string, Class>}
 */
function hydrateClasses(raw, skillMap) {
  /** @type {Record<string, Class>} */
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = Class.fromJSON(key, data, skillMap);
  }
  return result;
}

/**
 * @param {Record<string, any>} raw
 * @returns {Record<string, HydratedClassStatEntry>}
 */
function hydrateClassStats(raw) {
  /** @type {Record<string, HydratedClassStatEntry>} */
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = ClassStats.fromJSON(key, data);
  }
  return result;
}

/**
 * @param {Record<string, any>} raw
 * @returns {Record<string, BoonBaneStats>}
 */
function hydrateBoonBaneStats(raw) {
  /** @type {Record<string, BoonBaneStats>} */
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = BoonBaneStats.fromJSON(key, data);
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

const Skill = require("./models/Skill");
const skillMap = Object.fromEntries(
  Object.entries(loadJSON("skills.json")).map(([key, data]) => [
    key,
    Skill.fromJSON(key, data),
  ]),
);

module.exports = {
  characters: hydrateCharacters(loadJSON("characters.json")),
  classes: hydrateClasses(loadJSON("classes.json"), skillMap),
  characterStats: hydrateCharacterStats(loadJSON("character_stats.json")),
  classStats: hydrateClassStats(loadJSON("class_stats.json")),
  boonBaneStats: hydrateBoonBaneStats(loadJSON("boon_bane_stats.json")),
};
