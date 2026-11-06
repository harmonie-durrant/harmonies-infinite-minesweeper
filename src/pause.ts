import { exitToMainMenu, grid, startGame, ui } from "./main";
import { openOptions } from "./options";
import { AUDIO_ACTIONS } from "./settings";
import { onEscape, type Panel } from "./ui";

const gameUIElement = document.querySelector<HTMLDivElement>("#game_ui")!;
const pauseElement = document.querySelector<HTMLDivElement>("#pause_menu")!;
const confirmElement = document.querySelector<HTMLDivElement>("#confirm_menu")!;
const pauseButton = document.querySelector("#pause_button")!;
const resumeButton =
    document.querySelector<HTMLButtonElement>("#resume_button")!;
const restartButton = document.querySelector("#pause_restart_button")!;
const optionsButton = document.querySelector("#pause_options_button")!;
const mainMenuButton = document.querySelector("#pause_main_menu_button")!;
const confirmTitle = document.querySelector("#confirm_title")!;
const confirmMessage = document.querySelector("#confirm_message")!;
const confirmYes = document.querySelector("#confirm_yes")!;
const confirmNo = document.querySelector<HTMLButtonElement>("#confirm_no")!;

let onConfirm = () => {};
// Where No goes back to: the pause menu, or straight into the game
let confirmFrom: "pauseMenu" | "gameUI" = "pauseMenu";

export function pause() {
    // Locked while a mine explodes, before the game over menu takes over
    if (grid.isLocked) return;
    grid.isLocked = true;
    ui.close("gameUI");
    ui.open("pauseMenu");
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
}

export function confirmRestart() {
    askConfirm(
        "Restart?",
        "The current board progress will be lost",
        startGame,
        "gameUI",
    );
}

function cancelConfirm() {
    ui.close("confirmMenu");
    ui.open(confirmFrom);
    if (confirmFrom === "gameUI") grid.isLocked = false;
}

export const gameUIPanel: Panel = {
    element: gameUIElement,
    onOpen(signal) {
        pauseButton.addEventListener("click", pause, { signal });
        onEscape(signal, pause);
    },
};

export const pauseMenuPanel: Panel = {
    element: pauseElement,
    allowedActions: AUDIO_ACTIONS,
    onOpen(signal) {
        resumeButton.addEventListener("click", resume, { signal });
        restartButton.addEventListener(
            "click",
            () =>
                askConfirm(
                    "Restart?",
                    "The current board progress will be lost",
                    startGame,
                ),
            { signal },
        );
        optionsButton.addEventListener(
            "click",
            () => openOptions("pauseMenu"),
            { signal },
        );
        mainMenuButton.addEventListener(
            "click",
            () =>
                askConfirm(
                    "Quit?",
                    "The current board progress will be lost",
                    exitToMainMenu,
                ),
            { signal },
        );
        onEscape(signal, resume);
        resumeButton.focus();
    },
};

export const confirmMenuPanel: Panel = {
    element: confirmElement,
    allowedActions: AUDIO_ACTIONS,
    onOpen(signal) {
        confirmYes.addEventListener("click", () => onConfirm(), { signal });
        confirmNo.addEventListener("click", cancelConfirm, { signal });
        onEscape(signal, cancelConfirm);
        // Default to the safe answer
        confirmNo.focus();
    },
};
