import {MOVED_SIDE_PANELS} from 'arc-theme:arc';

/**
 * Colonne de propriétés : les panneaux d'activité passent dans l'onglet Activité.
 * S'applique à la vue latérale configurée pour l'entité, standard ou personnalisée.
 *
 * @param {typeof import('views/record/detail-side').default} Base
 */
export default function arcDetailSide(Base) {
    return class extends Base {

        alterPanels(layoutData) {
            this.panelList = this.panelList.filter(item => !MOVED_SIDE_PANELS.includes(item.name));

            super.alterPanels(layoutData);
        }
    };
}
