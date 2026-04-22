(function () {
  console.log(UI_CONFIG);

  /** UI_CONFIG - the context object passed from the template engine */
  var cfg = window.UI_CONFIG;
  var CORRIN_KANA_KEYS = ["corrin_m", "corrin_f", "kana_m", "kana_f"];
  var PANEL_GROUP_PARENT = "parent";
  var PANEL_GROUP_FRIENDSHIP = "friendship";
  var PANEL_GROUP_PARTNER = "partner";
  var PANEL_GROUP_TALENT = "talent";

  var boonSelect = document.getElementById("boon-options");
  var baneSelect = document.getElementById("bane-options");
  var parentSelect = document.getElementById("cfg-parent");
  var grandparentSelect = document.getElementById("cfg-grandparent");
  var grandparentSelectGroup = document.querySelector(".grandparent-sg");
  var friendshipSelect = document.getElementById("cfg-friendship");
  var partnerSelect = document.getElementById("cfg-partner");
  var talentSelect = document.getElementById("cfg-talent");
  var talentSelectGroup = document.querySelector(".talent-sg");

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
      parentSelect.addEventListener("change", function () {
        updateTables();

        var show = !!cfg.parents?.[this.value]?.stats?.boonBaneStats;
        boonBaneSelectGroups.forEach(function (sg) {
          sg.hidden = !show;
        });

        if (grandparentSelect) {
          var grandparents = cfg.parents?.[this.value]?.variableParents;
          grandparentSelect.value = "";
          if (grandparents && grandparents.length > 0) {
            // show/hide possible grandparents based on parent selection
            grandparentSelect.querySelectorAll("option").forEach(function (option) {
              option.hidden = !grandparents.some(function (gp) {
                return gp.key === option.value;
              });
            });
            grandparentSelectGroup.hidden = false;
          } else {
            grandparentSelectGroup.hidden = true;
          }
        }

        disableCorrinKanaOptions(this, friendshipSelect, partnerSelect);
        showTalentSelectGroup();
        showHidePanels(PANEL_GROUP_PARENT, this.value);
      });
    }

    if (grandparentSelect) {
      grandparentSelect.addEventListener("change", updateTables);
    }

    if (classChangeSelect) {
      classChangeSelect.addEventListener("change", updateTables);
      updateTables();
    }

    if (friendshipSelect) {
      friendshipSelect.addEventListener("change", function () {
        disableCorrinKanaOptions(this, parentSelect, partnerSelect);
        showTalentSelectGroup();
        showHidePanels(PANEL_GROUP_FRIENDSHIP, this.value);
      });
    }

    if (partnerSelect) {
      partnerSelect.addEventListener("change", function () {
        disableCorrinKanaOptions(this, parentSelect, friendshipSelect);
        showTalentSelectGroup();
        showHidePanels(PANEL_GROUP_PARTNER, this.value);
      });
    }

    if (talentSelect) {
      talentSelect.addEventListener("change", function () {
        console.log("talentSelect change", this.value);
        showHidePanels(PANEL_GROUP_TALENT, this.value);
      });
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

  function getParentGrowthValue(key) {
    var parentData = cfg.parents?.[parentSelect.value];
    if (!parentData) return NaN;
    return parseInt(parentData.stats?.growth?.[key] ?? NaN);
  }

  function getGrandparentGrowthValue(key) {
    var grandparentData = cfg.grandparents?.[grandparentSelect.value];
    if (!grandparentData) return NaN;
    return grandparentData?.stats?.growth?.[key] ?? NaN;
  }

  function updateTables() {
    var classKey = classChangeSelect.value;
    console.log(`updateTables: classKey=${classKey}`);
    updateGrowthsTable(classKey);
    updateStatsTable(classKey);
  }

  function updateGrowthsTable(classKey) {
    classGrowthsRows.forEach((row) => {
      var { classKey: rowClassKey } = row.dataset;
      row.hidden = !row.hasAttribute("data-is-base") && rowClassKey !== classKey;
      if (!row.hidden) {
        row.querySelectorAll("td[data-key]").forEach(calcGrowthValues);
      }
    });
  }

  function updateStatsTable(classKey) {
    classStatsRows.forEach((row) => {
      var { classKey: rowClassKey } = row.dataset;
      row.hidden = !row.hasAttribute("data-is-base") && rowClassKey !== classKey;
      if (!row.hidden) {
        row.querySelectorAll("td[data-key]").forEach(calcStatsValues);
      }
    });
  }

  function calcGrowthValues(td) {
    var { key } = td.dataset;
    var baseValue = parseInt(td.dataset.base);
    var clsValue = parseInt(td.dataset.class);
    var parentValue = getParentGrowthValue(key);
    if (!isNaN(parentValue)) {
      // parent growth is averaged with grandparent growth
      var grandparentValue = getGrandparentGrowthValue(key);
      if (!isNaN(grandparentValue)) {
        parentValue = (parentValue + grandparentValue) / 2;
      }

      // add parent boon/bane growths
      var parentBBS = cfg.parents?.[parentSelect?.value]?.stats?.boonBaneStats;
      if (parentBBS) {
        var parentBBValue = getBoonBaneGrowthValue(parentBBS, key);
        parentValue += parentBBValue;
      }

      // average parent growth with base growth
      baseValue = (baseValue + parentValue) / 2;
    }
    var bbValue = getBoonBaneGrowthValue(cfg.boonBaneStats, key);
    td.textContent = baseValue + clsValue + bbValue;
  }

  function calcStatsValues(td) {
    var { key } = td.dataset;
    var baseValue = parseInt(td.dataset.base);
    var clsValue = parseInt(td.dataset.class);
    var bbValue = getBoonBaneStatValue(cfg.boonBaneStats, key);
    td.textContent = baseValue + clsValue + bbValue;
  }

  /**
   * If the provided select is Corrin/Kana, disable all options that are Corrin/Kana.
   *
   */
  function disableCorrinKanaOptions(primarySelect, ...otherSelects) {
    if (CORRIN_KANA_KEYS.includes(primarySelect.value)) {
      otherSelects.forEach(function (select) {
        if (!select) return;
        if (CORRIN_KANA_KEYS.includes(select.value)) select.value = "";
        select.querySelectorAll("option").forEach(function (option) {
          option.disabled = CORRIN_KANA_KEYS.includes(option.value);
        });
      });
    } else {
      otherSelects.forEach(function (select) {
        if (!select) return;
        select.querySelectorAll("option").forEach(function (option) {
          option.disabled = false;
        });
      });
    }
  }

  /**
   * Show the talent select group if any of (character, parent, friendship, partner) keys are Corrin/Kana
   */
  function showTalentSelectGroup() {
    if (!talentSelectGroup) return;
    var characterKey = cfg.characterKey;
    var friendKey = friendshipSelect?.value;
    var partnerKey = partnerSelect?.value;
    var showTalent = [characterKey, friendKey, partnerKey].some(function (key) {
      return CORRIN_KANA_KEYS.includes(key);
    });
    talentSelectGroup.hidden = !showTalent;
  }

  function showHidePanels(group, key) {
    if (group === PANEL_GROUP_TALENT) {
      if (parentSelect && CORRIN_KANA_KEYS.includes(parentSelect.value)) {
        return _showHidePanels(PANEL_GROUP_PARENT, key);
      }
      if (friendshipSelect && CORRIN_KANA_KEYS.includes(friendshipSelect.value)) {
        return _showHidePanels(PANEL_GROUP_FRIENDSHIP, key);
      }
      if (partnerSelect && CORRIN_KANA_KEYS.includes(partnerSelect.value)) {
        return _showHidePanels(PANEL_GROUP_PARTNER, key);
      }
    }
    if (group !== PANEL_GROUP_PARENT) {
      if (CORRIN_KANA_KEYS.includes(key) && talentSelect) {
        return _showHidePanels(group, talentSelect.value);
      }
    }
    _showHidePanels(group, key);
  }

  function _showHidePanels(group, key) {
    console.log(`showHidePanels: group=${group}, key=${key}`);
    document.querySelectorAll(`[data-group="${group}"]`).forEach(function (panel) {
      var { key: panelKey } = panel.dataset;
      panel.hidden = panelKey !== key;
    });
  }
})();
