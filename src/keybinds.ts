import {
    DEFAULT_KEYBINDS,
    sameBinding,
    settings,
    updateSettings,
    type Action,
    type Binding,
    type Keybinds,
} from "./settings";

export { sameBinding };

export const ACTION_GROUPS: {
    label: string;
    actions: { id: Action; label: string }[];
}[] = [
    {
        label: "Game",
        actions: [
            { id: "reveal", label: "Reveal" },
            { id: "flag", label: "Flag" },
            { id: "restart", label: "Restart" },
        ],
    },
    {
        label: "View",
        actions: [
            { id: "zoomIn", label: "Zoom in" },
            { id: "zoomOut", label: "Zoom out" },
        ],
    },
    {
        label: "Music",
        actions: [
            { id: "muteMusic", label: "Mute" },
            { id: "musicUp", label: "Volume up" },
            { id: "musicDown", label: "Volume down" },
        ],
    },
    {
        label: "Sound FX",
        actions: [
            { id: "sfxUp", label: "Volume up" },
            { id: "sfxDown", label: "Volume down" },
        ],
    },
];

export const ACTIONS = ACTION_GROUPS.flatMap((group) =>
    group.actions.map((action) => ({
        ...action,
        fullLabel: `${group.label} ${action.label}`,
    })),
);

export function actionFor(binding: Binding): Action | null {
    const match = ACTIONS.find(({ id }) =>
        sameBinding(settings.keybinds[id], binding),
    );
    return match?.id ?? null;
}

// Each action has one binding: taking another action's input swaps them
export function setBinding(action: Action, binding: Binding | null) {
    const keybinds = { ...settings.keybinds };
    if (binding) {
        const other = actionFor(binding);
        if (other && other !== action) keybinds[other] = keybinds[action];
    }
    keybinds[action] = binding;
    updateSettings({ keybinds });
}

export function clearBinding(binding: Binding) {
    const action = actionFor(binding);
    if (action) setBinding(action, null);
}

export function resetBindings() {
    updateSettings({ keybinds: layoutDefaults() });
}

// Defaults named after what the key prints, which moves between layouts
// (M and - are elsewhere on AZERTY)
const PRINTED_DEFAULTS: [Action, string[]][] = [
    ["restart", ["r"]],
    ["muteMusic", ["m"]],
    ["sfxUp", ["+", "="]],
    ["sfxDown", ["-"]],
];

function layoutDefaults(): Keybinds {
    const keybinds = { ...DEFAULT_KEYBINDS };
    for (const [action, chars] of PRINTED_DEFAULTS) {
        for (const char of chars) {
            const code = [...(layoutMap ?? [])].find(
                ([, printed]) => printed === char,
            )?.[0];
            if (code) {
                keybinds[action] = { device: "key", code };
                break;
            }
        }
    }
    return keybinds;
}

// Moves untouched QWERTY defaults onto the keys that print + and -
function adaptDefaultsToLayout() {
    const defaults = layoutDefaults();
    for (const [action] of PRINTED_DEFAULTS) {
        const current = settings.keybinds[action];
        const adapted = defaults[action];
        if (!sameBinding(current, DEFAULT_KEYBINDS[action])) continue;
        if (sameBinding(current, adapted) || !adapted || actionFor(adapted))
            continue;
        setBinding(action, adapted);
    }
}

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

const KEY_NAMES: Record<string, string> = {
    Backquote: "`",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    IntlBackslash: "<",
    Backspace: "Bksp",
    CapsLock: "Caps",
    Space: "Space",
    Escape: "Esc",
    ControlLeft: "Ctrl",
    ControlRight: "Ctrl",
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    AltLeft: isMac ? "Opt" : "Alt",
    AltRight: isMac ? "Opt" : "AltGr",
    MetaLeft: isMac ? "Cmd" : "Win",
    MetaRight: isMac ? "Cmd" : "Win",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    NumpadAdd: "Num +",
    NumpadSubtract: "Num -",
    PageUp: "PgUp",
    PageDown: "PgDn",
    Delete: "Del",
    Insert: "Ins",
};

const MOUSE_NAMES = [
    "Left click",
    "Middle click",
    "Right click",
    "Mouse 4",
    "Mouse 5",
];

// Physical key code -> printed character, for non-QWERTY layouts
let layoutMap: Map<string, string> | null = null;

/** Resolves once the keyboard layout is known (Chromium only, else no-op). */
export async function loadKeyboardLayout() {
    const keyboard = (
        navigator as Navigator & {
            keyboard?: { getLayoutMap(): Promise<Map<string, string>> };
        }
    ).keyboard;
    try {
        layoutMap = (await keyboard?.getLayoutMap()) ?? null;
    } catch {
        layoutMap = null;
    }
    adaptDefaultsToLayout();
}

export function keyLabel(code: string) {
    const printed = layoutMap?.get(code);
    if (printed && printed.trim()) return printed.toUpperCase();
    return (
        KEY_NAMES[code] ??
        code.replace(/^(Key|Digit)/, "").replace(/^Numpad/, "Num ")
    );
}

export function bindingLabel(binding: Binding | null) {
    if (!binding) return "None";
    if (binding.device === "key") return keyLabel(binding.code);
    if (binding.device === "wheel") return `Scroll ${binding.direction}`;
    return MOUSE_NAMES[binding.button] ?? `Mouse ${binding.button + 1}`;
}
