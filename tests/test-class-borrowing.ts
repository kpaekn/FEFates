import { test } from "node:test";
import assert from "node:assert/strict";
import db from "../data/database.ts";

// Helper to get a typed character, throwing if not found
function getChar(key: string) {
  const char = db.characters.get(key);
  if (!char) throw new Error(`Unknown character: ${key}`);
  return char;
}

function doTestError(desc: string, characterKey: string, friendKey: string) {
  const character = getChar(characterKey);
  const friend = getChar(friendKey);
  test(`${desc} - ${friend.name} (${friend._classSet[0]}) → ${character.name} (${character._classSet.join("/")}) → error`, () => {
    assert.throws(() => character.getBorrowedClass(friend));
  });
}

function doTest(desc: string, characterKey: string, friendKey: string, expectedClassKey: string) {
  const character = getChar(characterKey);
  const friend = getChar(friendKey);
  test(`${desc} - ${friend.name} (${friend._classSet[0]}) → ${character.name} (${character._classSet.join("/")}) → ${expectedClassKey}`, () => {
    const borrowed = character.getBorrowedClass(friend);
    assert.equal(borrowed.key, expectedClassKey);
  });
}

doTest("", "corrin_m", "azura", "sky_knight");
