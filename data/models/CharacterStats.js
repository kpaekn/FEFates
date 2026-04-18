"use strict";

const BaseStats = require("./BaseStats");
const Stats = require("./Stats");

/**
 * @typedef {[number, number, number, number, number, number, number, number]} StatValues
 * @typedef {[number, number, number, number, number, number, number, number, number]} BaseStatsValues
 *
 * @typedef {Object} RawCharacterStatsData
 * @property {{ [name: string]: BaseStatsValues }} base
 * @property {StatValues} growth
 * @property {StatValues} cap
 */

class CharacterStats {
  /**
   * @param {string} key
   * @param {RawCharacterStatsData} raw
   */
  constructor(key, raw) {
    this.key = key;
    this.base = Object.fromEntries(
      Object.entries(raw.base).map(([name, values]) => [
        name,
        BaseStats.fromArray(values),
      ]),
    );
    this.growth = Stats.fromArray(raw.growth);
    this.cap = raw.cap ? Stats.fromArray(raw.cap) : null;
  }

  /**
   * @param {string} key
   * @param {RawCharacterStatsData} raw
   * @returns {CharacterStats}
   */
  static fromJSON(key, raw) {
    try {
      return new CharacterStats(key, raw);
    } catch (error) {
      console.error(`Error loading character_stats.json for ${key}:`);
      throw error;
    }
  }
}

module.exports = CharacterStats;
