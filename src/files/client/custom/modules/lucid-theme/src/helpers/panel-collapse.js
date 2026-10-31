import {el} from 'lucid-theme:lucid';

/** Blocs repliables : panneaux de la disposition et panneaux latéraux (Activités, Historique…). */
const PANEL_SELECTOR = [
    '.lucid-inspector-card .middle > .panel[data-name]',
    '.lucid-content-card .middle > .panel[data-name]',
    '.lucid-inspector > .side > .panel[data-name]:not([data-name="default"])',
].join(', ');

/** Zones observées : les panneaux y sont redessinés après chaque modification. */
const WATCHED_SELECTOR = '.lucid-inspector, .lucid-content-card';

/** Ce qui, dans un en-tête, garde son propre comportement au clic. */
const INTERACTIVE_SELECTOR = 'a, button, input, select, [data-action], .dropdown-menu';

/** Nom réservé à la carte « À propos » (suivi de la fiche). */
const ABOUT = 'lucidAbout';

const STORAGE_TYPE = 'lucidCollapsedPanels';

/**
 * Replie les blocs de la fiche comme des accordéons. L'état est retenu par utilisateur et par
 * type d'enregistrement, dans le navigateur ; en modification, tous les blocs restent ouverts.
 */
export default class PanelCollapse {

    /**
     * @param {import('views/record/detail').default} view
     */
    constructor(view) {
        this.view = view;
        this.storageName = `${view.getUser().id}-${view.entityType}`;
        this.collapsed = new Set(this.load());
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
            this.observer.observe(target, {childList: true, subtree: true});
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

        if (!root) {
            return;
        }

        root.querySelectorAll(PANEL_SELECTOR).forEach(panel => {
            const heading = panel.querySelector(':scope > .panel-heading');
            const title = heading && heading.querySelector('.panel-title');

            // Un panneau sans titre (premier groupe de champs, souvent) n'a rien à replier.
            if (title && title.textContent.trim()) {
                this.decorate(panel, heading, title.textContent.trim(), panel.dataset.name);
            }
        });

        const inspector = root.querySelector('.lucid-inspector');
        const aboutTitle = inspector && inspector.querySelector('.lucid-inspector-title');

        this.decorateTracking(inspector);

        const aboutContent = inspector && inspector.querySelector(':scope > .lucid-inspector-card > .middle, :scope > .side > .panel[data-name="default"]');

        if (aboutTitle && aboutContent) {
            this.decorate(inspector, aboutTitle, aboutTitle.textContent.replace('+', '').trim(), ABOUT);
        }
    }

    /**
     * Suivi (assigné, équipes, dates) : EspoCRM ne lui donne pas de titre. Quand il forme une
     * carte à part (les champs sont dans « À propos »), il reçoit un en-tête pour se replier.
     *
     * @private
     * @param {HTMLElement|null} inspector
     */
    decorateTracking(inspector) {
        const panel = inspector && inspector.querySelector(':scope > .side > .panel[data-name="default"]');

        if (!panel || !inspector.querySelector(':scope > .lucid-inspector-card > .middle')) {
            return;
        }

        let heading = panel.querySelector(':scope > .panel-heading');

        if (!heading) {
            heading = el('div', 'panel-heading lucid-added-heading');
            heading.append(el('h4', 'panel-title', this.view.translate('lucidRecordInfo', 'labels', 'Global')));
            panel.prepend(heading);
        }

        const title = heading.querySelector('.panel-title');

        if (title && title.textContent.trim()) {
            this.decorate(panel, heading, title.textContent.trim(), 'default');
        }
    }

    /**
     * @private
     * @param {HTMLElement} target Élément qui porte l'état replié.
     * @param {HTMLElement} heading
     * @param {string} label
     * @param {string} name
     */
    decorate(target, heading, label, name) {
        let button = heading.querySelector(':scope > .lucid-collapse');

        if (!button) {
            button = el('button', 'lucid-collapse btn btn-text btn-icon');
            button.type = 'button';
            button.append(el('span', 'fas fa-chevron-down'));
            button.addEventListener('click', () => this.toggle(name));

            heading.classList.add('lucid-collapsible');
            heading.append(button);

            heading.addEventListener('click', event => {
                if (event.target.closest(INTERACTIVE_SELECTOR) || this.isEditing()) {
                    return;
                }

                this.toggle(name);
            });
        }

        const collapsed = this.collapsed.has(name);

        target.classList.toggle('lucid-collapsed', collapsed);
        button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

        const text = `${this.view.translate(collapsed ? 'Expand' : 'Collapse', 'labels', 'Global')} ${label}`;

        if (button.title !== text) {
            button.title = text;
            button.setAttribute('aria-label', text);
        }
    }

    /**
     * @private
     * @param {string} name
     */
    toggle(name) {
        if (this.collapsed.has(name)) {
            this.collapsed.delete(name);
        } else {
            this.collapsed.add(name);
        }

        this.save();
        this.update();
    }

    /**
     * @private
     * @return {boolean}
     */
    isEditing() {
        const editButtons = this.view.element && this.view.element.querySelector('.lucid-band .edit-buttons');

        return !!editButtons && !editButtons.classList.contains('hidden');
    }

    /**
     * @private
     * @return {string[]}
     */
    load() {
        const stored = this.view.getStorage().get(STORAGE_TYPE, this.storageName);

        return Array.isArray(stored) ? stored : [];
    }

    /** @private */
    save() {
        this.view.getStorage().set(STORAGE_TYPE, this.storageName, [...this.collapsed]);
    }
}
