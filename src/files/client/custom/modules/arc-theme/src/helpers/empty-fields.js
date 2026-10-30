import {el} from 'arc-theme:arc';

/** Cellules concernées : champs de la disposition et du panneau latéral par défaut. */
const CELL_SELECTOR = '.middle .cell[data-name], .side > .panel[data-name="default"] .cell[data-name]';

/** Zones observées : les champs y sont redessinés après chaque modification. */
const WATCHED_SELECTOR = '.arc-inspector, .arc-content-card';

/**
 * Masque les champs vides de l'inspecteur et du contenu, avec un lien pour les afficher.
 * Le masquage ne joue qu'à l'affichage : en modification, tous les champs sont visibles.
 */
export default class EmptyFields {

    /**
     * @param {import('views/record/detail').default} view
     */
    constructor(view) {
        this.view = view;
        this.showEmpty = false;
        this.observer = null;
        this.scheduled = false;
    }

    init() {
        this.view.listenTo(this.view, 'after:render', () => this.observe());
        this.view.once('remove', () => this.observer && this.observer.disconnect());
    }

    /** @private */
    observe() {
        const root = this.view.element;

        if (this.observer) {
            this.observer.disconnect();
        }

        if (!root) {
            return;
        }

        this.observer = new MutationObserver(() => this.schedule());

        root.querySelectorAll(WATCHED_SELECTOR).forEach(target => {
            this.observer.observe(target, {childList: true, subtree: true, characterData: true});
        });

        this.schedule();
    }

    /** @private */
    schedule() {
        if (this.scheduled) {
            return;
        }

        this.scheduled = true;

        requestAnimationFrame(() => {
            this.scheduled = false;
            this.update();
        });
    }

    /** @private */
    update() {
        const root = this.view.element;
        const grid = root && root.querySelector('.arc-record-grid');

        if (!grid) {
            return;
        }

        let count = 0;

        root.querySelectorAll(CELL_SELECTOR).forEach(cell => {
            const empty = !cell.classList.contains('hidden-cell') && isEmpty(cell);

            if (cell.classList.contains('arc-empty') !== empty) {
                cell.classList.toggle('arc-empty', empty);
            }

            if (empty) {
                count++;
            }
        });

        grid.classList.toggle('arc-show-empty', this.showEmpty);

        this.renderToggle(root, count);
    }

    /**
     * @private
     * @param {HTMLElement} root
     * @param {number} count
     */
    renderToggle(root, count) {
        let toggle = root.querySelector('.arc-empty-toggle');

        if (!count) {
            if (toggle) {
                toggle.remove();
            }

            return;
        }

        const host = root.querySelector('.arc-inspector > .side > .panel[data-name="default"]:not(.hidden)') ||
            root.querySelector('.arc-inspector-card') ||
            root.querySelector('.arc-content-card');

        if (!host) {
            return;
        }

        if (!toggle || toggle.parentElement !== host) {
            if (toggle) {
                toggle.remove();
            }

            toggle = el('button', 'arc-empty-toggle');
            toggle.type = 'button';
            toggle.addEventListener('click', () => {
                this.showEmpty = !this.showEmpty;
                this.update();
            });

            host.append(toggle);
        }

        const label = this.showEmpty ?
            this.view.translate('arcHideEmpty', 'labels', 'Global') :
            this.view.translate(count === 1 ? 'arcShowEmptyOne' : 'arcShowEmptyMany', 'labels', 'Global')
                .replace('{count}', String(count));

        if (toggle.textContent !== label) {
            toggle.textContent = label;
        }

        toggle.setAttribute('aria-expanded', this.showEmpty ? 'true' : 'false');
    }
}

/**
 * Vide : rien d'autre que la mention « Aucun » d'EspoCRM. Une case à cocher, une image ou
 * un champ en cours de saisie comptent comme une valeur.
 *
 * @param {HTMLElement} cell
 * @return {boolean}
 */
function isEmpty(cell) {
    const field = cell.querySelector(':scope > .field');

    if (!field || cell.querySelector('.inline-save-link')) {
        return false;
    }

    if (field.querySelector('input, select, textarea, img, video, iframe, canvas, svg')) {
        return false;
    }

    const text = field.textContent.replace(/\s+/g, '');
    const noneText = [...field.querySelectorAll('.none-value')].map(item => item.textContent).join('').replace(/\s+/g, '');

    return text === '' || text === noneText;
}
