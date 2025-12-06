import { assert, check, IsString, IsNumber, ValidationException } from "../src";

class UserDto {
    @IsString()
    name!: string;

    @IsNumber()
    age!: number;
}

describe("v3.0.0 Features (Assert & Check)", () => {

    it("should assert valid json and return instance", () => {
        const input = { name: "Alice", age: 25 };
        const result = assert(UserDto, input);

        expect(result).toBeInstanceOf(UserDto);
        expect(result.name).toBe("Alice");
    });

    it("should throw ValidationException on invalid json", () => {
        const input = { name: "Alice", age: "not-number" };

        expect(() => assert(UserDto, input)).toThrow(ValidationException);

        try {
            assert(UserDto, input);
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            if (e instanceof ValidationException) {
                expect(e.errors[0]!.property).toBe("age");
            }
        }
    });

    it("should check valid json and return true", () => {
        const input = { name: "Bob", age: 30 };
        if (check(UserDto, input)) {
            expect(input.name).toBe("Bob");
        } else {
            fail("Should be valid");
        }
    });

    it("should check invalid json and return false", () => {
        const input = { name: 123, age: 30 };
        expect(check(UserDto, input)).toBe(false);
    });

    it("should strip unknown properties if option is enabled", () => {
        const input = { name: "Alice", age: 25, admin: true, hacking: "yes" };

        const result = assert(UserDto, input, { stripUnknown: true });

        expect(result.name).toBe("Alice");
        expect((result as any).admin).toBeUndefined();
        expect((result as any).hacking).toBeUndefined();
    });
});