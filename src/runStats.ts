import { bankRunCoins } from "./coins";
import { RUN_STATS_COUNT_DURATION } from "./constants";
import { openGameOverMenu, ui } from "./main";

const runCoins = document.querySelector<HTMLSpanElement>("#run_coins")!;
const continueButton = document.querySelector<HTMLButtonElement>(
    "#run_stats_continue",
)!;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let countFrame = 0;

// Ticks the number up from 0 so the total lands with a bit of weight
function countUp(element: HTMLElement, total: number) {
    cancelAnimationFrame(countFrame);
    if (reducedMotion.matches || total === 0) {
        element.textContent = String(total);
        return;
    }
    const start = performance.now();
    const step = (now: number) => {
        const progress = Math.min(1, (now - start) / RUN_STATS_COUNT_DURATION);
        element.textContent = String(Math.round(total * progress));
        if (progress < 1) countFrame = requestAnimationFrame(step);
    };
    countFrame = requestAnimationFrame(step);
}

/** Shown between the explosion and the game over menu */
export function openRunStats() {
    ui.open("runStatsMenu");
    // The run is over, so its coins are safe now
    countUp(runCoins, bankRunCoins());
    continueButton.focus();
}

export function closeRunStats() {
    cancelAnimationFrame(countFrame);
    ui.close("runStatsMenu");
    openGameOverMenu();
}

export function initializeRunStats() {
    continueButton.addEventListener("click", closeRunStats);
}
