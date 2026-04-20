import { test } from "node:test";
import assert from "node:assert/strict";
import db from "../data/database.ts";

// Helper to get a typed character, throwing if not found
function getChar(key: string) {
  const char = db.characters.get(key);
  if (!char) throw new Error(`Unknown character: ${key}`);
  return char;
}

function doTestError(desc: string, childKey: string, parentKey: string) {
  const child = getChar(childKey);
  const parent = getChar(parentKey);
  test(`${desc} - ${parent.name} (${parent._classSet[0]}) → ${child.name} (${child._classSet.join("/")}) → error`, () => {
    assert.throws(() => child.getInheritedClass(parent));
  });
}

function doTest(desc: string, childKey: string, parentKey: string, expectedClassKey: string) {
  const child = getChar(childKey);
  const parent = getChar(parentKey);
  test(`${desc} - ${parent.name} (${parent._classSet[0]}) → ${child.name} (${child._classSet.join("/")}) → ${expectedClassKey}`, () => {
    const inherited = child.getInheritedClass(parent);
    assert.equal(inherited.key, expectedClassKey);
  });
}

// error cases
doTestError("Adult", "kaze", "kaze");
doTestError("Parents Same Gender", "kana_m", "rhajat");

doTest("First", "soleil", "effie", "knight");
doTest("3rd Generation", "kana_f", "rhajat", "diviner");
doTest("Second", "soleil", "selena", "sky_knight");
doTest("Second (Gender Match)", "dwyer", "elise", "wyvern_rider");
doTest("Second (Gender Result)", "siegbert", "felicia", "troubadour_m");
doTest("Unique", "soleil", "corrin_f", "nohr_princess");
doTest("Songstress (Super Unique)", "soleil", "azura", "sky_knight");
doTest("Parallel", "nina", "nyx", "diviner");

// more tests
doTest("Second (Gender Match)", "forrest", "felicia", "mercenary");
doTest("Second (Gender Result)", "hisame", "hana", "monk");
doTest("Unique", "soleil", "mozu", "villager");
doTest("Kana Wolfskin", "kana_f", "velouria", "wolfskin");
doTest("Second, Collide with Fixed Parent", "kiragi", "oboro", "apothecary");
doTest("First", "shiro", "rinkah", "oni_savage");
