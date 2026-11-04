import type { Camera } from "./camera";
import { CELL_SIZE, MAX_REVEAL } from "./constants";
import { hash } from "./utils";
import { Vector2D } from "./vector";

export enum CellState {
    HIDDEN = "HIDDEN",
    FLAGGED = "FLAGGED",
    REVEALED = "REVEALED",
}

export class Grid {
    public seed: number;
    public isGameOver: boolean = false;
    public mineDensity: number;
    public cellSize: number;
    public isLocked: boolean = true;

    private data = new Map<string, CellState>();
    private firstReveal: Vector2D | null = null;

    constructor(seed: number, camera: Camera, density: number = 0.18) {
        const mineDensity = Math.abs(density);
        this.seed = seed;
        this.mineDensity = mineDensity > 1 ? 1 : mineDensity;
        this.cellSize = CELL_SIZE * camera.zoom;
    }

    public reset() {
        this.seed = Math.random() * 1000000;
        this.data = new Map<string, CellState>();
        this.firstReveal = null;
        this.isLocked = true;
        this.isGameOver = false;
    }

    public getCellState(cellPosition: Vector2D) {
        return (
            this.data.get(`${cellPosition.x},${cellPosition.y}`) ||
            CellState.HIDDEN
        );
    }

    public setCellState(cellPosition: Vector2D, cellState: CellState) {
        this.data.set(`${cellPosition.x},${cellPosition.y}`, cellState);
    }

    // Returns the cells that were opened, including the mine if one was hit
    public revealCell(cellPosition: Vector2D): Vector2D[] {
        if (this.isGameOver) return [];
        if (!this.firstReveal) {
            this.firstReveal = cellPosition;
        }
        const queue = [cellPosition];
        const revealed: Vector2D[] = [];
        while (queue.length > 0 && revealed.length < MAX_REVEAL) {
            const cell = queue.pop()!;
            if (this.getCellState(cell) !== CellState.HIDDEN) continue;
            if (this.isMine(cell)) {
                this.isGameOver = true;
                return [cell];
            }
            this.setCellState(cell, CellState.REVEALED);
            revealed.push(cell);
            if (this.countAdjacentMines(cell) === 0)
                queue.push(...this.getCellNeighbours(cell));
        }
        return revealed;
    }

    private isCellInSpawn(cellPosition: Vector2D) {
        if (!this.firstReveal) return false;
        const diff = {
            x: Math.abs(cellPosition.x - this.firstReveal.x),
            y: Math.abs(cellPosition.y - this.firstReveal.y),
        };
        return diff.x < 2 && diff.y < 2;
    }

    public isMine(cellPosition: Vector2D) {
        if (this.isCellInSpawn(cellPosition)) return false;
        const hashValue = hash(cellPosition.x, cellPosition.y, this.seed);
        return hashValue / 2 ** 32 < this.mineDensity;
    }

    private getCellNeighbours(cellPosition: Vector2D): Vector2D[] {
        return [
            new Vector2D(cellPosition.x - 1, cellPosition.y + 1), // Bottom Left
            new Vector2D(cellPosition.x, cellPosition.y + 1), // Bottom Center
            new Vector2D(cellPosition.x + 1, cellPosition.y + 1), // Bottom Right
            new Vector2D(cellPosition.x - 1, cellPosition.y), // Left
            new Vector2D(cellPosition.x + 1, cellPosition.y), // Right
            new Vector2D(cellPosition.x - 1, cellPosition.y - 1), // Top Left
            new Vector2D(cellPosition.x, cellPosition.y - 1), // Top Center
            new Vector2D(cellPosition.x + 1, cellPosition.y - 1), // Top Right
        ];
    }

    public countAdjacentMines(cellPosition: Vector2D) {
        const neighboutList: Vector2D[] = this.getCellNeighbours(cellPosition);

        let count = 0;
        for (const neighbour of neighboutList) {
            if (this.isMine(neighbour)) {
                count += 1;
            }
        }
        return count;
    }
}
