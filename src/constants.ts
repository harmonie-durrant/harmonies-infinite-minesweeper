export const CELL_SIZE = 64;

export const DRAG_THRESHOLD = 5;

// Mirrors the arcade tokens in src/style.css
export const THEME = {
    font: '"Press Start 2P", monospace',
    hidden: "#23235b",
    hiddenLight: "#3a3a8c",
    hiddenShadow: "#121236",
    revealed: "#0f0f2a",
    gridLine: "#1c1c44",
    mine: "#3d1030",
    flagCorrect: "rgb(57 255 20 / 0.35)",
    flagWrong: "rgb(255 46 136 / 0.45)",
    ink: "#f4f4ff",
    pink: "#ff2e88",
    cyan: "#00e5ff",
    yellow: "#ffd23f",
};

export const NUMBER_COLORS = [
    "",
    "#00e5ff",
    "#39ff14",
    "#ff2e88",
    "#b26bff",
    "#ff9f1c",
    "#2ec4b6",
    "#f4f4ff",
    "#8a8ab8",
];

export const MAX_REVEAL = 10000;

// Cell breaking animation (ms)
export const BREAK_DURATION = 450;
export const BREAK_RING_DELAY = 30;
export const BREAK_MAX_DELAY = 600;

export const FLAG_DURATION = 350;

// Mine hit sequence (ms)
export const EXPLOSION_DURATION = 800;
export const SHAKE_DURATION = 500;
export const GAME_OVER_REVEAL_DELAY = 250;
export const GAME_OVER_RING_DELAY = 35;
export const GAME_OVER_MAX_DELAY = 1200;
export const MINE_POP_DURATION = 300;
export const GAME_OVER_MENU_DELAY = 1100;

export const MAX_ZOOM = 10;
