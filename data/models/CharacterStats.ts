import BaseStats from "./BaseStats.ts";
import Stats from "./Stats.ts";
import type BoonBaneStats from "./BoonBaneStats.ts";
import PairUpStats from "./PairUpStats.ts";

interface RawCharacterStatsData {
  base: Record<string, number[]>;
  growth: number[];
  cap?: number[];
  pair_up: string[];
  boon_bane?: string;
}

export default class CharacterStats {
  key: string;
  base: BaseStats[];
  growth: Stats;
  cap: Stats | null;
  pairUp: PairUpStats[];
  boonBaneStats: BoonBaneStats | undefined = undefined;

  _boonBaneKey: string;
  _rawPairUp: string[];

  constructor(key: string, raw: RawCharacterStatsData) {
    this.key = key;
    this.base = Object.entries(raw.base).map(([name, values]) => new BaseStats(name, values));
    this.growth = new Stats(raw.growth);
    this.cap = raw.cap ? new Stats(raw.cap) : null;
    this.pairUp = PairUpStats.fromJSON(raw.pair_up ?? ["", "", "", ""]);

    this._boonBaneKey = raw.boon_bane ?? key;
    this._rawPairUp = raw.pair_up ?? ["", "", "", ""];
  }

  toJSON() {
    return {
      base: this.base,
      growth: this.growth,
      cap: this.cap,
      pair_up: this.pairUp,
      boonBaneStats: this.boonBaneStats,
    };
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
