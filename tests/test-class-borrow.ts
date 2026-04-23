import { test } from "node:test";
import assert from "node:assert/strict";
import db from "../data/database.ts";

function doTest(characterKey: string, partnerKey: string, expectedClassKey: string) {
  const character = db.characters.get(characterKey);
  const partner = db.characters.get(partnerKey);
  if (!character || !partner) assert.fail(`Unknown character or partner: ${characterKey}, ${partnerKey}`);
  test(`${character.name} (${character._classSet.join("/")}) ← ${partner.name} (${partner._classSet.join("/")}) = ${expectedClassKey}`, () => {
    const borrowed = character.getBorrowedClass(partner);
    assert.equal(borrowed.key, expectedClassKey);
  });
}

const tests = {
  hana: {
    jakob: "troubadour_f",
    kaze: "ninja",
    silas: "cavalier",
    subaki: "sky_knight",
    saizo: "ninja",
    azama: "shrine_maiden",
    hayato: "diviner",
    hinata: "oni_savage",
    takumi: "archer",
    kaden: "diviner",
    ryoma: "sky_knight",
    laslow: "mercenary",
    keaton: "fighter",
    felicia: "troubadour_f",
    sakura: "shrine_maiden",
    setsuna: "archer",
    effie: "knight",
  },
  subaki: {
    azura: "troubadour_m",
    felicia: "troubadour_m",
    mozu: "archer",
    rinkah: "oni_savage",
    sakura: "monk",
    hana: "samurai",
    orochi: "diviner",
    hinoka: "spear_fighter",
    setsuna: "archer",
    oboro: "spear_fighter",
    kagero: "ninja",
    nyx: "dark_mage",
    selena: "mercenary",
    saizo: "ninja",
    azama: "monk",
    hinata: "samurai",
    niles: "outlaw",
  },
  saizo: {
    azura: "sky_knight",
    felicia: "troubadour_m",
    mozu: "archer",
    rinkah: "oni_savage",
    sakura: "monk",
    hana: "samurai",
    orochi: "diviner",
    hinoka: "sky_knight",
    setsuna: "archer",
    oboro: "spear_fighter",
    kagero: "diviner",
    beruka: "wyvern_rider",
    charlotte: "fighter",
    kaze: "samurai",
    subaki: "sky_knight",
    ryoma: "samurai",
    laslow: "mercenary",
  },
  odin: {
    azura: "sky_knight",
    felicia: "troubadour_m",
    mozu: "archer",
    orochi: "diviner",
    kagero: "ninja",
    elise: "troubadour_m",
    effie: "knight",
    nyx: "outlaw",
    camilla: "wyvern_rider",
    selena: "mercenary",
    beruka: "wyvern_rider",
    peri: "cavalier",
    charlotte: "fighter",
    niles: "outlaw",
    laslow: "mercenary",
    leo: "troubadour_m",
    hinata: "samurai",
  },
  keaton: {
    azura: "sky_knight",
    felicia: "troubadour_m",
    mozu: "archer",
    rinkah: "oni_savage",
    hana: "samurai",
    elise: "troubadour_m",
    effie: "knight",
    nyx: "dark_mage",
    camilla: "wyvern_rider",
    selena: "mercenary",
    beruka: "wyvern_rider",
    peri: "cavalier",
    charlotte: "fighter",
    arthur: "fighter",
    laslow: "mercenary",
    benny: "knight",
    kaden: "diviner",
  },
  shigure: {
    sophie: "cavalier",
    midori: "apothecary",
    selkie: "diviner",
    mitama: "monk",
    caeldori: "samurai",
    rhajat: "diviner",
    velouria: "fighter",
    ophelia: "dark_mage",
    soleil: "mercenary",
    nina: "outlaw",
    hisame: "samurai",
    forrest: "troubadour_m",
  },
};

Object.entries(tests).forEach(([characterKey, partners]) => {
  const character = db.characters.get(characterKey);
  if (!character) assert.fail(`Unknown character: ${characterKey}`);
  Object.entries(partners).forEach(([partnerKey, expectedClassKey]) => {
    doTest(characterKey, partnerKey, expectedClassKey);
  });
});

// const char = db.characters.get("subaki");
// if (char) {
//   console.log(char.name);
//   [...char.partners, ...char.friendships].forEach((friend) => {
//     const borrowed = char.getBorrowedClass(friend);
//     if (borrowed) {
//       console.log(`  ${friend.key} → ${borrowed.key}`);
//     } else {
//       console.log(`  ${friend.key} → (no borrowable class)`);
//     }
//   });
// }
