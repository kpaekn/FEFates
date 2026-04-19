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
  static MAP: {key: string, name: string}[] = [
    { key: "hp", name: "HP" },
    { key: "str", name: "Str" },
    { key: "mag", name: "Mag" },
    { key: "skl", name: "Skl" },
    { key: "spd", name: "Spd" },
    { key: "lck", name: "Lck" },
    { key: "def", name: "Def" },
    { key: "res", name: "Res" },
  ];

  constructor(values: number[]) {
    if (values.length !== 8) {
      throw new Error(`Expected 8 stat values, got ${values.join(", ")}`);
    }
    this.hp = values[0];
    this.str = values[1];
    this.mag = values[2];
    this.skl = values[3];
    this.spd = values[4];
    this.lck = values[5];
    this.def = values[6];
    this.res = values[7];
  }

  static fromArray(values: number[]): Stats {
    return new Stats(values);
  }

  toArray(): number[] {
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
