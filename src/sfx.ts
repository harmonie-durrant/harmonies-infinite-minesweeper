import { SFX_MAX_VOLUME } from "./constants";
import { settings } from "./settings";

// Retro sound effects synthesised on the fly, so there are no files to load
let context: AudioContext | null = null;

function output() {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const volume = context.createGain();
    volume.gain.value = settings.sfxVolume * SFX_MAX_VOLUME;
    volume.connect(context.destination);
    return { context, volume };
}

// A square wave that slides from one pitch to another while fading out
function blip(from: number, to: number, duration: number, delay = 0) {
    if (settings.sfxVolume === 0) return;
    const { context, volume } = output();
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    envelope.gain.setValueAtTime(0.4, start);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope).connect(volume);
    oscillator.start(start);
    oscillator.stop(start + duration);
}

export function playReveal(count: number) {
    // Bigger cascades sound higher
    const pitch = 440 * Math.min(2, 1 + Math.log10(count) / 2);
    blip(pitch, pitch * 1.5, 0.08);
}

export function playFlag(placed: boolean) {
    if (placed) blip(660, 990, 0.1);
    else blip(660, 440, 0.1);
}

// The classic two-note coin chime
export function playCoin() {
    blip(988, 988, 0.07);
    blip(1319, 1319, 0.25, 0.07);
}

export function playExplosion() {
    if (settings.sfxVolume === 0) return;
    const { context, volume } = output();
    const duration = 0.7;
    const start = context.currentTime;
    const buffer = context.createBuffer(
        1,
        Math.floor(context.sampleRate * duration),
        context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
        samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, start);
    filter.frequency.exponentialRampToValueAtTime(80, start + duration);
    noise.connect(filter).connect(volume);
    noise.start(start);
}
