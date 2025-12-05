import {
    validate,
    IsEmail,
    Matches,
    IsInt,
    IsPositive,
    ArrayMinSize,
    ArrayMaxSize
} from "../src";

describe("💯 Full Coverage Tests", () => {

    describe("String Strategies", () => {
        class StringTest {
            @IsEmail()
            email: string;

            @Matches(/^[a-z]+$/)
            onlyLetters: string;

            constructor(email: string, letters: string) {
                this.email = email;
                this.onlyLetters = letters;
            }
        }

        it("should validate IsEmail", () => {
            const valid = new StringTest("test@example.com", "abc");
            expect(validate(valid)).toHaveLength(0);

            const invalid = new StringTest("not-an-email", "abc");
            const errors = validate(invalid);
            expect(errors).toHaveLength(1);
            expect(errors[0]!.failedRules!["IsEmail"]).toBeDefined();
        });

        it("should validate Matches (Regex)", () => {
            const invalid = new StringTest("test@example.com", "123");
            const errors = validate(invalid);
            expect(errors).toHaveLength(1);
            expect(errors[0]!.failedRules!["Matches"]).toBeDefined();
        });

        it("should fail IsEmail/Matches if value is not string", () => {
            // @ts-ignore
            const invalid = new StringTest(123, 123);
            const errors = validate(invalid);
            expect(errors).toHaveLength(2);
        });
    });

    describe("Numeric Strategies", () => {
        class NumberTest {
            @IsInt()
            intVal: number;

            @IsPositive()
            posVal: number;

            constructor(i: number, p: number) {
                this.intVal = i;
                this.posVal = p;
            }
        }

        it("should validate IsInt", () => {
            expect(validate(new NumberTest(10, 10))).toHaveLength(0);

            const invalid = new NumberTest(10.5, 10);
            const errors = validate(invalid);
            expect(errors).toHaveLength(1);
            expect(errors[0]!.failedRules!["IsInt"]).toBeDefined();
        });

        it("should validate IsPositive", () => {
            expect(validate(new NumberTest(10, 1))).toHaveLength(0);

            const invalid = new NumberTest(10, -5);
            const errors = validate(invalid);
            expect(errors).toHaveLength(1);
            expect(errors[0]!.failedRules!["IsPositive"]).toBeDefined();

            const zero = new NumberTest(10, 0);
            expect(validate(zero)).toHaveLength(1);
        });

        it("should fail if value is not number", () => {
            // @ts-ignore
            const invalid = new NumberTest("10", "10");
            const errors = validate(invalid);
            expect(errors).toHaveLength(2);
        });
    });

    describe("Array Size Strategies", () => {
        class ArrayTest {
            @ArrayMinSize(2)
            @ArrayMaxSize(4)
            tags: string[];

            constructor(tags: string[]) {
                this.tags = tags;
            }
        }

        it("should validate ArrayMinSize", () => {
            const valid = new ArrayTest(["a", "b"]);
            expect(validate(valid)).toHaveLength(0);

            const invalid = new ArrayTest(["a"]);
            const errors = validate(invalid);
            expect(errors).toHaveLength(1);
            expect(errors[0]!.failedRules!["ArrayMinSize"]).toBeDefined();
        });

        it("should validate ArrayMaxSize", () => {
            const invalid = new ArrayTest(["a", "b", "c", "d", "e"]);
            const errors = validate(invalid);
            expect(errors).toHaveLength(1);
            expect(errors[0]!.failedRules!["ArrayMaxSize"]).toBeDefined();
        });

        it("should fail if value is not array", () => {
            // @ts-ignore
            const invalid = new ArrayTest("not-array");
            const errors = validate(invalid);
            expect(errors).toHaveLength(1);
        });
    });

    describe("Validator Edge Cases", () => {
        it("should return empty array for null/undefined/primitive inputs", () => {
            // @ts-ignore
            expect(validate(null)).toEqual([]);
            // @ts-ignore
            expect(validate(undefined)).toEqual([]);
            // @ts-ignore
            expect(validate("string")).toEqual([]);
            // @ts-ignore
            expect(validate(123)).toEqual([]);
        });

        it("should handle classes with no decorators", () => {
            class Empty { }
            expect(validate(new Empty())).toEqual([]);
        });
    });
});