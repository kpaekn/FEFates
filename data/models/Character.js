"use strict";

const { parseCSV } = require("./utils");

/**
 * @typedef {Object} RawCharacterData
 * @property {string} name
 * @property {string} class_set
 * @property {"m" | "f"} gender
 * @property {"all" | "birthright" | "conquest" | "revelation"} route
 * @property {{ friendship: string, partner: string }} supports
 * @property {string} personal_skill
 * @property {string} starting_class
 * @property {string} parent
 * @property {string | null} stats
 */

class Character {
  /**
   * @param {string} key
   * @param {RawCharacterData} raw
   */
  constructor(key, raw) {
    this.key = key;
    this.name = raw.name;
    this.gender = raw.gender;
    this.route = raw.route;
    this.supports = {
      friendship: parseCSV(raw.supports.friendship),
      partner: parseCSV(raw.supports.partner),
    };
    this.personalSkill = raw.personal_skill;

    this._classSet = parseCSV(raw.class_set);
    this._startingClassKey = raw.starting_class ?? this._classSet[0];
    this._statsKey = raw.stats ?? key;
    this._parentKey = raw.parent;
  }

  /**
   * @param {string} key
   * @param {RawCharacterData} raw
   * @returns {Character}
   */
  static fromJSON(key, raw) {
    return new Character(key, raw);
  }

  /**
   * @param {import("../database")} database
   */
  linkObjects(database) {
    // Resolve class set
    this.classSet = this._classSet.map((classKey) => {
      const cls = database.classes.get(classKey);
      if (!cls) {
        throw new Error(`Unknown class: ${classKey} (in character ${this.key})`);
      }
      return cls;
    });

    // Resolve starting class
    const startingClass = database.classes.get(this._startingClassKey);
    if (!startingClass) {
      throw new Error(`Unknown starting class: ${this._startingClassKey} (in character ${this.key})`);
    }
    this.startingClass = startingClass;

    // Resolve stats
    const stats = database.characterStats.get(this._statsKey);
    if (!stats) {
      throw new Error(`Unknown character stats: ${this._statsKey} (in character ${this.key})`);
    }
    this.stats = stats;

    // Resolve parent
    if (this._parentKey) {
      const parent = database.characters.get(this._parentKey);
      if (!parent) {
        throw new Error(`Unknown parent character: ${this._parentKey} (in character ${this.key})`);
      }
      this.parent = parent;
    }

    // Resolve class change options
    // A character can change into any class in their class set + all non-unique classes.
    // Gender-restricted classes only count if they match the character
    this.classChangeOptions = [...database.classes]
      .filter(([_, cls]) => {
        const isInClassSet = this.classSet?.some((classSetCls) => {
          return (
            classSetCls.key === cls.key || classSetCls.promotion?.some((promotedCls) => promotedCls.key === cls.key)
          );
        });
        return cls.matchesGender(this.gender) && (isInClassSet || !cls.unique);
      })
      .map(([_, cls]) => cls);
  }

  /**
   * @returns {boolean}
   */
  isCorrin() {
    return this.key === "corrin_m" || this.key === "corrin_f";
  }

  /**
   * @returns {boolean}
   */
  isKana() {
    return this.key === "kana_m" || this.key === "kana_f";
  }

  /**
   * @returns {boolean}
   */
  isCorrinOrKana() {
    return this.isCorrin() || this.isKana();
  }

  /**
   * @returns {boolean}
   */
  isChild() {
    return !!this._parentKey;
  }
}

module.exports = Character;
