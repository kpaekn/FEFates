"use strict";

/**
 * @typedef {[number, number, number, number, number, number, number, number]} StatValues
 */

class Stats {
  /**
   * @param {number} hp
   * @param {number} str
   * @param {number} mag
   * @param {number} skl
   * @param {number} spd
   * @param {number} lck
   * @param {number} def
   * @param {number} res
   */
  constructor(hp, str, mag, skl, spd, lck, def, res) {
    this.hp = hp;
    this.str = str;
    this.mag = mag;
    this.skl = skl;
    this.spd = spd;
    this.lck = lck;
    this.def = def;
    this.res = res;
  }

  /**
   * @param {StatValues} values
   * @returns {Stats}
   */
  static fromArray(values) {
    return new Stats(...values);
  }

  /**
   * @returns {StatValues}
   */
  toArray() {
    return [this.hp, this.str, this.mag, this.skl, this.spd, this.lck, this.def, this.res];
  }

  static singleModifierMap(rawModifiers) {
    const modifierMap = {};
    for (const key of Stats.KEYS) {
      modifierMap[key] = Stats.KEYS.map((statKey) => (statKey === key ? (rawModifiers?.[key] ?? 0) : 0));
    }
    return modifierMap;
  }

  static multiModifierMap(rawModifiers) {
    const modifierMap = {};
    for (const key of Stats.KEYS) {
      const entry = rawModifiers?.[key] ?? {};
      modifierMap[key] = Stats.KEYS.map((statKey) => entry[statKey] ?? 0);
    }
    return modifierMap;
  }
}

Stats.KEYS = ["hp", "str", "mag", "skl", "spd", "lck", "def", "res"];
Stats.LABELS = ["HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res"];

module.exports = Stats;
