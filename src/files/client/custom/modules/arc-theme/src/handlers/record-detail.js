import {isArcTheme} from 'arc-theme:arc';
import RecordBand from 'arc-theme:helpers/record-band';
import EmptyFields from 'arc-theme:helpers/empty-fields';
import arcDetailBottom from 'arc-theme:mixins/detail-bottom';

/** Entités dont la fiche a une mise en page propre, laissée à EspoCRM. */
const EXCLUDED_ENTITY_TYPES = ['Email', 'User'];

/**
 * Applique la fiche Arc aux vues de détail, uniquement sous le thème Arc.
 * La vue du bas configurée pour l'entité est dérivée, pas remplacée, pour garder ses
 * comportements propres ; la vue latérale (conversion des prospects…) reste celle d'EspoCRM.
 */
export default class RecordDetailHandler {

    /**
     * @param {import('views/record/detail').default} view
     */
    constructor(view) {
        this.view = view;
    }

    async process() {
        const view = this.view;

        if (!this.isApplicable()) {
            return;
        }

        // Un texte riche (article, contenu) a besoin de largeur : la variante « contenu »
        // place les champs dans la colonne principale et garde le suivi dans l'inspecteur.
        view.template = this.hasRichText() ? 'arc-theme:record/detail-content' : 'arc-theme:record/detail';

        view.bottomView = await derive(view.bottomView, 'bottom', arcDetailBottom);

        // build() a déjà créé la vue du bas d'origine sans attendre ce gestionnaire ;
        // le rendu, lui, l'attend : on la recrée avant qu'elle ne s'affiche.
        view.createBottomView();

        new RecordBand(view).init();
        new EmptyFields(view).init();
    }

    /**
     * @private
     * @return {boolean}
     */
    hasRichText() {
        const fields = this.view.getMetadata().get(['entityDefs', this.view.entityType, 'fields']) || {};

        return Object.values(fields).some(field => field.type === 'wysiwyg' && !field.disabled);
    }

    /**
     * @private
     * @return {boolean}
     */
    isApplicable() {
        const view = this.view;

        return isArcTheme(view) &&
            view.type === 'detail' &&
            view.template === 'record/detail' &&
            !!view.sideView &&
            !!view.bottomView &&
            !view.sideDisabled &&
            !view.bottomDisabled &&
            !EXCLUDED_ENTITY_TYPES.includes(view.entityType) &&
            !!view.getMetadata().get(['scopes', view.entityType, 'object']);
    }
}

/**
 * Définit (une fois) une vue dérivée de la vue de base et renvoie son nom.
 *
 * @param {string} baseName
 * @param {string} kind
 * @param {function(Function): Function} mixin
 * @return {Promise<string>}
 */
function derive(baseName, kind, mixin) {
    const name = `arc-theme:views/record/derived/${kind}-${baseName.replace(/[^A-Za-z0-9]+/g, '-')}`;

    return new Promise((resolve, reject) => {
        Espo.loader.require(baseName, Base => {
            Espo.loader.define(name, null, () => mixin(Base));

            resolve(name);
        }, reject);
    });
}
