export class Vector2D {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public getDiff(other: Vector2D) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    public add(other: Vector2D) {
        this.x += other.x;
        this.y += other.y;
    }
}
