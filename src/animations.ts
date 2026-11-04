import {
    BREAK_DURATION,
    BREAK_RING_DELAY,
    BREAK_MAX_DELAY,
    FLAG_DURATION,
    EXPLOSION_DURATION,
    SHAKE_DURATION,
    GAME_OVER_REVEAL_DELAY,
    GAME_OVER_RING_DELAY,
    GAME_OVER_MAX_DELAY,
    MINE_POP_DURATION,
} from "./constants";
import { draw } from "./render";
import { hash } from "./utils";
import type { Vector2D } from "./vector";

export type BreakingCell = {
    x: number;
    y: number;
    start: number;
    spin: number;
};

export type FlagAnimation = {
    x: number;
    y: number;
    start: number;
    placed: boolean;
};

export type Explosion = {
    x: number;
    y: number;
    start: number;
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const breakingCells = new Map<string, BreakingCell>();
const flagAnimations = new Map<string, FlagAnimation>();
let explosion: Explosion | null = null;
let shakeStart = -Infinity;
let gameOverReveal: { origin: Vector2D; start: number } | null = null;
let frameRequested = false;

function ringDistance(a: Vector2D, b: Vector2D) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function breakCells(cells: Vector2D[], origin: Vector2D) {
    if (reducedMotion.matches) return;
    const now = performance.now();
    for (const cell of cells) {
        const ring = ringDistance(cell, origin);
        breakingCells.set(`${cell.x},${cell.y}`, {
            x: cell.x,
            y: cell.y,
            start: now + Math.min(ring * BREAK_RING_DELAY, BREAK_MAX_DELAY),
            spin: (hash(cell.x, cell.y, 0) / 2 ** 32) * 2 - 1,
        });
    }
    requestFrame();
}

export function animateFlag(cellPosition: Vector2D, placed: boolean) {
    if (reducedMotion.matches) return;
    flagAnimations.set(`${cellPosition.x},${cellPosition.y}`, {
        x: cellPosition.x,
        y: cellPosition.y,
        start: performance.now(),
        placed,
    });
    requestFrame();
}

// Mine hit: blast + shake, then the rest of the board ripples open
export function explode(cellPosition: Vector2D) {
    if (reducedMotion.matches) return;
    const now = performance.now();
    explosion = { x: cellPosition.x, y: cellPosition.y, start: now };
    shakeStart = now;
    gameOverReveal = { origin: cellPosition, start: now };
    requestFrame();
}

export function clearAnimations() {
    breakingCells.clear();
    flagAnimations.clear();
    explosion = null;
    shakeStart = -Infinity;
    gameOverReveal = null;
}

export function getBreakingCell(cellPosition: Vector2D) {
    return breakingCells.get(`${cellPosition.x},${cellPosition.y}`);
}

export function getBreakingCells() {
    return breakingCells.values();
}

export function breakProgress(cell: BreakingCell, now: number) {
    return (now - cell.start) / BREAK_DURATION;
}

export function getFlagAnimation(cellPosition: Vector2D) {
    return flagAnimations.get(`${cellPosition.x},${cellPosition.y}`);
}

export function getFlagAnimations() {
    return flagAnimations.values();
}

export function flagProgress(flag: FlagAnimation, now: number) {
    return (now - flag.start) / FLAG_DURATION;
}

export function getExplosion() {
    return explosion;
}

export function explosionProgress(now: number) {
    return explosion ? (now - explosion.start) / EXPLOSION_DURATION : 1;
}

// Decaying random offset in pixels
export function getShakeOffset(now: number, strength: number) {
    const progress = (now - shakeStart) / SHAKE_DURATION;
    if (progress < 0 || progress >= 1) return { x: 0, y: 0 };
    const amplitude = strength * (1 - progress) ** 2;
    return {
        x: (Math.random() * 2 - 1) * amplitude,
        y: (Math.random() * 2 - 1) * amplitude,
    };
}

// Milliseconds since the game-over ripple reached this cell (negative = not yet)
export function gameOverRevealAge(cellPosition: Vector2D, now: number) {
    if (!gameOverReveal) return Infinity;
    const ring = ringDistance(cellPosition, gameOverReveal.origin);
    // The hit mine opens instantly, the rest waits for the blast
    const delay =
        ring === 0
            ? 0
            : GAME_OVER_REVEAL_DELAY +
              Math.min(ring * GAME_OVER_RING_DELAY, GAME_OVER_MAX_DELAY);
    return now - gameOverReveal.start - delay;
}

function isAnimating(now: number) {
    return (
        breakingCells.size > 0 ||
        flagAnimations.size > 0 ||
        explosion !== null ||
        now - shakeStart < SHAKE_DURATION ||
        (gameOverReveal !== null &&
            now - gameOverReveal.start <
                GAME_OVER_REVEAL_DELAY +
                    GAME_OVER_MAX_DELAY +
                    MINE_POP_DURATION)
    );
}

function requestFrame() {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(tick);
}

function tick(now: number) {
    frameRequested = false;
    for (const [key, cell] of breakingCells) {
        if (breakProgress(cell, now) >= 1) breakingCells.delete(key);
    }
    for (const [key, flag] of flagAnimations) {
        if (flagProgress(flag, now) >= 1) flagAnimations.delete(key);
    }
    if (explosionProgress(now) >= 1) explosion = null;
    draw();
    if (isAnimating(now)) requestFrame();
}
