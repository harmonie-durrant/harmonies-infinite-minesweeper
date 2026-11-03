import { Camera } from "./camera";
import { CELL_SIZE } from "./constants";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;

const camera = new Camera();
let previousPointerPosition: { x: number; y: number } | null = { x: 0, y: 0 };
let pointerIsDown = false;

function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "gray";
    for (
        let col = Math.floor(camera.x / CELL_SIZE);
        col * CELL_SIZE - camera.x < canvas.clientWidth;
        col++
    ) {
        for (
            let row = Math.floor(camera.y / CELL_SIZE);
            row * CELL_SIZE - camera.y < canvas.clientHeight;
            row++
        ) {
            ctx.fillRect(
                col * CELL_SIZE - camera.x,
                row * CELL_SIZE - camera.y,
                CELL_SIZE,
                1,
            );
            ctx.fillRect(
                col * CELL_SIZE - camera.x,
                row * CELL_SIZE - camera.y,
                1,
                CELL_SIZE,
            );
        }
    }
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}

function onPointerDown() {
    pointerIsDown = true;
}

function onPointermove(event: PointerEvent) {
    if (!pointerIsDown) return;

    if (previousPointerPosition) {
        camera.move({
            x: previousPointerPosition.x - event.clientX,
            y: previousPointerPosition.y - event.clientY,
        });
        draw();
    }

    previousPointerPosition = {
        x: event.clientX,
        y: event.clientY,
    };
}

function onPointerUp() {
    pointerIsDown = false;
    previousPointerPosition = null;
}

window.addEventListener("resize", resize);
window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointermove);
window.addEventListener("pointerup", onPointerUp);
resize();
