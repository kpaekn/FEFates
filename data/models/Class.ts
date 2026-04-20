import { parseCSV } from "./utils.ts";
import type ClassStats from "./ClassStats.ts";
import type Skill from "./Skill.ts";
import type { Database } from "../database.ts";

interface RawClassData {
  name: string;
  gender?: string;
  opposite_gender?: string;
  unique?: boolean;
  inheritable?: boolean;
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
  inheritable: boolean;
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
    this.inheritable = raw.inheritable ?? true;
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
      stats: this.stats,
    };
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
        throw new Error(
          `Unknown opposite gender class: ${this._oppositeGenderedClassKey} (in class ${this.key})`,
        );
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

  /**
   * Checks if this class is the same as another class, considering opposite gender variants as equal (e.g. "troubadour_m" and "troubadour_f").
   */
  equals(other: Class): boolean {
    return this.key === other.key || this.key === other.oppositeGenderClass?.key;
  }

  /**
   * Checks if the given class is in the promotion tree of this class (including this class itself).
   */
  isInClassTree(cls: Class): boolean {
    return (
      this.equals(cls) || this.promotion.some((promotionClass) => promotionClass.isInClassTree(cls))
    );
  }

  /**
   * Flattens the class tree into a list of classes, starting with this class and followed by all promotion classes recursively.
   */
  flattenClassTree(): Class[] {
    return [this, ...this.promotion.flatMap((promotionClass) => promotionClass.flattenClassTree())];
  }

  /**
   * Checks if this class matches the given gender. If gender is not provided, returns true.
   */
  matchesGender(gender?: string): boolean {
    return gender && this.gender ? this.gender === gender : true;
  }

  resolveClassForGender(gender: string): Class {
    if (this.gender === gender) {
      return this;
    }
    return this.oppositeGenderClass ?? this;
  }

  /**
   * Checks if this class is a talent class, meaning it is not unique, not dls, and is a base class (has no promotion).
   */
  isTalent(): boolean {
    return !this.unique && !this.dlc && this._hasPromotion();
  }

  _hasPromotion(): boolean {
    return !!this.promotion && this.promotion.length > 0;
  }
}
