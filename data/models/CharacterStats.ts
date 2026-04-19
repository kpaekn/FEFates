import BaseStats from "./BaseStats.ts";
import Stats from "./Stats.ts";
import type BoonBaneStats from "./BoonBaneStats.ts";
import type { Database } from "../database.ts";

interface RawCharacterStatsData {
  base: Record<string, number[]>;
  growth: number[];
  cap?: number[];
}

export default class CharacterStats {
  key: string;
  base: Record<string, BaseStats>;
  growth: Stats;
  cap: Stats | null;
  boonBaneStats: BoonBaneStats | null = null;

  constructor(key: string, raw: RawCharacterStatsData) {
    this.key = key;
    this.base = Object.fromEntries(
      Object.entries(raw.base).map(([name, values]) => [name, BaseStats.fromArray(values)]),
    );
    this.growth = Stats.fromArray(raw.growth);
    this.cap = raw.cap ? Stats.fromArray(raw.cap) : null;
  }

  static fromJSON(key: string, raw: RawCharacterStatsData): CharacterStats {
    try {
      return new CharacterStats(key, raw);
    } catch (error) {
      console.error(`Error loading character_stats.json for ${key}:`);
      throw error;
    }
  }

  linkObjects(database: Database): void {
    this.boonBaneStats = database.boonBaneStats.get(this.key) ?? null;
  }
}
