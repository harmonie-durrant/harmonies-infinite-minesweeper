import { exitToMainMenu, grid, startGame, ui } from "../main";

export function initializeDocumentListeners() {
    document
        .querySelector("#play_again_button")!
        .addEventListener("click", startGame);

    document
        .querySelector("#main_menu_button")!
        .addEventListener("click", exitToMainMenu);

    document
        .querySelector("#view_map_button")!
        .addEventListener("click", () => {
            ui.closeAll();
            ui.open("gameUI");
            grid.isLocked = false;
        });

    document
        .querySelector("#start_button")!
        .addEventListener("click", startGame);
}
