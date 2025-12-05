import {
    validate,
    createDecorator,
    registerStrategy,
    ValidationOptions
} from "../src";

console.log("🛠️ Registering Custom Strategies...");

registerStrategy("IsBizNumber", (value, rule, prop) => {
    if (typeof value !== 'string') return `${prop} must be a string`;
    const regex = /^\d{3}-\d{2}-\d{5}$/;
    return regex.test(value) ? null : `${prop} is not a valid business number`;
});

registerStrategy("IsMultipleOf", (value, rule, prop) => {
    const divisor = rule.constraints ? rule.constraints[0] : 1;

    if (typeof value !== 'number') return `${prop} must be a number`;
    return value % divisor === 0 ? null : `${prop} must be a multiple of ${divisor}`;
});

registerStrategy("IsStrongPassword", (value, rule, prop) => {
    if (typeof value !== 'string') return `${prop} must be a string`;

    if (value.length < 8) return "Password too short";
    if (!/[A-Z]/.test(value)) return "Must contain uppercase";
    if (!/[!@#$%^&*]/.test(value)) return "Must contain special char";

    return null;
});
registerStrategy("IsAllowedColor", (value, rule, prop) => {
    const allowed = rule.constraints || [];
    return allowed.includes(value)
        ? null
        : `${prop} must be one of: ${allowed.join(", ")}`;
});

console.log("✅ Strategies Registered!\n");

function IsBizNumber(options?: ValidationOptions) {
    return createDecorator("IsBizNumber", [], options);
}

function IsMultipleOf(num: number, options?: ValidationOptions) {
    return createDecorator("IsMultipleOf", [num], options);
}

function IsStrongPassword(options?: ValidationOptions) {
    return createDecorator("IsStrongPassword", [], options);
}

function IsAllowedColor(colors: string[], options?: ValidationOptions) {
    return createDecorator("IsAllowedColor", colors, options);
}


class CustomTestDto {
    @IsBizNumber()
    bizNum: string;

    @IsMultipleOf(5)
    score: number;

    @IsStrongPassword()
    password: string;

    @IsAllowedColor(["red", "blue", "green"])
    theme: string;

    @IsMultipleOf(10, { each: true, message: "Should be multiple of 10" })
    points: number[];

    constructor(data: any) {
        this.bizNum = data.bizNum;
        this.score = data.score;
        this.password = data.password;
        this.theme = data.theme;
        this.points = data.points;
    }
}

function runTest(name: string, data: any, shouldPass: boolean) {
    console.log(`🧪 Testing: ${name}`);
    const dto = new CustomTestDto(data);
    const errors = validate(dto);

    if (shouldPass) {
        if (errors.length === 0) console.log("   ✅ Passed (As Expected)");
        else {
            console.error("   ❌ Failed (Unexpected Errors):");
            console.log(JSON.stringify(errors, null, 2));
        }
    } else {
        if (errors.length > 0) {
            console.log("   ✅ Caught Errors (As Expected):");
            errors.forEach(e => {
                const rules = e.failedRules ? Object.keys(e.failedRules).join(", ") : "";
                const msg = e.failedRules ? Object.values(e.failedRules)[0] : "";
                console.log(`      - Property: ${e.property} [${rules}] -> "${msg}"`);
            });
        } else {
            console.error("   ❌ Failed (Expected Errors but got none)");
        }
    }
    console.log("-".repeat(50));
}

runTest("Valid Data", {
    bizNum: "123-45-67890",
    score: 25,
    password: "Password1!",
    theme: "red",
    points: [10, 20, 30]
}, true);

runTest("Invalid Data", {
    bizNum: "1234567890",
    score: 22,
    password: "weak",
    theme: "purple",
    points: [10, 25, 30]
}, false);

runTest("Edge Case: Password missing special char", {
    bizNum: "123-45-67890",
    score: 25,
    password: "Password123",
    theme: "blue",
    points: []
}, false);