"use strict";

const Stats = require("./Stats");

class StatsModifierMap {
  /**
   * @param {Stats} hp
   * @param {Stats} str
   * @param {Stats} mag
   * @param {Stats} skl
   * @param {Stats} spd
   * @param {Stats} lck
   * @param {Stats} def
   * @param {Stats} res
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
   * @param {*} data // see boon_bane_stats.json
   * @returns {StatsModifierMap}
   */
  static fromJSON(data) {
    return new StatsModifierMap(
      Stats.fromArray(data.hp),
      Stats.fromArray(data.str),
      Stats.fromArray(data.mag),
      Stats.fromArray(data.skl),
      Stats.fromArray(data.spd),
      Stats.fromArray(data.lck),
      Stats.fromArray(data.def),
      Stats.fromArray(data.res),
    );
  }

  toModifierMap() {
    return Stats.multiModifierMap(this);
  }
}

module.exports = StatsModifierMap;
