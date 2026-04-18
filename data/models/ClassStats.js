"use strict";

const Stats = require("./Stats");

class ClassStats {
  /**
   * @param {string} key
   * @param {Stats} base
   * @param {Stats} growth
   * @param {Stats} max
   */
  constructor(key, base, growth, max) {
    this.key = key;
    this.base = base;
    this.growth = growth;
    this.max = max;
  }

  /**
   * @param {string} key 
   * @param {*} data // see class_stats.json
   * @returns {ClassStats}
   */
  static fromJSON(key, data) {
    try {
      const base = Stats.fromArray(data.base);
      const growth = Stats.fromArray(data.growth);
      const max = Stats.fromArray(data.max);
      return new ClassStats(key, base, growth, max);
    }
    catch (error) {
      console.error(`Error loading class_stats.json for ${key}:`);
      throw error;
    }
  }
}

module.exports = ClassStats;
