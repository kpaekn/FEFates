(function () {
    var cfg = window.PAGE_CONFIG;
    var cloneCounter = 0;

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
        sel.addEventListener('change', function () {
            showGroupIn(container, 'friendship-panel', this.value);
        });
        showGroupIn(container, 'friendship-panel', sel.value);

        cfg.friendshipCorrinKana.forEach(function (entry) {
            var subSel = container.querySelector('select[name^="friendship-talent-' + entry.key + '"]');
            if (!subSel) return;
            subSel.addEventListener('change', function () {
                showGroupIn(container, entry.subGroup, this.value);
            });
            showGroupIn(container, entry.subGroup, subSel.value);
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
        var originalContainer = document.querySelector('.friendship-seal-container');
        bindFriendshipContainer(originalContainer);

        document.addEventListener('click', function (e) {
            var addBtn = e.target.closest('.add-friendship-support');
            if (!addBtn) return;

            cloneCounter++;
            var clone = originalContainer.cloneNode(true);
            var suffix = '-clone-' + cloneCounter;

            clone.querySelectorAll('[id]').forEach(function (el) {
                el.id = el.id + suffix;
            });
            clone.querySelectorAll('[for]').forEach(function (el) {
                el.setAttribute('for', el.getAttribute('for') + suffix);
            });

            var cloneSel = clone.querySelector('select[name^="friendship-support"]');
            cloneSel.name = 'friendship-support' + suffix;
            cloneSel.value = '-none-';

            showGroupIn(clone, 'friendship-panel', '-none-');

            var btn = clone.querySelector('.add-friendship-support');
            btn.className = 'remove remove-friendship-support';
            btn.textContent = '- Remove';

            var grid = originalContainer.parentNode;
            var allContainers = grid.querySelectorAll('.friendship-seal-container');
            var last = allContainers[allContainers.length - 1];
            last.parentNode.insertBefore(clone, last.nextSibling);
            bindFriendshipContainer(clone);
        });

        document.addEventListener('click', function (e) {
            var removeBtn = e.target.closest('.remove-friendship-support');
            if (!removeBtn) return;
            removeBtn.closest('.friendship-seal-container').remove();
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
