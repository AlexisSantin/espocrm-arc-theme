/** Largeurs de la colonne « À propos », en pixels. */
const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 300;
const MAX_WIDTH = 720;

/** La colonne de droite garde toujours au moins cette largeur. */
const MAIN_MIN_WIDTH = 480;

const STEP = 16;
const LARGE_STEP = 64;

const STORAGE_TYPE = 'arcInspectorWidth';

/**
 * Poignée entre « À propos » et la colonne de droite : la largeur se règle à la souris
 * (double-clic pour revenir à la largeur par défaut) ou au clavier (flèches, Début, Fin).
 * Elle est retenue par utilisateur, dans le navigateur.
 */
export default class ColumnResizer {

    /**
     * @param {import('views/record/detail').default} view
     */
    constructor(view) {
        this.view = view;
        this.storageName = view.getUser().id;
        this.width = this.load();
        this.grid = null;
        this.handle = null;
    }

    init() {
        this.view.listenTo(this.view, 'after:render', () => this.setup());
    }

    /** @private */
    setup() {
        const root = this.view.element;

        this.grid = root && root.querySelector('.arc-record-grid');
        this.handle = this.grid && this.grid.querySelector(':scope > .arc-resizer');

        if (!this.handle) {
            return;
        }

        this.handle.addEventListener('pointerdown', event => this.startDrag(event));
        this.handle.addEventListener('keydown', event => this.onKeyDown(event));
        this.handle.addEventListener('dblclick', () => this.setWidth(null));

        this.apply();
    }

    /**
     * @private
     * @param {PointerEvent} event
     */
    startDrag(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();

        const handle = this.handle;
        const left = this.grid.querySelector(':scope > .arc-inspector').getBoundingClientRect().left;
        const offset = handle.offsetWidth / 2;

        handle.setPointerCapture(event.pointerId);
        handle.classList.add('is-dragging');
        document.body.classList.add('arc-resizing');

        const onMove = moveEvent => {
            this.width = this.clamp(moveEvent.clientX - left - offset);
            this.apply();
        };

        const onEnd = () => {
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onEnd);
            handle.removeEventListener('pointercancel', onEnd);
            handle.classList.remove('is-dragging');
            document.body.classList.remove('arc-resizing');

            this.save();
        };

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onEnd);
        handle.addEventListener('pointercancel', onEnd);
    }

    /**
     * @private
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        const current = this.currentWidth();
        const step = event.shiftKey ? LARGE_STEP : STEP;

        const next = {
            ArrowLeft: current - step,
            ArrowRight: current + step,
            Home: MIN_WIDTH,
            End: this.maxWidth(),
        }[event.key];

        if (next === undefined) {
            return;
        }

        event.preventDefault();

        this.setWidth(this.clamp(next));
    }

    /**
     * @private
     * @param {number|null} width Null : largeur par défaut.
     */
    setWidth(width) {
        this.width = width;
        this.apply();
        this.save();
    }

    /** @private */
    apply() {
        if (!this.grid || !this.handle) {
            return;
        }

        if (this.width) {
            this.grid.style.setProperty('--arc-inspector-width', `${this.width}px`);
        } else {
            this.grid.style.removeProperty('--arc-inspector-width');
        }

        const width = this.currentWidth();

        this.handle.setAttribute('aria-valuemin', String(MIN_WIDTH));
        this.handle.setAttribute('aria-valuemax', String(this.maxWidth()));
        this.handle.setAttribute('aria-valuenow', String(width));
        this.handle.setAttribute('aria-valuetext', `${width} px`);
    }

    /**
     * @private
     * @return {number}
     */
    currentWidth() {
        const inspector = this.grid.querySelector(':scope > .arc-inspector');

        return inspector ? Math.round(inspector.getBoundingClientRect().width) : (this.width || DEFAULT_WIDTH);
    }

    /**
     * @private
     * @return {number}
     */
    maxWidth() {
        const available = this.grid.clientWidth - this.handle.offsetWidth - MAIN_MIN_WIDTH;

        return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, available));
    }

    /**
     * @private
     * @param {number} width
     * @return {number}
     */
    clamp(width) {
        return Math.round(Math.min(Math.max(width, MIN_WIDTH), this.maxWidth()));
    }

    /**
     * @private
     * @return {number|null}
     */
    load() {
        const stored = this.view.getStorage().get(STORAGE_TYPE, this.storageName);

        return typeof stored === 'number' && stored >= MIN_WIDTH ? stored : null;
    }

    /** @private */
    save() {
        if (this.width) {
            this.view.getStorage().set(STORAGE_TYPE, this.storageName, this.width);
        } else {
            this.view.getStorage().clear(STORAGE_TYPE, this.storageName);
        }
    }
}
