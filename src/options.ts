import {
    ACTION_GROUPS,
    ACTIONS,
    actionFor,
    bindingLabel,
    clearBinding,
    keyLabel,
    loadKeyboardLayout,
    resetBindings,
    sameBinding,
    setBinding,
} from "./keybinds";
import { ui } from "./main";
import {
    onSettingsChange,
    settings,
    updateSettings,
    type Action,
    type Binding,
} from "./settings";
import { playFlag } from "./sfx";

// [code, width in key units]; every row adds up to 15 units
const KEYBOARD_ROWS: [string, number][][] = [
    [
        ["Backquote", 1],
        ...digits(),
        ["Minus", 1],
        ["Equal", 1],
        ["Backspace", 2],
    ],
    [
        ["Tab", 1.5],
        ...letters("QWERTYUIOP"),
        ["BracketLeft", 1],
        ["BracketRight", 1],
        ["Backslash", 1.5],
    ],
    [
        ["CapsLock", 1.75],
        ...letters("ASDFGHJKL"),
        ["Semicolon", 1],
        ["Quote", 1],
        ["Enter", 2.25],
    ],
    [
        ["ShiftLeft", 2.25],
        ...letters("ZXCVBNM"),
        ["Comma", 1],
        ["Period", 1],
        ["Slash", 1],
        ["ShiftRight", 2.75],
    ],
    [
        ["ControlLeft", 1.5],
        ["MetaLeft", 1.25],
        ["AltLeft", 1.5],
        ["Space", 6.5],
        ["AltRight", 1.5],
        ["MetaRight", 1.25],
        ["ControlRight", 1.5],
    ],
];

function digits(): [string, number][] {
    return "1234567890".split("").map((d) => [`Digit${d}`, 1]);
}

function letters(row: string): [string, number][] {
    return row.split("").map((l) => [`Key${l}`, 1]);
}

// [code, label] in an inverted T: top row first
const ARROW_KEYS = ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];

// [input, label, extra class]
const MOUSE_PARTS: [Binding, string, string][] = [
    [{ device: "mouse", button: 0 }, "L", "mouse-left"],
    [{ device: "wheel", direction: "up" }, "▲", "mouse-wheel"],
    [{ device: "mouse", button: 1 }, "M", "mouse-wheel"],
    [{ device: "wheel", direction: "down" }, "▼", "mouse-wheel"],
    [{ device: "mouse", button: 2 }, "R", "mouse-right"],
    [{ device: "mouse", button: 4 }, "5", "mouse-side mouse-forward"],
    [{ device: "mouse", button: 3 }, "4", "mouse-side mouse-back"],
];

let recordingAction: Action | null = null;
let selected: Binding | null = null;

const menu = document.querySelector<HTMLDivElement>("#options_menu")!;
const actionList = document.querySelector<HTMLDivElement>("#action_list")!;
const keyboard = document.querySelector<HTMLDivElement>("#keyboard")!;
const arrowKeys = document.querySelector<HTMLDivElement>("#arrow_keys")!;
const mouse = document.querySelector<HTMLDivElement>("#mouse")!;
const picker = document.querySelector<HTMLDivElement>("#key_picker")!;
const pickerLabel = document.querySelector("#key_picker_label")!;
const pickerActions = document.querySelector<HTMLDivElement>(
    "#key_picker_actions",
)!;

// Every element that stands for an input, so render() can mark its action
const inputElements: [Binding, HTMLButtonElement][] = [];

// The menu Back returns to, and the button to refocus there
let openedFrom = "mainMenu";
let openedBy: HTMLElement | null = null;

export function openOptions(from: string) {
    openedFrom = from;
    openedBy =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
    ui.close(from);
    ui.open("optionsMenu");
    menu.querySelector<HTMLButtonElement>("[aria-selected=true]")?.focus();
}

function closeOptions() {
    stopRecording();
    selected = null;
    render();
    ui.close("optionsMenu");
    ui.open(openedFrom);
    openedBy?.focus();
}

export function onOptionsEscape() {
    if (selected) {
        selected = null;
        render();
    } else {
        closeOptions();
    }
}

function selectTab(tab: HTMLButtonElement) {
    for (const other of menu.querySelectorAll<HTMLButtonElement>(
        "[role=tab]",
    )) {
        const isSelected = other === tab;
        other.setAttribute("aria-selected", String(isSelected));
        other.tabIndex = isSelected ? 0 : -1;
        const panel = document.getElementById(
            other.getAttribute("aria-controls")!,
        )!;
        panel.hidden = !isSelected;
    }
}

function startRecording(action: Action) {
    stopRecording();
    recordingAction = action;
    selected = null;
    window.addEventListener("keydown", onRecordKey, true);
    window.addEventListener("mousedown", onRecordMouse, true);
    window.addEventListener("wheel", onRecordWheel, {
        capture: true,
        passive: false,
    });
    render();
}

function stopRecording() {
    if (!recordingAction) return;
    recordingAction = null;
    window.removeEventListener("keydown", onRecordKey, true);
    window.removeEventListener("mousedown", onRecordMouse, true);
    window.removeEventListener("wheel", onRecordWheel, true);
    render();
}

function onRecordKey(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.code && event.code !== "Escape") {
        setBinding(recordingAction!, { device: "key", code: event.code });
    }
    stopRecording();
}

function onRecordMouse(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setBinding(recordingAction!, { device: "mouse", button: event.button });
    stopRecording();
    // The click that follows this press must not also press whatever is under it
    const swallow = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
    };
    window.addEventListener("click", swallow, true);
    window.addEventListener("auxclick", swallow, true);
    window.addEventListener(
        "mouseup",
        () =>
            setTimeout(() => {
                window.removeEventListener("click", swallow, true);
                window.removeEventListener("auxclick", swallow, true);
            }),
        { capture: true, once: true },
    );
}

function onRecordWheel(event: WheelEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.deltaY === 0) return;
    const direction = event.deltaY < 0 ? "up" : "down";
    setBinding(recordingAction!, { device: "wheel", direction });
    stopRecording();
}

function selectInput(binding: Binding) {
    stopRecording();
    selected = sameBinding(selected, binding) ? null : binding;
    render();
    if (selected) pickerActions.querySelector("button")?.focus();
}

function assignSelected(action: Action | null) {
    if (!selected) return;
    if (action) setBinding(action, selected);
    else clearBinding(selected);
    const input = inputElements.find(([b]) => sameBinding(b, selected));
    selected = null;
    render();
    input?.[1].focus();
}

function buildActionList() {
    for (const group of ACTION_GROUPS) {
        const section = document.createElement("div");
        section.className = "bind-group";
        section.dataset.action = group.actions[0]!.id;
        section.innerHTML = `<h2 class="bind-group-title"><span class="bind-swatch" aria-hidden="true"></span>${group.label}</h2>`;
        for (const { id, label } of group.actions) {
            const row = document.createElement("div");
            row.className = "bind-row";
            row.innerHTML = `<span class="flex-1">${label}</span>`;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn btn-secondary bind-button";
            button.dataset.bindAction = id;
            button.setAttribute("aria-label", `${group.label} ${label}`);
            button.addEventListener("click", () => {
                if (recordingAction === id) stopRecording();
                else startRecording(id);
            });
            row.append(button);
            section.append(row);
        }
        actionList.append(section);
    }
}

function inputButton(binding: Binding, className: string) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.addEventListener("click", () => selectInput(binding));
    inputElements.push([binding, button]);
    return button;
}

function buildKeyboard() {
    for (const row of KEYBOARD_ROWS) {
        const rowElement = document.createElement("div");
        rowElement.className = "keyboard-row";
        for (const [code, width] of row) {
            const key = inputButton({ device: "key", code }, "keycap");
            key.style.flexGrow = String(width);
            key.dataset.code = code;
            rowElement.append(key);
        }
        keyboard.append(rowElement);
    }
    for (const code of ARROW_KEYS) {
        const key = inputButton({ device: "key", code }, "keycap arrow-key");
        key.dataset.code = code;
        arrowKeys.append(key);
    }
    const wheel = document.createElement("div");
    wheel.className = "mouse-wheel-column";
    for (const [binding, label, className] of MOUSE_PARTS) {
        const part = inputButton(binding, `mouse-part ${className}`);
        part.textContent = label;
        if (className === "mouse-wheel") wheel.append(part);
        else mouse.append(part);
    }
    // Between the two buttons in the grid
    mouse.children[0]!.after(wheel);
}

function buildPicker() {
    const choices: [Action | null, string][] = [
        ...ACTIONS.map(({ id, fullLabel }): [Action, string] => [
            id,
            fullLabel,
        ]),
        [null, "Nothing"],
    ];
    for (const [action, label] of choices) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "picker-choice";
        if (action) button.dataset.action = action;
        button.dataset.choice = action ?? "none";
        button.textContent = label;
        button.addEventListener("click", () => assignSelected(action));
        pickerActions.append(button);
    }
}

function render() {
    for (const button of actionList.querySelectorAll<HTMLButtonElement>(
        "[data-bind-action]",
    )) {
        const action = button.dataset.bindAction as Action;
        const isRecording = recordingAction === action;
        button.textContent = isRecording
            ? "Press any input"
            : bindingLabel(settings.keybinds[action]);
        button.classList.toggle("recording", isRecording);
        button.setAttribute("aria-pressed", String(isRecording));
    }

    for (const [binding, element] of inputElements) {
        const action = actionFor(binding);
        const name = bindingLabel(binding);
        if (action) element.dataset.action = action;
        else delete element.dataset.action;
        if (binding.device === "key")
            element.textContent = keyLabel(binding.code);
        const actionLabel = ACTIONS.find(({ id }) => id === action)?.fullLabel;
        element.title = actionLabel ? `${name}: ${actionLabel}` : name;
        element.setAttribute("aria-label", element.title);
        element.setAttribute(
            "aria-pressed",
            String(sameBinding(binding, selected)),
        );
    }

    picker.hidden = !selected;
    if (selected) {
        pickerLabel.textContent = bindingLabel(selected);
        const current = actionFor(selected) ?? "none";
        for (const choice of pickerActions.querySelectorAll<HTMLButtonElement>(
            "button",
        )) {
            choice.setAttribute(
                "aria-pressed",
                String(choice.dataset.choice === current),
            );
        }
    }
}

function initializeSlider(
    id: string,
    get: () => number,
    set: (value: number) => void,
) {
    const slider = document.querySelector<HTMLInputElement>(`#${id}`)!;
    const output = document.querySelector<HTMLOutputElement>(`#${id}_value`)!;
    const show = () => {
        output.value = slider.value;
        slider.style.setProperty("--fill", `${slider.value}%`);
    };
    slider.value = String(Math.round(get() * 100));
    show();
    slider.addEventListener("input", () => {
        set(Number(slider.value) / 100);
        show();
    });
    return slider;
}

const TOUCH_ACTION_NAMES = { reveal: "Reveal", flag: "Flag" };

function renderTouchControls() {
    const tap = settings.touchTapAction;
    const hold = tap === "reveal" ? "flag" : "reveal";
    for (const [id, action] of [
        ["#touch_tap", tap],
        ["#touch_hold", hold],
    ] as const) {
        const element = document.querySelector<HTMLSpanElement>(id)!;
        element.dataset.action = action;
        element.textContent = TOUCH_ACTION_NAMES[action];
    }
}

export function initializeOptions() {
    document
        .querySelector("#options_button")!
        .addEventListener("click", () => openOptions("mainMenu"));
    document
        .querySelector("#options_back")!
        .addEventListener("click", closeOptions);

    const tabs = [...menu.querySelectorAll<HTMLButtonElement>("[role=tab]")];
    for (const [index, tab] of tabs.entries()) {
        tab.addEventListener("click", () => selectTab(tab));
        tab.addEventListener("keydown", (event) => {
            const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
            if (!step) return;
            const next = tabs[(index + step + tabs.length) % tabs.length]!;
            selectTab(next);
            next.focus();
        });
    }

    initializeSlider(
        "music_volume",
        () => settings.musicVolume,
        (musicVolume) => updateSettings({ musicVolume }),
    );
    const sfxSlider = initializeSlider(
        "sfx_volume",
        () => settings.sfxVolume,
        (sfxVolume) => updateSettings({ sfxVolume }),
    );
    // A sample so the new level can be heard
    sfxSlider.addEventListener("change", () => playFlag(true));

    const showPlayer =
        document.querySelector<HTMLInputElement>("#show_music_player")!;
    showPlayer.checked = settings.showMusicPlayer;
    showPlayer.addEventListener("change", () =>
        updateSettings({ showMusicPlayer: showPlayer.checked }),
    );

    document.querySelector("#reset_keybinds")!.addEventListener("click", () => {
        stopRecording();
        selected = null;
        resetBindings();
        updateSettings({ touchTapAction: "reveal" });
    });

    document.querySelector("#touch_swap")!.addEventListener("click", () =>
        updateSettings({
            touchTapAction:
                settings.touchTapAction === "reveal" ? "flag" : "reveal",
        }),
    );
    onSettingsChange(renderTouchControls);
    renderTouchControls();

    // Right clicks inside the menu are for binding, not the browser menu
    menu.addEventListener("contextmenu", (event) => event.preventDefault());

    buildActionList();
    buildKeyboard();
    buildPicker();
    onSettingsChange(render);
    render();
    void loadKeyboardLayout().then(render);
}
