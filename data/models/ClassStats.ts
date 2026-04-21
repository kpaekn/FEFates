import Stats from "./Stats.ts";

interface RawClassStatsData {
  base: number[];
  growth: number[];
  max: number[];
}

export default class ClassStats {
  key: string;
  base: Stats;
  growth: Stats;
  max: Stats;

  constructor(key: string, base: Stats, growth: Stats, max: Stats) {
    this.key = key;
    this.base = base;
    this.growth = growth;
    this.max = max;
  }

  static fromJSON(key: string, data: RawClassStatsData): ClassStats {
    try {
      return new ClassStats(key, new Stats(data.base), new Stats(data.growth), new Stats(data.max));
    } catch (error) {
      console.error(`Error loading class_stats.json for ${key}:`);
      throw error;
    }
  }
}
