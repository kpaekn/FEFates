"use strict";

const { parseCSV } = require("./utils");

class Character {
  /**
   * @typedef {Object} RawCharacterData
   * @property {string} name
   * @property {string} class_set
   * @property {"m" | "f"} gender
   * @property {"all" | "birthright" | "conquest" | "revelation"} route
   * @property {{ friendship: string, partner: string }} supports
   * @property {boolean} adult
   * @property {string} personal_skill
   * @property {string} growth
   * @property {string} starting_class
   * @property {string} parent
   * 
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
    this.growth = raw.growth;
    this.startingClass = raw.starting_class;
    this.parent = raw.parent;
  }

  /**
   * @param {string} key
   * @param {RawCharacterData} raw
   * @returns {Character}
   */
  static fromJSON(key, raw) {
    return new Character(key, raw);
  }

  isChild() {
    return !!this.parent;
  }
}

module.exports = Character;
