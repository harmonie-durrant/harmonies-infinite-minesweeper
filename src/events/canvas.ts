import { animateFlag, breakCells, explode } from "../animations";
import { DRAG_THRESHOLD, GAME_OVER_MENU_DELAY } from "../constants";
import { CellState } from "../grid";
import { camera, canvas, grid, ui } from "../main";
import { draw } from "../render";
import { screenToCell } from "../utils";
import { Vector2D } from "../vector";

let previousPointerPosition: Vector2D | null = null;
let pointerDownPosition: Vector2D | null = null;
let isDragging = false;
let pointerIsDown = false;

function onCellClick(event: PointerEvent) {
    if (grid.isGameOver || grid.isLocked) return;
    const cellPosition = screenToCell(event.offsetX, event.offsetY, camera);
    const cellState = grid.getCellState(cellPosition);
    if ([CellState.REVEALED, CellState.FLAGGED].includes(cellState)) return;
    const revealed = grid.revealCell(cellPosition);
    breakCells(revealed, cellPosition);
    if (grid.isGameOver) {
        explode(cellPosition);
        grid.isLocked = true;
        // Let the explosion play out before covering the board
        setTimeout(() => {
            if (grid.isGameOver) ui.open("gameOverMenu");
        }, GAME_OVER_MENU_DELAY);
    }
    draw();
}

function onCellRightClick(event: PointerEvent) {
    if (grid.isGameOver || grid.isLocked) return;
    const cellPosition = screenToCell(event.offsetX, event.offsetY, camera);
    const cellState = grid.getCellState(cellPosition);
    if (cellState === CellState.REVEALED) return;
    const newState =
        cellState === CellState.FLAGGED ? CellState.HIDDEN : CellState.FLAGGED;
    grid.setCellState(cellPosition, newState);
    animateFlag(cellPosition, newState === CellState.FLAGGED);
    draw();
}

function onPointerDown(event: PointerEvent) {
    canvas.setPointerCapture(event.pointerId);
    pointerIsDown = true;
    isDragging = false;
    pointerDownPosition = new Vector2D(event.offsetX, event.offsetY);
    previousPointerPosition = new Vector2D(event.offsetX, event.offsetY);
}

function onPointermove(event: PointerEvent) {
    if (grid.isLocked || !pointerIsDown || !pointerDownPosition) return;

    if (!isDragging) {
        const dx = event.offsetX - pointerDownPosition.x;
        const dy = event.offsetY - pointerDownPosition.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) isDragging = true;
    }

    if (isDragging && previousPointerPosition) {
        camera.move(
            new Vector2D(
                previousPointerPosition.x - event.offsetX,
                previousPointerPosition.y - event.offsetY,
            ),
        );
        draw();
    }

    previousPointerPosition = new Vector2D(event.offsetX, event.offsetY);
}

function onPointerUp(event: PointerEvent) {
    pointerIsDown = false;
    if (!isDragging) {
        if (event.button === 0) {
            onCellClick(event);
        } else if (event.button === 2) {
            onCellRightClick(event);
        }
    }
}

export function initializeCanvasListeners() {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointermove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}
