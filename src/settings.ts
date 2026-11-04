import { MUTED_KEY, SETTINGS_KEY } from "./constants";

export type Action =
    | "reveal"
    | "flag"
    | "restart"
    | "zoomIn"
    | "zoomOut"
    | "muteMusic"
    | "musicUp"
    | "musicDown"
    | "sfxUp"
    | "sfxDown";

export type Binding =
    | { device: "key"; code: string }
    | { device: "mouse"; button: number }
    | { device: "wheel"; direction: "up" | "down" };

export type Keybinds = Record<Action, Binding | null>;

/** What a tap does; holding does the other */
export type TouchTapAction = "reveal" | "flag";

export interface Settings {
    /** 0-1, scaled by MUSIC_MAX_VOLUME */
    musicVolume: number;
    musicMuted: boolean;
    /** 0-1, scaled by SFX_MAX_VOLUME */
    sfxVolume: number;
    showMusicPlayer: boolean;
    keybinds: Keybinds;
    touchTapAction: TouchTapAction;
}

export const DEFAULT_KEYBINDS: Keybinds = {
    reveal: { device: "mouse", button: 0 },
    flag: { device: "mouse", button: 2 },
    restart: { device: "key", code: "KeyR" },
    zoomIn: { device: "wheel", direction: "up" },
    zoomOut: { device: "wheel", direction: "down" },
    muteMusic: { device: "key", code: "KeyM" },
    musicUp: { device: "key", code: "ArrowUp" },
    musicDown: { device: "key", code: "ArrowDown" },
    sfxUp: { device: "key", code: "Equal" },
    sfxDown: { device: "key", code: "Minus" },
};

const DEFAULT_SETTINGS: Settings = {
    musicVolume: 0.5,
    // Mute used to be saved on its own
    musicMuted: localStorage.getItem(MUTED_KEY) === "true",
    sfxVolume: 0.5,
    showMusicPlayer: true,
    keybinds: DEFAULT_KEYBINDS,
    touchTapAction: "reveal",
};

export function sameBinding(a: Binding | null, b: Binding | null) {
    if (!a || !b || a.device !== b.device) return false;
    return JSON.stringify(a) === JSON.stringify(b);
}

// Actions added since the save get their default, unless the player
// already put that input on something else
function mergeKeybinds(saved: Partial<Keybinds>): Keybinds {
    const keybinds = { ...DEFAULT_KEYBINDS, ...saved };
    const savedBindings = Object.values(saved);
    for (const action of Object.keys(DEFAULT_KEYBINDS) as Action[]) {
        if (action in saved) continue;
        if (savedBindings.some((b) => sameBinding(b, keybinds[action])))
            keybinds[action] = null;
    }
    return keybinds;
}

function load(): Settings {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
        return {
            ...DEFAULT_SETTINGS,
            ...saved,
            keybinds: mergeKeybinds(saved.keybinds ?? {}),
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export const settings: Settings = load();

const listeners: (() => void)[] = [];

export function onSettingsChange(listener: () => void) {
    listeners.push(listener);
}

export function updateSettings(changes: Partial<Settings>) {
    Object.assign(settings, changes);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    for (const listener of listeners) listener();
}
