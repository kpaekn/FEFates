(function () {
  function getConfigOptions() {
    return {
      talent: document.getElementById("cfg-talent").value,
      boon: document.getElementById("cfg-boon").value,
      bane: document.getElementById("cfg-bane").value,
      friendship: document.getElementById("cfg-friendship").value,
      partner: document.getElementById("cfg-partner").value,
    };
  }

  /**
   * Handles class change dropdown and updates growths/stats tables.
   */
  var classChangeSelect = document.getElementById("class-change-options");
  var classGrowthsRows = document.querySelectorAll("#growths-table .class-growths-row");
  var classStatsRows = document.querySelectorAll(".stats-table .class-stats-row");

  if (classChangeSelect) {
    classChangeSelect.addEventListener("change", function () {
      updateTables(this.value);
    });
    updateTables(classChangeSelect.value);
  }

  function updateTables(classKey) {
    updateGrowthsTable(classKey);
    updateStatsTable(classKey);
  }

  function updateGrowthsTable(classKey) {
    classGrowthsRows.forEach((row) => {
      const rowClassKey = row.getAttribute("data-class-key");
      row.hidden = rowClassKey !== classKey;
    });
  }

  function updateStatsTable(classKey) {
    classStatsRows.forEach((row) => {
      const rowClassKey = row.getAttribute("data-class-key");
      row.hidden = rowClassKey !== classKey;
    });
  }

  /**
   * Saves growth/stat values to data-value attributes.
   */
  (function () {
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
  })();
})();
