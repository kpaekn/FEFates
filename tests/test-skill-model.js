"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Skill = require("../data/models/Skill");

const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "skills.json"), "utf8"),
);
const skills = {};
for (const [key, data] of Object.entries(raw)) {
  skills[key] = Skill.fromJSON(key, data);
}
const keys = Object.keys(skills);

assert(keys.length > 0, "Expected at least one skill");
console.log(`  skills loaded: ${keys.length}`);

for (const [key, skill] of Object.entries(skills)) {
  assert(skill instanceof Skill, `${key} should be a Skill instance`);
  assert.strictEqual(typeof skill.key, "string", `${key}.key should be a string`);
  assert.strictEqual(skill.key, key, `${key}.key should match its object key`);
  assert.strictEqual(typeof skill.name, "string", `${key}.name should be a string`);
  assert.strictEqual(typeof skill.description, "string", `${key}.description should be a string`);
  assert(
    skill.level === null || typeof skill.level === "number",
    `${key}.level should be null or a number`,
  );
}
console.log("  all skills are valid Skill instances");

const sample = skills["aegis"];
assert(sample, "Expected 'aegis' skill to exist");
assert.strictEqual(typeof sample.name, "string");
assert.strictEqual(typeof sample.description, "string");
console.log("  sample skill has expected properties");

console.log("PASS: Skill model tests");
