"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const DataSet = require("../data/models/DataSet");
const Skill = require("../data/models/Skill");

const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "skills.json"), "utf8"),
);
const ds = DataSet.fromJSON(raw, Skill);

// --- fromJSON / size ---
assert(ds.size > 0, "Expected at least one entry");
console.log(`  DataSet loaded: ${ds.size} entries`);

// --- get / has ---
const aegis = ds.get("aegis");
assert(aegis instanceof Skill, "get() should return a Skill instance");
assert.strictEqual(aegis.key, "aegis");
assert.strictEqual(ds.has("aegis"), true, "has() should return true for existing key");
assert.strictEqual(ds.has("nonexistent_key"), false, "has() should return false for missing key");
assert.strictEqual(ds.get("nonexistent_key"), undefined, "get() should return undefined for missing key");
console.log("  get() and has() work correctly");

// --- keys / values / entries ---
const keys = ds.keys();
assert(Array.isArray(keys), "keys() should return an array");
assert.strictEqual(keys.length, ds.size, "keys().length should match size");

const values = ds.values();
assert(Array.isArray(values), "values() should return an array");
assert.strictEqual(values.length, ds.size, "values().length should match size");
assert(values.every((v) => v instanceof Skill), "values() should all be Skill instances");

const entries = ds.entries();
assert(Array.isArray(entries), "entries() should return an array");
assert.strictEqual(entries.length, ds.size, "entries().length should match size");
for (const [key, value] of entries) {
  assert.strictEqual(typeof key, "string");
  assert(value instanceof Skill);
}
console.log("  keys(), values(), entries() work correctly");

// --- filter ---
const withLevel = ds.filter((skill) => skill.level !== null);
assert(withLevel instanceof DataSet, "filter() should return a DataSet");
assert(withLevel.size > 0, "Expected at least one skill with a level");
assert(withLevel.size < ds.size, "Filtered set should be smaller than original");
withLevel.forEach((skill) => {
  assert(skill.level !== null, "Filtered skills should all have a level");
});
console.log(`  filter() works correctly (${withLevel.size} skills with level)`);

// --- find ---
const found = ds.find((skill) => skill.key === "aegis");
assert(found instanceof Skill, "find() should return a Skill instance");
assert.strictEqual(found.key, "aegis");

const notFound = ds.find((skill) => skill.key === "nonexistent_key");
assert.strictEqual(notFound, undefined, "find() should return undefined when no match");
console.log("  find() works correctly");

// --- forEach ---
let count = 0;
ds.forEach((value, key) => {
  assert(value instanceof Skill);
  assert.strictEqual(typeof key, "string");
  count++;
});
assert.strictEqual(count, ds.size, "forEach() should iterate over all entries");
console.log("  forEach() works correctly");

// --- toMap ---
const map = ds.toMap();
assert.strictEqual(typeof map, "object");
assert.strictEqual(Object.keys(map).length, ds.size);
assert(map["aegis"] instanceof Skill);
console.log("  toMap() works correctly");

// --- Symbol.iterator ---
let iterCount = 0;
for (const [key, value] of ds) {
  assert.strictEqual(typeof key, "string");
  assert(value instanceof Skill);
  iterCount++;
}
assert.strictEqual(iterCount, ds.size, "Symbol.iterator should iterate all entries");
console.log("  Symbol.iterator works correctly");

// --- verify database.js integration ---
const db = require("../data/database");
assert(db.skills instanceof DataSet, "database.skills should be a DataSet");
assert(db.skills.size > 0, "database.skills should have entries");
assert(db.skills.get("aegis") instanceof Skill, "database.skills.get() should return Skill instances");
console.log("  database.js integration verified");

console.log("PASS: DataSet tests");
