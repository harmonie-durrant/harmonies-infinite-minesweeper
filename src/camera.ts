import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "./constants";
import { Vector2D } from "./vector";

export class Camera {
    public position: Vector2D;
    public zoom: number = 1;

    constructor(startPosition: Vector2D | null = null) {
        this.position = startPosition || new Vector2D();
    }

    // Bigger cells. Steps are rounded so repeated zooms don't drift.
    public zoomIn(anchor: Vector2D) {
        this.zoomTo(Math.round((this.zoom + ZOOM_STEP) * 10) / 10, anchor);
    }

    // Smaller cells
    public zoomOut(anchor: Vector2D) {
        this.zoomTo(Math.round((this.zoom - ZOOM_STEP) * 10) / 10, anchor);
    }

    /** Zooms while keeping the board point under the anchor (screen px) still. */
    public zoomTo(zoom: number, anchor: Vector2D) {
        const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
        const ratio = clamped / this.zoom;
        this.position = new Vector2D(
            (this.position.x + anchor.x) * ratio - anchor.x,
            (this.position.y + anchor.y) * ratio - anchor.y,
        );
        this.zoom = clamped;
    }

    public move(direction: Vector2D) {
        this.position.add(direction);
    }
}
