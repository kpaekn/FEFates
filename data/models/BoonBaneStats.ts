import Stats from "./Stats.ts";
import StatsModifierMap from "./StatsModifierMap.ts";

export default class BoonBaneStats {
  key: string;
  base: { boon: Stats; bane: Stats };
  growth: { boon: StatsModifierMap; bane: StatsModifierMap };
  cap: { boon: StatsModifierMap; bane: StatsModifierMap };

  constructor(
    key: string,
    base: { boon: Stats; bane: Stats },
    growth: { boon: StatsModifierMap; bane: StatsModifierMap },
    cap: { boon: StatsModifierMap; bane: StatsModifierMap },
  ) {
    this.key = key;
    this.base = base;
    this.growth = growth;
    this.cap = cap;
  }

  static fromJSON(key: string, data: Record<string, any>): BoonBaneStats {
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
      );
    } catch (error) {
      console.error(`Error loading boon_bane_stats.json for ${key}:`);
      throw error;
    }
  }
}
