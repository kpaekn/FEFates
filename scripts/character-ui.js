(function () {
  console.log(UI_CONFIG);

  var STAT_GROWTH = "growth";
  var STAT_BASE = "base";

  /** UI_CONFIG - the context object passed from the template engine */
  var cfg = window.UI_CONFIG;
  /** boon/bane stats for the current character */
  var bbs = cfg.boonBane;
  var allParents = cfg.parents;
  var fixedParent = cfg.parents[cfg.parentKey];

  var talentSelect = document.getElementById("cfg-talent");
  var boonSelect = document.getElementById("cfg-boon");
  var baneSelect = document.getElementById("cfg-bane");
  var parentSelect = document.getElementById("cfg-parent");
  var friendshipSelect = document.getElementById("cfg-friendship");
  var partnerSelect = document.getElementById("cfg-partner");

  var classChangeSelect = document.getElementById("class-change-options");
  var classGrowthsRows = document.querySelectorAll("#growths-table .class-growths-row");
  var classStatsRows = document.querySelectorAll(".stats-table .class-stats-row");

  initBoonBaneSelects();
  initParentSelect();
  initClassChangeSelect();

  function getConfigOptions() {
    return {
      talent: talentSelect?.value,
      selectedBoonKey: boonSelect?.value,
      selectedBaneKey: baneSelect?.value,
      selectedParentKey: parentSelect?.value,
      friendship: friendshipSelect?.value,
      partner: partnerSelect?.value,
    };
  }

  function initBoonBaneSelects() {
    if (boonSelect && baneSelect) {
      boonSelect.addEventListener("change", function () {
        ensureDistinctSelection(this, baneSelect);
        updateTables();
      });
      baneSelect.addEventListener("change", function () {
        ensureDistinctSelection(this, boonSelect);
        updateTables();
      });
      ensureDistinctSelection(boonSelect, baneSelect);
    }
  }

  function ensureDistinctSelection(primarySelect, secondarySelect) {
    if (!primarySelect || !secondarySelect) return;
    if (primarySelect.value !== secondarySelect.value) return;
    secondarySelect.value = [...secondarySelect.options].find(function (option) {
      return option.value !== primarySelect.value;
    })?.value;
  }

  function getBoonBaneStatValue(statKey) {
    if (!bbs) return { boonStatValue: 0, baneStatValue: 0 };
    var { selectedBoonKey, selectedBaneKey } = getConfigOptions();
    return {
      boonStatValue: statKey === selectedBoonKey ? bbs.base.boon[statKey] : 0,
      baneStatValue: statKey === selectedBaneKey ? bbs.base.bane[statKey] : 0,
    };
  }

  function getBoonBaneGrowthValue(growthKey) {
    if (!bbs) return { boonGrowthValue: 0, baneGrowthValue: 0 };
    var { selectedBoonKey, selectedBaneKey } = getConfigOptions();
    return {
      boonGrowthValue: bbs.growth.boon[selectedBoonKey]?.[growthKey] ?? 0,
      baneGrowthValue: bbs.growth.bane[selectedBaneKey]?.[growthKey] ?? 0,
    };
  }

  function initParentSelect() {
    if (parentSelect) {
      parentSelect.addEventListener("change", updateTables);
    }
  }

  function getParentStatValue(key, statType) {
    var { selectedParentKey } = getConfigOptions();
    var parentData = cfg.parents?.[selectedParentKey];
    if (!parentData) return NaN;
    return parentData.stats?.[statType]?.[key] ?? 0;
  }

  function initClassChangeSelect() {
    if (classChangeSelect) {
      classChangeSelect.addEventListener("change", updateTables);
      updateTables();
    }
  }

  function updateTables() {
    if (!classChangeSelect) return;
    var classKey = classChangeSelect.value;
    var { selectedBoonKey, selectedBaneKey } = getConfigOptions();
    console.log("updateTables", classKey, selectedBoonKey, selectedBaneKey, bbs);
    updateGrowthsTable(classKey);
    updateStatsTable(classKey);
  }

  function updateGrowthsTable(classKey) {
    classGrowthsRows.forEach((row) => {
      const rowClassKey = row.getAttribute("data-class-key");
      row.hidden = !row.hasAttribute("data-is-base") && rowClassKey !== classKey;
      if (!row.hidden) {
        row.querySelectorAll("td[data-key]").forEach(calcGrowthValues);
      }
    });
  }

  function updateStatsTable(classKey) {
    classStatsRows.forEach((row) => {
      const rowClassKey = row.getAttribute("data-class-key");
      row.hidden = !row.hasAttribute("data-is-base") && rowClassKey !== classKey;
      if (!row.hidden) {
        row.querySelectorAll("td[data-key]").forEach(calcStatsValues);
      }
    });
  }

  function calcGrowthValues(td) {
    var key = td.getAttribute("data-key");
    var baseValue = parseInt(td.getAttribute("data-base"));
    var clsValue = parseInt(td.getAttribute("data-class"));
    var parentValue = getParentStatValue(key, STAT_GROWTH);
    if (!isNaN(parentValue)) {
      baseValue = (baseValue + parentValue) / 2;
    }
    var { boonGrowthValue, baneGrowthValue } = getBoonBaneGrowthValue(key);
    td.textContent = baseValue + clsValue + boonGrowthValue + baneGrowthValue;
  }

  function calcStatsValues(td) {
    var key = td.getAttribute("data-key");
    var baseValue = parseInt(td.getAttribute("data-base"));
    var clsValue = parseInt(td.getAttribute("data-class"));
    var parentValue = getParentStatValue(key, STAT_GROWTH);
    if (!isNaN(parentValue)) {
      // stats = base + min(floor(), (max(0, Father - Base) + max(0, Mother - Base)) / 4)
    }
    var { boonStatValue, baneStatValue } = getBoonBaneStatValue(key);
    td.textContent = baseValue + clsValue + boonStatValue + baneStatValue;
  }
})();
