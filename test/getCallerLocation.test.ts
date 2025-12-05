/**
 * @jest-environment node
 */

import { getCallerLocation } from "../src/utils/stack";

describe("getCallerLocation", () => {
    let originalProcess: any;

    beforeAll(() => {
        originalProcess = global.process;
    });

    afterAll(() => {
        // @ts-ignore
        global.process = originalProcess;
    });

    function mockStack(lines: string[]) {
        const stack = ["Error", ...lines].join("\n");
        jest.spyOn(global, "Error").mockImplementation(() => ({ stack }) as any);
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("returns 'unknown' when stack is missing", () => {
        jest.spyOn(global, "Error").mockImplementation(() => ({ stack: undefined }) as any);
        expect(getCallerLocation()).toBe("unknown");
    });

    test("returns 'unknown' when caller line missing", () => {
        mockStack([
            "at a()",
            "at b()",
            "at c()"
        ]);
        expect(getCallerLocation()).toBe("unknown");
    });

    test("extracts simple caller location", () => {
        mockStack([
            "at func1 (file:///test/location/fileA.ts:10:5)",
            "at func2 (file:///other.ts:1:1)",
            "at func3 (file:///myfile.ts:20:10)",
            "at func4 (file:///target.ts:50:9)"
        ]);

        const loc = getCallerLocation().replace(/^\/+/, "");
        expect(loc).toBe("test/location/fileA.ts:10:5");
    });

    test("extracts location when no parentheses", () => {
        mockStack([
            "at something",
            "at next",
            "at third",
            "at fourth",
            "at plainfile.ts:100:20"
        ]);

        const loc = getCallerLocation().replace(/^\/+/, "");
        expect(loc).toBe("plainfile.ts:100:20");
    });

    test("handles Windows path correction (/C:/ → C:/)", () => {
        // @ts-ignore
        global.process = { platform: "win32" };

        mockStack([
            "at something",
            "at next",
            "at third",
            "at fourth",
            "at (/C:/project/src/file.ts:12:3)"
        ]);

        const loc = getCallerLocation().replace(/^\/+/, "");
        expect(loc).toBe("C:/project/src/file.ts:12:3");
    });
});
