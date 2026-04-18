"use strict";

const Stats = require("./Stats");

class BaseStats {
  /**
   * @param {number} level
   * @param {number} hp
   * @param {number} str
   * @param {number} mag
   * @param {number} skl
   * @param {number} spd
   * @param {number} lck
   * @param {number} def
   * @param {number} res
   */
  constructor(level, hp, str, mag, skl, spd, lck, def, res) {
    this.level = level;
    this.stat = new Stats(hp, str, mag, skl, spd, lck, def, res);
  }

  /**
   * @param {[number, number, number, number, number, number, number, number, number]} values
   * @returns {BaseStats}
   */
  static fromArray(values) {
    return new BaseStats(...values);
  }

  toRow(extras = {}) {
    return {
      ...extras,
      level: this.level ?? 0,
      ...this.stat,
    };
  }
}

module.exports = BaseStats;
