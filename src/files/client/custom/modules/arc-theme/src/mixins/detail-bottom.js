import {ACTIVITY_PANELS, SIDE_ACTIVITY_PANELS, el} from 'arc-theme:arc';

const ACTIVITY_TAB = 'activity';
const MORE_TAB = 'arc-more';

/**
 * Colonne principale de la fiche Arc : un onglet Activité (saisie rapide puis flux) et un
 * onglet par panneau de relation. Les onglets définis par l'administrateur dans la
 * disposition du bas regroupent leurs panneaux sous leur libellé. Activités, tâches et
 * historique restent des panneaux latéraux (colonne de gauche).
 * S'applique à la vue du bas configurée pour l'entité, standard ou personnalisée.
 *
 * @param {typeof import('views/record/detail-bottom').default} Base
 */
export default function arcDetailBottom(Base) {
    return class extends Base {

        /** @private */
        arcTab = ACTIVITY_TAB

        /** @private */
        arcBoundViews = new Set()

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

            this.arcRenderTabs();
            this.arcWatchResize();
        }

        /** @private */
        arcWatchResize() {
            if (this.arcResizeHandler) {
                return;
            }

            let timer;

            this.arcResizeHandler = () => {
                clearTimeout(timer);
                timer = setTimeout(() => this.arcRefresh(), 150);
            };

            window.addEventListener('resize', this.arcResizeHandler);

            this.once('remove', () => window.removeEventListener('resize', this.arcResizeHandler));
        }

        showPanel(...args) {
            const result = super.showPanel(...args);

            this.arcRefresh();

            return result;
        }

        hidePanel(...args) {
            const result = super.hidePanel(...args);

            this.arcRefresh();

            return result;
        }

        /** @private */
        arcRefresh() {
            if (this.isRendered()) {
                this.arcRenderTabs();
            }
        }

        /**
         * @private
         * @return {boolean}
         */
        arcIsEnabled() {
            return this.mode === 'detail' && !!this.element;
        }

        /**
         * @private
         * @return {HTMLElement[]}
         */
        arcGetPanels() {
            return [...this.element.querySelectorAll(':scope > .panel[data-name]')];
        }

        /**
         * @private
         * @return {{id: string, label: string, names: string[]}[]}
         */
        arcGetTabs() {
            const panels = this.arcGetPanels().filter(panel => !panel.classList.contains('hidden'));
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
                        const group = {id: `arc-native-${tabNumber}`, label: nativeTabs[tabNumber].label, names: []};

                        nativeGroups.set(tabNumber, group);
                        tabs.push(group);
                    }

                    nativeGroups.get(tabNumber).names.push(name);
                });

            return tabs;
        }

        /** @private */
        arcRenderTabs() {
            if (!this.arcIsEnabled()) {
                return;
            }

            const root = this.element;

            root.classList.add('arc-bottom');
            root.querySelectorAll(':scope > .arc-tabbar, :scope > .arc-composer').forEach(item => item.remove());

            const tabs = this.arcGetTabs();

            if (!tabs.length) {
                return;
            }

            if (!tabs.find(tab => tab.id === this.arcTab)) {
                this.arcTab = tabs[0].id;
            }

            let bar = this.arcBuildTabBar(tabs, tabs.length);

            root.prepend(bar);

            // Autant d'onglets que la largeur le permet, le reste dans « Plus ».
            for (let count = tabs.length - 1; count >= 1 && bar.scrollWidth > bar.clientWidth + 1; count--) {
                const smaller = this.arcBuildTabBar(tabs, count);

                bar.replaceWith(smaller);
                bar = smaller;
            }

            const composer = this.arcBuildComposer();

            if (composer) {
                root.querySelector(':scope > .arc-tabbar').after(composer);
            }

            this.arcApplyTab(tabs);
            this.arcBindCounts(tabs);
            this.arcUpdateCounts();
        }

        /**
         * @private
         * @param {{id: string, label: string, names: string[]}[]} tabs
         * @param {number} visibleCount
         * @return {HTMLElement}
         */
        arcBuildTabBar(tabs, visibleCount) {
            const bar = el('div', 'arc-tabbar');

            // Boutons à état (aria-pressed) dans un groupe nommé : le modèle « onglets » d'ARIA
            // supposerait un panneau par onglet et une navigation aux flèches.
            bar.setAttribute('role', 'group');
            bar.setAttribute('aria-label', this.translate(this.scope, 'scopeNames'));

            const visible = tabs.slice(0, visibleCount);
            const overflow = tabs.slice(visibleCount);

            visible.forEach(tab => bar.append(this.arcBuildTab(tab)));

            if (overflow.length) {
                const group = el('div', 'btn-group arc-tab-more');
                const toggle = el('button', 'arc-tab dropdown-toggle');
                const current = overflow.find(tab => tab.id === this.arcTab);

                toggle.type = 'button';
                toggle.dataset.toggle = 'dropdown';
                toggle.dataset.arcTab = MORE_TAB;
                toggle.setAttribute('aria-haspopup', 'true');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-pressed', current ? 'true' : 'false');
                toggle.append(current ? current.label : this.translate('More', 'labels', 'Global'));
                toggle.append(el('span', 'caret'));

                const menu = el('ul', 'dropdown-menu pull-right');

                overflow.forEach(tab => {
                    const item = el('li');
                    const link = el('a', 'arc-tab-more-item');

                    link.setAttribute('role', 'button');
                    link.tabIndex = 0;
                    link.dataset.arcTab = tab.id;

                    if (tab.id === this.arcTab) {
                        link.setAttribute('aria-current', 'true');
                    }

                    link.append(el('span', '', tab.label), el('span', 'arc-tab-count', ''));
                    link.addEventListener('click', () => this.arcSelectTab(tab.id));

                    // Un lien sans adresse ne réagit pas à Entrée : le clavier passe par ici.
                    link.addEventListener('keydown', event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            this.arcSelectTab(tab.id);
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
        arcBuildTab(tab) {
            const button = el('button', 'arc-tab');

            button.type = 'button';
            button.dataset.arcTab = tab.id;
            button.setAttribute('aria-pressed', tab.id === this.arcTab ? 'true' : 'false');
            button.append(el('span', 'arc-tab-label', tab.label));

            if (tab.id !== ACTIVITY_TAB) {
                button.append(el('span', 'arc-tab-count', ''));
            }

            button.addEventListener('click', () => this.arcSelectTab(tab.id));

            return button;
        }

        /**
         * @private
         * @param {string} id
         */
        arcSelectTab(id) {
            this.arcTab = id;
            this.arcRenderTabs();
        }

        /**
         * @private
         * @param {{id: string, names: string[]}[]} tabs
         */
        arcApplyTab(tabs) {
            const current = tabs.find(tab => tab.id === this.arcTab);
            const shown = current ? current.names : [];

            this.element.classList.toggle('arc-tab-activity', this.arcTab === ACTIVITY_TAB);

            this.arcGetPanels().forEach(panel => {
                const name = panel.dataset.name;
                const wasHidden = panel.classList.contains('arc-tab-hidden') || panel.classList.contains('tab-hidden');
                const isShown = shown.includes(name);

                panel.classList.toggle('arc-tab-hidden', !isShown);

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

            if (this.arcTab === ACTIVITY_TAB) {
                this.arcOrderActivityPanels(shown);
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
        arcOrderActivityPanels(names) {
            let order = 2;

            this.arcGetPanels()
                .filter(panel => names.includes(panel.dataset.name))
                .forEach(panel => {
                    if (panel.dataset.name === 'stream') {
                        panel.style.setProperty('--arc-stream-order', String(order++));
                        panel.style.setProperty('--arc-stream-list-order', String(order++));

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
        arcBuildComposer() {
            if (this.arcTab !== ACTIVITY_TAB) {
                return null;
            }

            const items = [
                {
                    kind: 'note',
                    label: this.translate('Note', 'scopeNames'),
                    icon: 'fas fa-pen',
                    run: this.arcLazy('.panel[data-name="stream"] .post-container:not(.hidden) textarea', 'focus'),
                },
                {
                    kind: 'email',
                    label: this.translate('Email', 'scopeNames'),
                    icon: 'fas fa-envelope',
                    run: this.arcFindAction('activities', 'composeEmail'),
                },
                {
                    kind: 'call',
                    label: this.translate('Call', 'scopeNames'),
                    icon: 'fas fa-phone',
                    run: this.arcFindActivityAction('Call'),
                },
                {
                    kind: 'meeting',
                    label: this.translate('Meeting', 'scopeNames'),
                    icon: 'fas fa-calendar-check',
                    run: this.arcFindActivityAction('Meeting'),
                },
                {
                    kind: 'task',
                    label: this.translate('Task', 'scopeNames'),
                    icon: 'fas fa-check-square',
                    run: this.arcFindAction('tasks', 'createTask') || this.arcFindAction('tasks', 'createRelated'),
                },
            ].filter(item => item.run);

            if (!items.length) {
                return null;
            }

            const composer = el('div', 'arc-composer');
            const label = this.translate('Create', 'labels', 'Global');
            const hasPost = !!this.element
                .querySelector('.panel[data-name="stream"]:not(.hidden) .post-container:not(.hidden)');

            // Sans zone de note dessous, la saisie se ferme sur elle-même.
            composer.classList.toggle('arc-composer-solo', !hasPost);

            composer.setAttribute('role', 'group');
            composer.setAttribute('aria-label', label);

            items.forEach(item => {
                const button = el('button', 'arc-composer-button');

                button.type = 'button';
                button.dataset.kind = item.kind;
                button.append(el('span', item.icon + ' arc-composer-icon'), el('span', '', item.label));
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
        arcFindAction(panel, action) {
            return this.arcLazy(`.panel[data-name="${panel}"] [data-action="${action}"]`, 'click');
        }

        /**
         * Les actions viennent aussi des panneaux latéraux : on cherche dans toute la fiche.
         *
         * @private
         * @return {HTMLElement}
         */
        arcRecordRoot() {
            return this.element.closest('.arc-record') || this.element;
        }

        /**
         * @private
         * @param {string} entityType
         * @return {function(): void|null}
         */
        arcFindActivityAction(entityType) {
            const base = '.panel[data-name="activities"] [data-action="createActivity"]';

            const target = [...this.arcRecordRoot().querySelectorAll(base)].find(item => {
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

            return this.arcLazy(selector, 'click');
        }

        /**
         * Retrouve la cible au moment du clic : les panneaux se redessinent indépendamment.
         *
         * @private
         * @param {string} selector
         * @param {'click'|'focus'} method
         * @return {function(): void|null}
         */
        arcLazy(selector, method) {
            if (!this.arcRecordRoot().querySelector(selector)) {
                return null;
            }

            return () => {
                const target = this.arcRecordRoot().querySelector(selector);

                if (target) {
                    target[method]();
                }
            };
        }

        /**
         * @private
         * @param {{id: string, names: string[]}[]} tabs
         */
        arcBindCounts(tabs) {
            tabs.filter(tab => tab.id !== ACTIVITY_TAB).forEach(tab => {
                const view = this.getPanelView(tab.id);

                if (!view || this.arcBoundViews.has(view)) {
                    return;
                }

                this.arcBoundViews.add(view);
                this.listenTo(view, 'after:render', () => this.arcUpdateCounts());

                if (view.collection) {
                    this.listenTo(view.collection, 'sync reset update', () => this.arcUpdateCounts());
                }
            });
        }

        /** @private */
        arcUpdateCounts() {
            if (!this.element) {
                return;
            }

            this.element.querySelectorAll('.arc-tabbar [data-arc-tab]').forEach(item => {
                const count = item.querySelector('.arc-tab-count');

                if (!count) {
                    return;
                }

                const view = item.dataset.arcTab.startsWith('arc-native-') ? null : this.getPanelView(item.dataset.arcTab);
                const total = view && view.collection ? view.collection.total : null;

                count.textContent = typeof total === 'number' && total >= 0 ? String(total) : '';
                count.classList.toggle('arc-tab-count-empty', total === 0);
            });
        }
    };
}
