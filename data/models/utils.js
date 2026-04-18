"use strict";

function parseCSV(value) {
  if (Array.isArray(value)) {
    console.log("warning: parseCSV: value is already an array", value);
    return value;
  }
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

module.exports = {
  parseCSV,
}
