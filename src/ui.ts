import type { Action } from "./settings";

export interface Panel {
    element: HTMLElement;
    /**
     * Runs each time the panel opens. Listeners added with `{ signal }` are
     * removed automatically when it closes.
     */
    onOpen?(signal: AbortSignal): void;
    /** Runs each time the panel closes, after its listeners are removed */
    onClose?(): void;
    /** Bound actions still usable while this panel is open; all if unset */
    allowedActions?: readonly Action[];
}

export class UI<Name extends string> {
    private readonly panels: Record<Name, Panel>;
    // One controller per open panel; aborting it drops that panel's listeners
    private readonly controllers = new Map<Name, AbortController>();

    constructor(panels: Record<Name, Panel>) {
        this.panels = panels;
        // Match the markup: whatever starts visible counts as open
        for (const name of Object.keys(panels) as Name[]) {
            if (!panels[name].element.classList.contains("hidden"))
                this.open(name);
        }
    }

    /** Whether the given panel, or with no name any panel, is open */
    public isOpen(name?: Name) {
        return name ? this.controllers.has(name) : this.controllers.size > 0;
    }

    /** Whether every open panel lets this bound action through */
    public allows(action: Action) {
        for (const name of this.controllers.keys()) {
            const allowed = this.panels[name].allowedActions;
            if (allowed && !allowed.includes(action)) return false;
        }
        return true;
    }

    public open(name: Name) {
        if (this.controllers.has(name)) return;
        const panel = this.panels[name];
        const controller = new AbortController();
        this.controllers.set(name, controller);
        panel.element.classList.remove("hidden");
        panel.element.classList.add("flex");
        panel.onOpen?.(controller.signal);
    }

    public close(name: Name) {
        const controller = this.controllers.get(name);
        if (!controller) return;
        const panel = this.panels[name];
        // A hidden button keeping focus would still catch Enter and Space
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && panel.element.contains(focused))
            focused.blur();
        panel.element.classList.remove("flex");
        panel.element.classList.add("hidden");
        this.controllers.delete(name);
        controller.abort();
        panel.onClose?.();
    }

    public closeAll() {
        for (const name of [...this.controllers.keys()]) this.close(name);
    }
}

// Panels listen on the document, which a key reaches before the window, so
// preventing it here keeps the window's bound actions from also running it
function onKey(
    signal: AbortSignal,
    matches: (event: KeyboardEvent) => boolean,
    handler: () => void,
) {
    document.addEventListener(
        "keydown",
        (event) => {
            if (event.defaultPrevented || !matches(event)) return;
            event.preventDefault();
            if (!event.repeat) handler();
        },
        { signal },
    );
}

/** Calls the handler on Escape while the signal is live */
export function onEscape(signal: AbortSignal, handler: () => void) {
    onKey(signal, (event) => event.code === "Escape", handler);
}

/** Calls the handler on Enter, unless a focused button will take it */
export function onEnter(signal: AbortSignal, handler: () => void) {
    onKey(
        signal,
        (event) =>
            (event.code === "Enter" || event.code === "NumpadEnter") &&
            !(document.activeElement instanceof HTMLButtonElement),
        handler,
    );
}
