import Stats from "./Stats.ts";

export default class BaseStats extends Stats {
  name: string;
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

  constructor(name: string, values: number[]) {
    if (values.length !== 9) {
      throw new Error(`Expected 9 values for BaseStats, got ${values.join(", ")}`);
    }
    super(values.slice(1));
    this.name = name;
    this.level = values[0];
  }

  get(key: string): number {
    if (key === "level") return this.level;
    return super.get(key);
  }
}
