import {
    validate,
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    Min,
    Max,
    Length,
    IsArray,
    ValidateNested,
    registerStrategy,
    ValidationOptions,
    createDecorator
} from "../src";

describe("Validator System", () => {
    class UserProfile {
        @IsString({ message: "Must be a string" })
        @Length(3, 10, { message: "Length must be 3-10" })
        username!: string;

        @IsNumber()
        @Min(18)
        @Max(100)
        age!: number;

        @IsOptional()
        @IsBoolean()
        isActive?: boolean;

        constructor(u: any) {
            Object.assign(this, u);
        }
    }

    it("should pass valid object", () => {
        const user = new UserProfile({ username: "Alice", age: 25, isActive: true });
        const errors = validate(user);
        expect(errors).toHaveLength(0);
    });

    it("should fail on wrong types", () => {
        const user = new UserProfile({ username: 123, age: "old" });
        const errors = validate(user);

        expect(errors).toHaveLength(2);

        const usernameError = errors.find(e => e.property === "username");
        const ageError = errors.find(e => e.property === "age");

        expect(usernameError!.failedRules!["IsString"]).toContain("Must be a string");
        expect(ageError!.failedRules!["IsNumber"]).toBeDefined();
    });

    it("should fail on constraints", () => {
        const user = new UserProfile({ username: "Li", age: 15 });
        const errors = validate(user);

        expect(errors).toHaveLength(2);
        const usernameError = errors.find(e => e.property === "username");
        const ageError = errors.find(e => e.property === "age");

        expect(usernameError!.failedRules!["Length"]).toContain("Length must be 3-10");
        expect(ageError!.failedRules!["Min"]).toBeDefined();
    });

    it("should respect @IsOptional", () => {
        const user = new UserProfile({ username: "Alice", age: 25 });
        const errors = validate(user);
        expect(errors).toHaveLength(0);

        const userWithNull = new UserProfile({ username: "Alice", age: 25, isActive: null });
        expect(validate(userWithNull)).toHaveLength(0);
    });
});

describe("Nested & Array Validation", () => {
    class Tag {
        @IsString()
        name!: string;
        constructor(name: string) { this.name = name; }
    }

    class Post {
        @IsString()
        title!: string;

        @IsArray()
        @ValidateNested({ each: true })
        tags!: Tag[];

        @ValidateNested()
        meta!: Tag;

        constructor(data: any) { Object.assign(this, data); }
    }

    it("should validate nested object arrays correctly", () => {
        const post = new Post({
            title: "Hello",
            tags: [
                new Tag("Tech"),
                new Tag(123 as any),
                new Tag("News")
            ],
            meta: new Tag("MetaInfo")
        });

        const errors = validate(post);

        expect(errors).toHaveLength(1);
        const tagError = errors[0]!;

        expect(tagError.property).toBe("tags");
        expect(tagError.children).toBeDefined();
        expect(tagError.children).toHaveLength(1);

        const childError = tagError.children![0]!;
        expect(childError.index).toBe(1);
        expect(childError.property).toContain("tags[1]");
        expect(childError.children![0]!.property).toBe("name");
        expect(childError.children![0]!.failedRules!["IsString"]).toBeDefined();
    });

    it("should validate single nested object", () => {
        const invalidTag = new Tag(123 as any);

        const post = new Post({
            title: "Test",
            tags: [],
            meta: invalidTag
        });

        const errors = validate(post);
        expect(errors).toHaveLength(1);

        const metaError = errors[0]!;
        expect(metaError.property).toBe("meta");

        expect(metaError.children![0]!.property).toBe("name");
        expect(metaError.children![0]!.failedRules!["IsString"]).toBeDefined();
    });
});

describe("Primitive Array Validation", () => {
    class ScoreBoard {
        @IsNumber({ each: true })
        @Min(0, { each: true })
        scores!: number[];
    }

    it("should validate each item in primitive array", () => {
        const board = new ScoreBoard();
        board.scores = [10, 20, -5, 30];

        const errors = validate(board);
        expect(errors).toHaveLength(1);

        const msgs = errors[0]!.failedRules!["Min"];
        expect(msgs).toBeDefined();
        expect(JSON.stringify(msgs)).toContain("at index 2");
    });
});

describe("Advanced Features", () => {
    const SymKey = Symbol("SecretKey");

    class SecretAgent {
        // @ts-ignore
        @IsString()
        [SymKey]!: string;
    }

    class BulkData {
        @IsString({ each: true })
        items: string[];

        constructor() {
            this.items = ["a", "b", 1 as any, 2 as any, "c"];
        }
    }

    it("should handle Symbol keys safely", () => {
        const agent = new SecretAgent();
        (agent as any)[SymKey] = 0.07;

        const errors = validate(agent);
        expect(errors).toHaveLength(1);
        expect(errors[0]!.property).toBe(String(SymKey));
        expect(errors[0]!.failedRules!["IsString"]).toBeDefined();
    });

    it("should stop at first error when abortEarly is true", () => {
        const data = new BulkData();
        const errors = validate(data, { abortEarly: true });

        expect(errors.length).toBeGreaterThan(0);

        const msgs = errors[0]!.failedRules!["IsString"];
        expect(msgs!.length).toBe(1);
    });

    it("should stop validation immediately after the first error when abortEarly is true", () => {
        class TestDto {
            @IsString({ message: "Must be a string" })
            @Min(5, { message: "Must be at least 5 characters" })
            name: string = "abc";
        }

        const errors = validate(new TestDto(), { abortEarly: true });

        expect(errors.length).toBe(1);
        expect(errors[0]!.failedRules!["Min"]).toContain("Must be at least 5 characters");

    });
});

describe("Custom Strategy", () => {
    registerStrategy("IsBlue", (val, rule, prop) => {
        return val === "blue" ? null : `${prop} must be blue`;
    });

    function IsBlue(options?: ValidationOptions) {
        return createDecorator("IsBlue", [], options);
    }

    class Theme {
        @IsBlue()
        color!: string;
    }

    it("should use custom strategy correctly", () => {
        const t1 = new Theme(); t1.color = "blue";
        expect(validate(t1)).toHaveLength(0);

        const t2 = new Theme(); t2.color = "red";
        const errors = validate(t2);
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["IsBlue"]).toContain("color must be blue");
    });

    it("should handle error inside custom strategy safely", () => {
        registerStrategy("Bomb", () => {
            throw new Error("Boom!");
        });
        function Bomb() { return createDecorator("Bomb", []); }

        class Danger {
            @Bomb() val = "test";
        }

        const errors = validate(new Danger());
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["Bomb"]![0]).toContain("Internal validation error");
    });
});