/** Links whose text is an address: emails and websites in the inspector and the content card. */
const LINK_SELECTOR = [
    '.lucid-inspector .field a[href^="mailto:"]',
    '.lucid-inspector .field a[data-action="mailTo"]',
    '.lucid-inspector .field a[href^="http"]',
    '.lucid-content-card .field a[href^="mailto:"]',
    '.lucid-content-card .field a[data-action="mailTo"]',
    '.lucid-content-card .field a[href^="http"]',
].join(', ');

/** Allowed breaks: after "@" and "/" (except inside "//"), before ".". */
const BREAK_PATTERN = /(?<=@)|(?<=\/)(?!\/)|(?=\.)/;

/**
 * In a narrow column, a long address used to break mid-word ("amara.diallo@exam-ple.com").
 * Break points (<wbr>) at the separators wrap it at natural places; the text, copying and
 * screen readers are unchanged.
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

        // Fields are redrawn after each change: new links are processed again.
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

            // The text sits in the link (website) or in a <span> inside the link (email).
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
