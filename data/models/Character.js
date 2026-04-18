"use strict";

const CharacterStats = require("./CharacterStats");
const { parseCSV } = require("./utils");

/**
 * @typedef {Object} RawCharacterData
 * @property {string} name
 * @property {string} class_set
 * @property {"m" | "f"} gender
 * @property {"all" | "birthright" | "conquest" | "revelation"} route
 * @property {{ friendship: string, partner: string }} supports
 * @property {boolean} adult
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
    this.adult = raw.adult;
    this.personalSkill = raw.personal_skill;
    this.startingClass = raw.starting_class;
    this.rawStats = raw.stats ?? key;
    this.stats = null;

    this._parent = raw.parent;
  }

  /**
   * @param {Map<string, CharacterStats>} characterStatsDataSet
   */
  setStats(characterStatsDataSet) {
    const characterStatsKey = this.rawStats ?? this.key;
    const stats = characterStatsDataSet.get(characterStatsKey);
    if (!stats) {
      throw new Error(
        `Unknown character stats: ${characterStatsKey} (in character ${this.key})`,
      );
    }
    this.stats = stats;
  }

  /**
   * @param {Map<string, Character>} charactersDataSet
   */
  setParent(charactersDataSet) {
    if (this._parent) {
      const parent = charactersDataSet.get(this._parent);
      if (!parent) {
        throw new Error(
          `Unknown parent character: ${this._parent} (in character ${this.key})`,
        );
      }
      this.parent = parent;
    }
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
    return !!this._parent;
  }
}

module.exports = Character;
