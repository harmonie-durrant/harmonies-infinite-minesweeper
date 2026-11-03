import { describe, expect, it } from "vitest";
import { Grid } from "./grid";

function countMines(grid: Grid, size: number, offset = 0): number {
    let mines = 0;
    for (let x = offset; x < offset + size; x++) {
        for (let y = offset; y < offset + size; y++) {
            if (grid.isMine({ x, y })) mines++;
        }
    }
    return mines;
}

describe("Grid", () => {
    describe("constructor", () => {
        it("uses a default density of 0.18", () => {
            expect(new Grid(1).mineDensity).toBe(0.18);
        });

        it("clamps density above 1 to 1", () => {
            expect(new Grid(1, 5).mineDensity).toBe(1);
        });

        it("turns a negative density positive", () => {
            expect(new Grid(1, -0.3).mineDensity).toBe(0.3);
        });
    });

    describe("isMine", () => {
        it("always gives the same answer for the same cell", () => {
            const grid = new Grid(42);
            for (let x = -50; x < 50; x++) {
                for (let y = -50; y < 50; y++) {
                    expect(grid.isMine({ x, y })).toBe(grid.isMine({ x, y }));
                }
            }
        });

        it("gives the same board for two grids with the same seed", () => {
            const a = new Grid(42);
            const b = new Grid(42);
            for (let x = -50; x < 50; x++) {
                for (let y = -50; y < 50; y++) {
                    expect(a.isMine({ x, y })).toBe(b.isMine({ x, y }));
                }
            }
        });

        it("gives a different board for a different seed", () => {
            const a = new Grid(1);
            const b = new Grid(2);
            let differences = 0;
            for (let x = 0; x < 100; x++) {
                for (let y = 0; y < 100; y++) {
                    if (a.isMine({ x, y }) !== b.isMine({ x, y }))
                        differences++;
                }
            }
            expect(differences).toBeGreaterThan(1000);
        });

        it("places roughly mineDensity of the cells as mines", () => {
            const grid = new Grid(42, 0.18);
            const ratio = countMines(grid, 200) / (200 * 200);
            expect(ratio).toBeGreaterThan(0.16);
            expect(ratio).toBeLessThan(0.2);
        });

        it("places mines at negative coordinates", () => {
            const grid = new Grid(42, 0.18);
            const ratio = countMines(grid, 200, -300) / (200 * 200);
            expect(ratio).toBeGreaterThan(0.16);
            expect(ratio).toBeLessThan(0.2);
        });

        it("does not mirror the board across the axes", () => {
            const grid = new Grid(42);
            let differences = 0;
            for (let x = 1; x < 100; x++) {
                for (let y = 1; y < 100; y++) {
                    if (grid.isMine({ x, y }) !== grid.isMine({ x: -x, y: -y }))
                        differences++;
                    if (grid.isMine({ x, y }) !== grid.isMine({ x: y, y: x }))
                        differences++;
                }
            }
            expect(differences).toBeGreaterThan(1000);
        });

        it("places no mines with a density of 0", () => {
            expect(countMines(new Grid(42, 0), 100)).toBe(0);
        });

        it("makes every cell a mine with a density of 1", () => {
            expect(countMines(new Grid(42, 1), 100)).toBe(100 * 100);
        });
    });
});
