import type { Vector2D } from "./vector";

export class Camera {
    public position: Vector2D;

    constructor(startPosition: Vector2D = { x: 0, y: 0 }) {
        this.position = startPosition;
    }

    public move(direction: Vector2D) {
        this.position.x += direction.x;
        this.position.y += direction.y;
    }
}
