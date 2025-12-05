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
        expect(validate(new UserProfile({ username: "Alice", age: 25, isActive: true }))).toHaveLength(0);
    });

    it("should fail on wrong types and constraints", () => {
        const errors = validate(new UserProfile({ username: 12, age: 15 }));
        expect(errors).toHaveLength(2);

        const usernameError = errors.find(e => e.property === "username")!;
        const ageError = errors.find(e => e.property === "age")!;

        expect(usernameError.failedRules!["IsString"]).toBeDefined();
        expect(usernameError.failedRules!["Length"]).toBeDefined();
        expect(ageError.failedRules!["Min"]).toBeDefined();
    });

    it("should respect @IsOptional", () => {
        expect(validate(new UserProfile({ username: "Alice", age: 25 }))).toHaveLength(0);
        expect(validate(new UserProfile({ username: "Alice", age: 25, isActive: null }))).toHaveLength(0);
    });

    it("should not trigger messages for valid values", () => {
        const user = new UserProfile({ username: "ValidName", age: 30, isActive: true });
        const errors = validate(user);

        expect(errors).toHaveLength(0);
    });

});

describe("Nested & Array Validation", () => {
    class Tag { @IsString() name!: string; constructor(name: string) { this.name = name; } }
    class Post {
        @IsString() title!: string;
        @IsArray() @ValidateNested({ each: true }) tags!: Tag[];
        @ValidateNested() meta!: Tag;
        constructor(data: any) { Object.assign(this, data); }
    }

    it("should validate nested object arrays correctly", () => {
        const post = new Post({ title: "Hello", tags: [new Tag("Tech"), new Tag(123 as any), new Tag("News")], meta: new Tag("MetaInfo") });
        const errors = validate(post);
        expect(errors).toHaveLength(1);
        expect(errors[0]!.children).toHaveLength(1);
        expect(errors[0]!.children![0]!.children![0]!.failedRules!["IsString"]).toBeDefined();
    });

    it("should validate single nested object", () => {
        const post = new Post({ title: "Test", tags: [], meta: new Tag(123 as any) });
        const errors = validate(post);
        expect(errors).toHaveLength(1);
        expect(errors[0]!.children![0]!.failedRules!["IsString"]).toBeDefined();
    });


});

describe("Primitive Array Validation", () => {
    class ScoreBoard { @IsNumber({ each: true }) @Min(0, { each: true }) scores!: number[]; }

    it("should validate each item in primitive array", () => {
        const board = new ScoreBoard();
        board.scores = [10, 20, -5, 30];
        const errors = validate(board);
        expect(errors).toHaveLength(1);
        expect(JSON.stringify(errors[0]!.failedRules!["Min"])).toContain("at index 2");
    });

});

describe("Advanced Features & abortEarly", () => {
    const SymKey = Symbol("SecretKey");
    //@ts-ignore
    class SecretAgent { @IsString() [SymKey]!: string; }
    class BulkData { @IsString({ each: true }) items = ["a", "b", 1 as any, 2 as any, "c"]; }

    it("should handle Symbol keys safely", () => {
        const agent = new SecretAgent();
        (agent as any)[SymKey] = 0.07;
        const errors = validate(agent);
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["IsString"]).toBeDefined();
    });

    it("should respect abortEarly for arrays", () => {
        const errors = validate(new BulkData(), { abortEarly: true });
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["IsString"]!.length).toBe(1);
    });

    it("should stop validation after first error in object", () => {
        class TestDto { @IsString({ message: "Must be a string" }) @Min(5, { message: "Must be at least 5 characters" }) name = "abc"; }
        const errors = validate(new TestDto(), { abortEarly: true });
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["Min"]).toContain("Must be at least 5 characters");
    });

});

describe("Custom Strategy", () => {
    registerStrategy("IsBlue", (val, rule, prop) => val === "blue" ? null : `${prop} must be blue`);
    function IsBlue(options?: ValidationOptions) { return createDecorator("IsBlue", [], options); }
    class Theme { @IsBlue() color!: string; }

    it("should validate custom strategy", () => {
        expect(validate(Object.assign(new Theme(), { color: "blue" }))).toHaveLength(0);
        const errors = validate(Object.assign(new Theme(), { color: "red" }));
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["IsBlue"]).toContain("color must be blue");
    });

    it("should handle internal errors safely", () => {
        registerStrategy("Bomb", () => { throw new Error("Boom!"); });
        function Bomb() { return createDecorator("Bomb", []); }
        class Danger { @Bomb() val = "test"; }
        const errors = validate(new Danger());
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["Bomb"]![0]).toContain("Internal validation error");
    });

    it("should attach metadata for custom decorator", () => {
        function TestDecorator(options?: ValidationOptions) { return createDecorator("TestRule", [], options); }
        class TestDto { @TestDecorator({ message: "Test message" }) field = "abc"; }
        expect(validate(new TestDto())).toEqual([]);
    });


});

describe("abortEarly coverage in loop", () => {
    it("should hit ctx.shouldStop inside array loop", () => {
        class TestDto { @IsArray() @Min(5, { each: true }) numbers = [1, 2, 6]; }
        const errors = validate(new TestDto(), { abortEarly: true });
        expect(errors).toHaveLength(1);
        expect(errors[0]!.failedRules!["Min"]!.length).toBe(1);
        expect(errors[0]!.failedRules!["Min"]![0]).toContain("at index 0");
    });
});

describe("registerStrategy warning coverage", () => {
    it("should warn when overwriting an existing strategy", () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const fn = () => null;
        registerStrategy("Duplicate", fn);
        registerStrategy("Duplicate", fn);
        expect(warnSpy).toHaveBeenCalledWith("[Validator] Strategy 'Duplicate' is being overwritten.");
        warnSpy.mockRestore();
    });
});
