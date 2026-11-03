import { Camera } from "./camera";
import { CELL_SIZE, DRAG_THRESHOLD, NUMBER_COLORS } from "./constants";
import type { Vector2D } from "./vector";
import "./style.css";
import { CellState, Grid } from "./grid/grid";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;

const camera = new Camera();
let grid = new Grid(Math.random() * 1000000);
const gameOverMenu = document.querySelector<HTMLDivElement>("#game_over_menu")!;
const mainMenu = document.querySelector<HTMLDivElement>("#main_menu")!;
let isMenuOpen = true;

let previousPointerPosition: Vector2D | null = null;
let pointerDownPosition: Vector2D | null = null;
let isDragging = false;
let pointerIsDown = false;

const bombImage = new Image();
bombImage.src = "/bomb.svg";
bombImage.onload = () => draw();

const flagImage = new Image();
flagImage.src = "/flag.svg";
flagImage.onload = () => draw();

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
            if (cellState === CellState.REVEALED || grid.isGameOver) {
                ctx.fillStyle = "lightgray";
                if (
                    cellState !== CellState.FLAGGED &&
                    grid.isMine({ x: col, y: row })
                ) {
                    ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
                    if (bombImage.complete) {
                        ctx.drawImage(
                            bombImage,
                            screenX + 10,
                            screenY + 10,
                            CELL_SIZE - 10 * 2,
                            CELL_SIZE - 10 * 2,
                        );
                    }
                } else {
                    ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
                    drawNumber(
                        screenX,
                        screenY,
                        grid.countAdjacentMines(cellPosition),
                    );
                }
            }
            if (cellState === CellState.FLAGGED) {
                if (grid.isGameOver) {
                    ctx.fillStyle = grid.isMine({ x: col, y: row })
                        ? "green"
                        : "red";
                    ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
                }
                if (flagImage.complete) {
                    ctx.drawImage(
                        flagImage,
                        screenX + 10,
                        screenY + 10,
                        CELL_SIZE - 10 * 2,
                        CELL_SIZE - 10 * 2,
                    );
                }
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
    if (grid.isGameOver || isMenuOpen) return;
    const cellPosition = screenToCell(event.offsetX, event.offsetY);
    const cellState = grid.getCellState(cellPosition);
    if ([CellState.REVEALED, CellState.FLAGGED].includes(cellState)) return;
    grid.revealCell(cellPosition);
    draw();
    if (grid.isGameOver) {
        openUI(gameOverMenu);
    }
}

function onCellRightClick(event: PointerEvent) {
    if (grid.isGameOver || isMenuOpen) return;
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
    if (isMenuOpen || !pointerIsDown || !pointerDownPosition) return;

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

function closeUI() {
    gameOverMenu.classList.replace("flex", "hidden");
    mainMenu.classList.replace("flex", "hidden");
    isMenuOpen = false;
}

function openUI(element: HTMLDivElement) {
    element.classList.replace("hidden", "flex");
    isMenuOpen = true;
}

function restart() {
    closeUI();
    openUI(mainMenu);
    grid = new Grid(Math.random() * 1000000);
    draw();
}

function start() {
    closeUI();
    grid = new Grid(Math.random() * 1000000);
    draw();
}

function onKeyPress(event: KeyboardEvent) {
    if (event.key === "r") {
        restart();
    }
}

document.querySelector("#restart_button")!.addEventListener("click", restart);
document.querySelector("#view_map_button")!.addEventListener("click", closeUI);
document.querySelector("#start_button")!.addEventListener("click", start);

window.addEventListener("keypress", onKeyPress);

window.addEventListener("resize", resize);
window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointermove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
resize();
