import { Camera } from "./camera";
import "./style.css";
import { Grid } from "./grid";
import { UI } from "./ui";
import { initializeDocumentListeners } from "./events/document";
import { initializeWindowListeners } from "./events/window";
import { initializeCanvasListeners } from "./events/canvas";
import { resize } from "./render";

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
});

export const grid = new Grid(Math.random() * 1000000, camera);

function main() {
    initializeDocumentListeners();
    initializeWindowListeners();
    initializeCanvasListeners();
    resize();
}

main();
