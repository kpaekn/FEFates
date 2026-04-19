import Stats from "./Stats.ts";

export type BaseStatsValues = [number, number, number, number, number, number, number, number, number];

export default class BaseStats {
  level: number;
  stat: Stats;

  constructor(level: number, hp: number, str: number, mag: number, skl: number, spd: number, lck: number, def: number, res: number) {
    this.level = level;
    this.stat = new Stats(hp, str, mag, skl, spd, lck, def, res);
  }

  static fromArray(values: BaseStatsValues): BaseStats {
    return new BaseStats(...values);
  }

  toRow(extras: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      ...extras,
      level: this.level ?? 0,
      ...this.stat,
    };
  }
}
