import { grid, restart, ui } from "../main";
import { draw } from "../render";

export function initializeDocumentListeners() {
    document
        .querySelector("#restart_button_ui")!
        .addEventListener("click", restart);

    document
        .querySelector("#restart_button")!
        .addEventListener("click", restart);

    document
        .querySelector("#view_map_button")!
        .addEventListener("click", () => {
            ui.closeAll();
            ui.open("gameUI");
            grid.isLocked = false;
        });

    document.querySelector("#start_button")!.addEventListener("click", () => {
        ui.closeAll();
        ui.open("gameUI");
        grid.reset();
        grid.isLocked = false;
        draw();
    });
}
