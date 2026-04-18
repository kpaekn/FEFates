"use strict";

const Stat = require("./Stat");

class BaseStat {
  constructor(level, HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
    this.level = level;
    this.stat = new Stat(HP, Str, Mag, Skl, Spd, Lck, Def, Res);
  }

  static fromArray(values) {
    const [level, HP, Str, Mag, Skl, Spd, Lck, Def, Res] = values ?? [];
    return new BaseStat(
      level ?? 0,
      HP ?? 0,
      Str ?? 0,
      Mag ?? 0,
      Skl ?? 0,
      Spd ?? 0,
      Lck ?? 0,
      Def ?? 0,
      Res ?? 0,
    );
  }

  toRow(extras = {}) {
    return {
      ...extras,
      level: this.level ?? 0,
      ...this.stat.toRow(),
    };
  }
}

module.exports = BaseStat;
