(function () {
    var cfg = window.PAGE_CONFIG;

    function showGroup(group, key) {
        document.querySelectorAll('[data-group="' + group + '"]').forEach(function (el) {
            el.hidden = el.dataset.key !== key;
        });
    }

    if (cfg.isCorrinKana) {
        var heartSealSelect = document.getElementById('class-talent');
        heartSealSelect.addEventListener('change', function () {
            showGroup('heart-seal', this.value);
        });
        showGroup('heart-seal', heartSealSelect.value);
    }

    if (cfg.hasFriendship) {
        var friendSelect = document.getElementById('friendship-support');
        friendSelect.addEventListener('change', function () {
            showGroup('friendship-panel', this.value);
        });
        showGroup('friendship-panel', friendSelect.value);

        cfg.friendshipCorrinKana.forEach(function (entry) {
            var subSel = document.getElementById('friendship-talent-' + entry.key);
            subSel.addEventListener('change', function () {
                showGroup(entry.subGroup, this.value);
            });
            showGroup(entry.subGroup, subSel.value);
        });
    }

    if (cfg.hasPartner) {
        var partnerSelect = document.getElementById('partner-support');
        partnerSelect.addEventListener('change', function () {
            showGroup('partner-panel', this.value);
            showGroup('partner-talent-control', this.value);
        });
        showGroup('partner-panel', partnerSelect.value);
        showGroup('partner-talent-control', partnerSelect.value);

        cfg.partnerCorrinKana.forEach(function (entry) {
            var subSel = document.getElementById('partner-talent-' + entry.key);
            subSel.addEventListener('change', function () {
                showGroup(entry.subGroup, this.value);
            });
            showGroup(entry.subGroup, subSel.value);
        });
    }

    if (cfg.isChild) {
        var parentSelect = document.getElementById('parent-select');
        parentSelect.addEventListener('change', function () {
            showGroup('parent-panel', this.value);
        });
        showGroup('parent-panel', parentSelect.value);
    }
})();
