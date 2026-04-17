"use strict";

const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname);
const DIST_DIR = "character-guide";
const DIST = path.join(ROOT, DIST_DIR);
const DATA_DIR = path.join(ROOT, "data");
const IMG_SKILLS = path.join(ROOT, "images", "icon", "skills");
const TEMPLATES_DIR = path.join(ROOT, "templates");
const PARTIALS_DIR = path.join(TEMPLATES_DIR, "partials");

// ─── Load data ────────────────────────────────────────────────────────────────
const characters = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "characters.json"), "utf8"),
);
const classes = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "classes.json"), "utf8"),
);
const skills = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "skills.json"), "utf8"),
);
const characterStats = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "character_stats.json"), "utf8"),
);
const classStats = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "class_stats.json"), "utf8"),
);
const boonBaneStats = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "boon_bane_stats.json"), "utf8"),
);

const Stat = function(HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
	this.HP = HP;
	this.Str = Str;
	this.Mag = Mag;
	this.Skl = Skl;
	this.Spd = Spd;
	this.Lck = Lck;
	this.Def = Def;
	this.Res = Res;
};

const BaseStat = function(level, HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
	this.level = level;
	this.stat = new Stat(HP, Str, Mag, Skl, Spd, Lck, Def, Res);
};

const ROUTE_ORDER = ["all", "birthright", "conquest", "revelation"];
const ROUTE_TITLES = {
  birthright: "Birthright",
  conquest: "Conquest",
  revelation: "Revelation",
};
const STAT_LABELS = ["HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res"];
const STAT_KEYS = ["hp", "str", "mag", "skl", "spd", "lck", "def", "res"];
const CORRIN_DEFAULT_BOON = "mag";
const CORRIN_DEFAULT_BANE = "lck";

// ─── Skill icon map (normalised: strip underscores + lowercase for fuzzy match)
//     Handles e.g. key "duelists_blow" → file "duelist_s_blow.png"
function normKey(s) {
  return s.toLowerCase().replace(/_/g, "");
}

const skillIconMap = new Map();
for (const file of fs
  .readdirSync(IMG_SKILLS)
  .filter((f) => f.endsWith(".png"))) {
  skillIconMap.set(normKey(file.slice(0, -4)), file);
}

function getSkillIconPath(skillKey) {
  const file = skillIconMap.get(normKey(skillKey));
  if (!file) console.warn(`[warn] No skill icon for: ${skillKey}`);
  return `../images/icon/skills/${file ?? skillKey + ".png"}`;
}

function getWeaponIconPath(weaponKey) {
  return `../images/icon/weapons/${weaponKey}.png`;
}

function createEmptyStatArray() {
  return STAT_KEYS.map(() => 0);
}

function createSingleStatModifierMap(rawModifiers) {
  const modifierMap = {};
  for (const key of STAT_KEYS) {
    modifierMap[key] = STAT_KEYS.map((statKey) =>
      statKey === key ? (rawModifiers?.[key] ?? 0) : 0,
    );
  }
  return modifierMap;
}

function createMultiStatModifierMap(rawModifiers) {
  const modifierMap = {};
  for (const key of STAT_KEYS) {
    const entry = rawModifiers?.[key] ?? {};
    modifierMap[key] = STAT_KEYS.map((statKey) => entry[statKey] ?? 0);
  }
  return modifierMap;
}

function applyStatModifiers(baseValues, ...modifierSets) {
  return baseValues.map((value, index) =>
    modifierSets.reduce(
      (total, modifierSet) => total + (modifierSet?.[index] ?? 0),
      value,
    ),
  );
}

function statArrayToRow(values) {
  return STAT_KEYS.reduce((row, key, index) => {
    row[key] = values[index];
    return row;
  }, {});
}

function normalizeStatArray(values) {
  const [HP, Str, Mag, Skl, Spd, Lck, Def, Res] = values ?? [];
  return new Stat(HP ?? 0, Str ?? 0, Mag ?? 0, Skl ?? 0, Spd ?? 0, Lck ?? 0, Def ?? 0, Res ?? 0);
}

function statObjectToArray(stat) {
  return [
    stat?.HP ?? 0,
    stat?.Str ?? 0,
    stat?.Mag ?? 0,
    stat?.Skl ?? 0,
    stat?.Spd ?? 0,
    stat?.Lck ?? 0,
    stat?.Def ?? 0,
    stat?.Res ?? 0,
  ];
}

function normalizeBaseStatArray(values) {
  const [level, HP, Str, Mag, Skl, Spd, Lck, Def, Res] = values ?? [];
  return new BaseStat(
    level ?? 0,
    HP ?? 0,
    Str ?? 0,
    Mag ?? 0,
    Skl ?? 0,
    Spd ?? 0,
    Lck ?? 0,
    Def ?? 0,
    Res ?? 0,
  );
}

function baseStatToRow(baseStat, extras = {}) {
  return {
    ...extras,
    level: baseStat?.level ?? 0,
    ...statArrayToRow(statObjectToArray(baseStat?.stat)),
  };
}

function normalizeBoonBaneMultiStatModifiers(rawModifiers) {
  const modifierMap = {};
  for (const [label, values] of Object.entries(rawModifiers ?? {})) {
    modifierMap[label.toLowerCase()] = statArrayToRow(
      statObjectToArray(normalizeStatArray(values)),
    );
  }
  return modifierMap;
}

function getCorrinStatOptions(selectedKey) {
  return STAT_KEYS.map((key, index) => ({
    key,
    name: STAT_LABELS[index],
    selected: key === selectedKey,
  }));
}

function getRouteBucket(char) {
  if (ROUTE_ORDER.includes(char.route)) return char.route;
  return "all";
}

function sortCharactersByRoute(entries) {
  return [...entries].sort((a, b) => {
    const routeA = getRouteBucket(a[1]);
    const routeB = getRouteBucket(b[1]);
    const rankA = ROUTE_ORDER.indexOf(routeA);
    const rankB = ROUTE_ORDER.indexOf(routeB);
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });
}

function buildCharacterIndexSections() {
  const sectionMap = new Map([
    ["all", []],
    ["birthright", []],
    ["conquest", []],
    ["revelation", []],
  ]);

  for (const [charKey, char] of sortCharactersByRoute(
    Object.entries(characters),
  )) {
    const bucket = getRouteBucket(char);
    sectionMap.get(bucket).push({
      key: charKey,
      name: char.name,
      href: `${charKey}.html`,
      portraitPath: `../images/portrait/${char.name}.png`,
    });
  }

  return [...sectionMap.entries()].map(([route, chars]) => ({
    route,
    title: ROUTE_TITLES[route] ?? null,
    characters: chars,
  }));
}

// ─── Promoted-class key set (to identify base classes for talent options) ─────
const promotedKeys = new Set();
for (const cls of Object.values(classes)) {
  if (cls.promotion) {
    for (const k of cls.promotion.split(",").map((s) => s.trim()))
      promotedKeys.add(k);
  }
}

// ─── Unique-first-class keys that trigger Case B seal resolution ──────────────
//     Derive these from the class data so the seal logic follows the source of
//     truth instead of a hand-maintained list.
const UNIQUE_CLASS_KEYS = new Set(
  Object.entries(classes)
    .filter(([, cls]) => cls.unique)
    .map(([key]) => key),
);

// ─── Corrin / Kana character keys ─────────────────────────────────────────────
const CORRIN_KEYS = new Set(["corrin_m", "corrin_f"]);
const KANA_KEYS = new Set(["kana_m", "kana_f"]);
const CORRIN_KANA_KEYS = new Set([...CORRIN_KEYS, ...KANA_KEYS]);

// ─── Class-key helpers ────────────────────────────────────────────────────────
/**
 * Resolve 'troubadour' → gender-specific key; pass all other keys through.
 * Uses the owning character's gender (not the recipient's).
 */
function resolveClassKey(key, gender) {
  if (
    key === "troubadour" ||
    key === "troubadour_m" ||
    key === "troubadour_f"
  ) {
    return gender === "m" ? "troubadour_m" : "troubadour_f";
  }
  if (key === "monk" || key === "shrine_maiden") {
    return gender === "m" ? "monk" : "shrine_maiden";
  }
  return key;
}

/**
 * Resolve the parallel class for a given class key and the RECIPIENT's gender.
 * Songstress has a two-value parallel: "troubadour_m, troubadour_f" —
 * index 0 for male recipient, index 1 for female.
 */
function resolveParallel(classKey, recipientGender) {
  const cls = classes[classKey];
  if (!cls?.parallel) {
    return classKey;
  }
  const parts = cls.parallel.split(",").map((s) => s.trim());
  if (parts.length === 1) return parts[0];
  return recipientGender === "m" ? parts[0] : parts[1];
}

/**
 * Turn a class key into a renderable object: { name, weapons[], skills[] }.
 * Adjusts "Nohr Prince(ss)" display name by gender.
 */
function enrichClass(classKey, displayGender) {
  classKey = resolveClassKey(classKey, displayGender);
  const cls = classes[classKey];
  if (!cls) {
    console.warn(`[warn] Unknown class: ${classKey} ${displayGender}`);
    return { name: classKey, weapons: [], skills: [] };
  }

  let name = cls.name;
  if (classKey === "nohr_prince_ss") {
    name = displayGender === "m" ? "Nohr Prince" : "Nohr Princess";
  }

  const weapons = (cls.weapons || "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => ({
      weaponName: w.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      iconPath: getWeaponIconPath(w),
    }));

  const skillList = (cls.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((sk) => {
      const skillData = skills[sk];
      if (!skillData)
        console.warn(`[warn] Unknown skill: ${sk} (in class ${classKey})`);
      return {
        name: skillData?.name ?? sk,
        description: skillData?.description ?? "",
        iconPath: getSkillIconPath(sk),
      };
    });

  return { name, weapons, skills: skillList };
}

/**
 * Resolve a raw class key into its full promotion tree:
 *   [base, promotion1, promotion2, ...]
 * Uses charGender for the Nohr Prince(ss) name and troubadour resolution.
 */
function resolveClassTree(rawKey, charGender) {
  const key = resolveClassKey(rawKey, charGender);
  const cls = classes[key];
  if (!cls) {
    console.warn(`[warn] Unknown class in tree: ${key}`);
    return [];
  }
  const result = [enrichClass(key, charGender)];
  if (cls.promotion) {
    for (const promKey of cls.promotion.split(",").map((s) => s.trim())) {
      result.push(enrichClass(promKey, charGender));
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
  for (const [key, cls] of Object.entries(classes)) {
    if (cls.unique) continue; // unique classes not selectable as talents
    if (!cls.promotion) continue; // promoted classes have no promotion field
    if (promotedKeys.has(key)) continue; // this IS a promoted class
    if (key === "troubadour_m" && gender === "f") continue;
    if (key === "troubadour_f" && gender === "m") continue;
    if (key === "monk" && gender === "f") continue;
    if (key === "shrine_maiden" && gender === "m") continue;
    options.push({ key, name: cls.name });
  }
  options.sort((a, b) => a.name.localeCompare(b.name));
  const defaultKey = options.some((o) => o.key === "samurai")
    ? "samurai"
    : options[0]?.key;
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
  const partner = characters[partnerKey];
  if (!partner) {
    console.warn(`[warn] Unknown partner: ${partnerKey}`);
    return null;
  }

  const charClassKeys = char.class_set.split(",").map((s) => s.trim());
  const partnerClassKeys = partner.class_set.split(",").map((s) => s.trim());

  const charFirstKey = resolveClassKey(charClassKeys[0], char.gender);
  const partnerFirstKey = resolveClassKey(partnerClassKeys[0], partner.gender);

  const isPartnerCorrinKana = CORRIN_KANA_KEYS.has(partnerKey);

  // Determine the partner's effective "second class" (talent for Corrin/Kana)
  let partnerSecondKey;
  if (isPartnerCorrinKana) {
    if (!partnerTalentKey) {
      console.warn(
        `[warn] Corrin/Kana partner ${partnerKey} requires a talent key`,
      );
      return null;
    }
    // Talent key is already gender-resolved (from getTalentOptions for that Corrin/Kana)
    partnerSecondKey = partnerTalentKey;
  } else {
    if (partnerClassKeys.length < 2) {
      // Partner has only one class; nothing to fall back to in Case A
      return partnerFirstKey;
    }
    partnerSecondKey = resolveClassKey(partnerClassKeys[1], partner.gender);
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
function resolveParentContribution(
  childFirstKey,
  donorClassKeys,
  donorGender,
  childGender,
) {
  const donorFirstKey = resolveClassKey(donorClassKeys[0], donorGender);
  if (donorClassKeys.length < 2) return donorFirstKey;
  const donorSecondKey = resolveClassKey(donorClassKeys[1], donorGender);

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
 * Corrin/Kana always contribute nohr_prince_ss (no talent needed).
 * Also checks Case C: if the result matches what the fixed parent contributes,
 * use the variable parent's second class instead.
 */
function resolveChildInheritedClassKey(child, varParentKey) {
  const childClassKeys = child.class_set.split(",").map((s) => s.trim());
  const childFirstKey = resolveClassKey(childClassKeys[0], child.gender);

  // Corrin/Kana as variable parent always contribute nohr_prince_ss
  if (CORRIN_KANA_KEYS.has(varParentKey)) return "nohr_prince_ss";

  const varParent = characters[varParentKey];
  if (!varParent) {
    console.warn(`[warn] Unknown variable parent: ${varParentKey}`);
    return null;
  }
  const varParentClassKeys = varParent.class_set
    .split(",")
    .map((s) => s.trim());
  const candidate = resolveParentContribution(
    childFirstKey,
    varParentClassKeys,
    varParent.gender,
    child.gender,
  );

  // Case C: candidate == fixed parent's contribution → fall back to var parent's second
  const fixedParent = characters[child.parent];
  if (fixedParent) {
    const fixedContribution = CORRIN_KANA_KEYS.has(child.parent)
      ? "nohr_prince_ss"
      : resolveParentContribution(
        childFirstKey,
        fixedParent.class_set.split(",").map((s) => s.trim()),
        fixedParent.gender,
        child.gender,
      );
    if (candidate === fixedContribution && varParentClassKeys.length >= 2) {
      const fallback = resolveClassKey(varParentClassKeys[1], varParent.gender);
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
  const fixedParent = characters[char.parent];
  if (!fixedParent) {
    console.warn(`[warn] Unknown fixed parent: ${char.parent}`);
    return { parentOptions: [], parentPanels: [] };
  }
  const varParentKeys = parseSupportList(fixedParent.supports?.partner);
  const sorted = [...varParentKeys].sort((a, b) => {
    const na = characters[a]?.name ?? a;
    const nb = characters[b]?.name ?? b;
    return na.localeCompare(nb);
  });

  const parentOptions = [];
  const parentPanels = [];

  for (const varParentKey of sorted) {
    const varParent = characters[varParentKey];
    if (!varParent) {
      console.warn(`[warn] Unknown variable parent: ${varParentKey}`);
      continue;
    }

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
function parseSupportList(csv) {
  if (!csv) return [];
  return csv
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
  const sealLabel =
    sealType === "friendship" ? "Friendship Seal" : "Partner Seal";
  const options = [];
  const panels = [];

  for (const partnerKey of supportKeys) {
    const partner = characters[partnerKey];
    if (!partner) {
      console.warn(`[warn] Unknown support character: ${partnerKey}`);
      continue;
    }

    const isCorrinKana = CORRIN_KANA_KEYS.has(partnerKey);

    options.push({ key: partnerKey, displayName: partner.name });

    if (isCorrinKana) {
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
        isCorrinKana: true,
        group: panelGroup,
        talentOptions,
        talentSubGroup,
        talentPanels,
        isHidden: true,
      });
    } else {
      panels.push({
        panelKey: partnerKey,
        isCorrinKana: false,
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
function buildCharacterContext(charKey, char) {
  const isCorrin = CORRIN_KEYS.has(charKey);
  const isCorrinKana = CORRIN_KANA_KEYS.has(charKey);
  const pageTitle = `Fire Emblem Fates - Character Guides - ${char.name}`;
  const statKey = charKey.replace(/_(m|f)$/, "");

  const classSetKeys = char.class_set
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Character growth rates
  const growthKey = char.growth ?? charKey;
  const charGrowth = characterStats[growthKey]?.growth;
  const baseGrowthValues = charGrowth
    ? statObjectToArray(normalizeStatArray(charGrowth))
    : [];
  const corrinBoonBane = isCorrin ? boonBaneStats[statKey] : null;
  const corrinGrowthBoonMap =
    isCorrin && corrinBoonBane?.growth
      ? createMultiStatModifierMap(normalizeBoonBaneMultiStatModifiers(corrinBoonBane.growth.boon))
      : null;
  const corrinGrowthBaneMap =
    isCorrin && corrinBoonBane?.growth
      ? createMultiStatModifierMap(normalizeBoonBaneMultiStatModifiers(corrinBoonBane.growth.bane))
      : null;
  const initialGrowthValues =
    isCorrin && corrinGrowthBoonMap && corrinGrowthBaneMap
      ? applyStatModifiers(
        baseGrowthValues,
        corrinGrowthBoonMap[CORRIN_DEFAULT_BOON],
        corrinGrowthBaneMap[CORRIN_DEFAULT_BANE],
      )
      : baseGrowthValues;
  const growthRates = initialGrowthValues.map((value, index) => ({
    stat: STAT_LABELS[index],
    value,
  }));

  // Class growth dropdown options: all non-unique classes + unique classes in this character's class_set
  const charUniqueKeys = new Set(
    classSetKeys
      .map((k) => resolveClassKey(k, char.gender))
      .filter((k) => UNIQUE_CLASS_KEYS.has(k)),
  );
  const defaultClassKey = char.starting_class
    ?? resolveClassKey(classSetKeys[0], char.gender);

  const classGrowthOptions = [];
  const classGrowthMap = {};
  for (const [clsKey, cls] of Object.entries(classes)) {
    if (cls.unique && !charUniqueKeys.has(clsKey)) continue;
    if (clsKey === "troubadour_m" && char.gender === "f") continue;
    if (clsKey === "troubadour_f" && char.gender === "m") continue;
    if (clsKey === "monk" && char.gender === "f") continue;
    if (clsKey === "shrine_maiden" && char.gender === "m") continue;
    const classGrowthKey = cls.growth ?? clsKey;
    const classGrowth = classStats[classGrowthKey]?.growth;
    if (!classGrowth) continue;
    const normalizedClassGrowth = normalizeStatArray(classGrowth);
    const enriched = enrichClass(clsKey, char.gender);
    classGrowthOptions.push({
      key: clsKey,
      name: enriched.name,
      selected: clsKey === defaultClassKey,
    });
    classGrowthMap[clsKey] = statObjectToArray(normalizedClassGrowth);
  }
  classGrowthOptions.sort((a, b) => a.name.localeCompare(b.name));

  // Base stat rows from character_stats.json variants
  const rawBaseStatsRows = (() => {
    const raw = characterStats[statKey]?.base || {};
    const rows = [];
    const variants = Object.entries(raw);
    const hasMultipleVariants = variants.length > 1;
    for (const [variant, values] of variants) {
      if (!Array.isArray(values)) continue;
      const normalizedBaseStat = normalizeBaseStatArray(values);
      rows.push(
        baseStatToRow(normalizedBaseStat, {
          rowKey: variant.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
          label: variant,
        }),
      );
    }
    return rows;
  })();
  const corrinBaseStatBoonMap =
    isCorrin && corrinBoonBane?.base
      ? createSingleStatModifierMap(
        statArrayToRow(statObjectToArray(normalizeStatArray(corrinBoonBane.base.boon))),
      )
      : null;
  const corrinBaseStatBaneMap =
    isCorrin && corrinBoonBane?.base
      ? createSingleStatModifierMap(
        statArrayToRow(statObjectToArray(normalizeStatArray(corrinBoonBane.base.bane))),
      )
      : null;
  const baseStatsRows = rawBaseStatsRows.map((row) => {
    if (!isCorrin || !corrinBaseStatBoonMap || !corrinBaseStatBaneMap) {
      return row;
    }
    const adjustedValues = applyStatModifiers(
      STAT_KEYS.map((key) => row[key] ?? 0),
      corrinBaseStatBoonMap[CORRIN_DEFAULT_BOON],
      corrinBaseStatBaneMap[CORRIN_DEFAULT_BANE],
    );
    return {
      ...row,
      ...statArrayToRow(adjustedValues),
    };
  });
  const baseStatsHeaders = ["Level", ...STAT_LABELS];
  const corrinBoonOptions = isCorrin
    ? getCorrinStatOptions(CORRIN_DEFAULT_BOON)
    : [];
  const corrinBaneOptions = isCorrin
    ? getCorrinStatOptions(CORRIN_DEFAULT_BANE)
    : [];

  // Talent options (only meaningful for Corrin/Kana pages, but built here)
  const talentOptions = isCorrinKana ? getTalentOptions(char.gender) : [];

  // ── Default class panels ──────────────────────────────────────────────────
  // First class-set key → "Default Class Set"
  // Subsequent keys     → "Heart Seal - {base class name}"
  const defaultPanels = classSetKeys.map((rawKey, i) => {
    const resolvedKey = resolveClassKey(rawKey, char.gender);
    const baseCls = classes[resolvedKey];
    const label = i === 0 ? "Default Class Set" : `Heart Seal`;
    return { label, classes: resolveClassTree(rawKey, char.gender) };
  });

  // ── Heart Seal talent panels (Corrin/Kana only) ───────────────────────────
  // All panels start hidden; JS shows the one matching the talent select.
  const heartSealTalentPanels = isCorrinKana
    ? talentOptions.map((opt) => ({
      key: opt.key,
      label: `Heart Seal`,
      group: "heart-seal",
      classes: resolveClassTree(opt.key, char.gender),
      isHidden: true,
    }))
    : [];

  // ── Friendship supports ───────────────────────────────────────────────────
  const friendshipKeys = parseSupportList(char.supports?.friendship);
  const hasFriendship = friendshipKeys.length > 0;
  let friendshipOptions = [];
  let friendshipPanels = [];
  if (hasFriendship) {
    const built = buildSealSection(char, "friendship", friendshipKeys);
    friendshipOptions = built.options;
    friendshipPanels = built.panels;
  }

  // ── Partner supports ──────────────────────────────────────────────────────
  const partnerKeys = parseSupportList(char.supports?.partner);
  const hasPartner = partnerKeys.length > 0;
  let partnerOptions = [];
  let partnerPanels = [];
  if (hasPartner) {
    const built = buildSealSection(char, "partner", partnerKeys);
    partnerOptions = built.options;
    partnerPanels = built.panels;
  }

  // ── Child parent dropdown ──────────────────────────────────────────────────
  const isChild = !!char.parent;
  let parentOptions = [];
  let parentPanels = [];
  if (isChild) {
    const built = buildChildParentSection(char);
    parentOptions = built.parentOptions;
    parentPanels = built.parentPanels;
  }

  return {
    pageTitle,
    characterName: char.name,
    indexHref: `./`,
    characterKey: charKey,
    growthRates,
    classGrowthOptions,
    baseStatsHeaders,
    baseStatsRows,
    isCorrin,
    isCorrinKana,
    isChild,
    corrinBoonOptions,
    corrinBaneOptions,
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
      isCorrin,
      isCorrinKana,
      isChild,
      hasFriendship,
      hasPartner,
      baseGrowth: baseGrowthValues,
      classGrowthMap,
      corrinBoon: isCorrin
        ? {
          defaultBoon: CORRIN_DEFAULT_BOON,
          defaultBane: CORRIN_DEFAULT_BANE,
          emptyStats: createEmptyStatArray(),
          growthBoonMap: corrinGrowthBoonMap,
          growthBaneMap: corrinGrowthBaneMap,
          baseStatBoonMap: corrinBaseStatBoonMap,
          baseStatBaneMap: corrinBaseStatBaneMap,
          baseStatRows: rawBaseStatsRows.map((row) =>
            STAT_KEYS.map((key) => row[key] ?? 0),
          ),
        }
        : null,
      friendshipCorrinKana: friendshipPanels
        .filter((p) => p.isCorrinKana)
        .map((p) => ({ key: p.panelKey, subGroup: p.talentSubGroup })),
      partnerCorrinKana: partnerPanels
        .filter((p) => p.isCorrinKana)
        .map((p) => ({ key: p.panelKey, subGroup: p.talentSubGroup })),
    },
  };
}

// ─── Register Handlebars partials and compile template ────────────────────────
Handlebars.registerHelper("json", (value) => JSON.stringify(value));
Handlebars.registerHelper("hidden", (value) => (value ? "hidden" : null));
Handlebars.registerHelper("data-group", (...args) => {
  const group = args[0];
  const key = args[1];
  return group ? `data-group="${group}" data-key="${key}"` : null;
});
Handlebars.registerPartial(
  "class-block",
  fs.readFileSync(path.join(PARTIALS_DIR, "class-block.hbs"), "utf8"),
);
Handlebars.registerPartial(
  "class-panel",
  fs.readFileSync(path.join(PARTIALS_DIR, "class-panel.hbs"), "utf8"),
);
Handlebars.registerPartial(
  "placeholder-panel",
  fs.readFileSync(path.join(PARTIALS_DIR, "placeholder-panel.hbs"), "utf8"),
);
const characterTemplate = Handlebars.compile(
  fs.readFileSync(path.join(TEMPLATES_DIR, "character.hbs"), "utf8"),
);
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
for (const [charKey, char] of sortCharactersByRoute(
  Object.entries(characters),
)) {
  const context = buildCharacterContext(charKey, char);
  const html = characterTemplate(context);
  fs.writeFileSync(path.join(DIST, `${charKey}.html`), html, "utf8");
  count++;
}

console.log(`Built ${count} pages → character-guide/`);
