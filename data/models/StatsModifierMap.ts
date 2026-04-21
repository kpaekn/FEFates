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
      new Stats(data.hp),
      new Stats(data.str),
      new Stats(data.mag),
      new Stats(data.skl),
      new Stats(data.spd),
      new Stats(data.lck),
      new Stats(data.def),
      new Stats(data.res),
    );
  }
}
