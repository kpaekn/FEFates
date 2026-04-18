"use strict";

const Stats = require("./Stats");
const StatsModifierMap = require("./StatsModifierMap");

class BoonBaneStats {
  /**
   * @param {string} key
   * @param {{ boon: Stats, bane: Stats }} base
   * @param {{ boon: StatsModifierMap, bane: StatsModifierMap }} growth
   * @param {{ boon: StatsModifierMap, bane: StatsModifierMap }} cap
   */
  constructor(key, base, growth, cap) {
    this.key = key;
    this.base = base;
    this.growth = growth;
    this.cap = cap;
  }

  /**
   * @param {string} key
   * @param {*} data // see boon_bane_stats.json
   * @returns {BoonBaneStats}
   */
  static fromJSON(key, data) {
    try {
      return new BoonBaneStats(key, {
        boon: Stats.fromArray(data.base.boon),
        bane: Stats.fromArray(data.base.bane),
      }, {
        boon: StatsModifierMap.fromJSON(data.growth.boon),
        bane: StatsModifierMap.fromJSON(data.growth.bane),
      }, {
        boon: StatsModifierMap.fromJSON(data.cap.boon),
        bane: StatsModifierMap.fromJSON(data.cap.bane),
      });
    } catch (error) {
      console.error(`Error loading boon_bane_stats.json for ${key}:`);
      throw error;
    }
  }
}

module.exports = BoonBaneStats;
