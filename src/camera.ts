import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "./constants";
import { Vector2D } from "./vector";

export class Camera {
    public position: Vector2D;
    public zoom: number = 1;

    constructor(startPosition: Vector2D | null = null) {
        this.position = startPosition || new Vector2D();
    }

    // Bigger cells
    public zoomIn() {
        this.setZoom(this.zoom + ZOOM_STEP);
    }

    // Smaller cells
    public zoomOut() {
        this.setZoom(this.zoom - ZOOM_STEP);
    }

    private setZoom(zoom: number) {
        // Rounded so repeated steps don't drift
        const rounded = Math.round(zoom * 10) / 10;
        this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rounded));
    }

    public move(direction: Vector2D) {
        this.position.add(direction);
    }
}
