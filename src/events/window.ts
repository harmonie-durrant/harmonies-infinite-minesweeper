import { actionFor } from "../keybinds";
import { startGame, ui } from "../main";
import { onOptionsEscape } from "../options";
import { cancelConfirm, pause, resume } from "../pause";
import { resize } from "../render";
import type { Action } from "../settings";
import { runAction } from "./canvas";
import { closeRunStats } from "../runStats";

// Work in the pause menus too, not just in game
const AUDIO_ACTIONS: Action[] = [
    "muteMusic",
    "musicUp",
    "musicDown",
    "sfxUp",
    "sfxDown",
];

// Holding the key keeps stepping
const REPEATING_ACTIONS: Action[] = [
    "zoomIn",
    "zoomOut",
    "musicUp",
    "musicDown",
    "sfxUp",
    "sfxDown",
];

// Escape backs out one level at a time
function onEscape() {
    const { optionsMenu, confirmMenu, pauseMenu, gameUI } = ui.uiPanels;
    if (optionsMenu?.isOpen) onOptionsEscape();
    else if (confirmMenu?.isOpen) cancelConfirm();
    else if (pauseMenu?.isOpen) resume();
    else if (gameUI?.isOpen) pause();
}

function onKeyDown(event: KeyboardEvent) {
    if (event.code === "Escape") {
        if (!event.repeat) onEscape();
        return;
    }
    const { optionsMenu, confirmMenu, pauseMenu, gameOverMenu, runStatsMenu } =
        ui.uiPanels;
    if (optionsMenu?.isOpen) return;
    // Enter on a focused button already presses it
    const isEnter = event.code === "Enter" || event.code === "NumpadEnter";
    const onButton = document.activeElement instanceof HTMLButtonElement;
    if (runStatsMenu?.isOpen && isEnter && !onButton && !event.repeat) {
        event.preventDefault();
        closeRunStats();
        return;
    }
    if (gameOverMenu?.isOpen && isEnter && !onButton && !event.repeat) {
        event.preventDefault();
        startGame();
        return;
    }
    const action = actionFor({ device: "key", code: event.code });
    if (!action) return;
    const inPauseMenus = confirmMenu?.isOpen || pauseMenu?.isOpen;
    if (inPauseMenus && !AUDIO_ACTIONS.includes(action)) return;
    event.preventDefault();
    if (event.repeat && !REPEATING_ACTIONS.includes(action)) return;
    runAction(action);
}

export function initializeWindowListeners() {
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    // Mouse 4/5 can be bound, so they must not navigate the page away
    window.addEventListener("mouseup", (event) => {
        if (event.button === 3 || event.button === 4) event.preventDefault();
    });
}
