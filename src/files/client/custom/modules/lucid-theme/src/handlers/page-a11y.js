import {isLucidTheme} from 'lucid-theme:lucid';

/**
 * Accessibilité de la page sous le thème Lucid (RGAA 8.3 et 10.4) : EspoCRM ne déclare pas la
 * langue du document et bloque le zoom sur mobile. Appelé à l'ouverture des listes, fiches,
 * formulaires et de la page de connexion.
 */
export default class PageA11yHandler {

    /**
     * @param {import('view').default} view
     */
    constructor(view) {
        this.view = view;
    }

    process() {
        if (!isLucidTheme(this.view)) {
            return;
        }

        const language = this.view.getLanguage().name || this.view.getConfig().get('language');

        if (language) {
            document.documentElement.lang = language.replace('_', '-');
        }

        const viewport = document.querySelector('meta[name="viewport"]');

        if (viewport && /user-scalable\s*=\s*no|maximum-scale/.test(viewport.content)) {
            viewport.content = 'width=device-width, initial-scale=1.0';
        }
    }
}
