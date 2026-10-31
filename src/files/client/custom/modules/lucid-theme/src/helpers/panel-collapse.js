import {el} from 'lucid-theme:lucid';

/** Collapsible blocks: layout panels and side panels (Activities, History…). */
const PANEL_SELECTOR = [
    '.lucid-inspector-card .middle > .panel[data-name]',
    '.lucid-content-card .middle > .panel[data-name]',
    '.lucid-inspector > .side > .panel[data-name]:not([data-name="default"])',
].join(', ');

/** Watched areas: panels are redrawn there after each change. */
const WATCHED_SELECTOR = '.lucid-inspector, .lucid-content-card';

/** Heading elements that keep their own click behaviour. */
const INTERACTIVE_SELECTOR = 'a, button, input, select, [data-action], .dropdown-menu';

/** Reserved name for the "About" card. */
const ABOUT = 'lucidAbout';

const STORAGE_TYPE = 'lucidCollapsedPanels';

/**
 * Folds the record blocks like accordions. The state is remembered per user and per
 * record type, in the browser; while editing, every block stays open.
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

            // A panel without a title (often the first group of fields) has nothing to collapse.
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
     * Record info (assignee, teams, dates): EspoCRM gives it no title. When it forms a separate
     * card (the fields being in "About"), it gets a heading so that it can be collapsed.
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
     * @param {HTMLElement} target Element that carries the collapsed state.
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
