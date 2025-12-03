declare const process: any;

export function getCallerLocation(): string {
    const stack = new Error().stack;
    if (!stack) return "unknown";

    const stackLines = stack.split('\n');

    let callerLine = stackLines[4];

    if (!callerLine) {
        return "unknown";
    }

    let cleanLine = callerLine.trim();

    if (cleanLine.startsWith("at ")) {
        cleanLine = cleanLine.slice(3);
    }

    const parenMatch = cleanLine.match(/\((.*?)\)/);
    if (parenMatch && parenMatch[1]) {
        cleanLine = parenMatch[1];
    }

    if (cleanLine.startsWith("file://")) {
        cleanLine = cleanLine.slice(7);
    }

    const isWindows = typeof process !== 'undefined' && process.platform === "win32";

    if (isWindows && /^\/[A-Z]:/.test(cleanLine)) {
        cleanLine = cleanLine.slice(1);
    }

    return cleanLine;
}