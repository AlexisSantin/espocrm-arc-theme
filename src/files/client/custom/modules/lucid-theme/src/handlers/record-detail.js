import {isLucidTheme} from 'lucid-theme:lucid';
import RecordBand from 'lucid-theme:helpers/record-band';
import EmptyFields from 'lucid-theme:helpers/empty-fields';
import PanelCollapse from 'lucid-theme:helpers/panel-collapse';
import ColumnResizer from 'lucid-theme:helpers/column-resizer';
import lucidDetailBottom from 'lucid-theme:mixins/detail-bottom';

/** Entités dont la fiche a une mise en page propre, laissée à EspoCRM. */
const EXCLUDED_ENTITY_TYPES = ['Email', 'User'];

/**
 * Applique la fiche Lucid aux vues de détail, uniquement sous le thème Lucid.
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

        let bottomView;

        try {
            bottomView = await derive(view.bottomView, 'bottom', lucidDetailBottom);
        } catch (e) {
            // Version d'EspoCRM inattendue : la fiche reste celle d'EspoCRM plutôt que de bloquer.
            console.warn('Lucid : fiche EspoCRM conservée.', e);

            return;
        }

        // Champs (statiques) à gauche dans « À propos », activité (dynamique) à droite. Un article
        // a besoin de largeur pour son corps : ses champs passent en tête de la colonne principale.
        view.template = this.hasArticleBody() ? 'lucid-theme:record/detail-content' : 'lucid-theme:record/detail';
        view.bottomView = bottomView;

        // build() a déjà créé la vue du bas d'origine sans attendre ce gestionnaire ;
        // le rendu, lui, l'attend : on la recrée avant qu'elle ne s'affiche.
        view.createBottomView();

        new RecordBand(view).init();
        new EmptyFields(view).init();
        new PanelCollapse(view).init();
        new ColumnResizer(view).init();
    }

    /**
     * Corps d'article en texte riche (base de connaissances, contenus) : un simple champ
     * « description » en texte riche ne suffit pas.
     *
     * @private
     * @return {boolean}
     */
    hasArticleBody() {
        const body = this.view.getMetadata().get(['entityDefs', this.view.entityType, 'fields', 'body']);

        return !!body && body.type === 'wysiwyg' && !body.disabled;
    }

    /**
     * @private
     * @return {boolean}
     */
    isApplicable() {
        const view = this.view;

        return isLucidTheme(view) &&
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
    const name = `lucid-theme:views/record/derived/${kind}-${baseName.replace(/[^A-Za-z0-9]+/g, '-')}`;

    return new Promise((resolve, reject) => {
        Espo.loader.require(baseName, Base => {
            try {
                Espo.loader.define(name, null, () => mixin(Base));
            } catch (e) {
                reject(e);

                return;
            }

            resolve(name);
        }, reject);
    });
}
