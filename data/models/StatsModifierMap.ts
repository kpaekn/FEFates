import Stats from "./Stats.ts";

export default class StatsModifierMap {
  hp: Stats;
  str: Stats;
  mag: Stats;
  skl: Stats;
  spd: Stats;
  lck: Stats;
  def: Stats;
  res: Stats;

  constructor(hp: Stats, str: Stats, mag: Stats, skl: Stats, spd: Stats, lck: Stats, def: Stats, res: Stats) {
    this.hp = hp;
    this.str = str;
    this.mag = mag;
    this.skl = skl;
    this.spd = spd;
    this.lck = lck;
    this.def = def;
    this.res = res;
  }

  static fromJSON(data: Record<string, any>): StatsModifierMap {
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
}
