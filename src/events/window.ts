import { actionFor } from "../keybinds";
import { ui } from "../main";
import { resize } from "../render";
import type { Action } from "../settings";
import { runAction } from "./canvas";

// Holding the key keeps stepping
const REPEATING_ACTIONS: Action[] = [
    "zoomIn",
    "zoomOut",
    "musicUp",
    "musicDown",
    "sfxUp",
    "sfxDown",
];

// Panels listen on the document, which sees a key before the window does,
// so anything they handled arrives here already prevented
function onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const action = actionFor({ device: "key", code: event.code });
    if (!action || !ui.allows(action)) return;
    event.preventDefault();
    if (event.repeat && !REPEATING_ACTIONS.includes(action)) return;
    runAction(action);
}

export function initializeWindowListeners() {
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    // Mouse 4/5 can be bound, so they must not navigate the page away
    window.addEventListener("mouseup", (event) => {
        if (event.button === 3 || event.button === 4) event.preventDefault();
    });
}
