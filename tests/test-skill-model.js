"use strict";

const assert = require("assert");
const db = require("../data/database");
const Skill = require("../data/models/Skill");

const skills = db.skills;
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

const rendered = sample.toRenderObject("icons/aegis.png");
assert.strictEqual(rendered.name, sample.name);
assert.strictEqual(rendered.description, sample.description);
assert.strictEqual(rendered.iconPath, "icons/aegis.png");
console.log("  toRenderObject() returns correct shape");

console.log("PASS: Skill model tests");
