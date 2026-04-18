"use strict";

const DataSet = require("./DataSet");
const Skill = require("./Skill");
const { parseCSV } = require("./utils");

class Class {
  /**
   * @param {string} key
   * @param {*} data // see classes.json
   * @param {DataSet<Skill>} skillsDataSet
   */
  constructor(
    key,
    {
      name,
      unique = false,
      dlc = false,
      weapons,
      promotion = "",
      skills,
      parallel = null,
      stats = null,
    },
    skillsDataSet,
  ) {
    this.key = key;
    this.name = name;
    this.unique = unique;
    this.dlc = dlc;
    this.weapons = parseCSV(weapons);
    this.promotion = parseCSV(promotion);
    this.skills = parseCSV(skills)
      .map((skillKey) => {
        const skill = skillsDataSet.get(skillKey);
        if (!skill) {
          throw new Error(`Unknown skill: ${skillKey} (in class ${key})`);
        }
        return skill;
      })
      .filter(Boolean);
    this.parallel = parallel;
    this.stats = stats;
  }

  /**
   * @param {string} key
   * @param {*} data // see classes.json
   * @param {DataSet<Skill>} skills
   * @returns {Class}
   */
  static fromJSON(key, data, skills) {
    return new Class(key, data, skills);
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
    return key;
  }

  static resolveParallelKey(classKey, recipientGender, classMap) {
    const cls = classMap[classKey];
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

  /**
   * @param {Record<string, Class>} classMap
   * @returns {Set<string>}
   */
  static uniqueKeys(classMap) {
    return new Set(
      Object.entries(classMap)
        .filter(([, cls]) => cls.unique)
        .map(([key]) => key),
    );
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