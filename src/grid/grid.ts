import { MAX_REVEAL } from "../constants";
import { hash } from "../hash";
import type { Vector2D } from "../vector";

export enum CellState {
    HIDDEN = "HIDDEN",
    FLAGGED = "FLAGGED",
    REVEALED = "REVEALED",
}

export class Grid {
    public seed: number;
    public isGameOver: boolean = false;

    private mineDensity: number;
    private data = new Map<string, CellState>();
    private firstReveal: Vector2D | null = null;

    constructor(seed: number, density: number = 0.18) {
        const mineDensity = Math.abs(density);
        this.seed = seed;
        this.mineDensity = mineDensity > 1 ? 1 : mineDensity;
    }

    public reset() {
        this.data = new Map<string, CellState>();
        this.isGameOver = false;
        this.firstReveal = null;
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

    public revealCell(cellPosition: Vector2D) {
        if (this.isGameOver) return;
        if (!this.firstReveal) {
            this.firstReveal = cellPosition;
        }
        const queue = [cellPosition];
        let revealed = 0;
        while (queue.length > 0 && revealed < MAX_REVEAL) {
            const cell = queue.pop()!;
            if (this.getCellState(cell) !== CellState.HIDDEN) continue;
            if (this.isMine(cell)) {
                this.isGameOver = true;
                return;
            }
            this.setCellState(cell, CellState.REVEALED);
            revealed++;
            if (this.countAdjacentMines(cell) === 0)
                queue.push(...this.getCellNeighbours(cell));
        }
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
            { x: cellPosition.x - 1, y: cellPosition.y + 1 }, // Bottom Left
            { x: cellPosition.x, y: cellPosition.y + 1 }, // Bottom Center
            { x: cellPosition.x + 1, y: cellPosition.y + 1 }, // Bottom Right
            { x: cellPosition.x - 1, y: cellPosition.y }, // Left
            { x: cellPosition.x + 1, y: cellPosition.y }, // Right
            { x: cellPosition.x - 1, y: cellPosition.y - 1 }, // Top Left
            { x: cellPosition.x, y: cellPosition.y - 1 }, // Top Center
            { x: cellPosition.x + 1, y: cellPosition.y - 1 }, // Top Right
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
