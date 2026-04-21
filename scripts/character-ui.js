(function () {
  console.log(UI_CONFIG);
  /** UI_CONFIG - the context object passed from the template engine */
  var cfg = window.UI_CONFIG;
  /** boon/bane stats for the current character */
  var bbs = cfg.boonBane;

  var talentSelect = document.getElementById("cfg-talent");
  var boonSelect = document.getElementById("cfg-boon");
  var baneSelect = document.getElementById("cfg-bane");
  var friendshipSelect = document.getElementById("cfg-friendship");
  var partnerSelect = document.getElementById("cfg-partner");

  var classChangeSelect = document.getElementById("class-change-options");
  var classGrowthsRows = document.querySelectorAll("#growths-table .class-growths-row");
  var classStatsRows = document.querySelectorAll(".stats-table .class-stats-row");

  initDataAttributes();
  initBoonBaneSelects();
  initClassChangeSelect();

  function getConfigOptions() {
    return {
      talent: talentSelect?.value,
      selectedBoonKey: boonSelect?.value,
      selectedBaneKey: baneSelect?.value,
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
      row.hidden = rowClassKey !== "base" && rowClassKey !== classKey;
      if (!row.hidden) {
        row.querySelectorAll("td[data-value]").forEach(updateGrowthValuesWithBoonBane);
      }
    });
  }

  function updateStatsTable(classKey) {
    classStatsRows.forEach((row) => {
      const rowClassKey = row.getAttribute("data-class-key");
      row.hidden = rowClassKey !== "base" && rowClassKey !== classKey;
      if (!row.hidden) {
        row.querySelectorAll("td[data-value]").forEach(updateStatsValuesWithBoonBane);
      }
    });
  }

  function updateGrowthValuesWithBoonBane(td) {
    var statKey = td.getAttribute("data-key");
    var statValue = parseInt(td.getAttribute("data-value"));
    if (statKey && !isNaN(statValue)) {
      var { boonGrowthValue, baneGrowthValue } = getBoonBaneGrowthValue(statKey);
      td.textContent = statValue + boonGrowthValue + baneGrowthValue;
    }
  }

  function updateStatsValuesWithBoonBane(td) {
    var statKey = td.getAttribute("data-key");
    var statValue = parseInt(td.getAttribute("data-value"));
    if (statKey && !isNaN(statValue)) {
      var { boonStatValue, baneStatValue } = getBoonBaneStatValue(statKey);
      td.textContent = statValue + boonStatValue + baneStatValue;
    }
  }

  /**
   * Saves growth/stat values to data-value attributes.
   */
  function initDataAttributes() {
    classGrowthsRows.forEach((row) => {
      var tds = row.querySelectorAll("td");
      tds.forEach(saveValueToDataAttribute);
    });

    classStatsRows.forEach((row) => {
      var tds = row.querySelectorAll("td");
      tds.forEach(saveValueToDataAttribute);
    });

    function saveValueToDataAttribute(td) {
      var value = td.innerHTML;
      if (value != "" && !isNaN(value)) {
        td.setAttribute("data-value", value);
      }
    }
  }
})();
