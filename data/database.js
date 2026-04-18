"use strict";

const fs = require("fs");
const path = require("path");

const Character = require("./models/Character");
const Class = require("./models/Class");
const Skill = require("./models/Skill");
const Stat = require("./models/Stat");

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
 * @typedef {Object} BoonBaneModifiers
 * @property {number[]} boon
 * @property {number[]} bane
 */

/**
 * @typedef {Object} BoonBaneGrowthCap
 * @property {Record<string, number[]>} boon
 * @property {Record<string, number[]>} bane
 */

/**
 * @typedef {Object} BoonBaneStatEntry
 * @property {BoonBaneModifiers} base
 * @property {BoonBaneGrowthCap} growth
 * @property {BoonBaneGrowthCap} cap
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
 * @returns {Record<string, Skill>}
 */
function hydrateSkills(raw) {
  /** @type {Record<string, Skill>} */
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = Skill.fromJSON(key, data);
  }
  return result;
}

/**
 * @param {Record<string, any>} raw
 * @returns {Record<string, Class>}
 */
function hydrateClasses(raw) {
  /** @type {Record<string, Class>} */
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = Class.fromJSON(key, data);
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
    result[key] = {
      ...data,
      base: Stat.fromJSON(data.base),
      growth: Stat.fromJSON(data.growth),
      max: Stat.fromJSON(data.max),
    };
  }
  return result;
}

module.exports = {
  /** @type {Record<string, Character>} */
  characters: hydrateCharacters(loadJSON("characters.json")),
  /** @type {Record<string, Class>} */
  classes: hydrateClasses(loadJSON("classes.json")),
  /** @type {Record<string, Skill>} */
  skills: hydrateSkills(loadJSON("skills.json")),
  /** @type {Record<string, CharacterStatEntry>} */
  characterStats: loadJSON("character_stats.json"),
  /** @type {Record<string, HydratedClassStatEntry>} */
  classStats: hydrateClassStats(loadJSON("class_stats.json")),
  /** @type {Record<string, BoonBaneStatEntry>} */
  boonBaneStats: loadJSON("boon_bane_stats.json"),
};
