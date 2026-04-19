"use strict";

const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const Stat = require("./data/models/Stats");

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname);
const DIST_DIR = "character-guide";
const DIST = path.join(ROOT, DIST_DIR);
const TEMPLATES_DIR = path.join(ROOT, "templates");
const PARTIALS_DIR = path.join(TEMPLATES_DIR, "partials");

// ─── Load data ────────────────────────────────────────────────────────────────
const { characters, classes } = require("./data/database");

const DEFAULT_BOON = "mag";
const DEFAULT_BANE = "lck";

function buildCharacterIndexSections() {
  const sections = {
    all: { title: "", characters: new Array() },
    birthright: { title: "Birthright", characters: new Array() },
    conquest: { title: "Conquest", characters: new Array() },
    revelation: { title: "Revelation", characters: new Array() },
  };
  characters.forEach((chara) => {
    sections[chara.route].characters.push(chara);
  });

  return Object.values(sections);
}

const UNIQUE_CLASS_KEYS = new Set(
  Array.from(classes.entries())
    .filter(([, cls]) => cls.unique)
    .map(([key]) => key),
);

// ─── Class-key helpers ────────────────────────────────────────────────────────
/**
 * @param {string} rawKey
 * @param {string} gender
 */
function getResolvedClass(rawKey, gender) {
  let cls = classes.get(rawKey);
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
  for (const [key, cls] of classes.entries()) {
    if (!cls.isTalent()) continue;
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
  const partner = characters.get(partnerKey);
  if (!partner) {
    console.warn(`[warn] Unknown partner: ${partnerKey}`);
    return null;
  }

  const charFirstKey = getResolvedClassKey(char.classSet[0].key, char.gender);
  const partnerFirstKey = getResolvedClassKey(partner.classSet[0].key, partner.gender);

  const isPartnerCorrinKana = partner.isCorrinOrKana();

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
  const variableParent = characters.get(varParentKey);

  // Corrin/Kana as variable parent always contribute nohr_prince or nohr_princess
  if (variableParent?.isCorrinOrKana()) {
    if (child.gender === "m") return "nohr_prince";
    else return "nohr_princess";
  }

  const varParent = characters.get(varParentKey);
  if (!varParent) {
    console.warn(`[warn] Unknown variable parent: ${varParentKey}`);
    return null;
  }
  const varParentClassKeys = varParent.classSet?.map((cls) => cls.key) || [];
  const candidate = resolveParentContribution(childFirstKey, varParentClassKeys, varParent.gender, child.gender);

  // Case C: candidate == fixed parent's contribution → fall back to var parent's second
  const fixedParent = child.parent;
  if (fixedParent) {
    const fixedContribution = fixedParent.isCorrinOrKana()
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
  const fixedParent = char.parent;
  if (!fixedParent) {
    console.warn(`[warn] Unknown fixed parent: ${char.key}`);
    return { parentOptions: [], parentPanels: [] };
  }
  const varParentKeys = parseSupportList(fixedParent.supports?.partner);
  const sorted = [...varParentKeys].sort((a, b) => {
    const na = characters.get(a)?.name ?? a;
    const nb = characters.get(b)?.name ?? b;
    return na.localeCompare(nb);
  });

  const parentOptions = [];
  const parentPanels = [];

  for (const varParentKey of sorted) {
    const varParent = characters.get(varParentKey);
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
    const partner = characters.get(partnerKey);
    if (!partner) {
      console.warn(`[warn] Unknown support character: ${partnerKey}`);
      continue;
    }

    options.push({ key: partnerKey, displayName: partner.name });

    if (partner.isCorrinOrKana()) {
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

// ─── Per-character template context ──────────────────────────────────────────
/**d
 * @param {import("./data/models/Character")} character
 * @returns
 */
function buildCharacterContext(character) {
  const charKey = character.key;
  const pageTitle = `Fire Emblem Fates - Character Guides - ${character.name}`;

  const classSetKeys = character.classSet?.map((cls) => cls.key) || [];

  // Character growth rates
  const charGrowth = character.stats?.growth;
  const baseGrowthValues = charGrowth ? charGrowth.toArray() : [];
  const boonBaneStats = character.stats?.boonBaneStats;
  const growthBoonMap = boonBaneStats?.growth ? boonBaneStats.growth.boon.toModifierMap() : null;
  const growthBaneMap = boonBaneStats?.growth ? boonBaneStats.growth.bane.toModifierMap() : null;
  const initialGrowthValues =
    growthBoonMap && growthBaneMap
      ? Stat.applyModifiers(baseGrowthValues, growthBoonMap[DEFAULT_BOON], growthBaneMap[DEFAULT_BANE])
      : baseGrowthValues;
  const growthRates = initialGrowthValues.map((value, index) => ({
    stat: Stat.LABELS[index],
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
  const baseStatBoonMap = boonBaneStats?.base ? Stat.singleModifierMap(boonBaneStats.base.boon) : null;
  const baseStatBaneMap = boonBaneStats?.base ? Stat.singleModifierMap(boonBaneStats.base.bane) : null;
  const baseStatsRows = rawBaseStatsRows.map((row) => {
    if (!baseStatBoonMap || !baseStatBaneMap) {
      return row;
    }
    const adjustedValues = Stat.applyModifiers(
      Stat.KEYS.map((key) => row[key] ?? 0),
      baseStatBoonMap[DEFAULT_BOON],
      baseStatBaneMap[DEFAULT_BANE],
    );
    return {
      ...row,
      ...new Stat(...adjustedValues),
    };
  });
  const baseStatsHeaders = ["Level", ...Stat.LABELS];
  const boonOptions = !!boonBaneStats ? Stat.getSelectOptions(DEFAULT_BOON) : [];
  const baneOptions = !!boonBaneStats ? Stat.getSelectOptions(DEFAULT_BANE) : [];

  // Talent options (only meaningful for Corrin/Kana pages, but built here)
  const talentOptions = character.isCorrinOrKana() ? getTalentOptions(character.gender) : [];

  // ── Default class panels ──────────────────────────────────────────────────
  // First class-set key → "Default Class Set"
  // Subsequent keys     → "Heart Seal - {base class name}"
  const defaultPanels = classSetKeys.map((rawKey, i) => {
    const label = i === 0 ? "Default Class Set" : `Heart Seal`;
    return { label, classes: resolveClassTree(rawKey, character.gender) };
  });

  // ── Heart Seal talent panels (Corrin/Kana only) ───────────────────────────
  // All panels start hidden; JS shows the one matching the talent select.
  const heartSealTalentPanels = character.isCorrinOrKana()
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
  const isChild = character.isChild();
  let parentOptions = [];
  let parentPanels = [];
  if (isChild) {
    const built = buildChildParentSection(character);
    parentOptions = built.parentOptions;
    parentPanels = built.parentPanels;
  }

  return {
    pageTitle,
    characterName: character.name,
    indexHref: `./`,
    characterKey: charKey,
    growthRates,
    classGrowthOptions,
    baseStatsHeaders,
    baseStatsRows,
    isCorrin: character.isCorrin(),
    isCorrinOrKana: character.isCorrinOrKana(),
    isChild,
    boonOptions,
    baneOptions,
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
      isCorrin: character.isCorrin(),
      isCorrinOrKana: character.isCorrinOrKana(),
      isChild,
      hasFriendship,
      hasPartner,
      baseGrowth: baseGrowthValues,
      classGrowthMap,
      boonBane: !!boonBaneStats
        ? {
            defaultBoon: DEFAULT_BOON,
            defaultBane: DEFAULT_BANE,
            emptyStats: Stat.emptyArray(),
            growthBoonMap: growthBoonMap,
            growthBaneMap: growthBaneMap,
            baseStatBoonMap: baseStatBoonMap,
            baseStatBaneMap: baseStatBaneMap,
            baseStatRows: rawBaseStatsRows.map((row) => Stat.KEYS.map((key) => row[key] ?? 0)),
          }
        : null,
      friendshipCorrinKana: friendshipPanels
        .filter((p) => p.isCorrinOrKana)
        .map((p) => ({ key: p.panelKey, subGroup: p.talentSubGroup })),
      partnerCorrinKana: partnerPanels
        .filter((p) => p.isCorrinOrKana)
        .map((p) => ({ key: p.panelKey, subGroup: p.talentSubGroup })),
    },
  };
}

// ─── Register Handlebars partials and compile template ────────────────────────
Handlebars.registerHelper("json", (value) => JSON.stringify(value));
Handlebars.registerHelper("hidden", (value) => (value ? "hidden" : null));
Handlebars.registerHelper("chara-portrait-path", (name) => `../images/portrait/${name}.png`);
Handlebars.registerHelper("skill-icon-path", (skill) => `../images/icon/skills/${skill}.png`);
Handlebars.registerHelper("weapon-icon-path", (weapon) => `../images/icon/weapons/${weapon}.png`);
Handlebars.registerHelper("data-group", (...args) => {
  const group = args[0];
  const key = args[1];
  return group ? `data-group="${group}" data-key="${key}"` : null;
});
Handlebars.registerPartial("class-block", fs.readFileSync(path.join(PARTIALS_DIR, "class-block.hbs"), "utf8"));
Handlebars.registerPartial("class-panel", fs.readFileSync(path.join(PARTIALS_DIR, "class-panel.hbs"), "utf8"));
Handlebars.registerPartial(
  "placeholder-panel",
  fs.readFileSync(path.join(PARTIALS_DIR, "placeholder-panel.hbs"), "utf8"),
);
const characterTemplate = Handlebars.compile(fs.readFileSync(path.join(TEMPLATES_DIR, "character.hbs"), "utf8"));
const characterIndexTemplate = Handlebars.compile(
  fs.readFileSync(path.join(TEMPLATES_DIR, "character-index.hbs"), "utf8"),
);

// ─── Build ────────────────────────────────────────────────────────────────────
fs.mkdirSync(DIST, { recursive: true });

const indexHtml = characterIndexTemplate({
  pageTitle: "Fire Emblem Fates - Character Guides",
  sections: buildCharacterIndexSections(),
});
fs.writeFileSync(path.join(DIST, "index.html"), indexHtml, "utf8");

let count = 0;
for (const [charKey, char] of characters.entries()) {
  const context = buildCharacterContext(char);
  const html = characterTemplate(context);
  fs.writeFileSync(path.join(DIST, `${charKey}.html`), html, "utf8");
  count++;
}

console.log(`Built ${count} pages → character-guide/`);
