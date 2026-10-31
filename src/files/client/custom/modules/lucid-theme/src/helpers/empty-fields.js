import {el} from 'lucid-theme:lucid';

/** Cells concerned: layout fields and fields of the default side panel. */
const CELL_SELECTOR = '.middle .cell[data-name], .side > .panel[data-name="default"] .cell[data-name]';

/** Watched areas: fields are redrawn there after each change. */
const WATCHED_SELECTOR = '.lucid-inspector, .lucid-content-card';

/**
 * Hides the empty fields of the inspector and the content card, with a link to show them.
 * Hiding only applies when viewing: while editing, every field is visible.
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
        const grid = root && root.querySelector('.lucid-record-grid');

        if (!grid) {
            return;
        }

        let count = 0;

        root.querySelectorAll(CELL_SELECTOR).forEach(cell => {
            const empty = !cell.classList.contains('hidden-cell') && isEmpty(cell);

            if (cell.classList.contains('lucid-empty') !== empty) {
                cell.classList.toggle('lucid-empty', empty);
            }

            if (empty) {
                count++;
            }
        });

        grid.classList.toggle('lucid-show-empty', this.showEmpty);

        this.renderToggle(root, count);
    }

    /**
     * @private
     * @param {HTMLElement} root
     * @param {number} count
     */
    renderToggle(root, count) {
        let toggle = root.querySelector('.lucid-empty-toggle');

        if (!count) {
            if (toggle) {
                toggle.remove();
            }

            return;
        }

        const host = root.querySelector('.lucid-inspector-card:has(> .middle)') ||
            root.querySelector('.lucid-inspector > .side > .panel[data-name="default"]:not(.hidden)') ||
            root.querySelector('.lucid-inspector-card') ||
            root.querySelector('.lucid-content-card');

        if (!host) {
            return;
        }

        if (!toggle || toggle.parentElement !== host) {
            if (toggle) {
                toggle.remove();
            }

            toggle = el('button', 'lucid-empty-toggle');
            toggle.type = 'button';
            toggle.addEventListener('click', () => {
                this.showEmpty = !this.showEmpty;
                this.update();
            });

            host.append(toggle);
        }

        const label = this.showEmpty ?
            this.view.translate('lucidHideEmpty', 'labels', 'Global') :
            this.view.translate(count === 1 ? 'lucidShowEmptyOne' : 'lucidShowEmptyMany', 'labels', 'Global')
                .replace('{count}', String(count));

        if (toggle.textContent !== label) {
            toggle.textContent = label;
        }

        toggle.setAttribute('aria-expanded', this.showEmpty ? 'true' : 'false');
    }
}

/**
 * Empty: nothing but EspoCRM's "None". A checkbox, an image or a field being edited
 * count as a value.
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
