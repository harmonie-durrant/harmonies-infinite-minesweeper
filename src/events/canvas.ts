import { DRAG_THRESHOLD } from "../constants";
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
    if (grid.isGameOver || ui.isOpen()) return;
    const cellPosition = screenToCell(event.offsetX, event.offsetY, camera);
    const cellState = grid.getCellState(cellPosition);
    if ([CellState.REVEALED, CellState.FLAGGED].includes(cellState)) return;
    grid.revealCell(cellPosition);
    draw();
    if (grid.isGameOver) {
        ui.open("gameOverMenu");
    }
}

function onCellRightClick(event: PointerEvent) {
    if (grid.isGameOver || ui.isOpen()) return;
    const cellPosition = screenToCell(event.offsetX, event.offsetY, camera);
    const cellState = grid.getCellState(cellPosition);
    if (cellState === CellState.REVEALED) return;
    const newState =
        cellState === CellState.FLAGGED ? CellState.HIDDEN : CellState.FLAGGED;
    grid.setCellState(cellPosition, newState);
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
    if (ui.isOpen() || !pointerIsDown || !pointerDownPosition) return;

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
}
