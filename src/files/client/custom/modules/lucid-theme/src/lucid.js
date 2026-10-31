/**
 * Réglages communs de la fiche Lucid.
 */

/**
 * Panneaux d'activité latéraux par nature : ils restent dans la colonne de gauche, sous
 * « À propos », et sont retirés du bas quand la disposition les y ajoute aussi.
 */
export const SIDE_ACTIVITY_PANELS = ['activities', 'history', 'tasks'];

/** Panneaux du bas de l'onglet Activité, sous la saisie. */
export const ACTIVITY_PANELS = ['stream'];

/**
 * @param {import('view').default} view
 * @return {boolean}
 */
export function isLucidTheme(view) {
    return view.getThemeManager().getName() === 'Lucid';
}

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @return {HTMLElement}
 */
export function el(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}
