import {ACTIVITY_PANELS, SIDE_ACTIVITY_PANELS, el} from 'lucid-theme:lucid';

const ACTIVITY_TAB = 'activity';
const MORE_TAB = 'lucid-more';

/**
 * Colonne principale de la fiche Lucid : un onglet Activité (saisie rapide puis flux) et un
 * onglet par panneau de relation. Les onglets définis par l'administrateur dans la
 * disposition du bas regroupent leurs panneaux sous leur libellé. Activités, tâches et
 * historique restent des panneaux latéraux (colonne de gauche).
 * S'applique à la vue du bas configurée pour l'entité, standard ou personnalisée.
 *
 * @param {typeof import('views/record/detail-bottom').default} Base
 */
export default function lucidDetailBottom(Base) {
    return class extends Base {

        /** @private */
        lucidTab = ACTIVITY_TAB

        /** @private */
        lucidBoundViews = new Set()

        alterPanels(layoutData) {
            const data = {...(layoutData || this.layoutData || {})};

            // Les onglets remplacent le « voir plus » des panneaux.
            delete data._delimiter_;

            this.layoutData = data;

            super.alterPanels(data);
        }

        setupPanelsFinal() {
            super.setupPanelsFinal();

            // Pas de doublon avec les panneaux latéraux d'activité (ni avec un panneau
            // de relation du même nom ajouté par la disposition, comme « tasks »).
            const sideNames = (this.getMetadata().get(['clientDefs', this.scope, 'sidePanels', this.type]) || [])
                .map(item => item.name);

            this.panelList = this.panelList.filter(item => {
                return !SIDE_ACTIVITY_PANELS.includes(item.name) || !sideNames.includes(item.name);
            });
        }

        afterRender() {
            super.afterRender();

            this.lucidRenderTabs();
            this.lucidWatchResize();
        }

        /** @private */
        lucidWatchResize() {
            if (this.lucidResizeHandler) {
                return;
            }

            let timer;

            this.lucidResizeHandler = () => {
                clearTimeout(timer);
                timer = setTimeout(() => this.lucidRefresh(), 150);
            };

            window.addEventListener('resize', this.lucidResizeHandler);

            this.once('remove', () => window.removeEventListener('resize', this.lucidResizeHandler));
        }

        showPanel(...args) {
            const result = super.showPanel(...args);

            this.lucidRefresh();

            return result;
        }

        hidePanel(...args) {
            const result = super.hidePanel(...args);

            this.lucidRefresh();

            return result;
        }

        /** @private */
        lucidRefresh() {
            if (this.isRendered()) {
                this.lucidRenderTabs();
            }
        }

        /**
         * @private
         * @return {boolean}
         */
        lucidIsEnabled() {
            return this.mode === 'detail' && !!this.element;
        }

        /**
         * @private
         * @return {HTMLElement[]}
         */
        lucidGetPanels() {
            return [...this.element.querySelectorAll(':scope > .panel[data-name]')];
        }

        /**
         * @private
         * @return {{id: string, label: string, names: string[]}[]}
         */
        lucidGetTabs() {
            const panels = this.lucidGetPanels().filter(panel => !panel.classList.contains('hidden'));
            const activityNames = panels
                .map(panel => panel.dataset.name)
                .filter(name => ACTIVITY_PANELS.includes(name));

            const tabs = [];

            if (activityNames.length) {
                tabs.push({
                    id: ACTIVITY_TAB,
                    label: this.translate('Stream', 'labels', 'Global'),
                    names: activityNames,
                });
            }

            const nativeTabs = this.hasTabs ? this.getTabDataList() : [];
            const nativeGroups = new Map();

            panels
                .filter(panel => !ACTIVITY_PANELS.includes(panel.dataset.name))
                .forEach(panel => {
                    const name = panel.dataset.name;
                    const title = panel.querySelector(':scope > .panel-heading .panel-title');
                    const label = (title ? title.textContent : name).replace(/\s+/g, ' ').trim();
                    const item = this.panelList.find(panelItem => panelItem.name === name);
                    const tabNumber = this.hasTabs && item ? item.tabNumber : -1;

                    if (tabNumber === -1 || tabNumber === undefined || !nativeTabs[tabNumber]) {
                        tabs.push({id: name, label, names: [name]});

                        return;
                    }

                    if (!nativeGroups.has(tabNumber)) {
                        const group = {id: `lucid-native-${tabNumber}`, label: nativeTabs[tabNumber].label, names: []};

                        nativeGroups.set(tabNumber, group);
                        tabs.push(group);
                    }

                    nativeGroups.get(tabNumber).names.push(name);
                });

            return tabs;
        }

        /** @private */
        lucidRenderTabs() {
            if (!this.lucidIsEnabled()) {
                return;
            }

            const root = this.element;

            root.classList.add('lucid-bottom');
            root.querySelectorAll(':scope > .lucid-tabbar, :scope > .lucid-composer').forEach(item => item.remove());

            const tabs = this.lucidGetTabs();

            if (!tabs.length) {
                return;
            }

            if (!tabs.find(tab => tab.id === this.lucidTab)) {
                this.lucidTab = tabs[0].id;
            }

            let bar = this.lucidBuildTabBar(tabs, tabs.length);

            root.prepend(bar);

            // Autant d'onglets que la largeur le permet, le reste dans « Plus ».
            for (let count = tabs.length - 1; count >= 1 && bar.scrollWidth > bar.clientWidth + 1; count--) {
                const smaller = this.lucidBuildTabBar(tabs, count);

                bar.replaceWith(smaller);
                bar = smaller;
            }

            const composer = this.lucidBuildComposer();

            if (composer) {
                root.querySelector(':scope > .lucid-tabbar').after(composer);
            }

            this.lucidApplyTab(tabs);
            this.lucidBindCounts(tabs);
            this.lucidUpdateCounts();
        }

        /**
         * @private
         * @param {{id: string, label: string, names: string[]}[]} tabs
         * @param {number} visibleCount
         * @return {HTMLElement}
         */
        lucidBuildTabBar(tabs, visibleCount) {
            const bar = el('div', 'lucid-tabbar');

            // Boutons à état (aria-pressed) dans un groupe nommé : le modèle « onglets » d'ARIA
            // supposerait un panneau par onglet et une navigation aux flèches.
            bar.setAttribute('role', 'group');
            bar.setAttribute('aria-label', this.translate(this.scope, 'scopeNames'));

            const visible = tabs.slice(0, visibleCount);
            const overflow = tabs.slice(visibleCount);

            visible.forEach(tab => bar.append(this.lucidBuildTab(tab)));

            if (overflow.length) {
                const group = el('div', 'btn-group lucid-tab-more');
                const toggle = el('button', 'lucid-tab dropdown-toggle');
                const current = overflow.find(tab => tab.id === this.lucidTab);

                toggle.type = 'button';
                toggle.dataset.toggle = 'dropdown';
                toggle.dataset.lucidTab = MORE_TAB;
                toggle.setAttribute('aria-haspopup', 'true');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-pressed', current ? 'true' : 'false');
                toggle.append(current ? current.label : this.translate('More', 'labels', 'Global'));
                toggle.append(el('span', 'caret'));

                const menu = el('ul', 'dropdown-menu pull-right');

                overflow.forEach(tab => {
                    const item = el('li');
                    const link = el('a', 'lucid-tab-more-item');

                    link.setAttribute('role', 'button');
                    link.tabIndex = 0;
                    link.dataset.lucidTab = tab.id;

                    if (tab.id === this.lucidTab) {
                        link.setAttribute('aria-current', 'true');
                    }

                    link.append(el('span', '', tab.label), el('span', 'lucid-tab-count', ''));
                    link.addEventListener('click', () => this.lucidSelectTab(tab.id));

                    // Un lien sans adresse ne réagit pas à Entrée : le clavier passe par ici.
                    link.addEventListener('keydown', event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            this.lucidSelectTab(tab.id);
                        }
                    });

                    item.append(link);
                    menu.append(item);
                });

                group.append(toggle, menu);
                bar.append(group);
            }

            return bar;
        }

        /**
         * @private
         * @param {{id: string, label: string}} tab
         * @return {HTMLElement}
         */
        lucidBuildTab(tab) {
            const button = el('button', 'lucid-tab');

            button.type = 'button';
            button.dataset.lucidTab = tab.id;
            button.setAttribute('aria-pressed', tab.id === this.lucidTab ? 'true' : 'false');
            button.append(el('span', 'lucid-tab-label', tab.label));

            if (tab.id !== ACTIVITY_TAB) {
                button.append(el('span', 'lucid-tab-count', ''));
            }

            button.addEventListener('click', () => this.lucidSelectTab(tab.id));

            return button;
        }

        /**
         * @private
         * @param {string} id
         */
        lucidSelectTab(id) {
            this.lucidTab = id;
            this.lucidRenderTabs();
        }

        /**
         * @private
         * @param {{id: string, names: string[]}[]} tabs
         */
        lucidApplyTab(tabs) {
            const current = tabs.find(tab => tab.id === this.lucidTab);
            const shown = current ? current.names : [];

            this.element.classList.toggle('lucid-tab-activity', this.lucidTab === ACTIVITY_TAB);

            this.lucidGetPanels().forEach(panel => {
                const name = panel.dataset.name;
                const wasHidden = panel.classList.contains('lucid-tab-hidden') || panel.classList.contains('tab-hidden');
                const isShown = shown.includes(name);

                panel.classList.toggle('lucid-tab-hidden', !isShown);

                if (isShown) {
                    // Onglet natif masqué : EspoCRM ne charge le panneau qu'à l'affichage.
                    panel.classList.remove('tab-hidden');
                }

                if (isShown && wasHidden) {
                    const view = this.getPanelView(name);

                    if (view) {
                        view.trigger('tab-show');
                        view.propagateEvent('panel-show-propagated');
                    }
                }
            });

            if (this.lucidTab === ACTIVITY_TAB) {
                this.lucidOrderActivityPanels(shown);
            }
        }

        /**
         * L'onglet Activité suit l'ordre de la disposition ; la saisie reste en tête.
         * Le flux est éclaté (en-tête, listes) : son ordre passe par des variables CSS posées
         * sur l'élément du panneau, qui survit aux re-rendus de la vue du flux.
         *
         * @private
         * @param {string[]} names
         */
        lucidOrderActivityPanels(names) {
            let order = 2;

            this.lucidGetPanels()
                .filter(panel => names.includes(panel.dataset.name))
                .forEach(panel => {
                    if (panel.dataset.name === 'stream') {
                        panel.style.setProperty('--lucid-stream-order', String(order++));
                        panel.style.setProperty('--lucid-stream-list-order', String(order++));

                        return;
                    }

                    panel.style.order = String(order++);
                });
        }

        /**
         * Saisie rapide : chaque bouton déclenche l'action native du panneau correspondant,
         * qui n'existe que si l'utilisateur a le droit de créer.
         *
         * @private
         * @return {HTMLElement|null}
         */
        lucidBuildComposer() {
            if (this.lucidTab !== ACTIVITY_TAB) {
                return null;
            }

            const items = [
                {
                    kind: 'note',
                    label: this.translate('Note', 'scopeNames'),
                    icon: 'fas fa-pen',
                    run: this.lucidLazy('.panel[data-name="stream"] .post-container:not(.hidden) textarea', 'focus'),
                },
                {
                    kind: 'email',
                    label: this.translate('Email', 'scopeNames'),
                    icon: 'fas fa-envelope',
                    run: this.lucidFindAction('activities', 'composeEmail'),
                },
                {
                    kind: 'call',
                    label: this.translate('Call', 'scopeNames'),
                    icon: 'fas fa-phone',
                    run: this.lucidFindActivityAction('Call'),
                },
                {
                    kind: 'meeting',
                    label: this.translate('Meeting', 'scopeNames'),
                    icon: 'fas fa-calendar-check',
                    run: this.lucidFindActivityAction('Meeting'),
                },
                {
                    kind: 'task',
                    label: this.translate('Task', 'scopeNames'),
                    icon: 'fas fa-check-square',
                    run: this.lucidFindAction('tasks', 'createTask') || this.lucidFindAction('tasks', 'createRelated'),
                },
            ].filter(item => item.run);

            if (!items.length) {
                return null;
            }

            const composer = el('div', 'lucid-composer');
            const label = this.translate('Create', 'labels', 'Global');
            const hasPost = !!this.element
                .querySelector('.panel[data-name="stream"]:not(.hidden) .post-container:not(.hidden)');

            // Sans zone de note dessous, la saisie se ferme sur elle-même.
            composer.classList.toggle('lucid-composer-solo', !hasPost);

            composer.setAttribute('role', 'group');
            composer.setAttribute('aria-label', label);

            items.forEach(item => {
                const button = el('button', 'lucid-composer-button');

                button.type = 'button';
                button.dataset.kind = item.kind;
                button.append(el('span', item.icon + ' lucid-composer-icon'), el('span', '', item.label));
                button.addEventListener('click', () => item.run());

                composer.append(button);
            });

            return composer;
        }

        /**
         * @private
         * @param {string} panel
         * @param {string} action
         * @return {function(): void|null}
         */
        lucidFindAction(panel, action) {
            return this.lucidLazy(`.panel[data-name="${panel}"] [data-action="${action}"]`, 'click');
        }

        /**
         * Les actions viennent aussi des panneaux latéraux : on cherche dans toute la fiche.
         *
         * @private
         * @return {HTMLElement}
         */
        lucidRecordRoot() {
            return this.element.closest('.lucid-record') || this.element;
        }

        /**
         * @private
         * @param {string} entityType
         * @return {function(): void|null}
         */
        lucidFindActivityAction(entityType) {
            const base = '.panel[data-name="activities"] [data-action="createActivity"]';

            const target = [...this.lucidRecordRoot().querySelectorAll(base)].find(item => {
                if (item.dataset.scope) {
                    return item.dataset.scope === entityType;
                }

                return item.dataset.link && this.model.getLinkParam(item.dataset.link, 'entity') === entityType;
            });

            if (!target) {
                return null;
            }

            const selector = target.dataset.scope ?
                `${base}[data-scope="${target.dataset.scope}"]` :
                `${base}[data-link="${target.dataset.link}"]`;

            return this.lucidLazy(selector, 'click');
        }

        /**
         * Retrouve la cible au moment du clic : les panneaux se redessinent indépendamment.
         *
         * @private
         * @param {string} selector
         * @param {'click'|'focus'} method
         * @return {function(): void|null}
         */
        lucidLazy(selector, method) {
            if (!this.lucidRecordRoot().querySelector(selector)) {
                return null;
            }

            return () => {
                const target = this.lucidRecordRoot().querySelector(selector);

                if (target) {
                    target[method]();
                }
            };
        }

        /**
         * @private
         * @param {{id: string, names: string[]}[]} tabs
         */
        lucidBindCounts(tabs) {
            tabs.filter(tab => tab.id !== ACTIVITY_TAB).forEach(tab => {
                const view = this.getPanelView(tab.id);

                if (!view || this.lucidBoundViews.has(view)) {
                    return;
                }

                this.lucidBoundViews.add(view);
                this.listenTo(view, 'after:render', () => this.lucidUpdateCounts());

                if (view.collection) {
                    this.listenTo(view.collection, 'sync reset update', () => this.lucidUpdateCounts());
                }
            });
        }

        /** @private */
        lucidUpdateCounts() {
            if (!this.element) {
                return;
            }

            this.element.querySelectorAll('.lucid-tabbar [data-lucid-tab]').forEach(item => {
                const count = item.querySelector('.lucid-tab-count');

                if (!count) {
                    return;
                }

                const view = item.dataset.lucidTab.startsWith('lucid-native-') ? null : this.getPanelView(item.dataset.lucidTab);
                const total = view && view.collection ? view.collection.total : null;

                count.textContent = typeof total === 'number' && total >= 0 ? String(total) : '';
                count.classList.toggle('lucid-tab-count-empty', total === 0);
            });
        }
    };
}
