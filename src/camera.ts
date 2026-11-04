import { MAX_ZOOM } from "./constants";
import { Vector2D } from "./vector";

export class Camera {
    public position: Vector2D;
    public zoom: number = 1;

    constructor(startPosition: Vector2D | null = null) {
        this.position = startPosition || new Vector2D();
    }

    public zoomIn() {
        if (this.zoom <= 0.5) this.zoom = 0.5;
        this.zoom -= 0.1;
    }

    public zoomOut() {
        if (this.zoom >= MAX_ZOOM) this.zoom = MAX_ZOOM;
        this.zoom += 0.1;
    }

    public move(direction: Vector2D) {
        this.position.add(direction);
    }
}
