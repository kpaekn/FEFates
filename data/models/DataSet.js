"use strict";

/**
 * Generic container for a hydrated key-value collection.
 * Wraps a Record<string, T> with lookup, iteration, and filtering.
 *
 * @template T
 */
class DataSet {
  /**
   * @param {Record<string, T>} map
   */
  constructor(map) {
    /** @private */
    this._map = map;
  }

  /**
   * Hydrate a raw JSON object into a DataSet using a Model's fromJSON factory.
   * @template T
   * @param {Record<string, any>} raw
   * @param {{ fromJSON(key: string, data: any): T }} Model
   * @returns {DataSet<T>}
   */
  static fromJSON(raw, Model) {
    /** @type {Record<string, T>} */
    const map = {};
    for (const [key, data] of Object.entries(raw)) {
      map[key] = Model.fromJSON(key, data);
    }
    return new DataSet(map);
  }

  /**
   * @param {string} key
   * @returns {T | undefined}
   */
  get(key) {
    return this._map[key];
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return key in this._map;
  }

  /** @returns {string[]} */
  keys() {
    return Object.keys(this._map);
  }

  /** @returns {T[]} */
  values() {
    return Object.values(this._map);
  }

  /** @returns {[string, T][]} */
  entries() {
    return Object.entries(this._map);
  }

  /** @returns {number} */
  get size() {
    return Object.keys(this._map).length;
  }

  /**
   * Returns a new DataSet containing only entries that pass the predicate.
   * @param {(value: T, key: string) => boolean} fn
   * @returns {DataSet<T>}
   */
  filter(fn) {
    /** @type {Record<string, T>} */
    const filtered = {};
    for (const [key, value] of Object.entries(this._map)) {
      if (fn(value, key)) {
        filtered[key] = value;
      }
    }
    return new DataSet(filtered);
  }

  /**
   * Returns the first value that passes the predicate, or undefined.
   * @param {(value: T, key: string) => boolean} fn
   * @returns {T | undefined}
   */
  find(fn) {
    for (const [key, value] of Object.entries(this._map)) {
      if (fn(value, key)) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * @param {(value: T, key: string) => void} fn
   */
  forEach(fn) {
    for (const [key, value] of Object.entries(this._map)) {
      fn(value, key);
    }
  }

  /**
   * Returns the underlying plain object for backward compatibility.
   * @returns {Record<string, T>}
   */
  toMap() {
    return this._map;
  }

  /** @returns {Iterator<[string, T]>} */
  [Symbol.iterator]() {
    return Object.entries(this._map)[Symbol.iterator]();
  }
}

module.exports = DataSet;
