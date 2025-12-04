import {
    IsString, IsNumber, IsBoolean, IsArray,
    Min, Max, Length, IsEmail,
    ValidateNested, IsOptional, Custom,
    validate, ValidationError
} from "../src"; // 경로 확인 필요

// --- [테스트 유틸리티] ---
function describe(name: string, fn: () => void) {
    console.log(`\n📦 [${name}]`);
    fn();
}

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
    } catch (e: any) {
        console.error(`  ❌ ${name}`);
        console.error(`     Error: ${e.message}`);
    }
}

function expect(actual: any) {
    return {
        toBe: (expected: any) => {
            if (actual !== expected) throw new Error(`Expected ${expected}, but got ${actual}`);
        },
        toHaveLength: (len: number) => {
            if (!Array.isArray(actual) && typeof actual !== 'string') throw new Error(`Value is not array/string`);
            if (actual.length !== len) throw new Error(`Expected length ${len}, but got ${actual.length}`);
        },
        toContainError: (prop: string, rule?: string) => {
            const found = actual.find((e: any) => e.property === prop);
            if (!found) throw new Error(`Expected error on property '${prop}', but found none.`);
            if (rule && (!found.failedRules?.[rule])) {
                throw new Error(`Expected rule '${rule}' to fail on '${prop}', but it didn't.`);
            }
        },
        toBeValid: () => {
            if (actual.length > 0) throw new Error(`Expected no errors, but got: ${JSON.stringify(actual)}`);
        }
    };
}

// --- [테스트 시나리오] ---
console.log("🔥 Starting Tysc Integration Test Suite...");

// 1. 기본 타입 및 제약 조건 테스트
describe("Primitive Types & Constraints", () => {
    class User {
        @IsString()
        @Length(3, 10)
        name: string;

        @IsNumber()
        @Min(18)
        age: number;

        @IsEmail()
        email: string;

        constructor(name: string, age: number, email: string) {
            this.name = name;
            this.age = age;
            this.email = email;
        }
    }

    test("Should pass valid data", () => {
        const user = new User("Alice", 25, "alice@example.com");
        expect(validate(user)).toBeValid();
    });

    test("Should fail invalid name length", () => {
        const user = new User("Al", 25, "alice@example.com");
        const errors = validate(user);
        expect(errors).toHaveLength(1);
        expect(errors).toContainError("name", "Length");
    });

    test("Should fail min age", () => {
        const user = new User("Alice", 17, "alice@example.com");
        const errors = validate(user);
        expect(errors).toHaveLength(1);
        expect(errors).toContainError("age", "Min");
    });

    test("Should fail invalid email", () => {
        const user = new User("Alice", 25, "not-an-email");
        const errors = validate(user);
        expect(errors).toHaveLength(1);
        expect(errors).toContainError("email", "IsEmail");
    });
});

// 2. 배열 기본 테스트
describe("Array Basic Validation", () => {
    class TagList {
        @IsArray()
        @Length(1, 5, { each: true })
        tags: string[];

        constructor(tags: any) {
            this.tags = tags;
        }
    }

    test("Should pass valid string array", () => {
        const list = new TagList(["js", "ts", "node"]);
        expect(validate(list)).toBeValid();
    });

    test("Should fail if not array", () => {
        const list = new TagList("not-array");
        const errors = validate(list);
        expect(errors).toContainError("tags", "IsArray");
    });

    test("Should fail if element length is invalid (each: true)", () => {
        const list = new TagList(["js", "javascript"]);
        const errors = validate(list);
        expect(errors).toHaveLength(1);
        expect(errors).toContainError("tags", "Length");
    });
});

// 3. 중첩 객체 및 중첩 배열 테스트
describe("Nested Object & Array Validation", () => {
    class Profile {
        @IsString()
        bio: string;

        constructor(bio: string) { this.bio = bio; }
    }

    class User {
        @ValidateNested()
        profile: Profile;

        @IsArray()
        @ValidateNested({ each: true })
        posts: Profile[];

        constructor(profile: Profile, posts: Profile[]) {
            this.profile = profile;
            this.posts = posts;
        }
    }

    test("Should validate nested object", () => {
        const user = new User(new Profile(123 as any), []);
        const errors = validate(user);
        expect(errors).toHaveLength(1);

        const nested = errors[0]?.children;
        if (!nested || nested.length === 0) {
            throw new Error("Nested error 'children' is missing");
        }
    });

    test("Should validate array of objects", () => {
        const user = new User(new Profile("valid"), [
            new Profile("valid"),
            new Profile(123 as any)
        ]);
        const errors = validate(user);
        expect(errors).toHaveLength(1);

        const nested = errors[0]?.children;
        if (!nested || nested.length === 0) {
            throw new Error("Array nested error 'children' is missing");
        }
    });
});

// 4. Optional 테스트
describe("Optional Fields", () => {
    class Config {
        @IsOptional()
        @IsString()
        env?: string;
    }

    test("Should pass if undefined", () => {
        const c = new Config();
        expect(validate(c)).toBeValid();
    });

    test("Should pass if null", () => {
        const c = new Config();
        c.env = null as any;
        expect(validate(c)).toBeValid();
    });

    test("Should fail if value provided but invalid", () => {
        const c = new Config();
        c.env = 123 as any;
        const errors = validate(c);
        expect(errors).toHaveLength(1);
        expect(errors).toContainError("env", "IsString");
    });
});

// 5. Source Location (at) 테스트
describe("Debugging Feature (at)", () => {
    class DebugUser {
        @IsString()
        name!: number;
    }

    test("Should include 'at' property in error", () => {
        const d = new DebugUser();
        d.name = 123;
        const errors = validate(d);
        expect(errors).toHaveLength(1);

        const error = errors[0];
        if (!error) throw new Error("Error object missing");
        if (!error.at) throw new Error("'at' property is missing");
        if (!error.at.includes(".ts") && !error.at.includes(".js")) {
            throw new Error(`Invalid 'at' format: ${error.at}`);
        }
    });
});

console.log("\n✨ All Integration Tests Passed!\n");
