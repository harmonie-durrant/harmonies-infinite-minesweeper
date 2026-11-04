import { MUSIC_MAX_VOLUME } from "../constants";
import { onSettingsChange, settings, updateSettings } from "../settings";
import { MusicPlayer } from "./player";
import { TRACKS, type Track } from "./tracks";

export function initializeMusicPlayer() {
    const container = document.querySelector<HTMLDivElement>("#music_player")!;
    if (TRACKS.length === 0) {
        container.classList.add("hidden");
        return;
    }

    const cover = document.querySelector<HTMLImageElement>("#music_cover")!;
    const title = document.querySelector<HTMLParagraphElement>("#music_title")!;
    const artist =
        document.querySelector<HTMLParagraphElement>("#music_artist")!;
    const muteButton =
        document.querySelector<HTMLButtonElement>("#music_mute")!;
    const skipButton =
        document.querySelector<HTMLButtonElement>("#music_skip")!;
    const volumeOnIcon = document.querySelector("#music_icon_on")!;
    const volumeOffIcon = document.querySelector("#music_icon_off")!;

    const player = new MusicPlayer();
    player.muted = settings.musicMuted;

    function showTrack(track: Track) {
        if (track.cover) cover.src = track.cover;
        else cover.removeAttribute("src");
        cover.classList.toggle("invisible", !track.cover);
        title.textContent = track.title;
        artist.textContent = track.artist;
    }

    function showMuted() {
        const label = player.muted ? "Unmute music" : "Mute music";
        muteButton.setAttribute("aria-label", label);
        muteButton.title = label;
        muteButton.setAttribute("aria-pressed", String(player.muted));
        volumeOnIcon.classList.toggle("hidden", player.muted);
        volumeOffIcon.classList.toggle("hidden", !player.muted);
    }

    function applySettings() {
        player.setVolume(settings.musicVolume * MUSIC_MAX_VOLUME);
        container.classList.toggle("hidden", !settings.showMusicPlayer);
        if (player.muted !== settings.musicMuted) {
            player.setMuted(settings.musicMuted);
            showMuted();
        }
    }

    player.onTrackChange = showTrack;
    showTrack(player.currentTrack);
    showMuted();
    applySettings();
    onSettingsChange(applySettings);

    const startOnGesture = () => {
        player.play();
        document.removeEventListener("pointerdown", startOnGesture);
        document.removeEventListener("keydown", startOnGesture);
    };
    document.addEventListener("pointerdown", startOnGesture);
    document.addEventListener("keydown", startOnGesture);

    muteButton.addEventListener("click", () =>
        updateSettings({ musicMuted: !settings.musicMuted }),
    );

    skipButton.addEventListener("click", () => player.skip());

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) player.pause();
        else player.resume();
    });
}
