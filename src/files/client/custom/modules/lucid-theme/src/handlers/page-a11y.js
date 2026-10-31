import {isLucidTheme} from 'lucid-theme:lucid';

/**
 * Page accessibility under the Lucid theme (RGAA 8.3 and 10.4): EspoCRM doesn't declare the
 * document language and blocks zooming on mobile. Called when lists, records, forms and the
 * login page open.
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
