export type StatValues = [number, number, number, number, number, number, number, number];

export default class Stats {
  hp: number;
  str: number;
  mag: number;
  skl: number;
  spd: number;
  lck: number;
  def: number;
  res: number;

  static KEYS = ["hp", "str", "mag", "skl", "spd", "lck", "def", "res"];
  static LABELS = ["HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res"];
  static MAP: Record<string, string> = {
    hp: "HP",
    str: "Str",
    mag: "Mag",
    skl: "Skl",
    spd: "Spd",
    lck: "Lck",
    def: "Def",
    res: "Res",
  };

  constructor(hp: number, str: number, mag: number, skl: number, spd: number, lck: number, def: number, res: number) {
    this.hp = hp;
    this.str = str;
    this.mag = mag;
    this.skl = skl;
    this.spd = spd;
    this.lck = lck;
    this.def = def;
    this.res = res;
  }

  static fromArray(values: StatValues): Stats {
    return new Stats(...values);
  }

  toArray(): StatValues {
    return [this.hp, this.str, this.mag, this.skl, this.spd, this.lck, this.def, this.res];
  }

  static singleModifierMap(rawModifiers: Record<string, number>): Record<string, number[]> {
    const modifierMap: Record<string, number[]> = {};
    for (const key of Stats.KEYS) {
      modifierMap[key] = Stats.KEYS.map((statKey) => (statKey === key ? (rawModifiers?.[key] ?? 0) : 0));
    }
    return modifierMap;
  }

  static multiModifierMap(rawModifiers: Record<string, Record<string, number>>): Record<string, number[]> {
    const modifierMap: Record<string, number[]> = {};
    for (const key of Stats.KEYS) {
      const entry = rawModifiers?.[key] ?? {};
      modifierMap[key] = Stats.KEYS.map((statKey) => entry[statKey] ?? 0);
    }
    return modifierMap;
  }
}
