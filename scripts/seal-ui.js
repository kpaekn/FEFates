// @ts-nocheck

(function () {
  var cfg = window.PAGE_CONFIG;
  var cloneCounter = 0;
  var boonBaneConfig = cfg.boonBane;

  function getModifierArray(map, key) {
    if (!map || !key) return null;
    return map[key] || null;
  }

  function applyModifiers(baseValues) {
    var modifierSets = Array.prototype.slice.call(arguments, 1);
    return baseValues.map(function (value, index) {
      return modifierSets.reduce(function (total, modifierSet) {
        return total + (modifierSet && modifierSet[index] ? modifierSet[index] : 0);
      }, value);
    });
  }

  function getCorrinSelections() {
    var boonSelect = document.getElementById("corrin-boon");
    var baneSelect = document.getElementById("corrin-bane");
    return {
      boonSelect: boonSelect,
      baneSelect: baneSelect,
      boonKey: boonSelect ? boonSelect.value : null,
      baneKey: baneSelect ? baneSelect.value : null,
    };
  }

  function updateCorrinBaseGrowth(baseGrowth) {
    document.querySelectorAll("[data-base-growth-idx]").forEach(function (td) {
      var index = Number(td.dataset.baseGrowthIdx);
      td.textContent = baseGrowth[index] + "%";
    });
  }

  function updateCorrinBaseStats(boonKey, baneKey) {
    if (!boonBaneConfig) return;
    var boonModifier = getModifierArray(boonBaneConfig.baseStatBoonMap, boonKey);
    var baneModifier = getModifierArray(boonBaneConfig.baseStatBaneMap, baneKey);

    document.querySelectorAll("[data-base-stat-row]").forEach(function (td) {
      var rowIndex = Number(td.dataset.baseStatRow);
      var statIndex = Number(td.dataset.baseStatIdx);
      var rowValues = boonBaneConfig.baseStatRows[rowIndex];
      if (!rowValues) return;
      var total =
        rowValues[statIndex] +
        (boonModifier ? boonModifier[statIndex] : 0) +
        (baneModifier ? baneModifier[statIndex] : 0);
      td.textContent = total;
    });
  }

  function updateGrowthDisplays() {
    var classGrowthSelect = document.getElementById("class-growth-select");
    var classKey = classGrowthSelect ? classGrowthSelect.value : null;
    var classGrowth = classKey ? cfg.classGrowthMap[classKey] : null;
    var baseGrowth = cfg.baseGrowth.slice();

    if (boonBaneConfig) {
      var selections = getCorrinSelections();
      baseGrowth = applyModifiers(
        baseGrowth,
        getModifierArray(boonBaneConfig.growthBoonMap, selections.boonKey),
        getModifierArray(boonBaneConfig.growthBaneMap, selections.baneKey),
      );
      updateCorrinBaseGrowth(baseGrowth);
      updateCorrinBaseStats(selections.boonKey, selections.baneKey);
    }

    if (!classGrowth) return;
    document.querySelectorAll("[data-class-growth-idx]").forEach(function (td) {
      var i = Number(td.dataset.classGrowthIdx);
      td.textContent = baseGrowth[i] + classGrowth[i] + "%";
    });
  }

  function disableMatchingOption(select, blockedValue) {
    if (!select) return;
    Array.prototype.forEach.call(select.options, function (option) {
      option.disabled = option.value === blockedValue;
    });
  }

  function ensureDistinctCorrinSelections(changedKey) {
    if (!boonBaneConfig) return;
    var selections = getCorrinSelections();
    if (!selections.boonSelect || !selections.baneSelect) return;

    if (selections.boonKey === selections.baneKey) {
      var targetSelect = changedKey === "bane" ? selections.boonSelect : selections.baneSelect;
      var blockedValue = changedKey === "bane" ? selections.baneKey : selections.boonKey;
      var fallback = Array.prototype.find.call(targetSelect.options, function (option) {
        return option.value !== blockedValue;
      });
      if (fallback) {
        targetSelect.value = fallback.value;
        selections = getCorrinSelections();
      }
    }

    disableMatchingOption(selections.boonSelect, selections.baneKey);
    disableMatchingOption(selections.baneSelect, selections.boonKey);
  }

  // ── Growth-rate class dropdown ───────────────────────────────────────────
  function updateClassGrowth(classKey) {
    if (!classKey) return;
    updateGrowthDisplays();
  }

  var classGrowthSelect = document.getElementById("class-growth-select");
  if (classGrowthSelect) {
    classGrowthSelect.addEventListener("change", function () {
      updateClassGrowth(this.value);
    });
    updateClassGrowth(classGrowthSelect.value);
  }

  if (boonBaneConfig) {
    var corrinSelections = getCorrinSelections();
    if (corrinSelections.boonSelect && corrinSelections.baneSelect) {
      corrinSelections.boonSelect.addEventListener("change", function () {
        ensureDistinctCorrinSelections("boon");
        updateGrowthDisplays();
      });
      corrinSelections.baneSelect.addEventListener("change", function () {
        ensureDistinctCorrinSelections("bane");
        updateGrowthDisplays();
      });
      ensureDistinctCorrinSelections("init");
      updateGrowthDisplays();
    }
  }

  function showGroup(group, key) {
    showGroupIn(document, group, key);
  }

  function showGroupIn(root, group, key) {
    root.querySelectorAll('[data-group="' + group + '"]').forEach(function (el) {
      el.hidden = el.dataset.key !== key;
    });
  }

  function bindFriendshipContainer(container) {
    var sel = container.querySelector('select[name^="friendship-support"]');
    sel.addEventListener("change", function () {
      showGroupIn(container, "friendship-panel", this.value);
    });
    showGroupIn(container, "friendship-panel", sel.value);

    cfg.friendshipCorrinKana.forEach(function (entry) {
      var subSel = container.querySelector('select[name^="friendship-talent-' + entry.key + '"]');
      if (!subSel) return;
      subSel.addEventListener("change", function () {
        showGroupIn(container, entry.subGroup, this.value);
      });
      showGroupIn(container, entry.subGroup, subSel.value);
    });
  }

  if (cfg.isCorrinOrKana) {
    var heartSealSelect = document.getElementById("class-talent");
    heartSealSelect.addEventListener("change", function () {
      showGroup("heart-seal", this.value);
    });
    showGroup("heart-seal", heartSealSelect.value);
  }

  if (cfg.hasFriendship) {
    var originalContainer = document.querySelector(".friendship-seal-container");
    bindFriendshipContainer(originalContainer);

    document.addEventListener("click", function (e) {
      var addBtn = e.target.closest(".add-friendship-support");
      if (!addBtn) return;

      cloneCounter++;
      var clone = originalContainer.cloneNode(true);
      var suffix = "-clone-" + cloneCounter;

      clone.querySelectorAll("[id]").forEach(function (el) {
        el.id = el.id + suffix;
      });
      clone.querySelectorAll("[for]").forEach(function (el) {
        el.setAttribute("for", el.getAttribute("for") + suffix);
      });

      var cloneSel = clone.querySelector('select[name^="friendship-support"]');
      cloneSel.name = "friendship-support" + suffix;
      cloneSel.value = "-none-";

      showGroupIn(clone, "friendship-panel", "-none-");

      var btn = clone.querySelector(".add-friendship-support");
      btn.className = "remove remove-friendship-support";
      btn.textContent = "- Remove";

      var grid = originalContainer.parentNode;
      var allContainers = grid.querySelectorAll(".friendship-seal-container");
      var last = allContainers[allContainers.length - 1];
      last.parentNode.insertBefore(clone, last.nextSibling);
      bindFriendshipContainer(clone);
    });

    document.addEventListener("click", function (e) {
      var removeBtn = e.target.closest(".remove-friendship-support");
      if (!removeBtn) return;
      removeBtn.closest(".friendship-seal-container").remove();
    });
  }

  if (cfg.hasPartner) {
    var partnerSelect = document.getElementById("partner-support");
    partnerSelect.addEventListener("change", function () {
      showGroup("partner-panel", this.value);
      showGroup("partner-talent-control", this.value);
    });
    showGroup("partner-panel", partnerSelect.value);
    showGroup("partner-talent-control", partnerSelect.value);

    cfg.partnerCorrinKana.forEach(function (entry) {
      var subSel = document.getElementById("partner-talent-" + entry.key);
      subSel.addEventListener("change", function () {
        showGroup(entry.subGroup, this.value);
      });
      showGroup(entry.subGroup, subSel.value);
    });
  }

  if (cfg.isChild) {
    var parentSelect = document.getElementById("parent-select");
    parentSelect.addEventListener("change", function () {
      showGroup("parent-panel", this.value);
    });
    showGroup("parent-panel", parentSelect.value);
  }
})();
