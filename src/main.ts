import { Camera } from "./camera";
import "./style.css";
import { Grid } from "./grid";
import { UI } from "./ui";
import { initializeDocumentListeners } from "./events/document";
import { initializeWindowListeners } from "./events/window";
import { initializeCanvasListeners } from "./events/canvas";
import { draw, resize } from "./render";

export const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
export const ctx = canvas.getContext("2d")!;
export const camera = new Camera();

export const ui = new UI({
    mainMenu: {
        element: document.querySelector<HTMLDivElement>("#main_menu")!,
        isOpen: true,
    },
    gameOverMenu: {
        element: document.querySelector<HTMLDivElement>("#game_over_menu")!,
        isOpen: false,
    },
    gameUI: {
        element: document.querySelector<HTMLDivElement>("#game_ui")!,
        isOpen: false,
    },
});

export const grid = new Grid(Math.random() * 1000000, camera);

export function restart() {
    ui.closeAll();
    ui.open("mainMenu");
    grid.reset();
    draw();
}

function main() {
    initializeDocumentListeners();
    initializeWindowListeners();
    initializeCanvasListeners();
    resize();
}

main();
