"use strict";

const fs = require("fs");
const path = require("path");

const Skill = require("./models/Skill");

const DATA_DIR = __dirname;

function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8"));
}

function hydrateSkills(raw) {
  const result = {};
  for (const [key, data] of Object.entries(raw)) {
    result[key] = Skill.fromJSON(key, data);
  }
  return result;
}

module.exports = {
  characters: loadJSON("characters.json"),
  classes: loadJSON("classes.json"),
  skills: hydrateSkills(loadJSON("skills.json")),
  characterStats: loadJSON("character_stats.json"),
  classStats: loadJSON("class_stats.json"),
  boonBaneStats: loadJSON("boon_bane_stats.json"),
};
