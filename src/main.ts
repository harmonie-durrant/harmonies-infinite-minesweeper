import { Camera } from "./camera";
import "./style.css";
import { Grid } from "./grid";
import { UI } from "./ui";
import { initializeDocumentListeners } from "./events/document";
import { initializeWindowListeners } from "./events/window";
import { initializeCanvasListeners } from "./events/canvas";
import { draw, resize } from "./render";
import { clearAnimations } from "./animations";
import { initializeMusicPlayer } from "./music/ui";
import { initializeOptions } from "./options";
import { initializePauseMenu } from "./pause";
import { initializeVolumeHud } from "./volume";
import { bankRunCoins, forfeitRunCoins, initializeCoins } from "./coins";
import { initializeRunStats } from "./runStats";

export const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
export const ctx = canvas.getContext("2d")!;
export const camera = new Camera();

export const ui = new UI({
    mainMenu: {
        element: document.querySelector<HTMLDivElement>("#main_menu")!,
        isOpen: true,
    },
    runStatsMenu: {
        element: document.querySelector<HTMLDivElement>("#run_stats_menu")!,
        isOpen: false,
    },
    gameOverMenu: {
        element: document.querySelector<HTMLDivElement>("#game_over_menu")!,
        isOpen: false,
    },
    optionsMenu: {
        element: document.querySelector<HTMLDivElement>("#options_menu")!,
        isOpen: false,
    },
    pauseMenu: {
        element: document.querySelector<HTMLDivElement>("#pause_menu")!,
        isOpen: false,
    },
    confirmMenu: {
        element: document.querySelector<HTMLDivElement>("#confirm_menu")!,
        isOpen: false,
    },
    gameUI: {
        element: document.querySelector<HTMLDivElement>("#game_ui")!,
        isOpen: false,
    },
});

export const grid = new Grid(Math.random() * 1000000, camera);

// A run that hit a mine keeps its coins, even when skipping the stats screen;
// one abandoned mid-way loses them
function settleRunCoins() {
    if (grid.isGameOver) bankRunCoins();
    else forfeitRunCoins();
}

export function exitToMainMenu() {
    ui.closeAll();
    ui.open("mainMenu");
    settleRunCoins();
    grid.reset();
    clearAnimations();
    draw();
}

export function startGame() {
    ui.closeAll();
    ui.open("gameUI");
    // Before the reset, which clears isGameOver
    settleRunCoins();
    grid.reset();
    grid.isLocked = false;
    clearAnimations();
    draw();
}

export function openGameOverMenu() {
    ui.open("gameOverMenu");
    // So Enter plays again straight away
    document.querySelector<HTMLButtonElement>("#play_again_button")!.focus();
}

function main() {
    initializeDocumentListeners();
    initializeWindowListeners();
    initializeCanvasListeners();
    initializeMusicPlayer();
    initializeOptions();
    initializePauseMenu();
    initializeVolumeHud();
    initializeCoins();
    initializeRunStats();
    resize();
}

main();
