/*
 * Tracks are collected from folders in ./tracks at build time. Each folder holds:
 * - an .mp3 file (required, folders without one are skipped)
 * - a cover image: cover.png / .jpg / .jpeg / .webp / .gif (optional)
 * - title.txt: the title on line 1, the artist on line 2 (optional, the
 *   title falls back to the folder name)
 */

export interface Track {
    title: string;
    artist: string;
    audio: string;
    cover: string | null;
}

const audioFiles = import.meta.glob<string>("./tracks/*/*.mp3", {
    eager: true,
    query: "?url",
    import: "default",
});
const coverFiles = import.meta.glob<string>(
    "./tracks/*/cover.{png,jpg,jpeg,webp,gif}",
    { eager: true, query: "?url", import: "default" },
);
const titleFiles = import.meta.glob<string>("./tracks/*/title.txt", {
    eager: true,
    query: "?raw",
    import: "default",
});

function folderOf(path: string) {
    return path.split("/")[2]!;
}

function findInFolder(files: Record<string, string>, folder: string) {
    const path = Object.keys(files).find((p) => folderOf(p) === folder);
    return path ? files[path]! : null;
}

export const TRACKS: Track[] = Object.entries(audioFiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, audio]) => {
        const folder = folderOf(path);
        const [title, artist] = (findInFolder(titleFiles, folder) ?? "")
            .split(/\r?\n/)
            .map((line) => line.trim());
        return {
            title: title || folder,
            artist: artist ?? "",
            audio,
            cover: findInFolder(coverFiles, folder),
        };
    });
