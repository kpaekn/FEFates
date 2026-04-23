import BaseStats from "./BaseStats.ts";
import Stats from "./Stats.ts";
import type BoonBaneStats from "./BoonBaneStats.ts";
import type { Database } from "../database.ts";

interface RawCharacterStatsData {
  base: Record<string, number[]>;
  growth: number[];
  cap?: number[];
  boon_bane?: string;
}

export default class CharacterStats {
  key: string;
  base: BaseStats[];
  growth: Stats;
  cap: Stats | null;
  boonBaneStats: BoonBaneStats | undefined = undefined;

  _boonBaneKey: string;

  constructor(key: string, raw: RawCharacterStatsData) {
    this.key = key;
    this.base = Object.entries(raw.base).map(([name, values]) => new BaseStats(name, values));
    this.growth = new Stats(raw.growth);
    this.cap = raw.cap ? new Stats(raw.cap) : null;

    this._boonBaneKey = raw.boon_bane ?? key;
  }

  toJSON() {
    return { ...this, _boonBaneKey: undefined };
  }

  static fromJSON(key: string, raw: RawCharacterStatsData): CharacterStats {
    try {
      return new CharacterStats(key, raw);
    } catch (error) {
      console.error(`Error loading character_stats.json for ${key}:`);
      throw error;
    }
  }

  linkObjects(boonBaneStats: Map<string, BoonBaneStats>): void {
    this.boonBaneStats = boonBaneStats.get(this._boonBaneKey) ?? undefined;
  }
}
