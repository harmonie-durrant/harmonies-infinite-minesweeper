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
        const panelList = Object(this.uiPanels).values;
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
        panel.element.classList.replace("flex", "hidden");
        this.uiPanels[name] = { ...panel, isOpen: false };
    }

    public closeAll() {
        const names = Object(this.uiPanels).keys;
        for (const name of names) {
            this.close(name);
        }
    }
}
