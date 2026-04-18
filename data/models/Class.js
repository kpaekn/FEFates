"use strict";

const Skill = require("./Skill");
const ClassStats = require("./ClassStats");
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
    
    this._oppositeGender = raw.opposite_gender ?? null;
    this._promotion = raw.promotion ?? "";
    this._skills = raw.skills ?? "";
    this._parallel = raw.parallel ?? null;
    this._stats = raw.stats ?? key;
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
   * @param {Map<string, Skill>} skillsDataSet
   */
  setSkills(skillsDataSet) {
    this.skills = parseCSV(this._skills)
      .map((skillKey) => {
        const skill = skillsDataSet.get(skillKey);
        if (!skill) {
          throw new Error(`Unknown skill: ${skillKey} (in class ${this.key})`);
        }
        return skill;
      })
      .filter(Boolean);
  }

  /**
   * @param {Map<string, ClassStats>} classStatsDataSet
   */
  setStats(classStatsDataSet) {
    const classStatsKey = this._stats;
    const stats = classStatsDataSet.get(classStatsKey);
    if (!stats) {
      throw new Error(
        `Unknown class stats: ${classStatsKey} (in class ${this.key})`,
      );
    }
    this.stats = stats;
  }

  /**
   * @param {Map<string, Class>} classesDataSet
   */
  setClasses(classesDataSet) {
    if (this._oppositeGender) {
      const oppositeClass = classesDataSet.get(this._oppositeGender);
      if (!oppositeClass) {
        throw new Error(
          `Unknown opposite gender class: ${this._oppositeGender} (in class ${this.key})`,
        );
      }
      this.oppositeGenderClass = oppositeClass;
    }

    this.promotion = parseCSV(this._promotion)
      .map((classKey) => {
        const cls = classesDataSet.get(classKey);
        if (!cls) {
          throw new Error(`Unknown class: ${classKey} (in class ${this.key})`);
        }
        return cls;
      })
      .filter(Boolean);
    
    if (this._parallel) {
      const parallelClass = classesDataSet.get(this._parallel);
      if (!parallelClass) {
        throw new Error(
          `Unknown parallel class: ${this._parallel} (in class ${this.key})`,
        );
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
