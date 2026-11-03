import { hash } from "../hash";
import type { Vector2D } from "../vector";

export enum CellState {
    HIDDEN = "HIDDEN",
    FLAGGED = "FLAGGED",
    REVEALED = "REVEALED",
}

export class Grid {
    public seed: number;
    public mineDensity: number;
    public data = new Map<string, CellState>();

    constructor(seed: number, density: number = 0.18) {
        const mineDensity = Math.abs(density);
        this.seed = seed;
        this.mineDensity = mineDensity > 1 ? 1 : mineDensity;
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
        if (this.getCellState(cellPosition) !== CellState.HIDDEN) return;
        this.setCellState(cellPosition, CellState.REVEALED);
        if (this.countAdjacentMines(cellPosition) === 0) {
            const neighboutList = this.getCellNeighbours(cellPosition);
            for (const neighbour of neighboutList) {
                if (this.countAdjacentMines(neighbour) > 0) {
                    this.setCellState(neighbour, CellState.REVEALED);
                    continue;
                }
                this.revealCell(neighbour);
            }
        }
    }

    public isMine(cellPosition: Vector2D) {
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
