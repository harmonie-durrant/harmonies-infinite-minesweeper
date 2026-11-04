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
import { camera, canvas, grid, startGame, ui } from "../main";
import { draw } from "../render";
import { settings, type Action } from "../settings";
import { playExplosion, playFlag, playReveal } from "../sfx";
import { screenToCell } from "../utils";
import { Vector2D } from "../vector";
import { changeVolume, toggleMusicMuted } from "../volume";
import { collectCoins } from "../coins";
import { confirmRestart } from "../pause";
import { openRunStats } from "../runStats";

let previousPointerPosition: Vector2D | null = null;
let pointerDownPosition: Vector2D | null = null;
let isDragging = false;
// Every pointer currently pressed on the board, by id
const activePointers = new Map<number, Vector2D>();
// Midpoint and spread of the two fingers at the last pinch step
let pinch: { mid: Vector2D; distance: number } | null = null;
// Where keyboard-bound reveal and flag act
let hoverPosition: Vector2D | null = null;
let longPressTimer = 0;
// The press already acted, so letting go must not act again
let longPressFired = false;

function revealCell(cellPosition: Vector2D) {
    if (grid.isGameOver || grid.isLocked) return;
    const cellState = grid.getCellState(cellPosition);
    if (cellState === CellState.FLAGGED) return;
    // The first click is always safe, so its cascade pays nothing
    const isFirstReveal = !grid.hasStarted;
    // Revealing an open number chords it instead
    const revealed =
        cellState === CellState.REVEALED
            ? grid.chord(cellPosition)
            : grid.revealCell(cellPosition);
    breakCells(revealed, cellPosition);
    if (grid.isGameOver) {
        playExplosion();
        explode(revealed.at(-1)!);
        grid.isLocked = true;
        // Let the explosion play out before covering the board
        setTimeout(() => {
            if (grid.isGameOver) openRunStats();
        }, GAME_OVER_MENU_DELAY);
    } else if (revealed.length > 0) {
        playReveal(revealed.length);
        if (!isFirstReveal) {
            collectCoins(
                revealed.filter((cell) => grid.isCoin(cell)),
                cellPosition,
            );
        }
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

function screenCenter() {
    return new Vector2D(canvas.clientWidth / 2, canvas.clientHeight / 2);
}

function applyZoom() {
    grid.cellSize = CELL_SIZE * camera.zoom;
    draw();
}

// Zooms around the anchor, or the middle of the screen without a pointer
function zoom(direction: "in" | "out", anchor: Vector2D | null) {
    if (!ui.uiPanels.gameUI?.isOpen) return;
    if (direction === "in") camera.zoomIn(anchor ?? screenCenter());
    else camera.zoomOut(anchor ?? screenCenter());
    applyZoom();
}

function restartGame() {
    const { gameUI, gameOverMenu, runStatsMenu } = ui.uiPanels;
    // Only from a game, not from the menus
    if (!gameUI?.isOpen && !gameOverMenu?.isOpen && !runStatsMenu?.isOpen)
        return;
    // Nothing to lose once the run is over or before the first click
    if (gameOverMenu?.isOpen || grid.isGameOver || !grid.hasStarted) {
        startGame();
    } else {
        confirmRestart();
    }
}

/** Runs a bound action; cell actions use the given screen position. */
export function runAction(action: Action, screenPosition = hoverPosition) {
    switch (action) {
        case "restart":
            return restartGame();
        case "zoomIn":
            return zoom("in", screenPosition);
        case "zoomOut":
            return zoom("out", screenPosition);
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

function currentPinch() {
    const [a, b] = [...activePointers.values()];
    return {
        mid: new Vector2D((a!.x + b!.x) / 2, (a!.y + b!.y) / 2),
        distance: Math.hypot(a!.x - b!.x, a!.y - b!.y),
    };
}

function onPointerDown(event: PointerEvent) {
    canvas.setPointerCapture(event.pointerId);
    const position = new Vector2D(event.offsetX, event.offsetY);
    activePointers.set(event.pointerId, position);

    // A second finger turns the gesture into a pinch: no tap or hold after it
    if (activePointers.size === 2) {
        clearTimeout(longPressTimer);
        isDragging = true;
        pinch = currentPinch();
        return;
    }
    if (activePointers.size > 2) return;

    isDragging = false;
    longPressFired = false;
    pointerDownPosition = position;
    previousPointerPosition = position;
    if (event.pointerType === "touch") {
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            if (activePointers.size !== 1 || isDragging) return;
            longPressFired = true;
            navigator.vibrate?.(30);
            runAction(touchActions()[1], position);
        }, LONG_PRESS_DURATION);
    }
}

// Two fingers zoom around their midpoint and pan as it moves
function onPinchMove() {
    if (!pinch || grid.isLocked) return;
    const next = currentPinch();
    if (pinch.distance > 0) {
        camera.zoomTo(camera.zoom * (next.distance / pinch.distance), next.mid);
    }
    camera.move(
        new Vector2D(pinch.mid.x - next.mid.x, pinch.mid.y - next.mid.y),
    );
    pinch = next;
    applyZoom();
}

function onPointermove(event: PointerEvent) {
    const position = new Vector2D(event.offsetX, event.offsetY);
    hoverPosition = position;
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, position);
    if (pinch) {
        onPinchMove();
        return;
    }
    if (grid.isLocked || !pointerDownPosition) return;

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

    previousPointerPosition = position;
}

// Returns true when the release ends (or was part of) a pinch
function releasePointer(event: PointerEvent) {
    activePointers.delete(event.pointerId);
    clearTimeout(longPressTimer);
    if (!pinch) return false;
    if (activePointers.size < 2) {
        pinch = null;
        // The finger left behind keeps panning from where it is
        const remaining = [...activePointers.values()][0];
        if (remaining) previousPointerPosition = remaining;
    }
    return true;
}

function onPointerUp(event: PointerEvent) {
    const endedPinch = releasePointer(event);
    if (endedPinch || isDragging || longPressFired) return;
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
    if (action) runAction(action, new Vector2D(event.offsetX, event.offsetY));
}

export function initializeCanvasListeners() {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointermove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", releasePointer);
    // A pointer lost without a pointerup would otherwise count as a finger
    canvas.addEventListener("lostpointercapture", releasePointer);
    canvas.addEventListener("pointerleave", () => (hoverPosition = null));
    canvas.addEventListener("wheel", onWheel);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    // Stop middle click from starting autoscroll
    canvas.addEventListener("mousedown", (e) => {
        if (e.button === 1) e.preventDefault();
    });
}
