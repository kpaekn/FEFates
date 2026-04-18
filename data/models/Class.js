"use strict";

const Skill = require("./Skill");
const ClassStats = require("./ClassStats");
const { parseCSV } = require("./utils");

/**
 * @typedef {Object} RawClassData
 * @property {string} name
 * @property {string} gender
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
    this.promotion = parseCSV(raw.promotion);
    
    this._skills = raw.skills;
    this._parallel = raw.parallel ?? null;
    this.parallelClass = null;
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
   * @param {Map<string, Class>} classDataSet
   */
  setParallelClass(classDataSet) {
    if (this._parallel) {
      const parallelClass = classDataSet.get(this._parallel);
      if (!parallelClass) {
        throw new Error(
          `Unknown parallel class: ${this._parallel} (in class ${this.key})`,
        );
      }
      this.parallelClass = parallelClass;
    }
  }

  static resolveKey(key, gender) {
    if (
      key === "troubadour" ||
      key === "troubadour_m" ||
      key === "troubadour_f"
    ) {
      return gender === "m" ? "troubadour_m" : "troubadour_f";
    }
    if (key === "monk" || key === "shrine_maiden") {
      return gender === "m" ? "monk" : "shrine_maiden";
    }
    if (
      key === "nohr_prince_ss" ||
      key === "nohr_prince" ||
      key === "nohr_princess"
    ) {
      return gender === "m" ? "nohr_prince" : "nohr_princess";
    }
    return key;
  }

  isAvailableForGender(gender) {
    if (this.key === "troubadour_m" && gender === "f") return false;
    if (this.key === "troubadour_f" && gender === "m") return false;
    if (this.key === "monk" && gender === "f") return false;
    if (this.key === "shrine_maiden" && gender === "m") return false;
    return true;
  }

  getDisplayName(displayGender) {
    if (this.key === "nohr_prince_ss") {
      return displayGender === "m" ? "Nohr Prince" : "Nohr Princess";
    }
    return this.name;
  }

  toRenderObject({ displayGender }) {
    const weapons = this.weapons.map((weaponKey) => ({
      key: weaponKey,
      weaponName: weaponKey
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    }));

    return {
      name: this.getDisplayName(displayGender),
      weapons,
      skills: this.skills,
    };
  }
}

module.exports = Class;
