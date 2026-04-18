"use strict";

const Stat = require("./Stat");

class BaseStat {
  constructor(level, HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
    this.level = level;
    this.stat = new Stat(HP, Str, Mag, Skl, Spd, Lck, Def, Res);
  }
}

module.exports = BaseStat;