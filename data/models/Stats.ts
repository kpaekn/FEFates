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
  static MAP: { key: string; label: string }[] = [
    { key: "hp", label: "HP" },
    { key: "str", label: "Str" },
    { key: "mag", label: "Mag" },
    { key: "skl", label: "Skl" },
    { key: "spd", label: "Spd" },
    { key: "lck", label: "Lck" },
    { key: "def", label: "Def" },
    { key: "res", label: "Res" },
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

  get(key: string): number {
    if (key === "hp") return this.hp;
    if (key === "str") return this.str;
    if (key === "mag") return this.mag;
    if (key === "skl") return this.skl;
    if (key === "spd") return this.spd;
    if (key === "lck") return this.lck;
    if (key === "def") return this.def;
    if (key === "res") return this.res;
    return 0;
  }

  toArray(): number[] {
    return [this.hp, this.str, this.mag, this.skl, this.spd, this.lck, this.def, this.res];
  }

  /**
   * Subtracts the values of one Stats object from another in place.
   */
  subtract(other: Stats) {
    this.hp -= other.hp;
    this.str -= other.str;
    this.mag -= other.mag;
    this.skl -= other.skl;
    this.spd -= other.spd;
    this.lck -= other.lck;
    this.def -= other.def;
    this.res -= other.res;
  }
}
