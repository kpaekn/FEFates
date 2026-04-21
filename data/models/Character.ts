import { parseCSV } from "./utils.ts";
import type Class from "./Class.ts";
import type CharacterStats from "./CharacterStats.ts";
import type { Database } from "../database.ts";

interface RawCharacterData {
  name: string;
  class_set: string;
  gender: "m" | "f";
  route: "all" | "birthright" | "conquest" | "revelation";
  supports: { friendship: string; partner: string };
  personal_skill: string;
  starting_class?: string;
  parent?: string;
}

export default class Character {
  key: string;
  name: string;
  gender: "m" | "f";
  route: "all" | "birthright" | "conquest" | "revelation";
  // todo: remove once friendships and partners are fully linked
  supports: { friendship: string[]; partner: string[] };
  personalSkill: string;
  isCorrin: boolean;
  isKana: boolean;
  isCorrinOrKana: boolean;
  isChild: boolean;

  classSet!: Class[];
  startingClass!: Class;
  stats!: CharacterStats;
  fixedParent?: Character;
  variableParents!: Character[];
  fixedChild?: Character;
  variableChildren!: Character[];
  friendships!: Character[];
  partners!: Character[];
  classChangeOptions!: Class[];

  _friendshipKeys: string[];
  _partnerKeys: string[];
  _classSet: string[];
  _startingClassKey: string;
  _parentKey: string | undefined;

  constructor(key: string, raw: RawCharacterData) {
    this.key = key;
    this.name = raw.name;
    this.gender = raw.gender;
    this.route = raw.route;
    this.supports = {
      friendship: parseCSV(raw.supports.friendship),
      partner: parseCSV(raw.supports.partner),
    };
    this.personalSkill = raw.personal_skill;
    this.isCorrin = key === "corrin_m" || key === "corrin_f";
    this.isKana = key === "kana_m" || key === "kana_f";
    this.isCorrinOrKana = this.isCorrin || this.isKana;
    this.isChild = !!raw.parent;

    this._friendshipKeys = parseCSV(raw.supports.friendship);
    this._partnerKeys = parseCSV(raw.supports.partner);
    this._classSet = parseCSV(raw.class_set);
    this._startingClassKey = raw.starting_class ?? this._classSet[0];
    this._parentKey = raw.parent;
  }

  static fromJSON(key: string, raw: RawCharacterData): Character {
    return new Character(key, raw);
  }

  toJSON() {
    const { key, name, stats } = this;
    return {
      key,
      name,
      stats,
    };
  }

  linkObjects(database: Database): void {
    // Hydrate class set
    this.classSet = this._classSet.map((classKey) => {
      const cls = database.classes.get(classKey);
      if (!cls) {
        throw new Error(`Unknown class: ${classKey} (in character ${this.key})`);
      }
      return cls;
    });

    // Hydrate starting class
    const startingClass = database.classes.get(this._startingClassKey);
    if (!startingClass) {
      throw new Error(`Unknown starting class: ${this._startingClassKey} (in character ${this.key})`);
    }
    this.startingClass = startingClass;

    // Hydrate stats
    const stats = database.characterStats.get(this.key);
    if (!stats) {
      throw new Error(`Unknown character stats: ${this.key} (in character ${this.key})`);
    }
    this.stats = stats;

    if (!this.isChild) {
      // calculate absolute base stats by subtracting the starting class's base stats from the character's base stats
      // only applies to non-child characters
      stats.base.forEach((baseStats) => {
        baseStats.subtract(startingClass.stats.base);
      });
    }

    // Hydrate friendships
    this.friendships = this._friendshipKeys.map((key) => {
      const friend = database.characters.get(key);
      if (!friend) {
        throw new Error(`Unknown friendship character: ${key} (in character ${this.key})`);
      }
      return friend;
    });

    // Hydrate partners
    // Note: partners are also used to determine potential parents, so we hydrate them before parents
    this.partners = this._partnerKeys.map((key) => {
      const partner = database.characters.get(key);
      if (!partner) {
        throw new Error(`Unknown partner character: ${key} (in character ${this.key})`);
      }
      return partner;
    });

    // Hydrate parent
    if (this._parentKey) {
      const parent = database.characters.get(this._parentKey);
      if (!parent) {
        throw new Error(`Unknown parent character: ${this._parentKey} (in character ${this.key})`);
      }
      this.fixedParent = parent;

      // Link parent to child (for ease of traversal in both directions)
      parent.fixedChild = this;

      // Hydrate potential parents (partners of parent)
      this.variableParents = parent.partners.filter((variableParent) => {
        // parents must be opposite genders
        return parent.gender !== variableParent.gender;
      });
      this.variableParents.forEach((variableParent) => {
        // Link variable parent to child (for ease of traversal in both directions)
        if (!variableParent.variableChildren) {
          variableParent.variableChildren = [];
        }
        variableParent.variableChildren.push(this);
      });

      // Hydrate second class set from fixed parent
      // Note: if the character is Kana and the parent is Corrin, we skip this step since Kana's second class set is determined by talent options.
      if (!(this.isKana && parent.isCorrin)) {
        this.classSet.push(this.getInheritedClass(parent));
      }
    }

    // Hydrate class change options
    this.classChangeOptions = [...database.classes]
      .filter(([_, cls]) => {
        return cls.matchesGender(this.gender) && (this.hasInClassSet(cls) || !cls.unique);
      })
      .map(([_, cls]) => cls);
  }

  hasInClassSet(cls: Class): boolean {
    return this.classSet.some((cs) => cs.isInClassTree(cls));
  }

  getVariableGrandparents(): Character[] | null {
    const grandparents = new Map();
    this.variableParents?.forEach((variableParent) => {
      variableParent.variableParents?.forEach((variableGrandparent) => {
        if (!variableGrandparent.isCorrin) {
          grandparents.set(variableGrandparent.key, variableGrandparent);
        }
      });
    });
    if (grandparents.size === 0) {
      return null;
    }
    return [...grandparents.values()];
  }

  getInheritedClass(parent: Character): Class {
    if (!this.isChild) {
      throw new Error(`Character (${this.key}) is not a child.`);
    }
    if (parent !== this.fixedParent) {
      if (parent.gender === this.fixedParent?.gender) {
        throw new Error(`Parents (${parent.key} and ${this.fixedParent?.key}) cannot be the same gender.`);
      }
    }

    const child = this;

    // First pass: look for the first inheritable class in the parent's class set that the child doesn't already have.
    for (let i = 0; i < parent.classSet.length; i++) {
      const parentClass = parent.classSet[i];
      if (!parentClass.inheritable) continue;
      if (!child.hasInClassSet(parentClass)) {
        return parentClass.resolveClassForGender(child.gender);
      }
    }

    // Second pass: look for the first parallel class of the parent's class set.
    for (let i = 0; i < parent.classSet.length; i++) {
      const parentClass = parent.classSet[i];
      if (parentClass.parallelClass) {
        return parentClass.parallelClass.resolveClassForGender(child.gender);
      }
    }

    throw new Error(`No inheritable class found from parent ${parent.key} to child ${child.key}`);
  }

  getBorrowedClass(friendOrPartner: Character): Class {
    for (let i = 0; i < friendOrPartner.classSet.length; i++) {
      const borrowedClass = friendOrPartner.classSet[i];
      if (borrowedClass.unique) continue;
      return borrowedClass.resolveClassForGender(this.gender);
    }

    throw new Error(`No borrowable class found from ${friendOrPartner.key} → ${this.key}`);
  }
}
