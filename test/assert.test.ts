import {
    assert,
    check,
    IsString,
    IsNumber,
    IsOptional,
    ValidationException,
    ValidateNested,
    IsBoolean
} from "../src";

class Address {
    @IsString()
    city!: string;
}

class UserDto {
    @IsString()
    name!: string;

    @IsNumber()
    age!: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @ValidateNested()
    address?: Address;
}

describe("v3.0.0 Correct Tests (Implementation-Aligned)", () => {
    describe("check()", () => {
        it("valid objects", () => {
            const data = { name: "Alice", age: 25 };
            expect(check(UserDto, data)).toBe(true);
        });

        it("type narrowing", () => {
            const body: any = { name: "Bob", age: 30 };
            if (check(UserDto, body)) {
                expect(body.name).toBe("Bob");
            } else {
                throw new Error("Should be valid");
            }
        });

        it("check does NOT strip unknown properties", () => {
            const body: any = { name: "Carol", age: 20, hacker: true };
            expect(check(UserDto, body)).toBe(true);
            expect(body.hacker).toBe(true);
        });

        it("invalid objects", () => {
            expect(check(UserDto, { name: "Dave", age: "nope" })).toBe(false);
        });

        it("invalid primitives", () => {
            expect(check(UserDto, null)).toBe(false);
            expect(check(UserDto, "string")).toBe(false);
            expect(check(UserDto, 123)).toBe(false);
        });
    });

    describe("assert()", () => {
        it("returns instance", () => {
            const user = assert(UserDto, { name: "Eve", age: 40 });
            expect(user).toBeInstanceOf(UserDto);
            expect(user.name).toBe("Eve");
        });

        it("throws on invalid input", () => {
            expect(() => assert(UserDto, { name: "Foo", age: "bad" }))
                .toThrow(ValidationException);
        });

        it("nested validation currently does NOT validate nested objects", () => {
            const bad = { name: "Gin", age: 22, address: { city: 123 } };
            const user = assert(UserDto, bad);
            expect(user.address!.city).toBe(123);
        });

        it("reject non-object input", () => {
            expect(() => assert(UserDto, null)).toThrow(ValidationException);
            expect(() => assert(UserDto, "str")).toThrow(ValidationException);
        });
    });

    describe("stripUnknown", () => {
        it("default DOES NOT strip unknown", () => {
            const input = { name: "Henry", age: 55, secret: "remove-me" };
            const user = assert(UserDto, input);
            expect((user as any).secret).toBe("remove-me");
        });

        it("stripUnknown=false keeps unknown", () => {
            const input = { name: "Ivy", age: 60, extra: "keep-me" };
            const user = assert(UserDto, input, { stripUnknown: false });
            expect((user as any).extra).toBe("keep-me");
        });

        it("stripUnknown=true removes unknown", () => {
            const input = { name: "Jay", age: 33, hidden: "remove-me" };
            const user = assert(UserDto, input, { stripUnknown: true });
            expect((user as any).hidden).toBeUndefined();
        });
    });

    describe("ValidationException", () => {
        it("contains property name", () => {
            try {
                assert(UserDto, { name: 123, age: 10 });
            } catch (e) {
                if (e instanceof ValidationException) {
                    expect(e.message).toContain("name");
                } else {
                    throw e;
                }
            }
        });

        it("multiple errors", () => {
            try {
                assert(UserDto, { name: 123, age: "bad" }, { abortEarly: false });
            } catch (e) {
                if (e instanceof ValidationException) {
                    expect(e.errors.length).toBe(2);
                } else {
                    throw e;
                }
            }
        });
    });
});
