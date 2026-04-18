"use strict";

const { parseCSV } = require("./utils");

class Class {
  constructor(
    key,
    {
      name,
      unique = false,
      dlc = false,
      weapons = "",
      promotion = "",
      skills = "",
      parallel = null,
      stats = null,
    },
    skillMap = {},
  ) {
    this.key = key;
    this.name = name;
    this.unique = unique;
    this.dlc = dlc;
    this.weapons = parseCSV(weapons);
    this.promotion = parseCSV(promotion);
    this.skills = parseCSV(skills)
      .map((skillKey) => {
        const skill = skillMap[skillKey];
        if (!skill) {
          console.warn(`[warn] Unknown skill: ${skillKey} (in class ${key})`);
        }
        return skill ?? null;
      })
      .filter(Boolean);
    this.parallel = parallel;
    this.stats = stats;
  }

  static fromJSON(key, data, skillMap = {}) {
    return new Class(key, data, skillMap);
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

  toRenderObject({ displayGender, getWeaponIconPath, getSkillIconPath }) {
    const weapons = this.weapons.map((weaponKey) => ({
      weaponName: weaponKey
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      iconPath: getWeaponIconPath(weaponKey),
    }));

    const skillList = this.skills.map((skill) =>
      skill.toRenderObject(getSkillIconPath(skill.key)),
    );

    return {
      name: this.getDisplayName(displayGender),
      weapons,
      skills: skillList,
    };
  }
}

module.exports = Class;