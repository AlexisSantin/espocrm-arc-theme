/** Liens dont le texte est une adresse : e-mails et sites web de l'inspecteur et du contenu. */
const LINK_SELECTOR = [
    '.lucid-inspector .field a[href^="mailto:"]',
    '.lucid-inspector .field a[data-action="mailTo"]',
    '.lucid-inspector .field a[href^="http"]',
    '.lucid-content-card .field a[href^="mailto:"]',
    '.lucid-content-card .field a[data-action="mailTo"]',
    '.lucid-content-card .field a[href^="http"]',
].join(', ');

/** Coupures permises : après « @ » et « / » (sauf au milieu de « // »), avant « . ». */
const BREAK_PATTERN = /(?<=@)|(?<=\/)(?!\/)|(?=\.)/;

/**
 * Dans une colonne étroite, une adresse trop longue se coupait au milieu d'un mot
 * (« amara.diallo@exam-ple.com »). Des points de coupure (<wbr>) aux séparateurs la font passer
 * à la ligne aux endroits naturels ; le texte, la copie et la lecture d'écran ne changent pas.
 */
export default class LinkBreaks {

    /**
     * @param {import('views/record/detail').default} view
     */
    constructor(view) {
        this.view = view;
        this.observer = null;
        this.scheduled = false;
    }

    init() {
        this.view.listenTo(this.view, 'after:render', () => this.observe());
        this.view.once('remove', () => this.observer && this.observer.disconnect());
    }

    /** @private */
    observe() {
        const root = this.view.element;

        if (this.observer) {
            this.observer.disconnect();
        }

        if (!root) {
            return;
        }

        // Les champs sont redessinés après chaque modification : on repasse sur les nouveaux liens.
        this.observer = new MutationObserver(() => this.schedule());
        this.observer.observe(root, {childList: true, subtree: true});

        this.schedule();
    }

    /** @private */
    schedule() {
        if (this.scheduled) {
            return;
        }

        this.scheduled = true;

        requestAnimationFrame(() => {
            this.scheduled = false;
            this.update();
        });
    }

    /** @private */
    update() {
        const root = this.view.element;

        if (!root) {
            return;
        }

        root.querySelectorAll(LINK_SELECTOR).forEach(link => {
            if (link.dataset.lucidBreaks) {
                return;
            }

            link.dataset.lucidBreaks = '1';

            // Le texte est dans le lien (site web) ou dans un <span> du lien (e-mail).
            const holder = !link.children.length ? link :
                link.children.length === 1 && !link.firstElementChild.children.length ? link.firstElementChild :
                null;

            if (!holder) {
                return;
            }

            const parts = holder.textContent.trim().split(BREAK_PATTERN).filter(part => part !== '');

            if (parts.length < 2) {
                return;
            }

            holder.replaceChildren(...parts.flatMap((part, index) => index ? [document.createElement('wbr'), part] : [part]));
        });
    }
}
