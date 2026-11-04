import { NUMBER_COLORS } from "./constants";
import { CellState } from "./grid";
import { camera, canvas, ctx, grid } from "./main";
import { Vector2D } from "./vector";

const bombImage = new Image();
bombImage.src = "/bomb.svg";
bombImage.onload = () => draw();

const flagImage = new Image();
flagImage.src = "/flag.svg";
flagImage.onload = () => draw();

export function draw() {
    const cellSize = grid.cellSize;

    ctx.font = `bold ${cellSize * 0.6}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    for (
        let col = Math.floor(camera.position.x / cellSize);
        col * cellSize - camera.position.x < canvas.clientWidth;
        col++
    ) {
        for (
            let row = Math.floor(camera.position.y / cellSize);
            row * cellSize - camera.position.y < canvas.clientHeight;
            row++
        ) {
            const screenX = col * cellSize - camera.position.x;
            const screenY = row * cellSize - camera.position.y;
            ctx.fillStyle = "gray";
            ctx.fillRect(screenX, screenY, cellSize, 1);
            ctx.fillRect(screenX, screenY, 1, cellSize);
            const cellPosition = new Vector2D(col, row);
            const cellState = grid.getCellState(cellPosition);
            if (cellState === CellState.REVEALED || grid.isGameOver) {
                ctx.fillStyle = "lightgray";
                if (
                    cellState !== CellState.FLAGGED &&
                    grid.isMine(cellPosition)
                ) {
                    ctx.fillRect(screenX, screenY, cellSize, cellSize);
                    if (bombImage.complete) {
                        ctx.drawImage(
                            bombImage,
                            screenX + camera.zoom * 10,
                            screenY + camera.zoom * 10,
                            cellSize - camera.zoom * 20,
                            cellSize - camera.zoom * 20,
                        );
                    }
                } else {
                    ctx.fillRect(screenX, screenY, cellSize, cellSize);
                    const count = grid.countAdjacentMines(cellPosition);
                    if (count > 0) {
                        ctx.fillStyle = NUMBER_COLORS[count]!;
                        ctx.fillText(
                            String(count),
                            screenX + cellSize / 2,
                            screenY + cellSize / 2,
                        );
                    }
                }
            }
            if (cellState === CellState.FLAGGED) {
                if (grid.isGameOver) {
                    ctx.fillStyle = grid.isMine(cellPosition) ? "green" : "red";
                    ctx.fillRect(screenX, screenY, cellSize, cellSize);
                }
                if (flagImage.complete) {
                    ctx.drawImage(
                        flagImage,
                        screenX + 10,
                        screenY + 10,
                        cellSize - 10 * 2,
                        cellSize - 10 * 2,
                    );
                }
            }
        }
    }
}

export function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}
