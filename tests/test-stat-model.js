"use strict";

const assert = require("assert");
const db = require("../data/database");
const Stat = require("../data/models/Stats");

const stat = new Stat(10, 11, 12, 13, 14, 15, 16, 17);
const hydrated = Stat.fromArray([1, 2, 3, 4, 5, 6, 7, 8]);

assert(stat instanceof Stat, "Expected stat to be a Stat instance");
assert.deepStrictEqual({ ...stat }, {
  HP: 10,
  Str: 11,
  Mag: 12,
  Skl: 13,
  Spd: 14,
  Lck: 15,
  Def: 16,
  Res: 17,
});

assert(hydrated instanceof Stat, "Expected hydrated stat to be a Stat instance");
assert.deepStrictEqual({ ...hydrated }, {
  HP: 1,
  Str: 2,
  Mag: 3,
  Skl: 4,
  Spd: 5,
  Lck: 6,
  Def: 7,
  Res: 8,
});

const samuraiClassStats = db.classes.get("samurai")?.stats;
assert(samuraiClassStats, "Expected samurai class stats to exist");
assert(samuraiClassStats.growth instanceof Stat, "Expected class growth stats to be hydrated as Stat instances");
assert(samuraiClassStats.base instanceof Stat, "Expected class base stats to be hydrated as Stat instances");
assert(samuraiClassStats.max instanceof Stat, "Expected class max stats to be hydrated as Stat instances");

console.log("PASS: Stat model tests");