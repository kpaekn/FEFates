import { parseCSV } from "./utils.ts";
import type ClassStats from "./ClassStats.ts";
import type Skill from "./Skill.ts";
import type { Database } from "../database.ts";

interface RawClassData {
  name: string;
  gender?: string;
  opposite_gender?: string;
  unique?: boolean;
  dlc?: boolean;
  weapons?: string;
  promotion?: string;
  skills?: string;
  parallel?: string;
  stats?: string;
}

export default class Class {
  key: string;
  name: string;
  gender: string | null;
  unique: boolean;
  dlc: boolean;
  weapons: string[];
  skills!: Skill[];
  stats!: ClassStats;
  oppositeGenderClass?: Class;
  promotion!: Class[];
  parallelClass?: Class;

  _oppositeGenderedClassKey: string;
  _promotionClassKeys: string[];
  _skillKeys: string[];
  _parallelClassKey: string;
  _statsKey: string;

  constructor(key: string, raw: RawClassData) {
    this.key = key;
    this.name = raw.name;
    this.gender = raw.gender ?? null;
    this.unique = raw.unique ?? false;
    this.dlc = raw.dlc ?? false;
    this.weapons = parseCSV(raw.weapons ?? "");

    this._oppositeGenderedClassKey = raw.opposite_gender ?? "";
    this._promotionClassKeys = parseCSV(raw.promotion ?? "");
    this._skillKeys = parseCSV(raw.skills ?? "");
    this._parallelClassKey = raw.parallel ?? "";
    this._statsKey = raw.stats ?? key;
  }

  static fromJSON(key: string, raw: RawClassData): Class {
    return new Class(key, raw);
  }

  toJSON() {
    return {
      key: this.key,
      name: this.name,
    }
  }

  linkObjects(database: Database): void {
    this.skills = this._skillKeys
      .map((skillKey) => {
        const skill = database.skills.get(skillKey);
        if (!skill) {
          throw new Error(`Unknown skill: ${skillKey} (in class ${this.key})`);
        }
        return skill;
      })
      .filter(Boolean) as Skill[];

    const stats = database.classStats.get(this._statsKey);
    if (!stats) {
      throw new Error(`Unknown class stats: ${this._statsKey} (in class ${this.key})`);
    }
    this.stats = stats;

    if (this._oppositeGenderedClassKey) {
      const oppositeClass = database.classes.get(this._oppositeGenderedClassKey);
      if (!oppositeClass) {
        throw new Error(`Unknown opposite gender class: ${this._oppositeGenderedClassKey} (in class ${this.key})`);
      }
      this.oppositeGenderClass = oppositeClass;
    }

    this.promotion = this._promotionClassKeys
      .map((classKey) => {
        const cls = database.classes.get(classKey);
        if (!cls) {
          throw new Error(`Unknown class: ${classKey} (in class ${this.key})`);
        }
        return cls;
      })
      .filter(Boolean) as Class[];

    if (this._parallelClassKey) {
      const parallelClass = database.classes.get(this._parallelClassKey);
      if (!parallelClass) {
        throw new Error(`Unknown parallel class: ${this._parallelClassKey} (in class ${this.key})`);
      }
      this.parallelClass = parallelClass;
    }
  }

  matchesGender(gender?: string): boolean {
    return gender && this.gender ? this.gender === gender : true;
  }

  resolveClassForGender(gender: string): Class {
    if (this.gender === gender) {
      return this;
    }
    return this.oppositeGenderClass ?? this;
  }

  isTalent(gender?: string): boolean {
    return !this.unique && !this.dlc && this._hasPromotion() && this.matchesGender(gender);
  }

  _hasPromotion(): boolean {
    return !!this.promotion && this.promotion.length > 0;
  }
}
