import { Camera } from "./camera";
import { CELL_SIZE, DRAG_THRESHOLD, NUMBER_COLORS } from "./constants";
import type { Vector2D } from "./vector";
import "./style.css";
import { CellState, Grid } from "./grid/grid";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;

const camera = new Camera();
const grid = new Grid(42);

let previousPointerPosition: Vector2D | null = null;
let pointerDownPosition: Vector2D | null = null;
let isDragging = false;
let pointerIsDown = false;

function screenToCell(screenX: number, screenY: number): Vector2D {
    return {
        x: Math.floor((screenX + camera.position.x) / CELL_SIZE),
        y: Math.floor((screenY + camera.position.y) / CELL_SIZE),
    };
}

function drawNumber(screenX: number, screenY: number, count: number) {
    if (count === 0) return;
    ctx.fillStyle = NUMBER_COLORS[count]!;
    ctx.fillText(
        String(count),
        screenX + CELL_SIZE / 2,
        screenY + CELL_SIZE / 2,
    );
}

function draw() {
    ctx.font = `bold ${CELL_SIZE * 0.6}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    for (
        let col = Math.floor(camera.position.x / CELL_SIZE);
        col * CELL_SIZE - camera.position.x < canvas.clientWidth;
        col++
    ) {
        for (
            let row = Math.floor(camera.position.y / CELL_SIZE);
            row * CELL_SIZE - camera.position.y < canvas.clientHeight;
            row++
        ) {
            const screenX = col * CELL_SIZE - camera.position.x;
            const screenY = row * CELL_SIZE - camera.position.y;
            ctx.fillStyle = "gray";
            ctx.fillRect(screenX, screenY, CELL_SIZE, 1);
            ctx.fillRect(screenX, screenY, 1, CELL_SIZE);
            const cellPosition = { x: col, y: row };
            const cellState = grid.getCellState(cellPosition);
            if (cellState === CellState.REVEALED) {
                if (grid.isMine({ x: col, y: row })) {
                    ctx.fillStyle = "red";
                    ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
                } else {
                    ctx.fillStyle = "light-gray";
                    ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
                    drawNumber(
                        screenX,
                        screenY,
                        grid.countAdjacentMines(cellPosition),
                    );
                }
            } else if (cellState === CellState.FLAGGED) {
                // TODO: draf a flag
                ctx.fillStyle = "green";
                ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}

function onCellClick(event: PointerEvent) {
    const cellPosition = screenToCell(event.offsetX, event.offsetY);
    const cellState = grid.getCellState(cellPosition);
    if ([CellState.REVEALED, CellState.FLAGGED].includes(cellState)) return;
    grid.revealCell(cellPosition);
    draw();
    if (grid.isMine(cellPosition)) {
        console.log("GAME OVER");
    }
}

function onCellRightClick(event: PointerEvent) {
    const cellPosition = screenToCell(event.offsetX, event.offsetY);
    const cellState = grid.getCellState(cellPosition);
    if (cellState === CellState.REVEALED) return;
    const newState =
        cellState === CellState.FLAGGED ? CellState.HIDDEN : CellState.FLAGGED;
    grid.setCellState(cellPosition, newState);
    draw();
}

function onPointerDown(event: PointerEvent) {
    pointerIsDown = true;
    isDragging = false;
    pointerDownPosition = { x: event.offsetX, y: event.offsetY };
    previousPointerPosition = { x: event.offsetX, y: event.offsetY };
}

function onPointermove(event: PointerEvent) {
    if (!pointerIsDown || !pointerDownPosition) return;

    if (!isDragging) {
        const dx = event.offsetX - pointerDownPosition.x;
        const dy = event.offsetY - pointerDownPosition.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) isDragging = true;
    }

    if (isDragging && previousPointerPosition) {
        camera.move({
            x: previousPointerPosition.x - event.offsetX,
            y: previousPointerPosition.y - event.offsetY,
        });
        draw();
    }

    previousPointerPosition = { x: event.offsetX, y: event.offsetY };
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

window.addEventListener("resize", resize);
window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointermove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
resize();
