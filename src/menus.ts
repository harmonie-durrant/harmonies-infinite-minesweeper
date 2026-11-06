import { exitToMainMenu, grid, startGame, ui } from "./main";
import { openOptions } from "./options";
import { onEnter, type Panel } from "./ui";

const startButton = document.querySelector("#start_button")!;
const optionsButton = document.querySelector("#options_button")!;
const playAgainButton =
    document.querySelector<HTMLButtonElement>("#play_again_button")!;
const viewMapButton = document.querySelector("#view_map_button")!;
const mainMenuButton = document.querySelector("#main_menu_button")!;

function viewMap() {
    ui.closeAll();
    ui.open("gameUI");
    grid.isLocked = false;
}

export const mainMenuPanel: Panel = {
    element: document.querySelector<HTMLDivElement>("#main_menu")!,
    onOpen(signal) {
        startButton.addEventListener("click", startGame, { signal });
        optionsButton.addEventListener("click", () => openOptions("mainMenu"), {
            signal,
        });
    },
};

export const gameOverPanel: Panel = {
    element: document.querySelector<HTMLDivElement>("#game_over_menu")!,
    onOpen(signal) {
        playAgainButton.addEventListener("click", startGame, { signal });
        viewMapButton.addEventListener("click", viewMap, { signal });
        mainMenuButton.addEventListener("click", exitToMainMenu, { signal });
        onEnter(signal, startGame);
        // So Enter plays again straight away
        playAgainButton.focus();
    },
};
