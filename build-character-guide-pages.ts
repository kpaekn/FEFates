import fs from "node:fs";
import path from "node:path";
import pug from "pug";

import BaseStats from "./data/models/BaseStats.ts";
import Stats from "./data/models/Stats.ts";
import Character from "./data/models/Character.ts";
import db from "./data/database.ts";
import Class from "./data/models/Class.ts";

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dirname = import.meta.dirname;
const ROOT = path.resolve(__dirname);
const DIST_DIR = "character-guide";
const DIST = path.join(ROOT, DIST_DIR);
const TEMPLATES_DIR = path.join(ROOT, "templates");

// ─── Load data ────────────────────────────────────────────────────────────────

function buildCharacterIndexSections() {
  const sections = {
    all: { title: "", characters: new Array() },
    birthright: { title: "Birthright", characters: new Array() },
    conquest: { title: "Conquest", characters: new Array() },
    revelation: { title: "Revelation", characters: new Array() },
  };
  db.characters.forEach((chara) => {
    sections[chara.route].characters.push(chara);
  });

  return Object.values(sections);
}

function createConfigOptions(character: Character) {
  const variableParents = character.variableParents;
  const showBoonBane = character.isCorrin || variableParents?.some((p) => p.isCorrin);
  return {
    talents: db.getTalentOptions(character.gender),
    talentsHidden: character.isCorrinOrKana ? false : true,
    parents: db.sortCharacters(variableParents),
    grandparents: db.sortCharacters(character.getVariableGrandparents()),
    friendships: character.friendships,
    partners: character.partners,
    classChange: createClassChangeOptions(character),
    boonBane: showBoonBane ? Stats.MAP : undefined,
  };
}

function createClassChangeOptions(character: Character) {
  const options = new Map<string, any>();
  // from talent options
  db.getTalentOptions(character.gender).forEach((talentClass) => {
    talentClass.flattenClassTree().forEach((c) => options.set(c.key, c));
  });
  // from class set, handles unique classes that are not talent options
  character.classSet.forEach((cls) => {
    cls.flattenClassTree().forEach((c) => options.set(c.key, c));
  });
  // from variable parents inheritance, handles unique classes that are not talent options
  character.variableParents?.forEach((parent) => {
    character
      .getInheritedClass(parent)
      .flattenClassTree()
      .forEach((c) => options.set(c.key, c));
  });
  db.getDLCClasses().forEach((cls) => {
    cls.flattenClassTree().forEach((c) => options.set(c.key, c));
  });
  // default selected/hidden values based on starting class
  options.forEach((opt) => {
    const selected = opt.key === character.startingClass.key;
    opt.selected = selected;
    opt.hidden = !selected;
  });
  // no need to check friendship/partner seals since those classes are always covered by talent options
  return db.sortClasses([...options.values()]);
}

function createStatsData(character: Character) {
  return {
    startingClass: character.startingClass,
    labels: {
      growth: Stats.MAP,
      base: BaseStats.MAP,
    },
    growth: character.stats?.growth,
    base: character.stats?.base,
    pairUp: character.getPairUpStats(),
  };
}

function createUiConfig(character: Character) {
  const parents = new Map<string, Character>();
  character.variableParents?.forEach((p) => {
    parents.set(p.key, p);
  });
  const grandparents = new Map<string, Character>();
  character.getVariableGrandparents()?.forEach((gp) => {
    grandparents.set(gp.key, gp);
  });

  return {
    characterKey: character.key,
    parentKey: character.fixedParent?.key,
    boonBaneStats: character.stats?.boonBaneStats,
    parents: parents.size > 0 ? Object.fromEntries(parents) : undefined,
    grandparents: grandparents.size > 0 ? Object.fromEntries(grandparents) : undefined,
  };
}

type Panel = {
  label: string;
  placeholder?: string;
  cls?: Class;
  group?: string;
  key?: string;
  hidden?: boolean;
};

function buildPanels(character: Character): Record<string, Panel[]> {
  const classSetPanels: Panel[] = character.classSet.map((cls, idx) => {
    return {
      label: idx === 0 ? "Default Class" : `Heart Seal`,
      cls: cls,
    };
  });
  const talentPanels: Panel[] = db.getTalentOptions(character.gender).map((cls, idx) => {
    return {
      label: "Talent - " + cls.name,
      cls: cls,
      group: "talent",
      key: cls.key,
      hidden: idx > 0,
    };
  });
  const inheritedClassPanels: Panel[] =
    character.variableParents?.length > 0
      ? [
          {
            label: "Inherited Class",
            placeholder: "(Select a parent)",
            group: "parent",
            key: "",
          },
          ...character.variableParents?.map((parent) => {
            return {
              label: "Inherited Class - " + parent.name,
              cls: character.getInheritedClass(parent),
              group: "parent",
              key: parent.key,
              hidden: true,
            };
          }),
        ]
      : [];
  const partnerClassSetPanels: Panel[] =
    character.partners.length > 0
      ? [
          {
            label: "Partner Seal",
            placeholder: "(Select an S rank support partner)",
            group: "partner",
            key: "",
          },
          ...talentPanels.map((tp) => {
            return {
              ...tp,
              label: "Partner Seal - " + tp.label,
              group: "partner",
              hidden: true,
            };
          }),
          ...character.partners
            .filter((partner) => !partner.isCorrinOrKana)
            .map((partner) => {
              return {
                label: "Partner Seal - " + partner.name,
                cls: character.getBorrowedClass(partner),
                group: "partner",
                key: partner.key,
                hidden: true,
              };
            }),
        ]
      : [];
  const friendshipClassSetPanels: Panel[] =
    character.friendships.length > 0
      ? [
          {
            label: "Friendship Seal",
            placeholder: `(Select an ${character.isCorrin ? "A" : "A+"} rank support partner)`,
            group: "friendship",
            key: "",
          },
          ...talentPanels.map((tp) => {
            return {
              ...tp,
              label: "Friendship Seal - " + tp.label,
              group: "friendship",
              hidden: true,
            };
          }),
          ...character.friendships
            .filter((friend) => !friend.isCorrinOrKana)
            .map((friend) => {
              return {
                label: "Friendship Seal - " + friend.name,
                cls: character.getBorrowedClass(friend),
                group: "friendship",
                key: friend.key,
                hidden: true,
              };
            }),
        ]
      : [];

  return {
    classSet: classSetPanels,
    talentClassSet: character.isCorrinOrKana ? talentPanels : [],
    inheritedClassSet: inheritedClassPanels,
    partnerClassSet: partnerClassSetPanels,
    friendshipClassSet: friendshipClassSetPanels,
  };
}

// ─── Per-character template context ──────────────────────────────────────────
function buildCharacterContext(character: Character) {
  return {
    pageTitle: `Fire Emblem Fates - Character Guides - ${character.name}`,
    indexHref: `./`,
    character,
    configOptions: createConfigOptions(character),
    statsData: createStatsData(character),
    uiConfig: createUiConfig(character),
    panels: buildPanels(character),
  };
}

// ─── Pug helper functions (passed as template locals) ─────────────────────────
const pugHelpers = {
  charaPortraitPath: (name: string) => `../images/portraits/${name}.png`,
  skillIconPath: (skill: string) => `../images/icon/skills/${skill}.png`,
  weaponIconPath: (weapon: string) => `../images/icon/weapons/${weapon}.png`,
};

// ─── Compile Pug templates ────────────────────────────────────────────────────
const characterTemplate = pug.compileFile(path.join(TEMPLATES_DIR, "character.pug"));
const characterIndexTemplate = pug.compileFile(path.join(TEMPLATES_DIR, "character-index.pug"));

// ─── Build ────────────────────────────────────────────────────────────────────
fs.mkdirSync(DIST, { recursive: true });

const indexHtml = characterIndexTemplate({
  pageTitle: "Fire Emblem Fates - Character Guides",
  sections: buildCharacterIndexSections(),
  ...pugHelpers,
});
fs.writeFileSync(path.join(DIST, "index.html"), indexHtml, "utf8");

let count = 0;
for (const [charKey, char] of db.characters.entries()) {
  const context = buildCharacterContext(char);
  const html = characterTemplate({
    ...context,
    ...pugHelpers,
    _context: context,
  });
  fs.writeFileSync(path.join(DIST, `${charKey}.html`), html, "utf8");
  count++;
}

console.log(`Built ${count} pages → ${DIST_DIR}/`);
