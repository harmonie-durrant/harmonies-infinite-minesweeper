import { exitToMainMenu, grid, startGame, ui } from "./main";
import { openOptions } from "./options";

const confirmTitle = document.querySelector("#confirm_title")!;
const confirmMessage = document.querySelector("#confirm_message")!;
let onConfirm = () => {};
// Where No goes back to: the pause menu, or straight into the game
let confirmFrom = "pauseMenu";

export function pause() {
    // Locked while a mine explodes, before the game over menu takes over
    if (grid.isLocked) return;
    grid.isLocked = true;
    ui.close("gameUI");
    ui.open("pauseMenu");
    document.querySelector<HTMLButtonElement>("#resume_button")!.focus();
}

export function resume() {
    ui.close("pauseMenu");
    ui.open("gameUI");
    grid.isLocked = false;
}

function askConfirm(
    title: string,
    message: string,
    action: () => void,
    from: "pauseMenu" | "gameUI" = "pauseMenu",
) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    onConfirm = action;
    confirmFrom = from;
    // The board must not take input behind the dialog
    grid.isLocked = true;
    ui.close(from);
    ui.open("confirmMenu");
    // Default to the safe answer
    document.querySelector<HTMLButtonElement>("#confirm_no")!.focus();
}

export function confirmRestart() {
    askConfirm(
        "Restart?",
        "The current board progress will be lost",
        startGame,
        "gameUI",
    );
}

export function cancelConfirm() {
    ui.close("confirmMenu");
    ui.open(confirmFrom);
    if (confirmFrom === "gameUI") {
        grid.isLocked = false;
    } else {
        document.querySelector<HTMLButtonElement>("#resume_button")!.focus();
    }
}

export function initializePauseMenu() {
    document.querySelector("#pause_button")!.addEventListener("click", pause);
    document.querySelector("#resume_button")!.addEventListener("click", resume);
    document
        .querySelector("#pause_restart_button")!
        .addEventListener("click", () =>
            askConfirm(
                "Restart?",
                "The current board progress will be lost",
                startGame,
            ),
        );
    document
        .querySelector("#pause_options_button")!
        .addEventListener("click", () => openOptions("pauseMenu"));
    document
        .querySelector("#pause_main_menu_button")!
        .addEventListener("click", () =>
            askConfirm(
                "Quit?",
                "The current board progress will be lost",
                exitToMainMenu,
            ),
        );
    document
        .querySelector("#confirm_yes")!
        .addEventListener("click", () => onConfirm());
    document
        .querySelector("#confirm_no")!
        .addEventListener("click", cancelConfirm);
}
