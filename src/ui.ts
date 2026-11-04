export class UI {
    public uiPanels: Record<
        string,
        { element: HTMLDivElement; isOpen: boolean }
    >;

    constructor(
        panelElements: Record<
            string,
            { element: HTMLDivElement; isOpen: boolean }
        >,
    ) {
        this.uiPanels = panelElements;
    }

    public isOpen() {
        const panelList = Object.values(this.uiPanels);
        for (const panel of panelList) {
            if (panel.isOpen) return true;
        }
        return false;
    }

    public open(name: string) {
        const panel = this.uiPanels[name];
        if (!panel) return;
        panel.element.classList.replace("hidden", "flex");
        this.uiPanels[name] = { ...panel, isOpen: true };
    }

    public close(name: string) {
        const panel = this.uiPanels[name];
        if (!panel) return;
        // A hidden button keeping focus would still catch Enter and Space
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && panel.element.contains(focused))
            focused.blur();
        panel.element.classList.replace("flex", "hidden");
        this.uiPanels[name] = { ...panel, isOpen: false };
    }

    public closeAll() {
        const names = Object.keys(this.uiPanels);
        for (const name of names) {
            this.close(name);
        }
    }
}
