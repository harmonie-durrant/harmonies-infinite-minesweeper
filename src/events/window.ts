import { CELL_SIZE } from "../constants";
import { camera, grid, restart } from "../main";
import { draw, resize } from "../render";

function onKeyPress(event: KeyboardEvent) {
    if (event.key === "r") {
        restart();
    }
}

export function initializeWindowListeners() {
    window.addEventListener("resize", resize);
    window.addEventListener("wheel", (event) => {
        event.preventDefault();
        if (event.deltaY < 0) camera.zoomIn();
        if (event.deltaY > 0) camera.zoomOut();
        grid.cellSize = CELL_SIZE * camera.zoom;
        draw();
    });
    window.addEventListener("keypress", onKeyPress);
}
