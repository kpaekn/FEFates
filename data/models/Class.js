"use strict";

const DataSet = require("./DataSet");
const Skill = require("./Skill");
const { parseCSV } = require("./utils");

class Class {
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
   *
   * @param {string} key
   * @param {RawClassData} raw
   */
  constructor(key, raw) {
    this.key = key;
    this.name = raw.name;
    this.gender = raw.gender;
    this.unique = raw.unique;
    this.dlc = raw.dlc;
    this.weapons = parseCSV(raw.weapons);
    this.promotion = parseCSV(raw.promotion);
    this.rawSkills = raw.skills;
    this.parallel = raw.parallel;
    this.stats = raw.stats;
  }

  /**
   * @param {DataSet<Skill>} skillsDataSet
   */
  updateSkills(skillsDataSet) {
    this.skills = parseCSV(this.rawSkills)
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
   * @param {string} key
   * @param {RawClassData} raw
   * @returns {Class}
   */
  static fromJSON(key, raw) {
    return new Class(key, raw);
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
    if (key === "nohr_prince_ss" || key === "nohr_prince" || key === "nohr_princess") {
      return gender === "m" ? "nohr_prince" : "nohr_princess";
    }
    return key;
  }

  static resolveParallelKey(classKey, recipientGender, classesDataSet) {
    const cls = classesDataSet.get(classKey);
    if (!cls?.parallel) {
      return classKey;
    }

    const parts = cls.parallel.split(",").map((value) => value.trim());
    if (parts.length === 1) return parts[0];
    return recipientGender === "m" ? parts[0] : parts[1];
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
