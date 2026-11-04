import type { Camera } from "./camera";
import { CELL_SIZE } from "./constants";
import { Vector2D } from "./vector";

export function hash(x: number, y: number, seed: number): number {
    let h = seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
}

export function screenToCell(
    screenX: number,
    screenY: number,
    camera: Camera,
): Vector2D {
    return new Vector2D(
        Math.floor((screenX + camera.position.x) / (CELL_SIZE * camera.zoom)),
        Math.floor((screenY + camera.position.y) / (CELL_SIZE * camera.zoom)),
    );
}
