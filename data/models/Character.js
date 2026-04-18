"use strict";

class Character {
  constructor(key, {
    name,
    class_set,
    gender,
    route = "all",
    supports = {},
    adult = false,
    personal_skill,
    growth = null,
    starting_class = null,
    parent = null,
  }) {
    this.key = key;
    this.name = name;
    this.classSet = Character.parseCSV(class_set);
    this.gender = gender;
    this.route = route;
    this.supports = {
      friendship: Character.parseCSV(supports.friendship),
      partner: Character.parseCSV(supports.partner),
    };
    this.adult = adult;
    this.personalSkill = personal_skill;
    this.growth = growth;
    this.startingClass = starting_class;
    this.parent = parent;
  }

  static fromJSON(key, data) {
    return new Character(key, data);
  }

  static parseCSV(str) {
    if (!str) return [];
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  }

  isChild() {
    return !!this.parent;
  }
}

module.exports = Character;
