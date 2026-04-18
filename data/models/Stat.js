"use strict";

class Stat {
  constructor(HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
    this.HP = HP;
    this.Str = Str;
    this.Mag = Mag;
    this.Skl = Skl;
    this.Spd = Spd;
    this.Lck = Lck;
    this.Def = Def;
    this.Res = Res;
  }

  static fromJSON(data) {
    if (data instanceof Stat) {
      return data;
    }

    if (Array.isArray(data)) {
      return new Stat(...data);
    }

    return new Stat(
      data?.HP ?? 0,
      data?.Str ?? 0,
      data?.Mag ?? 0,
      data?.Skl ?? 0,
      data?.Spd ?? 0,
      data?.Lck ?? 0,
      data?.Def ?? 0,
      data?.Res ?? 0,
    );
  }
}

module.exports = Stat;