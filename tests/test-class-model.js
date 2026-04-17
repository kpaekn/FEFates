"use strict";

const assert = require("assert");
const db = require("../data/database");
const Class = require("../data/models/Class");

const classes = db.classes;
const keys = Object.keys(classes);

assert(keys.length > 0, "Expected at least one class");
console.log(`  classes loaded: ${keys.length}`);

for (const [key, cls] of Object.entries(classes)) {
  assert(cls instanceof Class, `${key} should be a Class instance`);
  assert.strictEqual(typeof cls.key, "string", `${key}.key should be a string`);
  assert.strictEqual(cls.key, key, `${key}.key should match its object key`);
  assert.strictEqual(typeof cls.name, "string", `${key}.name should be a string`);
  assert.strictEqual(typeof cls.unique, "boolean", `${key}.unique should be a boolean`);
  assert.strictEqual(typeof cls.dlc, "boolean", `${key}.dlc should be a boolean`);
  assert(Array.isArray(cls.weapons), `${key}.weapons should be an array`);
  assert(Array.isArray(cls.promotion), `${key}.promotion should be an array`);
  assert(Array.isArray(cls.skills), `${key}.skills should be an array`);
  assert(
    cls.parallel === null || typeof cls.parallel === "string",
    `${key}.parallel should be null or a string`,
  );
  assert(
    cls.stats === null || typeof cls.stats === "string",
    `${key}.stats should be null or a string`,
  );
}
console.log("  all classes are valid Class instances");

assert.strictEqual(Class.resolveKey("troubadour", "m"), "troubadour_m");
assert.strictEqual(Class.resolveKey("troubadour", "f"), "troubadour_f");
assert.strictEqual(Class.resolveKey("monk", "f"), "shrine_maiden");
assert.strictEqual(Class.resolveKey("shrine_maiden", "m"), "monk");
console.log("  gender-based key resolution behaves correctly");

assert.strictEqual(
  Class.resolveParallelKey("songstress", "m", classes),
  "troubadour_m",
);
assert.strictEqual(
  Class.resolveParallelKey("songstress", "f", classes),
  "troubadour_f",
);
console.log("  parallel resolution behaves correctly");

const nohrPrince = classes.nohr_prince_ss;
assert(nohrPrince, "Expected 'nohr_prince_ss' class to exist");
assert.strictEqual(nohrPrince.getDisplayName("m"), "Nohr Prince");
assert.strictEqual(nohrPrince.getDisplayName("f"), "Nohr Princess");

const rendered = classes.swordmaster.toRenderObject({
  displayGender: "m",
  skillsByKey: db.skills,
  getWeaponIconPath: (weaponKey) => `icons/${weaponKey}.png`,
  getSkillIconPath: (skillKey) => `skills/${skillKey}.png`,
});
assert.strictEqual(rendered.name, "Swordmaster");
assert.deepStrictEqual(rendered.weapons, [
  { weaponName: "Sword", iconPath: "icons/sword.png" },
]);
assert.strictEqual(rendered.skills.length, 2);
assert.strictEqual(rendered.skills[0].iconPath, "skills/astra.png");
assert.strictEqual(rendered.skills[0].name, db.skills.astra.name);
assert.strictEqual(rendered.skills[0].description, db.skills.astra.description);
console.log("  toRenderObject() returns correct shape");

console.log("PASS: Class model tests");