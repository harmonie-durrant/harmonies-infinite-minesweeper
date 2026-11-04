import {
    breakProgress,
    explosionProgress,
    flagProgress,
    gameOverRevealAge,
    getBreakingCell,
    getBreakingCells,
    getExplosion,
    getFlagAnimation,
    getFlagAnimations,
    getShakeOffset,
    type BreakingCell,
    type Explosion,
} from "./animations";
import { MINE_POP_DURATION, NUMBER_COLORS, THEME } from "./constants";
import { CellState } from "./grid";
import { camera, canvas, ctx, grid } from "./main";
import { hash } from "./utils";
import { Vector2D } from "./vector";

const bombImage = new Image();
bombImage.src = "/bomb.svg";
bombImage.onload = () => draw();

const flagImage = new Image();
flagImage.src = "/flag.svg";
flagImage.onload = () => draw();

// The pixel font loads asynchronously; redraw once it's ready.
document.fonts.ready.then(() => draw());

function easeOutBack(t: number) {
    const c1 = 1.70158;
    return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function easeOutBounce(t: number) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t - 1.5 / d1) ** 2 + 0.75;
    if (t < 2.5 / d1) return n1 * (t - 2.25 / d1) ** 2 + 0.9375;
    return n1 * (t - 2.625 / d1) ** 2 + 0.984375;
}

function strokeRing(x: number, y: number, radius: number, width: number) {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

function isNearScreen(x: number, y: number, size: number) {
    return (
        x > -size * 3 &&
        y > -size * 3 &&
        x < canvas.clientWidth + size * 2 &&
        y < canvas.clientHeight + size * 2
    );
}

function drawHiddenCell(x: number, y: number, size: number) {
    const bevel = Math.max(1, Math.round(size * 0.08));
    ctx.fillStyle = THEME.hiddenLight;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = THEME.hiddenShadow;
    ctx.fillRect(x + bevel, y + bevel, size - bevel, size - bevel);
    ctx.fillStyle = THEME.hidden;
    ctx.fillRect(x + bevel, y + bevel, size - bevel * 2, size - bevel * 2);
}

function drawFlag(x: number, y: number, size: number) {
    if (!flagImage.complete) return;
    const padding = size * 0.2;
    ctx.drawImage(
        flagImage,
        x + padding,
        y + padding,
        size - padding * 2,
        size - padding * 2,
    );
}

// revealAge: ms since the mine was uncovered, used for the pop-in
function drawMine(x: number, y: number, size: number, revealAge: number) {
    ctx.fillStyle = THEME.mine;
    ctx.fillRect(x, y, size, size);
    const progress = revealAge / MINE_POP_DURATION;
    const scale = progress < 1 ? easeOutBack(Math.max(0, progress)) : 1;
    const bombSize = size * 0.68 * scale;
    if (bombImage.complete) {
        ctx.drawImage(
            bombImage,
            x + (size - bombSize) / 2,
            y + (size - bombSize) / 2,
            bombSize,
            bombSize,
        );
    }
    if (progress >= 0 && progress < 1) {
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = THEME.pink;
        strokeRing(
            x + size / 2,
            y + size / 2,
            size * (0.25 + 0.25 * progress),
            size * 0.06,
        );
        ctx.globalAlpha = 1;
    }
}

// Each side of a hidden cell becomes a triangular shard pointing outward
const SHARDS = [
    { dx: 0, dy: -1, corners: [-1, -1, 1, -1], color: THEME.hiddenLight },
    { dx: 1, dy: 0, corners: [1, -1, 1, 1], color: THEME.hidden },
    { dx: 0, dy: 1, corners: [1, 1, -1, 1], color: THEME.hiddenShadow },
    { dx: -1, dy: 0, corners: [-1, 1, -1, -1], color: THEME.hiddenLight },
] as const;

function drawBreakingCell(
    cell: BreakingCell,
    progress: number,
    x: number,
    y: number,
    size: number,
) {
    const half = size / 2;
    const easeOut = 1 - (1 - progress) ** 2;

    // Quick neon flash on the freshly opened cell
    if (progress < 0.25) {
        ctx.globalAlpha = (1 - progress / 0.25) * 0.5;
        ctx.fillStyle = THEME.cyan;
        ctx.fillRect(x, y, size, size);
    }

    ctx.globalAlpha = 1 - progress;
    for (const [index, shard] of SHARDS.entries()) {
        const [ax, ay, bx, by] = shard.corners.map((c) => c * half);
        // Rotate each shard around its own centroid
        const gx = (ax! + bx!) / 3;
        const gy = (ay! + by!) / 3;
        const direction = index % 2 === 0 ? 1 : -1;

        ctx.save();
        ctx.translate(
            x +
                half +
                gx +
                shard.dx * size * 0.5 * easeOut +
                cell.spin * size * 0.2 * easeOut,
            y +
                half +
                gy +
                shard.dy * size * 0.5 * easeOut +
                size * 1.5 * progress ** 2,
        );
        ctx.rotate((cell.spin + direction) * progress * Math.PI * 0.75);
        ctx.scale(0.92 - 0.4 * progress, 0.92 - 0.4 * progress);
        ctx.beginPath();
        ctx.moveTo(-gx, -gy);
        ctx.lineTo(ax! - gx, ay! - gy);
        ctx.lineTo(bx! - gx, by! - gy);
        ctx.closePath();
        ctx.fillStyle = shard.color;
        ctx.fill();
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

function drawFlagAnimation(
    placed: boolean,
    progress: number,
    x: number,
    y: number,
    size: number,
) {
    if (placed) {
        // Drop in with a bounce, then a ring where it lands
        ctx.globalAlpha = Math.min(1, progress * 4);
        drawFlag(x, y - size * 0.6 * (1 - easeOutBounce(progress)), size);
        const landing = (progress - 0.35) / 0.65;
        if (landing > 0) {
            ctx.globalAlpha = 1 - landing;
            ctx.strokeStyle = THEME.yellow;
            strokeRing(
                x + size / 2,
                y + size / 2,
                size * (0.3 + 0.4 * landing),
                size * 0.05,
            );
        }
    } else {
        // Lift off and fade
        ctx.globalAlpha = 1 - progress;
        drawFlag(x, y - size * 0.8 * (1 - (1 - progress) ** 2), size);
    }
    ctx.globalAlpha = 1;
}

const DEBRIS_COUNT = 16;
const DEBRIS_COLORS = [THEME.yellow, THEME.pink, THEME.hiddenLight];

function drawExplosion(
    explosion: Explosion,
    progress: number,
    x: number,
    y: number,
    size: number,
) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const easeOut = 1 - (1 - progress) ** 3;

    ctx.globalAlpha = 1 - progress;
    const radius = size * (0.4 + 1.4 * easeOut);
    const fireball = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    fireball.addColorStop(0, THEME.yellow);
    fireball.addColorStop(0.4, THEME.pink);
    fireball.addColorStop(1, "rgb(255 46 136 / 0)");
    ctx.fillStyle = fireball;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = THEME.ink;
    strokeRing(
        cx,
        cy,
        size * (0.5 + 4 * easeOut),
        size * 0.12 * (1 - progress),
    );

    for (let i = 0; i < DEBRIS_COUNT; i++) {
        const random = hash(i, explosion.x + explosion.y, 7) / 2 ** 32;
        const angle = (i / DEBRIS_COUNT) * Math.PI * 2 + random * 0.6;
        const distance = size * (1.5 + 2 * random) * easeOut;
        const debrisSize = size * 0.14 * (1 - progress);
        ctx.fillStyle = DEBRIS_COLORS[i % DEBRIS_COLORS.length]!;
        ctx.fillRect(
            cx + Math.cos(angle) * distance - debrisSize / 2,
            cy +
                Math.sin(angle) * distance +
                size * 2 * progress ** 2 -
                debrisSize / 2,
            debrisSize,
            debrisSize,
        );
    }
    ctx.globalAlpha = 1;
}

export function draw() {
    const cellSize = grid.cellSize;
    const now = performance.now();

    ctx.font = `${Math.round(cellSize * 0.4)}px ${THEME.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = THEME.revealed;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const shake = getShakeOffset(now, cellSize * 0.2);
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // One extra cell on each side so shaking never exposes the edges
    for (
        let col = Math.floor(camera.position.x / cellSize) - 1;
        col * cellSize - camera.position.x < canvas.clientWidth + cellSize;
        col++
    ) {
        for (
            let row = Math.floor(camera.position.y / cellSize) - 1;
            row * cellSize - camera.position.y < canvas.clientHeight + cellSize;
            row++
        ) {
            const screenX = col * cellSize - camera.position.x;
            const screenY = row * cellSize - camera.position.y;
            const cellPosition = new Vector2D(col, row);
            const cellState = grid.getCellState(cellPosition);
            const revealAge = grid.isGameOver
                ? gameOverRevealAge(cellPosition, now)
                : -1;
            const isOpen = cellState === CellState.REVEALED || revealAge >= 0;
            if (isOpen) {
                ctx.fillStyle = THEME.revealed;
                ctx.fillRect(screenX, screenY, cellSize, cellSize);
                ctx.fillStyle = THEME.gridLine;
                ctx.fillRect(screenX, screenY, cellSize, 1);
                ctx.fillRect(screenX, screenY, 1, cellSize);
                if (
                    cellState !== CellState.FLAGGED &&
                    grid.isMine(cellPosition)
                ) {
                    drawMine(screenX, screenY, cellSize, revealAge);
                } else {
                    const count = grid.countAdjacentMines(cellPosition);
                    if (count > 0) {
                        ctx.fillStyle = NUMBER_COLORS[count]!;
                        ctx.fillText(
                            String(count),
                            screenX + cellSize / 2,
                            screenY + cellSize / 2,
                        );
                    }
                }
            } else {
                drawHiddenCell(screenX, screenY, cellSize);
            }
            // Still waiting for the ripple to reach it: keep it intact
            const breaking = getBreakingCell(cellPosition);
            if (breaking && breakProgress(breaking, now) < 0) {
                drawHiddenCell(screenX, screenY, cellSize);
            }
            if (cellState === CellState.FLAGGED) {
                if (isOpen) {
                    ctx.fillStyle = grid.isMine(cellPosition)
                        ? THEME.flagCorrect
                        : THEME.flagWrong;
                    ctx.fillRect(screenX, screenY, cellSize, cellSize);
                }
                // A flag that's still dropping in is drawn in the overlay pass
                if (!getFlagAnimation(cellPosition)?.placed) {
                    drawFlag(screenX, screenY, cellSize);
                }
            }
        }
    }

    // Overlays are drawn last so neighbouring cells don't cover them
    for (const cell of getBreakingCells()) {
        const progress = breakProgress(cell, now);
        if (progress < 0 || progress >= 1) continue;
        const screenX = cell.x * cellSize - camera.position.x;
        const screenY = cell.y * cellSize - camera.position.y;
        if (!isNearScreen(screenX, screenY, cellSize)) continue;
        drawBreakingCell(cell, progress, screenX, screenY, cellSize);
    }

    for (const flag of getFlagAnimations()) {
        const progress = flagProgress(flag, now);
        if (progress < 0 || progress >= 1) continue;
        const screenX = flag.x * cellSize - camera.position.x;
        const screenY = flag.y * cellSize - camera.position.y;
        if (!isNearScreen(screenX, screenY, cellSize)) continue;
        drawFlagAnimation(flag.placed, progress, screenX, screenY, cellSize);
    }

    const explosion = getExplosion();
    const blastProgress = explosionProgress(now);
    if (explosion && blastProgress < 1) {
        drawExplosion(
            explosion,
            blastProgress,
            explosion.x * cellSize - camera.position.x,
            explosion.y * cellSize - camera.position.y,
            cellSize,
        );
    }

    ctx.restore();

    // Full-screen flash isn't shaken
    if (explosion && blastProgress < 0.2) {
        ctx.globalAlpha = 0.4 * (1 - blastProgress / 0.2);
        ctx.fillStyle = THEME.pink;
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.globalAlpha = 1;
    }
}

export function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}
