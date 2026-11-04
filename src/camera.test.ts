import { describe, expect, it } from "vitest";
import { Camera } from "./camera";
import { CELL_SIZE, MAX_ZOOM, MIN_ZOOM } from "./constants";
import { Vector2D } from "./vector";

// Board position (in cells) shown at a screen point
function boardPointAt(camera: Camera, screen: Vector2D) {
    const cellSize = CELL_SIZE * camera.zoom;
    return new Vector2D(
        (screen.x + camera.position.x) / cellSize,
        (screen.y + camera.position.y) / cellSize,
    );
}

describe("Camera zoom", () => {
    it("keeps the board point under the anchor still", () => {
        const camera = new Camera(new Vector2D(130, -45));
        const anchor = new Vector2D(400, 250);
        const before = boardPointAt(camera, anchor);

        camera.zoomTo(2.3, anchor);
        const after = boardPointAt(camera, anchor);

        expect(after.x).toBeCloseTo(before.x);
        expect(after.y).toBeCloseTo(before.y);
    });

    it("steps in and out by rounded amounts", () => {
        const camera = new Camera();
        camera.zoomTo(1.37, new Vector2D());
        camera.zoomIn(new Vector2D());
        expect(camera.zoom).toBe(1.5);
        camera.zoomOut(new Vector2D());
        expect(camera.zoom).toBe(1.4);
    });

    it("stays within the zoom limits", () => {
        const camera = new Camera();
        camera.zoomTo(100, new Vector2D());
        expect(camera.zoom).toBe(MAX_ZOOM);
        camera.zoomTo(0, new Vector2D());
        expect(camera.zoom).toBe(MIN_ZOOM);
    });
});
