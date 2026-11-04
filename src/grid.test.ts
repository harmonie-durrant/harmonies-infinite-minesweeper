import { describe, expect, it } from "vitest";
import { Camera } from "./camera";
import { COIN_DENSITY } from "./constants";
import { CellState, Grid } from "./grid";
import { Vector2D } from "./vector";

function cellsAround(radius: number) {
    const cells: Vector2D[] = [];
    for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) cells.push(new Vector2D(x, y));
    }
    return cells;
}

function neighboursOf(cell: Vector2D) {
    return cellsAround(1)
        .filter(({ x, y }) => x !== 0 || y !== 0)
        .map(({ x, y }) => new Vector2D(cell.x + x, cell.y + y));
}

// An opened number on the edge of the first cascade, with hidden neighbours
function openBoardWithNumber(
    seed: number,
    safeNeeded: (mines: number) => number = () => 1,
) {
    const grid = new Grid(seed, new Camera());
    grid.revealCell(new Vector2D(0, 0));
    const number = cellsAround(30).find((cell) => {
        if (grid.getCellState(cell) !== CellState.REVEALED) return false;
        const hidden = neighboursOf(cell).filter(
            (n) => grid.getCellState(n) === CellState.HIDDEN,
        );
        const mines = grid.countAdjacentMines(cell);
        // Mines are never opened, so they are all among the hidden ones
        return mines > 0 && hidden.length - mines >= safeNeeded(mines);
    })!;
    return { grid, number };
}

describe("Chording", () => {
    it("opens the other neighbours when the flags are right", () => {
        const { grid, number } = openBoardWithNumber(7);
        for (const cell of neighboursOf(number)) {
            if (grid.isMine(cell)) grid.setCellState(cell, CellState.FLAGGED);
        }
        const opened = grid.chord(number);
        expect(opened.length).toBeGreaterThan(0);
        expect(grid.isGameOver).toBe(false);
        for (const cell of neighboursOf(number)) {
            expect(grid.getCellState(cell)).not.toBe(CellState.HIDDEN);
        }
    });

    it("hits a mine when a flag is wrong, and returns it last", () => {
        const { grid, number } = openBoardWithNumber(7, (mines) => mines);
        const mines = grid.countAdjacentMines(number);
        // Flag the right number of cells, but only safe ones
        const safeHidden = neighboursOf(number).filter(
            (cell) =>
                !grid.isMine(cell) &&
                grid.getCellState(cell) === CellState.HIDDEN,
        );
        for (const cell of safeHidden.slice(0, mines)) {
            grid.setCellState(cell, CellState.FLAGGED);
        }
        const opened = grid.chord(number);
        expect(grid.isGameOver).toBe(true);
        expect(grid.isMine(opened.at(-1)!)).toBe(true);
    });

    it("does nothing when the flag count doesn't match", () => {
        const { grid, number } = openBoardWithNumber(7);
        expect(grid.chord(number)).toEqual([]);
        expect(grid.isGameOver).toBe(false);
    });
});

describe("Grid", () => {
    it("never puts a coin on a mine", () => {
        const grid = new Grid(12345, new Camera());
        for (const cell of cellsAround(60)) {
            if (grid.isCoin(cell)) expect(grid.isMine(cell)).toBe(false);
        }
    });

    it("puts coins in about COIN_DENSITY of safe cells", () => {
        const grid = new Grid(987, new Camera());
        const safe = cellsAround(100).filter((cell) => !grid.isMine(cell));
        const coins = safe.filter((cell) => grid.isCoin(cell));
        const share = coins.length / safe.length;
        expect(share).toBeGreaterThan(COIN_DENSITY * 0.75);
        expect(share).toBeLessThan(COIN_DENSITY * 1.25);
    });

    it("has not started until a cell is revealed", () => {
        const grid = new Grid(42, new Camera());
        expect(grid.hasStarted).toBe(false);
        grid.revealCell(new Vector2D(0, 0));
        expect(grid.hasStarted).toBe(true);
        grid.reset();
        expect(grid.hasStarted).toBe(false);
    });

    it("makes the first click safe", () => {
        for (let seed = 0; seed < 50; seed++) {
            const grid = new Grid(seed, new Camera());
            grid.revealCell(new Vector2D(3, -7));
            expect(grid.isGameOver).toBe(false);
        }
    });
});
