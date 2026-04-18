"use strict";

const assert = require("assert");
const BaseStat = require("../data/models/BaseStats");
const Stat = require("../data/models/Stats");

const baseStat = new BaseStat(5, 10, 11, 12, 13, 14, 15, 16, 17);

assert(baseStat instanceof BaseStat, "Expected baseStat to be a BaseStat instance");
assert.strictEqual(baseStat.level, 5);
assert(baseStat.stat instanceof Stat, "Expected baseStat.stat to be a Stat instance");
assert.deepStrictEqual({ ...baseStat.stat }, {
  HP: 10,
  Str: 11,
  Mag: 12,
  Skl: 13,
  Spd: 14,
  Lck: 15,
  Def: 16,
  Res: 17,
});

console.log("PASS: BaseStat model tests");