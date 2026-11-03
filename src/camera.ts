export class Camera {
    public x = 0;
    public y = 0;

    constructor() {
        this.x = 0;
        this.y = 0;
    }

    public move(direction: { x: number; y: number }) {
        this.x += direction.x;
        this.y += direction.y;
    }
}
