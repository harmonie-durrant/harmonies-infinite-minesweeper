import { TRACKS, type Track } from "./tracks";

export class MusicPlayer {
    public muted = false;
    public onTrackChange: (track: Track) => void = () => {};

    private trackIndex = Math.floor(Math.random() * TRACKS.length);
    private audio = new Audio();
    private started = false;

    constructor() {
        this.audio.preload = "none";
        this.audio.src = this.currentTrack.audio;
        this.audio.addEventListener("ended", () => this.skip());
    }

    public get currentTrack() {
        return TRACKS[this.trackIndex]!;
    }

    /** Must first be called from a user gesture so the browser allows audio. */
    public play() {
        if (this.muted) return;
        this.started = true;
        void this.audio.play().catch(() => {});
    }

    public pause() {
        this.audio.pause();
    }

    /** Resumes after pause(), without starting audio that never started. */
    public resume() {
        if (this.started) this.play();
    }

    public setVolume(volume: number) {
        this.audio.volume = volume;
    }

    public setMuted(muted: boolean) {
        this.muted = muted;
        if (muted) this.pause();
        else this.play();
    }

    public skip() {
        this.trackIndex = (this.trackIndex + 1) % TRACKS.length;
        this.audio.src = this.currentTrack.audio;
        this.onTrackChange(this.currentTrack);
        if (this.started) this.play();
    }
}
