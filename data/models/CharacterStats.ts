import BaseStats from "./BaseStats.ts";
import Stats from "./Stats.ts";
import PairUpStats from "./PairUpStats.ts";
import type BoonBaneStats from "./BoonBaneStats.ts";

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
  pairUp: PairUpStats;
  boonBaneStats: BoonBaneStats | undefined = undefined;

  _boonBaneKey: string;

  constructor(key: string, raw: RawCharacterStatsData) {
    this.key = key;
    this.base = Object.entries(raw.base).map(([name, values]) => new BaseStats(name, values));
    this.growth = new Stats(raw.growth);
    this.cap = raw.cap ? new Stats(raw.cap) : null;
    this.pairUp = new PairUpStats((raw.pair_up ?? ["", " ", " ", " "]).map(parsePairUpStat));

    this._boonBaneKey = raw.boon_bane ?? key;
  }

  toJSON() {
    return { ...this, pairUp: undefined, _boonBaneKey: undefined };
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

function parsePairUpStat(value: string): string {
  const acc = new Map<string, number>();
  value
    .split(",")
    .map((stat) => stat.trim())
    .map((stat) => {
      return stat.charAt(0).toUpperCase() + stat.slice(1);
    })
    .forEach((stat) => {
      const existing = acc.get(stat);
      if (existing) {
        acc.set(stat, existing + 1);
      } else {
        acc.set(stat, 1);
      }
    });
  return [...acc.entries()].map(([stat, count]) => (stat ? `${stat} +${count}` : "")).join(", ");
}
