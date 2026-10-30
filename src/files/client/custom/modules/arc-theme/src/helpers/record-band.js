import PipelinesHelper from 'helpers/misc/pipelines';
import {el} from 'arc-theme:arc';

/** Étapes de clôture négative : proposées à part plutôt que sur le parcours. */
const OFF_PATH_STYLES = ['danger'];

/**
 * Bandeau de la fiche : identité (nom, personnes assignées, équipes)
 * et parcours de pipeline.
 */
export default class RecordBand {

    /**
     * @param {import('views/record/detail').default} view
     */
    constructor(view) {
        this.view = view;
        this.model = view.model;
        this.entityType = view.entityType;
        this.pipelines = new PipelinesHelper();
    }

    init() {
        this.view.listenTo(this.view, 'after:render', () => {
            this.render();
            this.watchBandHeight();
        });

        this.view.listenTo(this.model, 'sync change', () => {
            if (this.view.isRendered()) {
                this.render();
            }
        });

        this.view.once('remove', () => this.releaseBackground());
    }

    /**
     * Le dégradé est peint sur le fond de la page, qui couvre toute la largeur sans
     * débordement, sur la hauteur exacte du bandeau (en-tête de page compris).
     *
     * @private
     */
    watchBandHeight() {
        const band = this.view.element && this.view.element.querySelector('.arc-band');

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (!band) {
            return;
        }

        const update = () => {
            const bottom = band.getBoundingClientRect().bottom + window.scrollY;

            document.body.style.setProperty('--arc-band-height', `${Math.round(bottom)}px`);
            document.body.dataset.arcBandOwner = this.view.cid;
            document.body.classList.add('arc-band-page');
        };

        this.resizeObserver = new ResizeObserver(update);
        this.resizeObserver.observe(band);

        const header = document.querySelector('#main > .page-header');

        if (header) {
            this.resizeObserver.observe(header);
        }

        update();
    }

    /** @private */
    releaseBackground() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // La fiche suivante a pu poser son propre fond avant le retrait de celle-ci.
        if (document.body.dataset.arcBandOwner !== this.view.cid) {
            return;
        }

        delete document.body.dataset.arcBandOwner;
        document.body.classList.remove('arc-band-page');
        document.body.style.removeProperty('--arc-band-height');
    }

    render() {
        const root = this.view.element;

        if (!root) {
            return;
        }

        const identity = root.querySelector('[data-role="arc-identity"]');
        const pipeline = root.querySelector('[data-role="arc-pipeline"]');

        if (identity) {
            identity.replaceChildren(this.buildIdentity());
        }

        if (pipeline) {
            this.renderPipeline(pipeline);
        }
    }

    /**
     * @private
     * @return {HTMLElement}
     */
    buildIdentity() {
        const name = this.model.get('name') || '';

        const wrapper = el('div', 'arc-identity');
        const text = el('div', 'arc-identity-text');

        text.append(el('p', 'arc-identity-name', name));

        const people = this.buildPeople();

        if (people) {
            text.append(people);
        }

        wrapper.append(text);

        return wrapper;
    }

    /**
     * @private
     * @param {string} name
     * @return {string}
     */
    getInitials(name) {
        const words = name.trim().split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word));

        if (!words.length) {
            return [...this.view.translate(this.entityType, 'scopeNames')][0].toUpperCase();
        }

        const letters = words.length === 1 ?
            [...words[0]].slice(0, 2) :
            [[...words[0]][0], [...words[words.length - 1]][0]];

        return letters.join('').toUpperCase();
    }

    /**
     * Personnes assignées et équipes, selon les champs de l'entité et les droits de lecture.
     *
     * @private
     * @return {HTMLElement|null}
     */
    buildPeople() {
        const forbidden = this.view.getAcl().getScopeForbiddenFieldList(this.entityType, 'read');
        const container = el('div', 'arc-identity-people');

        const users = this.getAssignedUsers(forbidden);

        if (users) {
            const chips = users.length ?
                users.map(user => this.buildUserChip(user)) :
                [el('span', 'arc-person arc-person-empty', this.view.translate('arcUnassigned', 'labels', 'Global'))];

            container.append(this.buildGroup(this.view.translate('arcAssigned', 'labels', 'Global'), chips));
        }

        if (this.model.hasField('teams') && !forbidden.includes('teams')) {
            const ids = this.model.get('teamsIds') || [];
            const names = this.model.get('teamsNames') || {};

            if (ids.length) {
                container.append(this.buildGroup(
                    this.view.translate('teams', 'fields', this.entityType),
                    ids.map(id => el('span', 'arc-person arc-team', names[id] || id))
                ));
            }
        }

        return container.childElementCount ? container : null;
    }

    /**
     * @private
     * @param {string[]} forbidden
     * @return {{id: string, name: string}[]|null} Null si l'entité n'a pas de champ d'assignation lisible.
     */
    getAssignedUsers(forbidden) {
        if (this.model.hasField('assignedUsers') && !forbidden.includes('assignedUsers')) {
            const names = this.model.get('assignedUsersNames') || {};

            return (this.model.get('assignedUsersIds') || []).map(id => ({id, name: names[id] || id}));
        }

        if (this.model.hasField('assignedUser') && !forbidden.includes('assignedUser')) {
            const id = this.model.get('assignedUserId');

            return id ? [{id, name: this.model.get('assignedUserName') || id}] : [];
        }

        return null;
    }

    /**
     * @private
     * @param {string} label
     * @param {HTMLElement[]} chips
     * @return {HTMLElement}
     */
    buildGroup(label, chips) {
        const group = el('span', 'arc-people-group');

        group.append(el('span', 'arc-people-label', label), ...chips);

        return group;
    }

    /**
     * @private
     * @param {{id: string, name: string}} user
     * @return {HTMLElement}
     */
    buildUserChip(user) {
        const chip = el('span', 'arc-person');
        const initials = el('span', 'arc-person-avatar', this.getInitials(user.name));

        initials.setAttribute('aria-hidden', 'true');
        chip.append(initials, el('span', '', user.name));

        return chip;
    }

    /**
     * @private
     * @param {HTMLElement} container
     */
    renderPipeline(container) {
        const pipeline = this.getPipeline();

        if (!pipeline) {
            this.renderPipelineSummary(container);

            return;
        }

        container.classList.remove('hidden');

        const currentId = this.model.get('pipelineStageId');
        const path = pipeline.stages.filter(stage => !OFF_PATH_STYLES.includes(stage.style));
        const offPath = pipeline.stages.filter(stage => OFF_PATH_STYLES.includes(stage.style));
        const currentIndex = path.findIndex(stage => stage.id === currentId);
        const editable = this.canEditStage();

        const head = el('div', 'arc-pipeline-head');
        const summary = el('span', 'arc-pipeline-summary');

        summary.append(this.view.translate('pipeline', 'fields', this.entityType) + ' ');
        summary.append(el('strong', '', this.model.get('pipelineName') || ''));

        if (currentIndex >= 0) {
            summary.append(' · ' + this.view.translate('arcPipelineStep', 'labels', 'Global')
                .replace('{current}', String(currentIndex + 1))
                .replace('{total}', String(path.length)));
        }

        head.append(summary);

        if (offPath.length) {
            const links = el('span', 'arc-pipeline-off');

            offPath.forEach(stage => {
                const label = this.view.translate('arcMarkStage', 'labels', 'Global').replace('{stage}', stage.name);

                if (stage.id === currentId) {
                    links.append(el('span', 'arc-pipeline-off-current', stage.name));

                    return;
                }

                if (!editable) {
                    return;
                }

                const button = el('button', 'arc-pipeline-off-link', label);

                button.type = 'button';
                button.addEventListener('click', () => this.setStage(stage.id));
                links.append(button);
            });

            head.append(links);
        }

        const list = el('ol', 'arc-pipeline-steps');

        list.setAttribute('aria-label', this.view.translate('pipelineStage', 'fields', this.entityType));
        list.style.setProperty('--arc-steps', String(path.length));

        path.forEach((stage, index) => {
            const item = el('li', 'arc-step');
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';

            item.dataset.state = state;

            if (state === 'current') {
                item.setAttribute('aria-current', 'step');
            }

            const inner = editable && state !== 'current' ? el('button', 'arc-step-inner') : el('span', 'arc-step-inner');

            if (inner.tagName === 'BUTTON') {
                inner.type = 'button';
                inner.addEventListener('click', () => this.setStage(stage.id));
            }

            if (state === 'done') {
                inner.append(el('span', 'fas fa-check arc-step-check'));
            }

            inner.append(el('span', 'arc-step-label', stage.name));
            item.append(inner);
            list.append(item);
        });

        container.replaceChildren(head, list);
    }

    /**
     * Pipeline inactif : EspoCRM n'en transmet pas les étapes, on rappelle seulement l'étape actuelle.
     *
     * @private
     * @param {HTMLElement} container
     */
    renderPipelineSummary(container) {
        const pipelineName = this.model.get('pipelineName');
        const stageName = this.model.get('pipelineStageName');

        if (!this.canReadStage() || !pipelineName || !stageName) {
            container.classList.add('hidden');
            container.replaceChildren();

            return;
        }

        const head = el('div', 'arc-pipeline-head');
        const summary = el('span', 'arc-pipeline-summary');

        summary.append(this.view.translate('pipeline', 'fields', this.entityType) + ' ');
        summary.append(el('strong', '', pipelineName), ' · ', el('span', 'arc-pipeline-stage-chip', stageName));
        head.append(summary);

        container.classList.remove('hidden');
        container.replaceChildren(head);
    }

    /**
     * @private
     * @return {boolean}
     */
    canReadStage() {
        if (!this.pipelines.isEnabled(this.entityType) || !this.model.hasField('pipelineStage')) {
            return false;
        }

        return !this.view.getAcl().getScopeForbiddenFieldList(this.entityType, 'read').includes('pipelineStage');
    }

    /**
     * @private
     * @return {{id: string, stages: {id: string, name: string, style: string|null}[]}|null}
     */
    getPipeline() {
        if (!this.canReadStage()) {
            return null;
        }

        const pipelineId = this.model.get('pipelineId');
        const pipeline = this.pipelines.get(this.entityType).find(item => item.id === pipelineId);

        return pipeline && pipeline.stages && pipeline.stages.length ? pipeline : null;
    }

    /**
     * @private
     * @return {boolean}
     */
    canEditStage() {
        if (this.view.readOnly || this.view.mode === 'edit') {
            return false;
        }

        if (this.model.getFieldParam('pipelineStage', 'readOnly')) {
            return false;
        }

        const forbidden = this.view.getAcl().getScopeForbiddenFieldList(this.entityType, 'edit');

        return !forbidden.includes('pipelineStage') && this.view.getAcl().checkModel(this.model, 'edit') === true;
    }

    /**
     * @private
     * @param {string} stageId
     */
    async setStage(stageId) {
        Espo.Ui.notifyWait();

        try {
            await this.model.save({pipelineStageId: stageId}, {patch: true});
        } catch (e) {
            // EspoCRM affiche déjà l'erreur renvoyée par le serveur.
            return;
        }

        Espo.Ui.success(this.view.translate('Saved'));
    }
}
