(function () {
  console.log(UI_CONFIG);

  var STAT_GROWTH = "growth";
  var STAT_BASE = "base";

  /** UI_CONFIG - the context object passed from the template engine */
  var cfg = window.UI_CONFIG;

  var talentSelect = document.getElementById("cfg-talent");
  var boonSelect = document.getElementById("boon-options");
  var baneSelect = document.getElementById("bane-options");
  var parentSelect = document.getElementById("cfg-parent");
  var friendshipSelect = document.getElementById("cfg-friendship");
  var partnerSelect = document.getElementById("cfg-partner");

  var classChangeSelect = document.getElementById("class-change-options");
  var classGrowthsRows = document.querySelectorAll("#growths-table .class-growths-row");
  var classStatsRows = document.querySelectorAll(".stats-table .class-stats-row");
  var boonBaneSelectGroups = document.querySelectorAll(".boon-bane-sg");

  initSelects();

  function initSelects() {
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

    if (parentSelect) {
      parentSelect.addEventListener("change", updateTables);
      parentSelect.addEventListener("change", function () {
        var show = !!cfg.parents?.[this.value]?.stats?.boonBaneStats;
        boonBaneSelectGroups.forEach(function (sg) {
          sg.hidden = !show;
        });
      });
    }

    if (classChangeSelect) {
      classChangeSelect.addEventListener("change", updateTables);
      updateTables();
    }
  }

  function ensureDistinctSelection(primarySelect, secondarySelect) {
    if (!primarySelect || !secondarySelect) return;
    if (primarySelect.value !== secondarySelect.value) return;
    secondarySelect.value = [...secondarySelect.options].find(function (option) {
      return option.value !== primarySelect.value;
    })?.value;
  }

  function getBoonBaneStatValue(bbs, statKey) {
    if (!bbs) return 0;
    var result = 0;
    if (statKey === boonSelect.value) result += bbs.base.boon[statKey];
    if (statKey === baneSelect.value) result += bbs.base.bane[statKey];
    return result;
  }

  function getBoonBaneGrowthValue(bbs, growthKey) {
    if (!bbs) return 0;
    var result = 0;
    result += bbs.growth.boon[boonSelect.value]?.[growthKey] ?? 0;
    result += bbs.growth.bane[baneSelect.value]?.[growthKey] ?? 0;
    return result;
  }

  function getParentStatValue(key, statType) {
    var parentData = cfg.parents?.[parentSelect.value];
    if (!parentData) return NaN;
    return parentData.stats?.[statType]?.[key] ?? 0;
  }

  function updateTables() {
    if (!classChangeSelect) return;
    var classKey = classChangeSelect.value;
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
      var parentBBS = cfg.parents?.[parentSelect?.value]?.stats?.boonBaneStats;
      if (parentBBS) {
        var parentBBValue = getBoonBaneGrowthValue(parentBBS, key);
        parentValue += parentBBValue;
      }
      baseValue = (baseValue + parentValue) / 2;
    }
    var bbValue = getBoonBaneGrowthValue(cfg.boonBaneStats, key);
    td.textContent = baseValue + clsValue + bbValue;
  }

  function calcStatsValues(td) {
    var key = td.getAttribute("data-key");
    var baseValue = parseInt(td.getAttribute("data-base"));
    var clsValue = parseInt(td.getAttribute("data-class"));
    var bbValue = getBoonBaneStatValue(cfg.boonBaneStats, key);
    td.textContent = baseValue + clsValue + bbValue;
  }
})();
