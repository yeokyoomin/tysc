export function getCallerLocation(): string {
    const stack = new Error().stack;
    if (!stack) return "unknown";

    const stackLines = stack.split("\n");

    const callerLine = stackLines[4] || stackLines[3] || "unknown";
    const match = callerLine.match(/\((.*)\)/);
    const fullPath = (match && match[1]) ? match[1] : callerLine.trim();
    return fullPath;
}