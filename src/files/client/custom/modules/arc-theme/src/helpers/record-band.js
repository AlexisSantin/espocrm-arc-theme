import PipelinesHelper from 'helpers/misc/pipelines';
import {el} from 'arc-theme:arc';

/**
 * Attributs affichés sous le nom, dans l'ordre, quand ils ont une valeur.
 *
 * @type {Object.<string, string[]>}
 */
const SUBTITLE_ATTRIBUTES = {
    Lead: ['title', 'accountName', 'addressCity'],
    Contact: ['title', 'accountName', 'addressCity'],
    Account: ['type', 'industry', 'billingAddressCity'],
    Opportunity: ['accountName', 'stage'],
    Case: ['accountName', 'status'],
};

/** Étapes de clôture négative : proposées à part plutôt que sur le parcours. */
const OFF_PATH_STYLES = ['danger'];

/**
 * Bandeau de la fiche : identité (avatar, nom, informations clés) et parcours de pipeline.
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
        this.view.listenTo(this.view, 'after:render', () => this.render());

        this.view.listenTo(this.model, 'sync change', () => {
            if (this.view.isRendered()) {
                this.render();
            }
        });
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
        const avatar = el('div', 'arc-avatar', this.getInitials(name));
        const text = el('div', 'arc-identity-text');

        avatar.setAttribute('aria-hidden', 'true');
        avatar.append(el('span', 'arc-avatar-plus', '+'));

        text.append(el('p', 'arc-identity-name', name));

        const parts = this.getSubtitleParts();

        if (parts.length) {
            text.append(el('p', 'arc-identity-meta', parts.join(' · ')));
        }

        wrapper.append(avatar, text);

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
            return '+';
        }

        const letters = words.length === 1 ?
            [...words[0]].slice(0, 2) :
            [[...words[0]][0], [...words[words.length - 1]][0]];

        return letters.join('').toUpperCase();
    }

    /**
     * @private
     * @return {string[]}
     */
    getSubtitleParts() {
        const attributes = SUBTITLE_ATTRIBUTES[this.entityType] || [];
        const forbidden = this.view.getAcl().getScopeForbiddenFieldList(this.entityType, 'read');

        return attributes
            .filter(attribute => !forbidden.includes(this.getFieldOfAttribute(attribute)))
            .map(attribute => {
                const value = this.model.get(attribute);

                if (value === null || value === undefined || value === '') {
                    return null;
                }

                if (this.model.getFieldType(attribute) === 'enum') {
                    return this.view.getLanguage().translateOption(value, attribute, this.entityType);
                }

                return String(value);
            })
            .filter(Boolean);
    }

    /**
     * @private
     * @param {string} attribute
     * @return {string}
     */
    getFieldOfAttribute(attribute) {
        if (this.model.hasField(attribute)) {
            return attribute;
        }

        for (const suffix of ['Name', 'City']) {
            const field = attribute.slice(0, -suffix.length);

            if (attribute.endsWith(suffix) && this.model.hasField(field)) {
                return field;
            }
        }

        return attribute;
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
