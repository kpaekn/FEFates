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
    this.classSet = parseCSV(raw.class_set);
    this.gender = raw.gender;
    this.route = raw.route;
    this.supports = {
      friendship: parseCSV(raw.supports.friendship),
      partner: parseCSV(raw.supports.partner),
    };
    this.personalSkill = raw.personal_skill;
    this.startingClass = raw.starting_class;

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
