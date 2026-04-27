import PairUpStats from "./PairUpStats.ts";
import Stats from "./Stats.ts";
import StatsModifierMap from "./StatsModifierMap.ts";

export default class BoonBaneStats {
  key: string;
  base: { boon: Stats; bane: Stats };
  growth: { boon: StatsModifierMap; bane: StatsModifierMap };
  cap: { boon: StatsModifierMap; bane: StatsModifierMap };
  pairUp: { boon: string; bane: string; stats: PairUpStats[] }[];

  constructor(
    key: string,
    base: { boon: Stats; bane: Stats },
    growth: { boon: StatsModifierMap; bane: StatsModifierMap },
    cap: { boon: StatsModifierMap; bane: StatsModifierMap },
    pairUp: { boon: string; bane: string; stats: PairUpStats[] }[],
  ) {
    this.key = key;
    this.base = base;
    this.growth = growth;
    this.cap = cap;
    this.pairUp = pairUp;
  }

  toJSON() {
    return {
      base: this.base,
      growth: this.growth,
    };
  }

  static fromJSON(key: string, data: Record<string, any>): BoonBaneStats {
    const pairUp = new Set<{ boon: string; bane: string; stats: PairUpStats[] }>();
    Stats.KEYS.forEach((boon) => {
      Stats.KEYS.forEach((bane) => {
        const pairUpValues = data.pair_up[bane][boon];
        if (pairUpValues) {
          pairUp.add({ boon, bane, stats: PairUpStats.fromJSON(pairUpValues) });
        }
      });
    });
    try {
      return new BoonBaneStats(
        key,
        {
          boon: new Stats(data.base.boon),
          bane: new Stats(data.base.bane),
        },
        {
          boon: StatsModifierMap.fromJSON(data.growth.boon),
          bane: StatsModifierMap.fromJSON(data.growth.bane),
        },
        {
          boon: StatsModifierMap.fromJSON(data.cap.boon),
          bane: StatsModifierMap.fromJSON(data.cap.bane),
        },
        Array.from(pairUp),
      );
    } catch (error) {
      console.error(`Error loading boon_bane_stats.json for ${key}:`);
      throw error;
    }
  }
}
