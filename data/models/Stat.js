"use strict";

class Stat {
  constructor(HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
    this.HP = HP;
    this.Str = Str;
    this.Mag = Mag;
    this.Skl = Skl;
    this.Spd = Spd;
    this.Lck = Lck;
    this.Def = Def;
    this.Res = Res;
  }

  static fromJSON(data) {
    if (data instanceof Stat) {
      return data;
    }

    if (Array.isArray(data)) {
      return new Stat(...data);
    }

    return new Stat(
      data?.HP ?? 0,
      data?.Str ?? 0,
      data?.Mag ?? 0,
      data?.Skl ?? 0,
      data?.Spd ?? 0,
      data?.Lck ?? 0,
      data?.Def ?? 0,
      data?.Res ?? 0,
    );
  }

  toArray() {
    return [this.HP, this.Str, this.Mag, this.Skl, this.Spd, this.Lck, this.Def, this.Res];
  }

  toRow() {
    return Stat.KEYS.reduce((row, key, index) => {
      row[key] = this.toArray()[index];
      return row;
    }, {});
  }

  static emptyArray() {
    return Stat.KEYS.map(() => 0);
  }

  static applyModifiers(baseValues, ...modifierSets) {
    return baseValues.map((value, index) =>
      modifierSets.reduce(
        (total, modifierSet) => total + (modifierSet?.[index] ?? 0),
        value,
      ),
    );
  }

  static singleModifierMap(rawModifiers) {
    const modifierMap = {};
    for (const key of Stat.KEYS) {
      modifierMap[key] = Stat.KEYS.map((statKey) =>
        statKey === key ? (rawModifiers?.[key] ?? 0) : 0,
      );
    }
    return modifierMap;
  }

  static multiModifierMap(rawModifiers) {
    const modifierMap = {};
    for (const key of Stat.KEYS) {
      const entry = rawModifiers?.[key] ?? {};
      modifierMap[key] = Stat.KEYS.map((statKey) => entry[statKey] ?? 0);
    }
    return modifierMap;
  }

  static normalizeBoonBaneModifiers(rawModifiers) {
    const modifierMap = {};
    for (const [label, values] of Object.entries(rawModifiers ?? {})) {
      modifierMap[label.toLowerCase()] = Stat.fromJSON(values).toRow();
    }
    return modifierMap;
  }

  static getSelectOptions(selectedKey) {
    return Stat.KEYS.map((key, index) => ({
      key,
      name: Stat.LABELS[index],
      selected: key === selectedKey,
    }));
  }
}

Stat.KEYS = ["hp", "str", "mag", "skl", "spd", "lck", "def", "res"];
Stat.LABELS = ["HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res"];

module.exports = Stat;
