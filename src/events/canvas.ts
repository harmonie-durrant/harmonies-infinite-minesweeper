import { animateFlag, breakCells, explode } from "../animations";
import {
    CELL_SIZE,
    DRAG_THRESHOLD,
    GAME_OVER_MENU_DELAY,
    LONG_PRESS_DURATION,
    TOUCH_DRAG_THRESHOLD,
} from "../constants";
import { CellState } from "../grid";
import { actionFor } from "../keybinds";
import { camera, canvas, grid, openGameOverMenu, startGame, ui } from "../main";
import { draw } from "../render";
import { settings, type Action } from "../settings";
import { playExplosion, playFlag, playReveal } from "../sfx";
import { screenToCell } from "../utils";
import { Vector2D } from "../vector";
import { changeVolume, toggleMusicMuted } from "../volume";

let previousPointerPosition: Vector2D | null = null;
let pointerDownPosition: Vector2D | null = null;
let isDragging = false;
let pointerIsDown = false;
// Where keyboard-bound reveal and flag act
let hoverPosition: Vector2D | null = null;
let longPressTimer = 0;
// The press already acted, so letting go must not act again
let longPressFired = false;

function revealCell(cellPosition: Vector2D) {
    if (grid.isGameOver || grid.isLocked) return;
    const cellState = grid.getCellState(cellPosition);
    if ([CellState.REVEALED, CellState.FLAGGED].includes(cellState)) return;
    const revealed = grid.revealCell(cellPosition);
    breakCells(revealed, cellPosition);
    if (grid.isGameOver) {
        playExplosion();
        explode(cellPosition);
        grid.isLocked = true;
        // Let the explosion play out before covering the board
        setTimeout(() => {
            if (grid.isGameOver) openGameOverMenu();
        }, GAME_OVER_MENU_DELAY);
    } else if (revealed.length > 0) {
        playReveal(revealed.length);
    }
    draw();
}

function toggleFlag(cellPosition: Vector2D) {
    if (grid.isGameOver || grid.isLocked) return;
    const cellState = grid.getCellState(cellPosition);
    if (cellState === CellState.REVEALED) return;
    const newState =
        cellState === CellState.FLAGGED ? CellState.HIDDEN : CellState.FLAGGED;
    grid.setCellState(cellPosition, newState);
    animateFlag(cellPosition, newState === CellState.FLAGGED);
    playFlag(newState === CellState.FLAGGED);
    draw();
}

function zoom(direction: "in" | "out") {
    if (!ui.uiPanels.gameUI?.isOpen) return;
    if (direction === "in") camera.zoomIn();
    else camera.zoomOut();
    grid.cellSize = CELL_SIZE * camera.zoom;
    draw();
}

/** Runs a bound action; cell actions use the given screen position. */
export function runAction(action: Action, screenPosition = hoverPosition) {
    switch (action) {
        case "restart":
            // Only from a game, not from the menus
            if (ui.uiPanels.gameUI?.isOpen || ui.uiPanels.gameOverMenu?.isOpen)
                startGame();
            return;
        case "zoomIn":
            return zoom("in");
        case "zoomOut":
            return zoom("out");
        case "muteMusic":
            return toggleMusicMuted();
        case "musicUp":
            return changeVolume("music", 1);
        case "musicDown":
            return changeVolume("music", -1);
        case "sfxUp":
            return changeVolume("sfx", 1);
        case "sfxDown":
            return changeVolume("sfx", -1);
    }
    if (!screenPosition) return;
    const cellPosition = screenToCell(
        screenPosition.x,
        screenPosition.y,
        camera,
    );
    if (action === "reveal") revealCell(cellPosition);
    else toggleFlag(cellPosition);
}

function touchActions(): [tap: Action, hold: Action] {
    return settings.touchTapAction === "flag"
        ? ["flag", "reveal"]
        : ["reveal", "flag"];
}

function onPointerDown(event: PointerEvent) {
    canvas.setPointerCapture(event.pointerId);
    pointerIsDown = true;
    isDragging = false;
    longPressFired = false;
    pointerDownPosition = new Vector2D(event.offsetX, event.offsetY);
    previousPointerPosition = new Vector2D(event.offsetX, event.offsetY);
    if (event.pointerType === "touch") {
        const position = pointerDownPosition;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            if (!pointerIsDown || isDragging) return;
            longPressFired = true;
            navigator.vibrate?.(30);
            runAction(touchActions()[1], position);
        }, LONG_PRESS_DURATION);
    }
}

function onPointermove(event: PointerEvent) {
    hoverPosition = new Vector2D(event.offsetX, event.offsetY);
    if (grid.isLocked || !pointerIsDown || !pointerDownPosition) return;

    if (!isDragging && !longPressFired) {
        const dx = event.offsetX - pointerDownPosition.x;
        const dy = event.offsetY - pointerDownPosition.y;
        const threshold =
            event.pointerType === "touch"
                ? TOUCH_DRAG_THRESHOLD
                : DRAG_THRESHOLD;
        if (Math.hypot(dx, dy) > threshold) {
            isDragging = true;
            clearTimeout(longPressTimer);
        }
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
    clearTimeout(longPressTimer);
    if (isDragging || longPressFired) return;
    const position = new Vector2D(event.offsetX, event.offsetY);
    const action =
        event.pointerType === "touch"
            ? touchActions()[0]
            : actionFor({ device: "mouse", button: event.button });
    if (action) runAction(action, position);
}

function onWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY === 0) return;
    const direction = event.deltaY < 0 ? "up" : "down";
    const action = actionFor({ device: "wheel", direction });
    if (action) runAction(action);
}

export function initializeCanvasListeners() {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointermove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", () => (hoverPosition = null));
    canvas.addEventListener("wheel", onWheel);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    // Stop middle click from starting autoscroll
    canvas.addEventListener("mousedown", (e) => {
        if (e.button === 1) e.preventDefault();
    });
}
