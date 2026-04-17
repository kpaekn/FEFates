"use strict";

class Skill {
  constructor(key, { name, description, level }) {
    this.key = key;
    this.name = name;
    this.description = description;
    this.level = level ?? null;
  }

  static fromJSON(key, data) {
    return new Skill(key, data);
  }

  toRenderObject(iconPath) {
    return {
      name: this.name,
      description: this.description,
      iconPath,
    };
  }
}

module.exports = Skill;
