import { breakDelay } from "./animations";
import {
    COIN_FLIGHT_DURATION,
    COIN_POP_DELAY,
    COINS_KEY,
    RUN_STATS_COUNT_DURATION,
} from "./constants";
import { camera, canvas, grid } from "./main";
import { playCoin } from "./sfx";
import type { Vector2D } from "./vector";

const balance = document.querySelector<HTMLDivElement>("#coin_balance")!;
const count = document.querySelector<HTMLSpanElement>("#coin_count")!;
const icon = document.querySelector<HTMLImageElement>("#coin_icon")!;
const runBalance = document.querySelector<HTMLDivElement>("#run_coin_balance")!;
const layer = document.querySelector<HTMLDivElement>("#coin_layer")!;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Banked and saved; only grows when a run ends
let coins = Number(localStorage.getItem(COINS_KEY)) || 0;
let shownCoins = coins;
// Picked up this run, not banked yet: restarting or quitting loses them
let runCoins = 0;
// The pending counter catches up as each coin lands
let shownRunCoins = 0;
const flights = new Set<Animation>();
let tweenFrame = 0;

export function getCoins() {
    return coins;
}

function showCount() {
    count.textContent = String(shownCoins);
    runBalance.textContent = `+${shownRunCoins}`;
    runBalance.classList.toggle("hidden", shownRunCoins === 0);
    const pending = shownRunCoins ? `, ${shownRunCoins} more this run` : "";
    balance.setAttribute("aria-label", `${shownCoins} coins${pending}`);
}

function bump(element: HTMLElement) {
    element.animate([{ scale: 1.5 }, { scale: 1 }], {
        duration: 200,
        easing: "ease-out",
    });
}

function landCoin() {
    // The run ended while this coin was in the air
    if (shownRunCoins >= runCoins) return;
    shownRunCoins += 1;
    showCount();
    playCoin();
    bump(icon);
    bump(runBalance);
}

// Runs onProgress from 0 to 1 over the duration, or straight to 1
function tween(duration: number, onProgress: (progress: number) => void) {
    cancelAnimationFrame(tweenFrame);
    if (reducedMotion.matches) {
        onProgress(1);
        return;
    }
    const start = performance.now();
    const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        onProgress(progress);
        if (progress < 1) tweenFrame = requestAnimationFrame(step);
    };
    tweenFrame = requestAnimationFrame(step);
}

function cancelFlights() {
    for (const flight of flights) flight.cancel();
    flights.clear();
    layer.replaceChildren();
}

// The coin pops out of its cell as it breaks, then flies to the balance
function flyCoin(cell: Vector2D, delay: number) {
    const size = grid.cellSize * 0.55;
    const canvasRect = canvas.getBoundingClientRect();
    const target = icon.getBoundingClientRect();
    const startX =
        canvasRect.left + (cell.x + 0.5) * grid.cellSize - camera.position.x;
    const startY =
        canvasRect.top + (cell.y + 0.5) * grid.cellSize - camera.position.y;
    const endX = target.left + target.width / 2;
    const endY = target.top + target.height / 2;
    const lift = grid.cellSize * 0.6;
    const endScale = target.width / size;
    const at = (x: number, y: number, scale: number) =>
        `translate(${x - size / 2}px, ${y - size / 2}px) scale(${scale})`;

    const coin = document.createElement("img");
    coin.src = icon.src;
    coin.alt = "";
    coin.className = "coin-flyer";
    coin.style.width = coin.style.height = `${size}px`;
    layer.append(coin);

    const flight = coin.animate(
        [
            { transform: at(startX, startY, 0), easing: "ease-out" },
            { transform: at(startX, startY - lift, 1.2), offset: 0.3 },
            {
                transform: at(startX, startY - lift, 1),
                offset: 0.45,
                easing: "ease-in",
            },
            { transform: at(endX, endY, endScale) },
        ],
        { duration: COIN_FLIGHT_DURATION, delay, fill: "backwards" },
    );
    flights.add(flight);
    flight.onfinish = () => {
        flights.delete(flight);
        coin.remove();
        landCoin();
    };
}

export function collectCoins(cells: Vector2D[], origin: Vector2D) {
    if (cells.length === 0) return;
    runCoins += cells.length;
    if (reducedMotion.matches) {
        cells.forEach(() => landCoin());
        return;
    }
    for (const cell of cells) {
        flyCoin(cell, breakDelay(cell, origin) + COIN_POP_DELAY);
    }
}

/**
 * Ends the run: its coins join the saved total, and the pending counter
 * drains into the balance. Returns how many were banked.
 */
export function bankRunCoins() {
    const earned = runCoins;
    if (earned === 0) return 0;
    coins += earned;
    runCoins = 0;
    localStorage.setItem(COINS_KEY, String(coins));
    const fromTotal = shownCoins;
    const fromRun = shownRunCoins;
    tween(RUN_STATS_COUNT_DURATION, (progress) => {
        shownCoins = Math.round(fromTotal + (coins - fromTotal) * progress);
        shownRunCoins = Math.round(fromRun * (1 - progress));
        showCount();
    });
    return earned;
}

/** Restarting or quitting mid-run: the unbanked coins are lost */
export function forfeitRunCoins() {
    cancelFlights();
    if (runCoins === 0) return;
    runCoins = 0;
    if (shownRunCoins === 0 || reducedMotion.matches) {
        shownRunCoins = 0;
        showCount();
        return;
    }
    // Flashes pink and drops away
    runBalance.classList.add("lost");
    runBalance.animate(
        [
            { translate: "0 0", opacity: 1 },
            { translate: "0 0", opacity: 1, offset: 0.4 },
            { translate: "0 1rem", opacity: 0 },
        ],
        { duration: 700, easing: "ease-in" },
    ).onfinish = () => {
        runBalance.classList.remove("lost");
        shownRunCoins = 0;
        showCount();
    };
}

export function initializeCoins() {
    showCount();
}
