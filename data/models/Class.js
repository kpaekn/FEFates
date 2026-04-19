"use strict";

const { parseCSV } = require("./utils");

/**
 * @typedef {Object} RawClassData
 * @property {string} name
 * @property {string} gender
 * @property {string} opposite_gender
 * @property {boolean} unique
 * @property {boolean} dlc
 * @property {string} weapons
 * @property {string} promotion
 * @property {string} skills
 * @property {string} parallel
 * @property {string} stats
 */

class Class {
  /**
   * @param {string} key
   * @param {RawClassData} raw
   */
  constructor(key, raw) {
    this.key = key;
    this.name = raw.name;
    this.gender = raw.gender ?? null;
    this.unique = raw.unique ?? false;
    this.dlc = raw.dlc ?? false;
    this.weapons = parseCSV(raw.weapons);

    this._oppositeGenderedClassKey = raw.opposite_gender ?? "";
    this._promotionClassKeys = parseCSV(raw.promotion);
    this._skillKeys = parseCSV(raw.skills);
    this._parallelClassKey = raw.parallel ?? "";
    this._statsKey = raw.stats ?? key;
  }

  /**
   * @param {string} key
   * @param {RawClassData} raw
   * @returns {Class}
   */
  static fromJSON(key, raw) {
    return new Class(key, raw);
  }

  /**
   * @param {import("../database")} database
   */
  linkObjects(database) {
    // Resolve skills
    this.skills = this._skillKeys
      .map((skillKey) => {
        const skill = database.skills.get(skillKey);
        if (!skill) {
          throw new Error(`Unknown skill: ${skillKey} (in class ${this.key})`);
        }
        return skill;
      })
      .filter(Boolean);

    // Resolve stats
    const stats = database.classStats.get(this._statsKey);
    if (!stats) {
      throw new Error(`Unknown class stats: ${this._statsKey} (in class ${this.key})`);
    }
    this.stats = stats;

    // Resolve opposite gendered class
    if (this._oppositeGenderedClassKey) {
      const oppositeClass = database.classes.get(this._oppositeGenderedClassKey);
      if (!oppositeClass) {
        throw new Error(`Unknown opposite gender class: ${this._oppositeGenderedClassKey} (in class ${this.key})`);
      }
      this.oppositeGenderClass = oppositeClass;
    }

    // Resolve promotion classes
    this.promotion = this._promotionClassKeys
      .map((classKey) => {
        const cls = database.classes.get(classKey);
        if (!cls) {
          throw new Error(`Unknown class: ${classKey} (in class ${this.key})`);
        }
        return cls;
      })
      .filter(Boolean);

    // Resolve parallel class
    if (this._parallelClassKey) {
      const parallelClass = database.classes.get(this._parallelClassKey);
      if (!parallelClass) {
        throw new Error(`Unknown parallel class: ${this._parallelClassKey} (in class ${this.key})`);
      }
      this.parallelClass = parallelClass;
    }
  }

  /**
   * @param {string} gender
   * @returns {Class}
   */
  resolveClassForGender(gender) {
    if (this.gender === gender) {
      return this;
    }
    return this.oppositeGenderClass || this;
  }

  /**
   * @returns {boolean}
   */
  isTalent() {
    return !this.unique && !this.dlc && this._hasPromotion();
  }

  _hasPromotion() {
    return !!this.promotion && this.promotion.length > 0;
  }
}

module.exports = Class;
