/**
 * Arc — libellés flottants dans les vues d'édition.
 * Ne s'applique qu'aux champs texte simples : les champs composites (nom, téléphone,
 * sélecteurs, boutons) gardent leur libellé au-dessus.
 */
(function () {
    'use strict';

    var CELL_SELECTOR = '.edit .cell.form-group[data-name]';
    var TEXT_TYPES = ['text', 'email', 'tel', 'url', 'number'];

    function getInput(cell) {
        return cell.querySelector('input:not([type="hidden"])');
    }

    function isEligible(cell) {
        if (cell.querySelector('select, textarea, button, .btn, .dropdown-toggle')) {
            return false;
        }

        var inputs = cell.querySelectorAll('input:not([type="hidden"])');

        return inputs.length === 1 && TEXT_TYPES.indexOf(inputs[0].type) !== -1;
    }

    function refresh(cell) {
        var eligible = isEligible(cell);

        cell.classList.toggle('arc-float', eligible);

        if (!eligible) {
            cell.classList.remove('arc-has-value');

            return;
        }

        cell.classList.toggle('arc-has-value', getInput(cell).value !== '');
    }

    function refreshAll() {
        document.querySelectorAll(CELL_SELECTOR).forEach(refresh);
    }

    function onFieldEvent(event) {
        if (!(event.target instanceof Element)) {
            return;
        }

        var cell = event.target.closest('.cell[data-name]');

        if (cell) {
            refresh(cell);
        }
    }

    function init() {
        ['input', 'change', 'focusout'].forEach(function (type) {
            document.addEventListener(type, onFieldEvent);
        });

        // Espo rend les vues dynamiquement et renseigne parfois les valeurs par code :
        // on resynchronise à chaque insertion de noeuds, regroupé par frame.
        var scheduled = false;

        new MutationObserver(function () {
            if (scheduled) {
                return;
            }

            scheduled = true;

            requestAnimationFrame(function () {
                scheduled = false;
                refreshAll();
            });
        }).observe(document.body, {childList: true, subtree: true});

        refreshAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
