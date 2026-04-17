"use strict";

const fs = require("fs");
const path = require("path");

const DATA_DIR = __dirname;

function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8"));
}

module.exports = {
  characters: loadJSON("characters.json"),
  classes: loadJSON("classes.json"),
  skills: loadJSON("skills.json"),
  characterStats: loadJSON("character_stats.json"),
  classStats: loadJSON("class_stats.json"),
  boonBaneStats: loadJSON("boon_bane_stats.json"),
};
