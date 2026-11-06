import { Camera } from "./camera";
import "./style.css";
import { Grid } from "./grid";
import { UI } from "./ui";
import { initializeWindowListeners } from "./events/window";
import { initializeCanvasListeners } from "./events/canvas";
import { draw, resize } from "./render";
import { clearAnimations } from "./animations";
import { initializeMusicPlayer } from "./music/ui";
import { initializeOptions, optionsPanel } from "./options";
import { confirmMenuPanel, gameUIPanel, pauseMenuPanel } from "./pause";
import { gameOverPanel, mainMenuPanel } from "./menus";
import { initializeVolumeHud } from "./volume";
import { bankRunCoins, forfeitRunCoins, initializeCoins } from "./coins";
import { runStatsPanel } from "./runStats";

export const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
export const ctx = canvas.getContext("2d")!;
export const camera = new Camera();

const panels = {
    mainMenu: mainMenuPanel,
    runStatsMenu: runStatsPanel,
    gameOverMenu: gameOverPanel,
    optionsMenu: optionsPanel,
    pauseMenu: pauseMenuPanel,
    confirmMenu: confirmMenuPanel,
    gameUI: gameUIPanel,
};
export type PanelName = keyof typeof panels;
export const ui = new UI<PanelName>(panels);

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

function main() {
    initializeWindowListeners();
    initializeCanvasListeners();
    initializeMusicPlayer();
    initializeOptions();
    initializeVolumeHud();
    initializeCoins();
    resize();
}

main();
