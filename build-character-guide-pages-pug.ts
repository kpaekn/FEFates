import fs from "node:fs";
import path from "node:path";
import pug from "pug";

import BaseStats from "./data/models/BaseStats.ts";
import Stats from "./data/models/Stats.ts";
import Character from "./data/models/Character.ts";
import Class from "./data/models/Class.ts";
import db from "./data/database.ts";

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dirname = import.meta.dirname;
const ROOT = path.resolve(__dirname);
const DIST_DIR = "character-guide-pug";
const DIST = path.join(ROOT, DIST_DIR);
const TEMPLATES_DIR = path.join(ROOT, "templates-pug");

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

const UNIQUE_CLASS_KEYS = new Set(
  Array.from(db.classes.entries())
    .filter(([, cls]) => cls.unique)
    .map(([key]) => key),
);

// ─── Class-key helpers ────────────────────────────────────────────────────────
/**
 * @param {string} rawKey
 * @param {string} gender
 */
function getResolvedClass(rawKey, gender) {
  let cls = db.classes.get(rawKey);
  if (!cls) {
    throw new Error(`Raw class key "${rawKey}" is not valid`);
  }

  return cls.resolveClassForGender(gender);
}

/**
 * @param {string} rawKey
 * @param {string} gender
 */
function getResolvedClassKey(rawKey, gender) {
  return getResolvedClass(rawKey, gender)?.key || rawKey;
}

function resolveParallel(classKey, recipientGender) {
  const cls = getResolvedClass(classKey, recipientGender);
  if (!cls?.parallelClass) {
    return cls?.key || classKey;
  }

  return getResolvedClassKey(cls.parallelClass.key, recipientGender);
}

function enrichClass(classKey, displayGender) {
  const cls = getResolvedClass(classKey, displayGender);
  if (!cls) {
    throw new Error(`Unknown class: ${classKey} ${displayGender}`);
  }
  return cls;
}

/**
 * Resolve a raw class key into its full promotion tree:
 *   [base, promotion1, promotion2, ...]
 * Uses charGender for the Nohr Prince(ss) name and troubadour resolution.
 */
function resolveClassTree(rawKey, charGender) {
  const cls = getResolvedClass(rawKey, charGender);
  if (!cls) {
    console.warn(`[warn] Unknown class in tree: ${rawKey}`);
    return [];
  }
  const result = [enrichClass(cls.key, charGender)];
  if (cls.promotion) {
    for (const promCls of cls.promotion) {
      result.push(enrichClass(promCls.key, charGender));
    }
  }
  return result;
}

/**
 * Build the sorted talent option list for a Corrin/Kana character.
 * Includes all non-unique base classes (those with a promotion field and not
 * promoted-into by another class). Troubadour is gender-resolved.
 * Returns [{ key, name, selected }] where first item is selected.
 */
function getTalentOptions(gender) {
  const options = [];
  const seenClassKeys = new Set();
  for (const [key, cls] of db.classes.entries()) {
    if (!cls.isTalent() || !cls.matchesGender(gender)) continue;
    const resolvedClass = getResolvedClass(key, gender);
    if (!resolvedClass || seenClassKeys.has(resolvedClass.key)) continue;
    seenClassKeys.add(resolvedClass.key);
    options.push({ key: resolvedClass.key, name: resolvedClass.name });
  }
  options.sort((a, b) => a.name.localeCompare(b.name));
  const defaultKey = options.some((o) => o.key === "samurai") ? "samurai" : options[0]?.key;
  return options.map((opt) => ({ ...opt, selected: opt.key === defaultKey }));
}

// ─── Seal resolution ──────────────────────────────────────────────────────────
/**
 * Determine which class key a character (char) gains via a
 * Friendship or Partner Seal with a given partner.
 *
 * Cases (applied in priority order):
 *   B:   partner's first class is a unique-first class → use partner's second
 *   B+A: partner's first is unique AND second == char's first
 *          → use parallel of partner's first class (or talent class if Corrin/Kana)
 *   A:   partner's first == char's first → use partner's second class
 *   N:   normal → use partner's first class
 *
 * @param {object} char            - The character using the seal
 * @param {string} partnerKey      - The partner character key
 * @param {string|null} partnerTalentKey
 *   The already-resolved talent class key (required when partner is Corrin/Kana)
 */
function resolveSealClassKey(char, partnerKey, partnerTalentKey) {
  const partner = db.characters.get(partnerKey);
  if (!partner) {
    console.warn(`[warn] Unknown partner: ${partnerKey}`);
    return null;
  }

  const charFirstKey = getResolvedClassKey(char.classSet[0].key, char.gender);
  const partnerFirstKey = getResolvedClassKey(partner.classSet[0].key, partner.gender);

  const isPartnerCorrinKana = partner.isCorrinOrKana;

  // Determine the partner's effective "second class" (talent for Corrin/Kana)
  let partnerSecondKey;
  if (isPartnerCorrinKana) {
    if (!partnerTalentKey) {
      console.warn(`[warn] Corrin/Kana partner ${partnerKey} requires a talent key`);
      return null;
    }
    // Talent key is already gender-resolved (from getTalentOptions for that Corrin/Kana)
    partnerSecondKey = partnerTalentKey;
  } else {
    if (partner.classSet.length < 2) {
      // Partner has only one class; nothing to fall back to in Case A
      return partnerFirstKey;
    }
    partnerSecondKey = getResolvedClassKey(partner.classSet[1].key, partner.gender);
  }

  // ── Case B: partner's first class is a unique-first class ────────────────
  if (UNIQUE_CLASS_KEYS.has(partnerFirstKey)) {
    let lentKey = partnerSecondKey;

    // ── Case B+A compound: the fallback second class is also char's first ─
    if (lentKey === charFirstKey) {
      lentKey = isPartnerCorrinKana
        ? resolveParallel(partnerSecondKey, char.gender) // parallel of talent
        : resolveParallel(partnerFirstKey, char.gender); // parallel of unique class
    }

    return lentKey;
  }

  // ── Case A: partner's first class is the same as char's first ────────────
  if (partnerFirstKey === charFirstKey) {
    return partnerSecondKey;
  }

  // ── Normal ────────────────────────────────────────────────────────────────
  return partnerFirstKey;
}

/** Resolve the class key and build the full class tree for a seal panel. */
function buildSealClasses(char, partnerKey, partnerTalentKey) {
  const lentKey = resolveSealClassKey(char, partnerKey, partnerTalentKey);
  if (!lentKey) return [];
  return resolveClassTree(lentKey, char.gender);
}

// ─── Child inheritance ─────────────────────────────────────────────────────────
/**
 * Resolve which class key a donor parent contributes to a child.
 * Applies Cases B, B+A, A, and Normal (same logic as seal resolution).
 * Does NOT handle Corrin/Kana donors — callers short-circuit those first.
 */
function resolveParentContribution(childFirstKey, donorClassKeys, donorGender, childGender) {
  const donorFirstKey = getResolvedClassKey(donorClassKeys[0], donorGender);
  if (donorClassKeys.length < 2) return donorFirstKey;
  const donorSecondKey = getResolvedClassKey(donorClassKeys[1], donorGender);

  // Case B: donor's first class is unique
  if (UNIQUE_CLASS_KEYS.has(donorFirstKey)) {
    let lentKey = donorSecondKey;
    // Case B+A: the fallback second is also the child's first
    if (lentKey === childFirstKey) {
      lentKey = resolveParallel(donorFirstKey, childGender);
    }
    return lentKey;
  }

  // Case A: donor's first == child's first
  if (donorFirstKey === childFirstKey) return donorSecondKey;

  // Normal
  return donorFirstKey;
}

/**
 * Determine which class key a child inherits from their variable parent.
 * Corrin/Kana always contribute nohr_prince or nohr_princess (no talent needed).
 * Also checks Case C: if the result matches what the fixed parent contributes,
 * use the variable parent's second class instead.
 */
function resolveChildInheritedClassKey(child, varParentKey) {
  const childClassKeys = child.classSet.map((cls) => cls.key);
  const childFirstKey = getResolvedClassKey(childClassKeys[0], child.gender);
  const variableParent = db.characters.get(varParentKey);

  // Corrin/Kana as variable parent always contribute nohr_prince or nohr_princess
  if (variableParent?.isCorrinOrKana) {
    if (child.gender === "m") return "nohr_prince";
    else return "nohr_princess";
  }

  const varParent = db.characters.get(varParentKey);
  if (!varParent) {
    console.warn(`[warn] Unknown variable parent: ${varParentKey}`);
    return null;
  }
  const varParentClassKeys = varParent.classSet?.map((cls) => cls.key) || [];
  const candidate = resolveParentContribution(
    childFirstKey,
    varParentClassKeys,
    varParent.gender,
    child.gender,
  );

  // Case C: candidate == fixed parent's contribution → fall back to var parent's second
  const fixedParent = child.parent;
  if (fixedParent) {
    const fixedContribution = fixedParent.isCorrinOrKana
      ? "nohr_prince_ss"
      : resolveParentContribution(
          childFirstKey,
          fixedParent.classSet?.map((cls) => cls.key) || [],
          fixedParent.gender,
          child.gender,
        );
    if (candidate === fixedContribution && varParentClassKeys.length >= 2) {
      const fallback = getResolvedClassKey(varParentClassKeys[1], varParent.gender);
      if (fallback === childFirstKey) {
        return resolveParallel(candidate, child.gender);
      }
      return fallback;
    }
  }

  return candidate;
}

/**
 * Build the option list and panel list for the child parent dropdown.
 * Options are the fixed parent's partner support list, sorted by name.
 */
function buildChildParentSection(char) {
  const fixedParent = char.fixedParent;
  if (!fixedParent) {
    console.warn(`[warn] Unknown fixed parent: ${char.key}`);
    return { parentOptions: [], parentPanels: [] };
  }
  const varParentKeys = parseSupportList(fixedParent.supports?.partner);
  const sorted = [...varParentKeys].sort((a, b) => {
    const na = db.characters.get(a)?.name ?? a;
    const nb = db.characters.get(b)?.name ?? b;
    return na.localeCompare(nb);
  });

  const parentOptions = [];
  const parentPanels = [];

  for (const varParentKey of sorted) {
    const varParent = db.characters.get(varParentKey);
    if (!varParent) {
      console.warn(`[warn] Unknown variable parent: ${varParentKey}`);
      continue;
    }

    if (varParent.gender === fixedParent.gender) continue;

    parentOptions.push({ key: varParentKey, displayName: varParent.name });

    const inheritedKey = resolveChildInheritedClassKey(char, varParentKey);
    if (!inheritedKey) continue;

    parentPanels.push({
      group: "parent-panel",
      key: varParentKey,
      label: `Inherited Class - ${varParent.name}`,
      classes: resolveClassTree(inheritedKey, char.gender),
      isHidden: true,
    });
  }

  return { parentOptions, parentPanels };
}

// ─── Context helpers ──────────────────────────────────────────────────────────
function parseSupportList(list) {
  if (!list) return [];
  if (Array.isArray(list)) return list;
  return list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build option list + panel list for one seal column (friendship or partner).
 * Corrin/Kana entries get a nested talent sub-select instead of a single panel.
 */
function buildSealSection(char, sealType, supportKeys) {
  const panelGroup = `${sealType}-panel`;
  const sealLabel = sealType === "friendship" ? "Friendship Seal" : "Partner Seal";
  const options = [];
  const panels = [];

  for (const partnerKey of supportKeys) {
    const partner = db.characters.get(partnerKey);
    if (!partner) {
      console.warn(`[warn] Unknown support character: ${partnerKey}`);
      continue;
    }

    options.push({ key: partnerKey, displayName: partner.name });

    if (partner.isCorrinOrKana) {
      const talentOptions = getTalentOptions(partner.gender);
      const talentSubGroup = `${sealType}-talent-${partnerKey}`;
      const talentPanels = talentOptions.map((opt) => ({
        key: opt.key,
        label: `${sealLabel} - ${partner.name}`,
        group: talentSubGroup,
        classes: buildSealClasses(char, partnerKey, opt.key),
        isHidden: true,
      }));
      panels.push({
        panelKey: partnerKey,
        isCorrinOrKana: true,
        group: panelGroup,
        talentOptions,
        talentSubGroup,
        talentPanels,
        isHidden: true,
      });
    } else {
      panels.push({
        panelKey: partnerKey,
        isCorrinOrKana: false,
        group: panelGroup,
        key: partnerKey,
        label: `${sealLabel} - ${partner.name}`,
        classes: buildSealClasses(char, partnerKey, null),
        isHidden: true,
      });
    }
  }

  return { options, panels };
}

/**
 * @param {import("./data/models/Character")} character
 * @param {object[]} rawBaseStatsRows
 * @returns
 */
function createBoonBaneOptions(character, rawBaseStatsRows) {
  const boonBaneStats = character.stats?.boonBaneStats;
  if (!boonBaneStats) return null;

  return {
    template: {
      selectOptions: Stats.KEYS.map((key, index) => ({ key, name: Stats.LABELS[index] })),
    },
    js: {
      growthBoonMap: boonBaneStats.growth ? Stats.multiModifierMap(boonBaneStats.growth.boon) : null,
      growthBaneMap: boonBaneStats.growth ? Stats.multiModifierMap(boonBaneStats.growth.bane) : null,
      baseStatBoonMap: boonBaneStats.base ? Stats.singleModifierMap(boonBaneStats.base.boon) : null,
      baseStatBaneMap: boonBaneStats.base ? Stats.singleModifierMap(boonBaneStats.base.bane) : null,
      baseStatRows: rawBaseStatsRows.map((row) => Stats.KEYS.map((key) => row[key] ?? 0)),
    },
  };
}

function createConfigOptions(character: Character) {
  return {
    talents: db.getTalentOptions(character.gender),
    boonBane: Stats.MAP,
    parents: character.variableParents,
    grandparents: db.sortCharacters(character.getVariableGrandparents()),
    friendships: character.friendships,
    partners: character.partners,
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
  };
}

function createUiConfig(character: Character) {
  const parents = new Map<string, Character>();
  if (character.fixedParent) {
    parents.set(character.fixedParent.key, character.fixedParent);
  }
  character.variableParents?.forEach((parent) => {
    parents.set(parent.key, parent);
  });

  return {
    characterKey: character.key,
    parentKey: character.fixedParent?.key,
    boonBane: character.stats?.boonBaneStats,
    parents: parents.size > 0 ? Object.fromEntries(parents) : null,
  };
}

// ─── Per-character template context ──────────────────────────────────────────
/**
 * @returns
 */
function buildCharacterContext(character: Character) {
  const charKey = character.key;
  const classSetKeys = character.classSet?.map((cls) => cls.key) || [];

  // Character growth rates
  const charGrowth = character.stats?.growth;
  const baseGrowthValues = charGrowth ? charGrowth.toArray() : [];
  const growthRates = baseGrowthValues.map((value, index) => ({
    stat: Stats.LABELS[index],
    value,
  }));

  const classGrowthMap = Object.fromEntries(
    new Map(
      character.classChangeOptions?.map((cls) => {
        return [cls.key, cls.stats?.growth.toArray()];
      }),
    ),
  );
  const classGrowthOptions = character.classChangeOptions?.map((cls) => {
    return {
      key: cls.key,
      name: cls.name,
      selected: cls.key === character.startingClass?.key,
    };
  });

  // Base stat rows from character_stats.json variants
  const rawBaseStatsRows = (() => {
    const raw = character.stats?.base || {};
    const rows = [];
    const variants = Object.entries(raw);
    for (const [variant, baseStats] of variants) {
      rows.push(
        baseStats.toRow({
          rowKey: variant.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
          label: variant,
        }),
      );
    }
    return rows;
  })();
  const baseStatsRows = rawBaseStatsRows;
  const baseStatsHeaders = ["Level", ...Stats.LABELS];
  const boonBaneOptions = createBoonBaneOptions(character, rawBaseStatsRows);

  // Talent options (only meaningful for Corrin/Kana pages, but built here)
  const talentOptions = character.isCorrinOrKana ? getTalentOptions(character.gender) : [];

  // ── Default class panels ──────────────────────────────────────────────────
  // First class-set key → "Default Class Set"
  // Subsequent keys     → "Heart Seal - {base class name}"
  const defaultPanels = classSetKeys.map((rawKey, i) => {
    const label = i === 0 ? "Default Class Set" : `Heart Seal`;
    return { label, classes: resolveClassTree(rawKey, character.gender) };
  });

  // ── Heart Seal talent panels (Corrin/Kana only) ───────────────────────────
  // All panels start hidden; JS shows the one matching the talent select.
  const heartSealTalentPanels = character.isCorrinOrKana
    ? talentOptions.map((opt) => ({
        key: opt.key,
        label: `Heart Seal`,
        group: "heart-seal",
        classes: resolveClassTree(opt.key, character.gender),
        isHidden: true,
      }))
    : [];

  // ── Friendship supports ───────────────────────────────────────────────────
  const friendshipKeys = parseSupportList(character.supports?.friendship);
  const hasFriendship = friendshipKeys.length > 0;
  let friendshipOptions = [];
  let friendshipPanels = [];
  if (hasFriendship) {
    const built = buildSealSection(character, "friendship", friendshipKeys);
    friendshipOptions = built.options;
    friendshipPanels = built.panels;
  }

  // ── Partner supports ──────────────────────────────────────────────────────
  const partnerKeys = parseSupportList(character.supports?.partner);
  const hasPartner = partnerKeys.length > 0;
  let partnerOptions = [];
  let partnerPanels = [];
  if (hasPartner) {
    const built = buildSealSection(character, "partner", partnerKeys);
    partnerOptions = built.options;
    partnerPanels = built.panels;
  }

  // ── Child parent dropdown ──────────────────────────────────────────────────
  const isChild = character.isChild;
  let parentOptions = [];
  let parentPanels = [];
  if (isChild) {
    const built = buildChildParentSection(character);
    parentOptions = built.parentOptions;
    parentPanels = built.parentPanels;
  }

  return {
    pageTitle: `Fire Emblem Fates - Character Guides - ${character.name}`,
    indexHref: `./`,
    characterKey: character.key,
    configOptions: createConfigOptions(character),
    classChangeOptions: createClassChangeOptions(character),
    statsData: createStatsData(character),
    uiConfig: createUiConfig(character),

    characterName: character.name,
    growthRates,
    classGrowthOptions,
    baseStatsHeaders,
    baseStatsRows,
    boonBane: boonBaneOptions?.template,
    isCorrin: character.isCorrin,
    isCorrinOrKana: character.isCorrinOrKana,
    isChild,
    talentOptions,
    defaultPanels,
    heartSealTalentPanels,
    parentOptions,
    parentPanels,
    hasFriendship,
    friendshipOptions,
    friendshipPanels,
    hasPartner,
    partnerOptions,
    partnerPanels,
    hasSealSection: hasFriendship || hasPartner,
    pageConfig: {
      isCorrin: character.isCorrin,
      isCorrinOrKana: character.isCorrinOrKana,
      isChild,
      baseGrowth: baseGrowthValues,
      classGrowthMap,
      boonBane: boonBaneOptions?.js,
      hasFriendship,
      hasPartner,
      friendshipCorrinKana: friendshipPanels
        .filter((p) => p.isCorrinOrKana)
        .map((p) => ({ key: p.panelKey, subGroup: p.talentSubGroup })),
      partnerCorrinKana: partnerPanels
        .filter((p) => p.isCorrinOrKana)
        .map((p) => ({ key: p.panelKey, subGroup: p.talentSubGroup })),
    },
  };
}

// ─── Pug helper functions (passed as template locals) ─────────────────────────
const pugHelpers = {
  charaPortraitPath: (name: string) => `../images/portrait/${name}.png`,
  skillIconPath: (skill: string) => `../images/icon/skills/${skill}.png`,
  weaponIconPath: (weapon: string) => `../images/icon/weapons/${weapon}.png`,
  listKeys: (value: { key: string }[]) => {
    return value?.map((item) => item.key).join(",");
  },
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
