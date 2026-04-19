import Stats from "./Stats.ts";

export default class BaseStats {
  level: number;
  stat: Stats;

  constructor(values: number[]) {
    if (values.length !== 9) {
      throw new Error(`Expected 9 values for BaseStats, got ${values.join(", ")}`);
    }
    this.level = values[0];
    this.stat = new Stats(values.slice(1));
  }

  static fromArray(values: number[]): BaseStats {
    return new BaseStats(values);
  }

  toRow(extras: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      ...extras,
      level: this.level ?? 0,
      ...this.stat,
    };
  }
}
