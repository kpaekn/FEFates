"use strict";

class Class {
  constructor(
    key,
    {
      name,
      unique = false,
      dlc = false,
      weapons = [],
      promotion = [],
      skills = [],
      parallel = null,
      stats = null,
    },
  ) {
    this.key = key;
    this.name = name;
    this.unique = unique;
    this.dlc = dlc;
    this.weapons = weapons;
    this.promotion = promotion;
    this.skills = skills;
    this.parallel = parallel;
    this.stats = stats;
  }

  static fromJSON(key, data) {
    return new Class(key, data);
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

  getDisplayName(displayGender) {
    if (this.key === "nohr_prince_ss") {
      return displayGender === "m" ? "Nohr Prince" : "Nohr Princess";
    }
    return this.name;
  }

  toRenderObject({
    displayGender,
    skillsByKey = {},
    getWeaponIconPath,
    getSkillIconPath,
  }) {
    const weapons = this.weapons.map((weaponKey) => ({
      weaponName: weaponKey
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      iconPath: getWeaponIconPath(weaponKey),
    }));

    const skillList = this.skills.map((skillKey) => {
      const skill = skillsByKey[skillKey];
      if (!skill) {
        console.warn(`[warn] Unknown skill: ${skillKey} (in class ${this.key})`);
      }
      return skill
        ? skill.toRenderObject(getSkillIconPath(skillKey))
        : { name: skillKey, description: "", iconPath: getSkillIconPath(skillKey) };
    });

    return {
      name: this.getDisplayName(displayGender),
      weapons,
      skills: skillList,
    };
  }
}

module.exports = Class;