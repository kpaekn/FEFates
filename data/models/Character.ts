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
  stats?: string;
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
  _statsKey: string;
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
    this._statsKey = raw.stats ?? key;
    this._parentKey = raw.parent;
  }

  static fromJSON(key: string, raw: RawCharacterData): Character {
    return new Character(key, raw);
  }

  toJSON() {
    const { key, name, fixedParent, variableParents, fixedChild, variableChildren, isCorrin } = this;
    return {
      key,
      name,
      variableChildren,
      isCorrin,
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
    const stats = database.characterStats.get(this._statsKey);
    if (!stats) {
      throw new Error(`Unknown character stats: ${this._statsKey} (in character ${this.key})`);
    }
    this.stats = stats;

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
      this.variableParents = parent.partners.filter((potentialParent) => {
        // parents must be opposite genders
        return parent.gender !== potentialParent.gender;
      });
      this.variableParents.forEach((variableParent) => {
        // Link variable parent to child (for ease of traversal in both directions)
        if (!variableParent.variableChildren) {
          variableParent.variableChildren = [];
        }
        variableParent.variableChildren.push(this);
      });
    }

    // Hydrate class change options
    this.classChangeOptions = [...database.classes]
      .filter(([_, cls]) => {
        return cls.matchesGender(this.gender) && (this._classSet.includes(cls.key) || !cls.unique);
      })
      .map(([_, cls]) => cls);
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
}
