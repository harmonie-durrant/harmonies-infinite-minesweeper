import { VOLUME_HUD_DURATION, VOLUME_STEP } from "./constants";
import { onSettingsChange, settings, updateSettings } from "./settings";
import { playFlag } from "./sfx";

type Channel = "music" | "sfx";

const hud = document.querySelector<HTMLDivElement>("#volume_hud")!;
const channels = [
    ...hud.querySelectorAll<HTMLDivElement>("[data-channel]"),
].map((element) => ({
    element,
    channel: element.dataset.channel as Channel,
    bar: element.querySelector<HTMLDivElement>(".volume-bar")!,
    fill: element.querySelector<HTMLDivElement>(".volume-fill")!,
    value: element.querySelector<HTMLSpanElement>(".volume-value")!,
}));

let hideTimer = 0;
let isHovered = false;
let isDragging = false;

function level(channel: Channel) {
    return channel === "music" ? settings.musicVolume : settings.sfxVolume;
}

function setLevel(channel: Channel, value: number) {
    // Snap to 5% so dragging lands on round numbers
    const snapped = Math.round(Math.min(1, Math.max(0, value)) * 20) / 20;
    if (channel === "music") {
        // Turning the music up is a clear sign it should be heard
        updateSettings({ musicVolume: snapped, musicMuted: false });
    } else {
        updateSettings({ sfxVolume: snapped });
    }
}

export function changeVolume(channel: Channel, direction: 1 | -1) {
    setLevel(channel, level(channel) + direction * VOLUME_STEP);
    if (channel === "sfx") playFlag(true);
    showVolumeHud();
}

export function toggleMusicMuted() {
    updateSettings({ musicMuted: !settings.musicMuted });
    showVolumeHud();
}

export function showVolumeHud() {
    hud.classList.replace("hidden", "flex");
    scheduleHide();
}

// Stays up while the pointer is over it or dragging a bar
function scheduleHide() {
    clearTimeout(hideTimer);
    if (isHovered || isDragging) return;
    hideTimer = setTimeout(
        () => hud.classList.replace("flex", "hidden"),
        VOLUME_HUD_DURATION,
    );
}

function render() {
    for (const { element, channel, fill, value } of channels) {
        const percent = Math.round(level(channel) * 100);
        const muted = channel === "music" && settings.musicMuted;
        fill.style.height = `${percent}%`;
        value.textContent = muted ? "Off" : String(percent);
        element.classList.toggle("muted", muted);
    }
}

export function initializeVolumeHud() {
    hud.addEventListener("pointerenter", () => {
        isHovered = true;
        clearTimeout(hideTimer);
    });
    hud.addEventListener("pointerleave", () => {
        isHovered = false;
        scheduleHide();
    });

    for (const { element, channel, bar } of channels) {
        const setFromPointer = (event: PointerEvent) => {
            const rect = bar.getBoundingClientRect();
            setLevel(channel, 1 - (event.clientY - rect.top) / rect.height);
        };
        bar.addEventListener("pointerdown", (event) => {
            bar.setPointerCapture(event.pointerId);
            isDragging = true;
            setFromPointer(event);
        });
        bar.addEventListener("pointermove", (event) => {
            if (isDragging) setFromPointer(event);
        });
        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            if (channel === "sfx") playFlag(true);
            scheduleHide();
        };
        bar.addEventListener("pointerup", endDrag);
        bar.addEventListener("pointercancel", endDrag);
        element.addEventListener("wheel", (event) => {
            event.preventDefault();
            if (event.deltaY === 0) return;
            changeVolume(channel, event.deltaY < 0 ? 1 : -1);
        });
    }

    onSettingsChange(render);
    render();
}
