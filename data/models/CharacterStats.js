"use strict";

const BaseStats = require("./BaseStats");
const Stats = require("./Stats");

class CharacterStats {
  /**
   * @param {string} key
   * @param {{ [name: string]: BaseStats }} base
   * @param {Stats} growth
   * @param {Stats} cap
   */
  constructor(key, base, growth, cap) {
    this.key = key;
    this.base = base;
    this.growth = growth;
    this.cap = cap;
  }

  /**
   * @param {string} key 
   * @param {*} data // see character_stats.json
   * @returns {CharacterStats}
   */
  static fromJSON(key, data) {
    try {
      const base = Object.fromEntries(Object.entries(data.base).map(([name, values]) => [name, BaseStats.fromArray(values)]));
      const growth = Stats.fromArray(data.growth);
      const cap = data.cap ? Stats.fromArray(data.cap) : null;
      return new CharacterStats(key, base, growth, cap);
    }
    catch (error) {
      console.error(`Error loading character_stats.json for ${key}:`);
      throw error;
    }
  }
}

module.exports = CharacterStats;
