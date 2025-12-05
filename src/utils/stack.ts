declare const process: any;

export function getCallerLocation(): string {
    const stack = new Error().stack;
    if (!stack) return "unknown";

    const lines = stack.split("\n").map(s => s.trim());

    const line = lines.find(l =>
        l.includes(".ts:") || l.includes(".js:")
    );
    if (!line) return "unknown";

    let clean = line;

    if (clean.startsWith("at ")) clean = clean.slice(3);

    const match = clean.match(/\((.*?)\)/);
    if (match?.[1]) clean = match[1];

    if (clean.startsWith("file://")) {
        clean = clean.slice(7);
    }

    const isWindows = typeof process !== "undefined" && process.platform === "win32";

    if (isWindows && /^\/[A-Z]:/.test(clean)) {
        clean = clean.slice(1);
    }

    if (!isWindows && clean.startsWith("/")) {
        clean = clean.slice(1);
    }

    return clean;
}
