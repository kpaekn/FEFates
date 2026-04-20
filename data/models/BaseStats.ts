import Stats from "./Stats.ts";

export default class BaseStats extends Stats {
  level: number;

  static MAP: { key: string; label: string }[] = [
    { key: "level", label: "Lvl" },
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
    if (values.length !== 9) {
      throw new Error(`Expected 9 values for BaseStats, got ${values.join(", ")}`);
    }
    super(values.slice(1));
    this.level = values[0];
  }

  static fromArray(values: number[]): BaseStats {
    return new BaseStats(values);
  }

  get(key: string): number {
    if (key === "level") return this.level;
    return super.get(key);
  }

  toRow(extras: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      ...extras,
      level: this.level ?? 0,
      hp: this.hp,
      str: this.str,
      mag: this.mag,
      skl: this.skl,
      spd: this.spd,
      lck: this.lck,
      def: this.def,
      res: this.res,
    };
  }
}
