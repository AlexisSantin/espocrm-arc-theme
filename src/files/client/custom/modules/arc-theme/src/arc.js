/**
 * Réglages communs de la fiche Arc.
 */

/** Panneaux latéraux qui rejoignent l'onglet Activité de la colonne principale. */
export const MOVED_SIDE_PANELS = ['activities', 'history', 'tasks'];

/** Panneaux du bas regroupés dans l'onglet Activité, dans leur ordre d'affichage. */
export const ACTIVITY_PANELS = ['stream', 'activities', 'tasks', 'history'];

/**
 * @param {import('view').default} view
 * @return {boolean}
 */
export function isArcTheme(view) {
    return view.getThemeManager().getName() === 'Arc';
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
