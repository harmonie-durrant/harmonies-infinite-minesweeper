import { grid, ui } from "../main";
import { draw } from "../render";

export function initializeDocumentListeners() {
    document.querySelector("#restart_button")!.addEventListener("click", () => {
        ui.closeAll();
        ui.open("mainMenu");
        grid.reset();
        draw();
    });

    document
        .querySelector("#view_map_button")!
        .addEventListener("click", () => {
            ui.closeAll();
        });

    document.querySelector("#start_button")!.addEventListener("click", () => {
        ui.closeAll();
        grid.reset();
        draw();
    });
}
