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
    this.parent = raw.parent;
    this.rawStats = raw.stats ?? key;
    this.stats = null;
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
   * @param {string} key
   * @param {RawCharacterData} raw
   * @returns {Character}
   */
  static fromJSON(key, raw) {
    return new Character(key, raw);
  }

  isCorrin() {
    return this.key === "corrin_m" || this.key === "corrin_f";
  }

  isKana() {
    return this.key === "kana_m" || this.key === "kana_f";
  }

  isCorrinOrKana() {
    return this.isCorrin() || this.isKana();
  }

  isChild() {
    return !!this.parent;
  }
}

module.exports = Character;
