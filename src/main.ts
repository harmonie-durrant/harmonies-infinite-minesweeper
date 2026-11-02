import { Camera } from "./camera";
import { CELL_SIZE } from "./constants";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;

const camera = new Camera();

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "gray";
    for (
        let col = Math.floor(camera.x / CELL_SIZE);
        col * CELL_SIZE - camera.x < canvas.width;
        col++
    ) {
        for (
            let row = Math.floor(camera.y / CELL_SIZE);
            row * CELL_SIZE - camera.y < canvas.height;
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

window.addEventListener("resize", resize);
resize();
