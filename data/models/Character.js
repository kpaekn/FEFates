"use strict";

const { parseCSV } = require("./utils");

class Character {
  constructor(key, {
    name,
    class_set,
    gender,
    route = "all",
    supports = { friendship: "", partner: "" },
    adult = false,
    personal_skill,
    growth = null,
    starting_class = null,
    parent = null,
  }) {
    this.key = key;
    this.name = name;
    this.classSet = parseCSV(class_set);
    this.gender = gender;
    this.route = route;
    this.supports = {
      friendship: parseCSV(supports.friendship),
      partner: parseCSV(supports.partner),
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

  isChild() {
    return !!this.parent;
  }
}

module.exports = Character;
