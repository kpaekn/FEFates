import Stats from "./Stats.ts";

export default class PairUpStats extends Stats {
  name: string;
  mov: number;

  static MAP: { key: string; label: string }[] = [
    { key: "mov", label: "Mov" },
    { key: "str", label: "Str" },
    { key: "mag", label: "Mag" },
    { key: "skl", label: "Skl" },
    { key: "spd", label: "Spd" },
    { key: "lck", label: "Lck" },
    { key: "def", label: "Def" },
    { key: "res", label: "Res" },
  ];

  constructor(name: string, values: number[]) {
    if (values.length !== 8) {
      throw new Error(`Expected 8 values for PairUpStats, got ${values.join(", ")}`);
    }
    super(values);
    this.name = name;
    this.mov = values[0];
  }

  static fromJSON(values: string[]): PairUpStats[] {
    const statsValues = Array(8).fill(0);
    const pairUpStatsValues = values.map((value) => {
      value.split(",").forEach((stat) => {
        const idx = Stats.KEYS.indexOf(stat);
        statsValues[idx]++;
      });
      return [...statsValues];
    });
    return [
      new PairUpStats("C", pairUpStatsValues[0]),
      new PairUpStats("B", pairUpStatsValues[1]),
      new PairUpStats("A", pairUpStatsValues[2]),
      new PairUpStats("S", pairUpStatsValues[3]),
    ];
  }

  get(key: string): number {
    if (key === "mov") return this.mov;
    return super.get(key);
  }
}
